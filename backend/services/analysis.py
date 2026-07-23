"""
LogSense AI - Incident Analysis Engine Service
Produces structured incident reports using deterministic rule-based logic from SQLite logs.
"""

import uuid
from typing import List, Dict, Any, Optional
from collections import Counter, defaultdict
from database.operations import get_all_logs, get_logs_by_upload

# Category Keyword Mapping Dictionary
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "DATABASE": [
        "database", "db", "postgres", "mysql", "sql", "sqlite", "mongo", "redis",
        "connection pool", "deadlock", "query", "transaction", "db-service", "psycopg2", "hibernate"
    ],
    "NETWORK": [
        "network", "timeout", "socket", "http", "connection refused", "dns",
        "unreachable", "gateway", "stripe", "502", "503", "504", "api", "curl", "sockettimeout"
    ],
    "AUTH": [
        "auth", "authentication", "login", "password", "jwt", "token", "unauthorized",
        "401", "403", "permission", "credential", "auth-service", "session", "oauth"
    ],
    "API": [
        "endpoint", "rest", "graphql", "payload", "bad request", "400", "500",
        "invalid format", "schema", "validation", "controller", "route"
    ],
    "CACHE": [
        "cache", "memcached", "ttl", "eviction", "cache miss", "redis-cache"
    ],
    "FILESYSTEM": [
        "file", "disk", "storage", "directory", "permission denied", "space",
        "read-only", "enoent", "ioerror", "filepath", "disk full"
    ],
    "SECURITY": [
        "security", "attack", "injection", "cors", "csrf", "rate limit",
        "brute force", "malicious", "xss", "ddos"
    ]
}

# Category Recommendation Mapping Dictionary
RECOMMENDATION_MAPPING: Dict[str, List[str]] = {
    "DATABASE": [
        "Increase database connection pool size in backend service configuration.",
        "Inspect long-running transactions and optimize missing table indexes.",
        "Configure strict query timeout thresholds and monitor active DB handles."
    ],
    "NETWORK": [
        "Verify network security groups and API gateway timeout configurations.",
        "Implement exponential backoff and circuit breaker pattern for external HTTP calls.",
        "Inspect DNS resolution routing and load balancer health check paths."
    ],
    "AUTH": [
        "Review token expiration parameters and cache active session keys.",
        "Scale authentication service instances to handle login traffic surges.",
        "Inspect account lockout limits and invalid credential retry loops."
    ],
    "API": [
        "Enforce strict request payload validation schemas at ingress controllers.",
        "Review error handling middleware and standardize HTTP 4xx/5xx status codes.",
        "Enable distributed request tracing across service endpoints."
    ],
    "CACHE": [
        "Increase cache node memory allocation and tune eviction policies.",
        "Implement cache warming routines for critical high-frequency lookup keys.",
        "Verify Redis/Memcached cluster connection pool health."
    ],
    "FILESYSTEM": [
        "Check available disk storage capacity and directory access permissions.",
        "Configure automated log rotation and temporary file cleanup cron jobs.",
        "Inspect asynchronous file read/write locks to prevent file descriptor exhaustion."
    ],
    "SECURITY": [
        "Enable Web Application Firewall (WAF) rules and rate-limiting headers.",
        "Audit active API access tokens and revoke compromised credentials.",
        "Review CORS policy configurations and CSRF token validation layers."
    ],
    "UNKNOWN": [
        "Inspect system resource utilization metrics (CPU, Memory, Disk I/O).",
        "Increase log level verbosity to DEBUG for affected microservice modules.",
        "Correlate stack traces around the initial failure timestamp."
    ]
}


def classify_log_category(log: Dict[str, Any]) -> str:
    """
    Classifies a log record into a category based on keyword matching in message, service, and level.
    """
    msg = (log.get("message") or "").lower()
    srv = (log.get("service") or "").lower()
    lvl = (log.get("level") or "").lower()

    text_to_search = f"{msg} {srv} {lvl}"

    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_to_search:
                return category

    return "UNKNOWN"


