"""
LogSense AI - Deployment Preparation Unit Tests
Verifies GET /health endpoint, GET / root metadata, environment configuration, CORS resolution, and error response consistency.
"""

import os
import sys
import unittest
from unittest.mock import patch
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from config import AppConfig, APP_VERSION, get_app_config, get_ai_config


class TestDeploymentReadiness(unittest.TestCase):
    """Test suite verifying Phase 9.1 deployment readiness components."""

    def setUp(self):
        self.client = TestClient(app)

    def test_get_root_version_and_metadata(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["version"], APP_VERSION)
        self.assertIn("environment", data)

    def test_get_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["version"], APP_VERSION)
        self.assertIn("timestamp", data)
        self.assertIn("environment", data)

        # Verify database telemetry structure
        self.assertIn("database", data)
        self.assertEqual(data["database"]["status"], "connected")
        self.assertIsInstance(data["database"]["total_logs"], int)

        # Verify AI service telemetry structure
        self.assertIn("ai_service", data)
        self.assertIn("status", data["ai_service"])
        self.assertIn("model", data["ai_service"])

    def test_app_config_environment_validation(self):
        with patch.dict(os.environ, {
            "ENVIRONMENT": "production",
            "PORT": "9000",
            "CORS_ORIGINS": "https://logsense.ai,https://app.logsense.ai"
        }):
            cfg = AppConfig()
            self.assertEqual(cfg.environment, "production")
            self.assertEqual(cfg.port, 9000)
            origins = cfg.get_cors_origins()
            self.assertIn("https://logsense.ai", origins)
            self.assertIn("https://app.logsense.ai", origins)

    def test_app_config_invalid_environment(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "invalid_env_name"}):
            with self.assertRaises(ValueError):
                AppConfig()

    def test_http_exception_handler_format(self):
        # Trigger 404 route error
        response = self.client.get("/non_existent_route_12345")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertEqual(data["status"], "error")
        self.assertIn("detail", data)
        self.assertIn("error", data)
        self.assertEqual(data["error"]["code"], 404)

    def test_validation_exception_handler_format(self):
        # Trigger 422 validation error on POST /ai/chat
        response = self.client.post("/ai/chat", json="invalid_json_type_string")
        self.assertEqual(response.status_code, 422)
        data = response.json()
        self.assertEqual(data["status"], "error")
        self.assertIn("detail", data)
        self.assertEqual(data["error"]["code"], 422)


if __name__ == "__main__":
    unittest.main()
