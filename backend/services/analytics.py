"""
LogSense AI - Backend Analytics Service
Computes dashboard metrics, log statistics, timelines, and error aggregations
from parsed log records.
"""

import re
from typing import List, Dict, Any, Optional
from collections import Counter, defaultdict

# Regex patterns for timestamp hour extraction
ISO_DATETIME_PATTERN = re.compile(r'(\d{4}-\d{2}-\d{2})[T ](\d{2}):\d{2}')
TIME_ONLY_PATTERN = re.compile(r'^\s*(\d{2}):\d{2}')
SYSLOG_TIME_PATTERN = re.compile(r'([A-Za-z]{3}\s+\d{1,2})\s+(\d{2}):\d{2}')

# Global in-memory log store
_STORED_LOGS: List[Dict[str, Any]] = []


def add_parsed_logs(logs: List[Dict[str, Any]]) -> None:
    """Appends new parsed log records to the in-memory log store."""
    global _STORED_LOGS
    _STORED_LOGS.extend(logs)


def set_parsed_logs(logs: List[Dict[str, Any]]) -> None:
    """Replaces the in-memory log store with a new list of parsed log records."""
    global _STORED_LOGS
    _STORED_LOGS = list(logs)


def get_parsed_logs() -> List[Dict[str, Any]]:
    """Returns all currently stored parsed log records."""
    return _STORED_LOGS


def clear_parsed_logs() -> None:
    """Clears all stored parsed log records."""
    global _STORED_LOGS
    _STORED_LOGS = []


def extract_hour_bucket(timestamp: Optional[str]) -> str:
    """
    Safely extracts an hourly time bucket (e.g. '2023-10-27 14:00') from a timestamp string.
    Returns 'Unknown' if timestamp is missing, malformed, or unparseable.
    """
    if not timestamp or not isinstance(timestamp, str):
        return "Unknown"

    ts_clean = timestamp.strip()
    if not ts_clean:
        return "Unknown"

    # Match ISO format: 2023-10-27T14:32:01 or 2023-10-27 14:32:01
    iso_match = ISO_DATETIME_PATTERN.search(ts_clean)
    if iso_match:
        return f"{iso_match.group(1)} {iso_match.group(2)}:00"

    # Match Syslog format: Oct 27 14:32:01
    syslog_match = SYSLOG_TIME_PATTERN.search(ts_clean)
    if syslog_match:
        return f"{syslog_match.group(1)} {syslog_match.group(2)}:00"

    # Match Time-only format: 14:32:01
    time_match = TIME_ONLY_PATTERN.search(ts_clean)
    if time_match:
        return f"{time_match.group(1)}:00"

    return "Unknown"


def generate_dashboard_metrics(parsed_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes dashboard analytics from a list of parsed log records.

    Parameters:
        parsed_logs: List of parsed log dictionaries containing timestamp, level, service, message.

    Returns:
        Dictionary containing overall metrics, log level distribution, top services,
        hourly timeline breakdown, and recent error records.
    """
    if not parsed_logs:
        return {
            "total_logs": 0,
            "errors": 0,
            "error_count": 0,
            "warnings": 0,
            "warning_count": 0,
            "info": 0,
            "info_count": 0,
            "debug": 0,
            "debug_count": 0,
            "critical": 0,
            "critical_count": 0,
            "unique_services": 0,
            "top_services": [],
            "log_level_distribution": {},
            "logs_over_time": [],
            "recent_errors": []
        }

    total_logs = len(parsed_logs)
    error_count = 0
    warning_count = 0
    info_count = 0
    debug_count = 0
    critical_count = 0

    level_counter: Counter = Counter()
    service_counter: Counter = Counter()
    hourly_groups: Dict[str, Dict[str, int]] = defaultdict(
        lambda: {"count": 0, "errors": 0, "warnings": 0, "info": 0}
    )
    error_logs: List[Dict[str, Any]] = []

    for log in parsed_logs:
        if not isinstance(log, dict):
            continue

        raw_level = log.get("level")
        level_str = (raw_level.upper() if isinstance(raw_level, str) else "UNKNOWN").strip()
        if not level_str:
            level_str = "UNKNOWN"

        level_counter[level_str] += 1

        # Count specific log levels
        if level_str in ("ERROR", "ERR"):
            error_count += 1
            error_logs.append(log)
        elif level_str in ("WARN", "WARNING"):
            warning_count += 1
        elif level_str == "INFO":
            info_count += 1
        elif level_str in ("DEBUG", "TRACE"):
            debug_count += 1
        elif level_str in ("CRITICAL", "FATAL", "SEVERE"):
            critical_count += 1
            error_logs.append(log)

        # Track service counts
        service = log.get("service")
        if isinstance(service, str) and service.strip():
            service_counter[service.strip()] += 1

        # Timeline grouping by hour
        bucket = extract_hour_bucket(log.get("timestamp"))
        hourly_groups[bucket]["count"] += 1
        if level_str in ("ERROR", "ERR", "CRITICAL", "FATAL", "SEVERE"):
            hourly_groups[bucket]["errors"] += 1
        elif level_str in ("WARN", "WARNING"):
            hourly_groups[bucket]["warnings"] += 1
        elif level_str == "INFO":
            hourly_groups[bucket]["info"] += 1

    # Top 5 services
    unique_services = len(service_counter)
    top_services = [
        {"service": srv, "count": cnt}
        for srv, cnt in service_counter.most_common(5)
    ]

    # Chronological timeline sorting
    sorted_buckets = sorted(
        hourly_groups.keys(),
        key=lambda b: (1 if b == "Unknown" else 0, b)
    )
    logs_over_time = [
        {
            "timestamp": bucket,
            "count": hourly_groups[bucket]["count"],
            "errors": hourly_groups[bucket]["errors"],
            "warnings": hourly_groups[bucket]["warnings"],
            "info": hourly_groups[bucket]["info"],
        }
        for bucket in sorted_buckets
    ]

    # Recent 10 errors (latest first)
    recent_errors = [
        {
            "timestamp": err.get("timestamp") or "N/A",
            "service": err.get("service") or "unknown",
            "level": err.get("level") or "ERROR",
            "message": err.get("message") or ""
        }
        for err in reversed(error_logs[-10:])
    ]

    return {
        "total_logs": total_logs,
        "errors": error_count,
        "error_count": error_count,
        "warnings": warning_count,
        "warning_count": warning_count,
        "info": info_count,
        "info_count": info_count,
        "debug": debug_count,
        "debug_count": debug_count,
        "critical": critical_count,
        "critical_count": critical_count,
        "unique_services": unique_services,
        "top_services": top_services,
        "log_level_distribution": dict(level_counter),
        "logs_over_time": logs_over_time,
        "recent_errors": recent_errors,
    }
