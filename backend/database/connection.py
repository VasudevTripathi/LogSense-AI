"""
LogSense AI - Database Connection Module
Manages SQLite database connections and table initialization.
"""

import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "logsense.db"


def get_db_connection() -> sqlite3.Connection:
    """
    Creates and returns a thread-safe connection to the SQLite database.
    Sets row_factory to sqlite3.Row for dict-like column access.
    """
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """
    Initializes the database schema if tables do not exist.
    """
    from database.models import CREATE_LOGS_TABLE_SQL, CREATE_INDEXES_SQL

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(CREATE_LOGS_TABLE_SQL)
        for idx_sql in CREATE_INDEXES_SQL:
            cursor.execute(idx_sql)
        conn.commit()
    finally:
        conn.close()


# Auto-initialize database on module import
init_db()
