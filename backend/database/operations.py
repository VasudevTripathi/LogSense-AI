"""
LogSense AI - Database Operations Module
Encapsulates all raw SQL CRUD operations for log storage and retrieval.
"""

from typing import List, Dict, Any, Optional, Tuple
from database.connection import get_db_connection, init_db


def insert_logs(logs: List[Dict[str, Any]], upload_id: str) -> int:
    """
    Inserts a list of parsed log records into the SQLite database under a specific upload_id.
    Returns the number of rows inserted.
    """
    if not logs:
        return 0

    init_db()

    records_to_insert = [
        (
            upload_id,
            log.get("timestamp"),
            log.get("level"),
            log.get("service"),
            log.get("message")
        )
        for log in logs
        if isinstance(log, dict)
    ]

    if not records_to_insert:
        return 0

    sql = """
        INSERT INTO logs (upload_id, timestamp, level, service, message)
        VALUES (?, ?, ?, ?, ?)
    """

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.executemany(sql, records_to_insert)
        conn.commit()
        inserted_count = cursor.rowcount
        return inserted_count
    finally:
        conn.close()


def get_all_logs() -> List[Dict[str, Any]]:
    """
    Retrieves all log records from the database ordered by insertion ID.
    Returns a list of dictionary log objects.
    """
    init_db()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, upload_id, timestamp, level, service, message, created_at
            FROM logs
            ORDER BY id ASC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def _build_where_clause(
    search: Optional[str] = None,
    level: Optional[str] = None,
    service: Optional[str] = None,
    upload_id: Optional[str] = None
) -> Tuple[str, List[Any]]:
    """
    Internal helper to construct parameterized SQL WHERE clause and argument list.
    """
    conditions = []
    params: List[Any] = []

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        conditions.append("(LOWER(message) LIKE ? OR LOWER(service) LIKE ? OR LOWER(level) LIKE ?)")
        params.extend([term, term, term])

    if level and level.strip().upper() not in ("ALL", "ALL LEVELS", ""):
        lvl = level.strip().upper()
        if lvl in ("ERROR", "ERR"):
            conditions.append("UPPER(level) IN ('ERROR', 'ERR')")
        elif lvl in ("WARN", "WARNING"):
            conditions.append("UPPER(level) IN ('WARN', 'WARNING')")
        elif lvl in ("CRITICAL", "FATAL", "SEVERE"):
            conditions.append("UPPER(level) IN ('CRITICAL', 'FATAL', 'SEVERE')")
        else:
            conditions.append("UPPER(level) = ?")
            params.append(lvl)

    if service and service.strip().upper() not in ("ALL", "ALL SERVICES", ""):
        conditions.append("service = ?")
        params.append(service.strip())

    if upload_id and upload_id.strip().upper() not in ("ALL", "ALL UPLOADS", ""):
        conditions.append("upload_id = ?")
        params.append(upload_id.strip())

    where_str = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    return where_str, params


def count_logs(
    search: Optional[str] = None,
    level: Optional[str] = None,
    service: Optional[str] = None,
    upload_id: Optional[str] = None
) -> int:
    """
    Counts total log records matching the specified search terms and filter criteria.
    """
    init_db()
    where_str, params = _build_where_clause(search, level, service, upload_id)
    sql = f"SELECT COUNT(*) FROM logs {where_str}"

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        row = cursor.fetchone()
        return row[0] if row else 0
    finally:
        conn.close()


def search_logs(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    level: Optional[str] = None,
    service: Optional[str] = None,
    upload_id: Optional[str] = None,
    sort: str = "desc"
) -> List[Dict[str, Any]]:
    """
    Searches and paginates stored logs based on filters, search query, and sort order.
    """
    init_db()
    where_str, params = _build_where_clause(search, level, service, upload_id)

    safe_page = max(1, page)
    safe_limit = max(1, min(limit, 500))
    offset = (safe_page - 1) * safe_limit

    sort_direction = "ASC" if sort.strip().lower() == "asc" else "DESC"

    sql = f"""
        SELECT id, upload_id, timestamp, level, service, message, created_at
        FROM logs
        {where_str}
        ORDER BY id {sort_direction}
        LIMIT ? OFFSET ?
    """
    params.extend([safe_limit, offset])

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_services() -> List[str]:
    """
    Retrieves a list of distinct non-empty service names present in the database.
    """
    init_db()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT TRIM(service) as service
            FROM logs
            WHERE service IS NOT NULL AND TRIM(service) != ''
            ORDER BY service ASC
        """)
        rows = cursor.fetchall()
        return [row["service"] for row in rows]
    finally:
        conn.close()


def get_upload_ids() -> List[str]:
    """
    Retrieves a list of distinct upload_id values present in the database.
    """
    init_db()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT upload_id
            FROM logs
            WHERE upload_id IS NOT NULL AND upload_id != ''
            ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        return [row["upload_id"] for row in rows]
    finally:
        conn.close()


def get_recent_errors(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Retrieves the latest ERROR/CRITICAL logs up to the specified limit.
    Returns a list of dicts with timestamp, service, level, message.
    """
    init_db()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT timestamp, service, level, message
            FROM logs
            WHERE UPPER(level) IN ('ERROR', 'ERR', 'CRITICAL', 'FATAL', 'SEVERE')
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [
            {
                "timestamp": row["timestamp"] or "N/A",
                "service": row["service"] or "unknown",
                "level": row["level"] or "ERROR",
                "message": row["message"] or ""
            }
            for row in rows
        ]
    finally:
        conn.close()


def get_top_services(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieves the top services with the highest log counts up to the specified limit.
    Returns a list of dicts with service and count.
    """
    init_db()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TRIM(service) as service, COUNT(*) as count
            FROM logs
            WHERE service IS NOT NULL AND TRIM(service) != ''
            GROUP BY TRIM(service)
            ORDER BY count DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [{"service": row["service"], "count": row["count"]} for row in rows]
    finally:
        conn.close()


def get_logs_by_upload(upload_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves all log records for a specific upload_id.
    """
    init_db()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, upload_id, timestamp, level, service, message, created_at
            FROM logs
            WHERE upload_id = ?
            ORDER BY id ASC
        """, (upload_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def clear_logs() -> int:
    """
    Deletes all log records from the database.
    Returns the number of deleted records.
    """
    init_db()
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM logs")
        conn.commit()
        deleted_count = cursor.rowcount
        return deleted_count
    finally:
        conn.close()