def normalize_logs(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sanitizes and enriches raw log dicts with normalized level, timestamp, service, and category.
    """
    normalized = []
    for log in logs:
        if not isinstance(log, dict):
            continue

        raw_lvl = log.get("level")
        level_str = (raw_lvl.upper() if isinstance(raw_lvl, str) else "UNKNOWN").strip()
        if not level_str:
            level_str = "UNKNOWN"

        service_str = log.get("service") or "unknown"
        if isinstance(service_str, str):
            service_str = service_str.strip() or "unknown"

        timestamp_str = log.get("timestamp") or "N/A"
        message_str = log.get("message") or ""

        entry = {
            "id": log.get("id"),
            "upload_id": log.get("upload_id") or "",
            "timestamp": timestamp_str,
            "level": level_str,
            "service": service_str,
            "message": message_str,
            "category": classify_log_category({"message": message_str, "service": service_str, "level": level_str})
        }
        normalized.append(entry)

    return normalized


def aggregate_errors(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Groups error and critical logs by message/service pattern and computes frequency and timestamps.
    """
    error_groups: Dict[str, Dict[str, Any]] = {}

    for log in logs:
        lvl = log.get("level", "")
        if lvl not in ("ERROR", "ERR", "CRITICAL", "FATAL", "SEVERE"):
            continue

        srv = log.get("service") or "unknown"
        msg = log.get("message") or ""
        ts = log.get("timestamp") or "N/A"
        cat = log.get("category") or "UNKNOWN"

        # Create pattern key from service + snippet
        msg_snippet = msg[:100].strip()
        key = f"{srv}:{msg_snippet}"

        if key not in error_groups:
            error_groups[key] = {
                "key": key,
                "message": msg,
                "service": srv,
                "level": lvl,
                "category": cat,
                "count": 0,
                "first_seen": ts,
                "last_seen": ts,
            }

        group = error_groups[key]
        group["count"] += 1
        group["last_seen"] = ts
        if group["level"] not in ("CRITICAL", "FATAL", "SEVERE") and lvl in ("CRITICAL", "FATAL", "SEVERE"):
            group["level"] = lvl

    # Convert to list and sort by level priority (CRITICAL > ERROR), then count descending
    result = list(error_groups.values())

    def sort_key(item: Dict[str, Any]):
        lvl = item["level"]
        severity_rank = 0 if lvl in ("CRITICAL", "FATAL", "SEVERE") else 1
        return (severity_rank, -item["count"])

    result.sort(key=sort_key)
    return result


def detect_affected_services(logs: List[Dict[str, Any]]) -> List[str]:
    """
    Identifies all unique services that experienced errors or warnings.
    """
    affected = set()
    for log in logs:
        lvl = log.get("level", "")
        srv = log.get("service")
        if lvl in ("ERROR", "ERR", "CRITICAL", "FATAL", "SEVERE", "WARN", "WARNING"):
            if isinstance(srv, str) and srv.strip() and srv.strip().lower() != "unknown":
                affected.add(srv.strip())
    return sorted(list(affected))


def build_incident_timeline(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extracts chronological list of key error and warning events for the incident timeline.
    """
    timeline_events = []
    for log in logs:
        lvl = log.get("level", "")
        if lvl in ("ERROR", "ERR", "CRITICAL", "FATAL", "SEVERE", "WARN", "WARNING"):
            timeline_events.append({
                "timestamp": log.get("timestamp") or "N/A",
                "service": log.get("service") or "unknown",
                "level": lvl,
                "message": log.get("message") or ""
            })

    # Limit timeline to max 15 key events
    return timeline_events[:15]


def determine_root_cause(
    logs: List[Dict[str, Any]],
    aggregated_errors: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Determines the primary root cause of the incident using deterministic rule-based analysis.
    Rule 1: Prioritize CRITICAL/FATAL severity errors.
    Rule 2: Prioritize high-frequency error patterns.
    Rule 3: Consider earliest onset timestamp.
    """
    if not aggregated_errors:
        return {
            "summary": "No critical operational failures detected",
            "primary_error": "System operating within normal parameter thresholds.",
            "service": "system",
            "category": "UNKNOWN",
            "explanation": "No error or critical log events were identified in the analyzed log dataset.",
            "first_seen": "N/A",
            "occurrences": 0
        }

    # Top error is already sorted by severity rank (CRITICAL first) and count descending
    top_error = aggregated_errors[0]
    category = top_error.get("category", "UNKNOWN")
    service = top_error.get("service", "unknown")
    level = top_error.get("level", "ERROR")
    count = top_error.get("count", 1)
    first_seen = top_error.get("first_seen", "N/A")
    primary_msg = top_error.get("message", "")

    summary = f"{category.replace('_', ' ').title()} failure in {service}"
    explanation = (
        f"Identified as root cause due to highest severity ({level}) "
        f"and {count} occurrence(s) initiated at {first_seen}."
    )

    return {
        "summary": summary,
        "primary_error": primary_msg,
        "service": service,
        "category": category,
        "explanation": explanation,
        "first_seen": first_seen,
        "occurrences": count
    }


def calculate_severity(
    logs: List[Dict[str, Any]],
    aggregated_errors: List[Dict[str, Any]]
) -> str:
    """
    Computes deterministic severity rating (LOW, MEDIUM, HIGH, CRITICAL) based on log counts and error ranks.
    """
    if not logs:
        return "LOW"

    total_logs = len(logs)
    critical_count = sum(
        1 for l in logs if l.get("level") in ("CRITICAL", "FATAL", "SEVERE")
    )
    error_count = sum(
        1 for l in logs if l.get("level") in ("ERROR", "ERR")
    )
    warning_count = sum(
        1 for l in logs if l.get("level") in ("WARN", "WARNING")
    )

    failure_count = critical_count + error_count
    failure_rate = failure_count / max(1, total_logs)

    if critical_count > 0 or failure_count >= 20 or failure_rate >= 0.25:
        return "CRITICAL"
    if failure_count >= 5 or failure_rate >= 0.10:
        return "HIGH"
    if failure_count >= 1 or warning_count >= 5:
        return "MEDIUM"
    return "LOW"


def calculate_confidence(root_cause: Dict[str, Any], total_errors: int) -> str:
    """
    Calculates deterministic confidence percentage score for the identified root cause.
    """
    if root_cause.get("occurrences", 0) == 0:
        return "100%"

    occurrences = root_cause.get("occurrences", 1)
    category = root_cause.get("category", "UNKNOWN")

    confidence_score = 80
    if occurrences > 5:
        confidence_score += 8
    elif occurrences > 1:
        confidence_score += 4

    if category != "UNKNOWN":
        confidence_score += 8

    if total_errors > 0 and (occurrences / max(1, total_errors)) > 0.4:
        confidence_score += 4

    confidence_score = min(98, max(65, confidence_score))
    return f"{confidence_score}%"


def generate_recommendations(category: str, root_cause: Dict[str, Any]) -> List[str]:
    """
    Returns rule-based remediation steps based on the identified incident category.
    """
    recs = RECOMMENDATION_MAPPING.get(category.upper(), RECOMMENDATION_MAPPING["UNKNOWN"])
    return list(recs)


def generate_incident_report(upload_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entry point for the Incident Analysis Engine.
    Queries SQLite logs, executes analysis pipeline, and returns structured report JSON.
    """
    if upload_id:
        raw_logs = get_logs_by_upload(upload_id)
    else:
        raw_logs = get_all_logs()

    normalized = normalize_logs(raw_logs)
    agg_errors = aggregate_errors(normalized)
    affected_srvs = detect_affected_services(normalized)
    timeline = build_incident_timeline(normalized)
    root_cause = determine_root_cause(normalized, agg_errors)
    category = root_cause.get("category", "UNKNOWN")
    severity = calculate_severity(normalized, agg_errors)
    confidence = calculate_confidence(root_cause, len(agg_errors))
    recs = generate_recommendations(category, root_cause)

    total_logs = len(normalized)
    total_errors = sum(1 for l in normalized if l["level"] in ("ERROR", "ERR", "CRITICAL", "FATAL", "SEVERE"))
    total_warnings = sum(1 for l in normalized if l["level"] in ("WARN", "WARNING"))

    incident_id = f"inc-{uuid.uuid4().hex[:8]}"

    return {
        "status": "success",
        "incident_id": incident_id,
        "root_cause": root_cause,
        "incident_category": category,
        "severity": severity,
        "confidence": confidence,
        "affected_services": affected_srvs,
        "timeline": timeline,
        "top_errors": agg_errors[:5],
        "recommendations": recs,
        "statistics": {
            "total_logs": total_logs,
            "total_errors": total_errors,
            "total_warnings": total_warnings,
            "affected_service_count": len(affected_srvs)
        }
    }
