import re
import csv
import io
from typing import List, Dict, Any, Tuple, Optional

# Common regex patterns for log level detection
LEVEL_REGEX = re.compile(
    r'\b(ERROR|ERR|WARN|WARNING|INFO|DEBUG|TRACE|FATAL|CRITICAL|SEVERE)\b',
    re.IGNORECASE
)

# Common regex patterns for timestamp detection
TIMESTAMP_REGEX = re.compile(
    r'(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?|'
    r'\d{2}:\d{2}:\d{2}(?:\.\d+)?|'
    r'[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})'
)

# Bracketed or colon-terminated service pattern e.g. [auth-service] or auth-service:
SERVICE_BRACKET_REGEX = re.compile(r'\[([a-zA-Z0-9_\-\.\s]+)\]')
SERVICE_COLON_REGEX = re.compile(r'\b([a-zA-Z0-9_\-\.]+):')


def is_valid_service_name(val: Optional[str]) -> bool:
    """
    Validates whether a candidate string is a valid microservice name.
    Strictly rejects timestamps, ISO dates/times, log levels, URL schemes, and empty/generic values.
    """
    if not val or not isinstance(val, str):
        return False
    s = val.strip()
    if not s or s.lower() in ("unknown", "n/a", "null", "none", "http", "https", "file", "all", "localhost"):
        return False

    # Reject if string matches timestamp patterns or date/time strings
    if TIMESTAMP_REGEX.search(s):
        return False
    if re.match(r'^\d{4}[-\/]\d{2}[-\/]\d{2}', s) or re.match(r'^\d{2}:\d{2}', s):
        return False
    if re.search(r'\d{4}-\d{2}-\d{2}', s) or re.search(r'\d{2}:\d{2}:\d{2}', s):
        return False

    # Reject if string is a log level
    if s.upper() in ("INFO", "WARN", "WARNING", "ERROR", "ERR", "CRITICAL", "FATAL", "DEBUG", "TRACE"):
        return False

    # Reject if string is purely numeric or punctuation
    if s.isdigit() or not any(c.isalpha() for c in s):
        return False

    # Reject if string looks like a full log message rather than a service name (> 3 words)
    if len(s.split()) > 3:
        return False

    return True


def parse_log_line(line: str) -> Dict[str, Any]:
    """
    Parses a single line from a .log or .txt file.
    Extracts timestamp, level, service, and message.
    """
    line_clean = line.strip()
    if not line_clean:
        return None

    timestamp = None
    level = None
    service = None
    message = line_clean

    # 1. Extract Timestamp
    ts_match = TIMESTAMP_REGEX.search(line_clean)
    if ts_match:
        timestamp = ts_match.group(1)

    # 2. Extract Level
    lvl_match = LEVEL_REGEX.search(line_clean)
    if lvl_match:
        level = lvl_match.group(1).upper()
        if level in ("ERR", "CRITICAL", "FATAL", "SEVERE"):
            level = "ERROR"
        elif level == "WARNING":
            level = "WARN"

    # 3. Extract Service
    # First check for bracketed service e.g. [auth-service]
    bracket_matches = SERVICE_BRACKET_REGEX.findall(line_clean)
    for bm in bracket_matches:
        cleaned_bm = bm.strip()
        if is_valid_service_name(cleaned_bm):
            service = cleaned_bm
            break

    # If no bracketed service, check for service: identifier before message
    if not service:
        colon_match = SERVICE_COLON_REGEX.search(line_clean)
        if colon_match:
            candidate = colon_match.group(1).strip()
            if is_valid_service_name(candidate):
                service = candidate

    # Positional check for space-separated format: TIMESTAMP LEVEL SERVICE MESSAGE
    if not service:
        parts = line_clean.split()
        if len(parts) >= 3:
            for candidate_token in (parts[2], parts[1]):
                cleaned_token = candidate_token.strip(" []:\t")
                if is_valid_service_name(cleaned_token):
                    service = cleaned_token
                    break

    # 4. Clean up Message
    msg_candidate = line_clean
    if timestamp:
        msg_candidate = msg_candidate.replace(f"[{timestamp}]", "").replace(timestamp, "")
    if level and lvl_match:
        msg_candidate = msg_candidate.replace(f"[{lvl_match.group(0)}]", "").replace(lvl_match.group(0), "")
    if service:
        msg_candidate = msg_candidate.replace(f"[{service}]", "").replace(f"{service}:", "")

    msg_candidate = msg_candidate.strip(" :-]\t")
    if msg_candidate:
        message = msg_candidate

    return {
        "timestamp": timestamp,
        "level": level,
        "service": service if service else "unknown",
        "message": message
    }


