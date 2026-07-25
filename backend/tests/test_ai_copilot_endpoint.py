"""
LogSense AI - AI Copilot Endpoint Unit Tests
Verifies POST /ai/chat endpoint requirements, HTTP status codes, logging, and performance metrics.
"""

import sys
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from services.ai.client import OpenAIClientError
from services.ai.schemas import AIChatResponse


class TestAICopilotEndpoint(unittest.TestCase):
    """Test suite for POST /ai/chat AI Copilot endpoint."""

    def setUp(self):
        self.client = TestClient(app)
        self.valid_upload_id = "upload_test_12345"
        self.valid_logs = [
            {
                "id": 1,
                "upload_id": self.valid_upload_id,
                "timestamp": "2026-07-26T00:00:00Z",
                "level": "ERROR",
                "service": "auth-service",
                "message": "Database connection timeout"
            }
        ]
        self.mock_report = {
            "status": "success",
            "incident_id": "inc-98765",
            "root_cause": {
                "summary": "Database connection timeout",
                "primary_error": "psycopg2.OperationalError",
                "service": "auth-service",
                "category": "DATABASE",
                "explanation": "High connection pool load caused request drops.",
                "occurrences": 15
            },
            "incident_category": "DATABASE",
            "severity": "HIGH",
            "confidence": "92%",
            "affected_services": ["auth-service"],
            "timeline": [],
            "top_errors": [],
            "recommendations": ["Increase DB pool size"],
            "statistics": {
                "total_logs": 100,
                "total_errors": 15,
                "total_warnings": 5,
                "affected_service_count": 1
            }
        }

    @patch("api.routes.get_logs_by_upload")
    @patch("api.routes.generate_incident_report")
    @patch("api.routes.get_ai_service")
    def test_ai_chat_success(self, mock_get_ai_service, mock_generate_report, mock_get_logs):
        mock_get_logs.return_value = self.valid_logs
        mock_generate_report.return_value = self.mock_report

        mock_ai_service = MagicMock()
        mock_ai_service.process_chat.return_value = AIChatResponse(
            response="The auth-service failed due to a database connection pool timeout.",
            model_used="gpt-4o-mini",
            tokens_used={"prompt_tokens": 120, "completion_tokens": 30, "total_tokens": 150}
        )
        mock_get_ai_service.return_value = mock_ai_service

        payload = {
            "upload_id": self.valid_upload_id,
            "question": "What caused the auth-service failure?"
        }

        response = self.client.post("/ai/chat", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("auth-service failed", data["answer"])
        self.assertEqual(data["model"], "gpt-4o-mini")
        self.assertGreaterEqual(data["response_time_ms"], 0)
        self.assertEqual(data["tokens"]["input"], 120)
        self.assertEqual(data["tokens"]["output"], 30)
        self.assertEqual(data["tokens"]["total"], 150)

        # Verify source of truth call to analysis.py
        mock_generate_report.assert_called_once_with(upload_id=self.valid_upload_id)

    def test_ai_chat_missing_fields_400(self):
        # Empty payload
        response = self.client.post("/ai/chat", json={})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid request", response.json()["detail"])

        # Empty question
        response = self.client.post("/ai/chat", json={"upload_id": "upload_123", "question": "   "})
        self.assertEqual(response.status_code, 400)

        # Empty upload_id
        response = self.client.post("/ai/chat", json={"upload_id": "", "question": "Why?"})
        self.assertEqual(response.status_code, 400)

    @patch("api.routes.get_logs_by_upload")
    def test_ai_chat_upload_not_found_404(self, mock_get_logs):
        mock_get_logs.return_value = []
        payload = {
            "upload_id": "non_existent_upload_999",
            "question": "Explain failure"
        }
        response = self.client.post("/ai/chat", json=payload)
        self.assertEqual(response.status_code, 404)
        self.assertIn("Upload ID 'non_existent_upload_999' not found", response.json()["detail"])

    @patch("api.routes.get_logs_by_upload")
    @patch("api.routes.generate_incident_report")
    def test_ai_chat_no_incident_data_404(self, mock_generate_report, mock_get_logs):
        mock_get_logs.return_value = self.valid_logs
        mock_generate_report.return_value = {
            "statistics": {"total_logs": 0}
        }
        payload = {
            "upload_id": self.valid_upload_id,
            "question": "What happened?"
        }
        response = self.client.post("/ai/chat", json=payload)
        self.assertEqual(response.status_code, 404)
        self.assertIn("No incident data found", response.json()["detail"])

    @patch("api.routes.get_logs_by_upload")
    @patch("api.routes.generate_incident_report")
    @patch("api.routes.get_ai_service")
    def test_ai_chat_unconfigured_500(self, mock_get_ai_service, mock_generate_report, mock_get_logs):
        mock_get_logs.return_value = self.valid_logs
        mock_generate_report.return_value = self.mock_report

        mock_ai_service = MagicMock()
        mock_ai_service.process_chat.side_effect = OpenAIClientError("OPENAI_API_KEY is not configured.")
        mock_get_ai_service.return_value = mock_ai_service

        payload = {
            "upload_id": self.valid_upload_id,
            "question": "Summarize error"
        }
        response = self.client.post("/ai/chat", json=payload)
        self.assertEqual(response.status_code, 500)
        self.assertIn("configuration error", response.json()["detail"])

    @patch("api.routes.get_logs_by_upload")
    @patch("api.routes.generate_incident_report")
    @patch("api.routes.get_ai_service")
    def test_ai_chat_rate_limit_429(self, mock_get_ai_service, mock_generate_report, mock_get_logs):
        mock_get_logs.return_value = self.valid_logs
        mock_generate_report.return_value = self.mock_report

        mock_ai_service = MagicMock()
        mock_ai_service.process_chat.side_effect = OpenAIClientError("Rate limit exceeded for requests.")
        mock_get_ai_service.return_value = mock_ai_service

        payload = {
            "upload_id": self.valid_upload_id,
            "question": "Summarize error"
        }
        response = self.client.post("/ai/chat", json=payload)
        self.assertEqual(response.status_code, 429)
        self.assertIn("rate limit exceeded", response.json()["detail"])

    @patch("api.routes.get_logs_by_upload")
    @patch("api.routes.generate_incident_report")
    @patch("api.routes.get_ai_service")
    def test_ai_chat_timeout_504(self, mock_get_ai_service, mock_generate_report, mock_get_logs):
        mock_get_logs.return_value = self.valid_logs
        mock_generate_report.return_value = self.mock_report

        mock_ai_service = MagicMock()
        mock_ai_service.process_chat.side_effect = OpenAIClientError("Request timeout while reaching OpenAI.")
        mock_get_ai_service.return_value = mock_ai_service

        payload = {
            "upload_id": self.valid_upload_id,
            "question": "Summarize error"
        }
        response = self.client.post("/ai/chat", json=payload)
        self.assertEqual(response.status_code, 504)
        self.assertIn("timed out", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
