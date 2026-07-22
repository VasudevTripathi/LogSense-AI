import re
import csv
import io
from typing import List, Dict, Any, Tuple

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
    # Skip if bracket matches the timestamp e.g. [2023-10-27...]
    bracket_matches = SERVICE_BRACKET_REGEX.findall(line_clean)
    for bm in bracket_matches:
        if not TIMESTAMP_REGEX.search(bm) and not LEVEL_REGEX.search(bm):
            service = bm.strip()
            break

    # If no bracketed service, check for service: identifier before message
    if not service:
        colon_match = SERVICE_COLON_REGEX.search(line_clean)
        if colon_match:
            candidate = colon_match.group(1)
            # Avoid matching protocols e.g. http: or timestamps e.g. 14:
            if candidate.lower() not in ("http", "https", "file") and not candidate.isdigit():
                service = candidate

    # 4. Clean up Message
    # If timestamp and level are in line, clean prefix if possible
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
        "service": service,
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

        results.append({
            "timestamp": ts if ts else None,
            "level": lvl if lvl else None,
            "service": srv if srv else None,
            "message": msg if msg else ""
        })

    return results


def parse_log_file(file_content: bytes, filename: str) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Main entry point to parse log files (.log, .txt, .csv).
    Returns (total_logs, preview_records_up_to_20).
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

    total_logs = len(parsed_records)
    preview = parsed_records[:20]

    return total_logs, preview
