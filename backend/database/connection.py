import sqlite3
import os
from pathlib import Path

# Base directory setup
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "logsense.db"

def get_db_connection():
    """
    Creates and returns a connection to the SQLite database.
    """
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
