"""
LogSense AI - Database Models and Schema Definitions
"""

from dataclasses import dataclass
from typing import Optional

# SQL DDL for table creation
CREATE_LOGS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id TEXT NOT NULL,
    timestamp TEXT,
    level TEXT,
    service TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""

# SQL DDL for performance indexes
CREATE_INDEXES_SQL = [
    "CREATE INDEX IF NOT EXISTS idx_logs_upload_id ON logs(upload_id);",
    "CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);",
    "CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service);"
]


@dataclass
class LogModel:
    """
    Data model representing a single log record entry in SQLite.
    """
    id: Optional[int] = None
    upload_id: str = ""
    timestamp: Optional[str] = None
    level: Optional[str] = None
    service: Optional[str] = None
    message: Optional[str] = None
    created_at: Optional[str] = None

    def to_dict(self) -> dict:
        """Converts the dataclass model into a standard dictionary."""
        return {
            "id": self.id,
            "upload_id": self.upload_id,
            "timestamp": self.timestamp,
            "level": self.level,
            "service": self.service,
            "message": self.message,
            "created_at": self.created_at
        }
