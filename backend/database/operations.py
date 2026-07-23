"""
LogSense AI - Database Operations Module
Encapsulates all raw SQL CRUD operations for log storage and retrieval.
"""

from typing import List, Dict, Any
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