def parse_csv_content(content_str: str) -> List[Dict[str, Any]]:
    """
    Parses CSV content and extracts timestamp, level, service, and message.
    """
    results = []
    stream = io.StringIO(content_str)
    reader = csv.reader(stream)
    
    rows = list(reader)
    if not rows:
        return results

    # Header identification
    first_row = [c.strip().lower() for c in rows[0]]
    has_header = False
    col_map = {}

    for idx, col in enumerate(first_row):
        if col in ("timestamp", "time", "date", "datetime"):
            col_map["timestamp"] = idx
            has_header = True
        elif col in ("level", "loglevel", "severity", "type"):
            col_map["level"] = idx
            has_header = True
        elif col in ("service", "component", "source", "module", "app"):
            col_map["service"] = idx
            has_header = True
        elif col in ("message", "msg", "log", "text", "description"):
            col_map["message"] = idx
            has_header = True

    start_idx = 1 if has_header else 0

    for row in rows[start_idx:]:
        if not row or not any(c.strip() for c in row):
            continue

        if has_header and col_map:
            ts = row[col_map["timestamp"]].strip() if "timestamp" in col_map and col_map["timestamp"] < len(row) else None
            lvl = row[col_map["level"]].strip() if "level" in col_map and col_map["level"] < len(row) else None
            srv = row[col_map["service"]].strip() if "service" in col_map and col_map["service"] < len(row) else None
            msg = row[col_map["message"]].strip() if "message" in col_map and col_map["message"] < len(row) else " ".join(row)
        else:
            # Fallback based on column count
            ts = row[0].strip() if len(row) > 0 else None
            lvl = row[1].strip() if len(row) > 1 else None
            srv = row[2].strip() if len(row) > 2 else None
            msg = row[3].strip() if len(row) > 3 else (row[-1].strip() if len(row) > 0 else None)

        if lvl:
            lvl = lvl.upper()
            if lvl in ("ERR", "CRITICAL", "FATAL", "SEVERE"):
                lvl = "ERROR"
            elif lvl == "WARNING":
                lvl = "WARN"

        if srv and not is_valid_service_name(srv):
            srv = "unknown"

        results.append({
            "timestamp": ts if ts else None,
            "level": lvl if lvl else None,
            "service": srv if srv else "unknown",
            "message": msg if msg else ""
        })

    return results


def parse_log_content(file_content: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Parses log file content (.log, .txt, .csv) into a list of parsed records.
    """
    content_str = file_content.decode("utf-8", errors="replace")
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    parsed_records = []

    if ext == "csv":
        parsed_records = parse_csv_content(content_str)
    else:
        lines = content_str.splitlines()
        for line in lines:
            record = parse_log_line(line)
            if record:
                parsed_records.append(record)

    return parsed_records


def parse_log_file(file_content: bytes, filename: str) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Main entry point to parse log files (.log, .txt, .csv).
    Returns (total_logs, preview_records_up_to_20).
    """
    parsed_records = parse_log_content(file_content, filename)
    total_logs = len(parsed_records)
    preview = parsed_records[:20]

    return total_logs, preview
