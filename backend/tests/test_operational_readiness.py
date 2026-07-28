"""
LogSense AI - Operational Readiness Unit Tests (Phase 9.2)
Verifies DELETE /logs, DELETE /uploads/{upload_id}, and POST /demo/load.
"""

import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from database.operations import insert_logs, get_all_logs, clear_logs


class TestOperationalReadiness(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        # Clear database before each test
        clear_logs()

    def test_post_demo_load(self):
        response = self.client.post("/demo/load")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("upload_ids", data)
        self.assertGreater(data["total_logs"], 0)

    def test_delete_upload_batch(self):
        # Insert test data
        upload_id = "test_delete_batch_123"
        logs = [
            {"timestamp": "2026-07-28T12:00:00Z", "level": "INFO", "service": "test", "message": "hello"}
        ]
        insert_logs(logs, upload_id)

        # Verify insertion
        db_logs = get_all_logs()
        self.assertEqual(len(db_logs), 1)

        # Call DELETE /uploads/{upload_id}
        response = self.client.delete(f"/uploads/{upload_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["deleted_count"], 1)

        # Verify DB is now empty
        self.assertEqual(len(get_all_logs()), 0)

    def test_delete_upload_batch_not_found(self):
        response = self.client.delete("/uploads/non_existent_upload_99999")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertEqual(data["status"], "error")

    def test_delete_all_logs(self):
        # Insert test data
        insert_logs([{"timestamp": "2026-07-28T12:00:00Z", "level": "INFO", "service": "s1", "message": "msg1"}], "u1")
        insert_logs([{"timestamp": "2026-07-28T12:00:00Z", "level": "WARN", "service": "s2", "message": "msg2"}], "u2")

        self.assertEqual(len(get_all_logs()), 2)

        # Call DELETE /logs
        response = self.client.delete("/logs")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["deleted_count"], 2)

        # Verify DB is empty
        self.assertEqual(len(get_all_logs()), 0)


if __name__ == "__main__":
    unittest.main()
