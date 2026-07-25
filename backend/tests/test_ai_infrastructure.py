"""
LogSense AI - AI Infrastructure Unit Test Suite
Verifies config loading, client initialization, prompt generation, sanitization, schemas, and orchestration service.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import AIConfig, get_ai_config
from services.ai.client import OpenAIClient, OpenAIClientError
from services.ai.sanitizer import sanitize_text, sanitize_incident_report
from services.ai.prompts import (
    format_structured_report_summary,
    build_incident_explanation_prompt,
    build_summary_prompt,
    build_chat_prompt
)
from services.ai.schemas import (
    AIChatMessage,
    AIChatRequest,
    AIChatResponse,
    AIIncidentExplanationRequest,
    AIIncidentExplanationResponse,
    AISummaryRequest,
    AISummaryResponse
)
from services.ai.service import AIService, get_ai_service


class TestAIConfig(unittest.TestCase):
    """Tests for AI Configuration loading and validation."""

    def test_default_config_loading(self):
        with patch.dict(os.environ, {
            "OPENAI_API_KEY": "sk-test12345678901234567890",
            "OPENAI_MODEL": "gpt-4o-mini",
            "OPENAI_MAX_TOKENS": "500",
            "OPENAI_TEMPERATURE": "0.5"
        }):
            cfg = AIConfig()
            self.assertEqual(cfg.api_key, "sk-test12345678901234567890")
            self.assertEqual(cfg.model, "gpt-4o-mini")
            self.assertEqual(cfg.max_tokens, 500)
            self.assertEqual(cfg.temperature, 0.5)
            self.assertTrue(cfg.is_configured())

    def test_invalid_max_tokens(self):
        with patch.dict(os.environ, {"OPENAI_MAX_TOKENS": "-10"}):
            with self.assertRaises(ValueError):
                AIConfig()

    def test_invalid_temperature(self):
        with patch.dict(os.environ, {"OPENAI_TEMPERATURE": "3.5"}):
            with self.assertRaises(ValueError):
                AIConfig()


class TestSanitizer(unittest.TestCase):
    """Tests for Incident Report and Text Sanitization."""

    def test_sanitize_text_credentials_and_secrets(self):
        raw_text = (
            "Found sk-12345678901234567890 and Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature "
            "with password='SuperSecretPassword123' and postgres://user:secret@localhost:5432/mydb "
            "contact dev@example.com at 192.168.1.50"
        )
        sanitized = sanitize_text(raw_text, mask_emails=True, mask_ips=True)

        self.assertNotIn("sk-12345678901234567890", sanitized)
        self.assertNotIn("SuperSecretPassword123", sanitized)
        self.assertNotIn("postgres://user:secret@localhost:5432/mydb", sanitized)
        self.assertNotIn("dev@example.com", sanitized)
        self.assertNotIn("192.168.1.50", sanitized)
        self.assertIn("[MASKED_API_KEY]", sanitized)
        self.assertIn("[MASKED_BEARER_TOKEN]", sanitized)
        self.assertIn("[MASKED_CONNECTION_STRING]", sanitized)
        self.assertIn("[MASKED_EMAIL]", sanitized)
        self.assertIn("[MASKED_IP]", sanitized)

    def test_sanitize_incident_report_deep_copy(self):
        original_report = {
            "report_id": "rep-100",
            "summary": {
                "root_cause_category": "DATABASE",
                "message": "Connection error to postgres://dbuser:dbpass@db.internal:5432/production"
            },
            "root_cause": {
                "explanation": "Failed auth with token Bearer abc.123.xyz and user user@domain.com"
            },
            "sensitive_key": "sk-proj-98765432109876543210"
        }

        sanitized_report = sanitize_incident_report(original_report)

        # Ensure original report is NOT mutated
        self.assertIn("postgres://dbuser:dbpass@db.internal:5432/production", original_report["summary"]["message"])
        self.assertIn("user@domain.com", original_report["root_cause"]["explanation"])

        # Ensure copy IS sanitized
        self.assertNotIn("postgres://", sanitized_report["summary"]["message"])
        self.assertNotIn("user@domain.com", sanitized_report["root_cause"]["explanation"])
        self.assertIn("[MASKED_CONNECTION_STRING]", sanitized_report["summary"]["message"])
        self.assertIn("[MASKED_EMAIL]", sanitized_report["root_cause"]["explanation"])
        self.assertIn("[MASKED_API_KEY]", sanitized_report["sensitive_key"])


class TestPrompts(unittest.TestCase):
    """Tests for Reusable Prompt Builders."""

    def setUp(self):
        self.structured_report = {
            "report_id": "rep-202",
            "summary": {
                "overall_status": "CRITICAL",
                "severity_score": 9.2,
                "total_logs": 1500,
                "total_errors": 45,
                "total_critical": 5,
                "root_cause_category": "DATABASE",
                "affected_services": ["auth-service", "user-service"]
            },
            "root_cause": {
                "summary": "Database Connection Pool Exhaustion",
                "primary_error": "psycopg2.OperationalError: FATAL: remaining connection slots are reserved",
                "service": "auth-service",
                "category": "DATABASE",
                "explanation": "High concurrent traffic led to unreleased DB connections.",
                "occurrences": 32
            },
            "recommendations": [
                "Increase max_connections parameter in postgresql.conf",
                "Configure HikariCP connection leak detection"
            ],
            "incident_timeline": [
                {"timestamp": "2026-07-26T00:10:00Z", "level": "ERROR", "service": "auth-service", "message": "Connection timeout"}
            ]
        }

    def test_build_incident_explanation_prompt(self):
        messages = build_incident_explanation_prompt(self.structured_report)
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0]["role"], "system")
        self.assertEqual(messages[1]["role"], "user")
        self.assertIn("Database Connection Pool Exhaustion", messages[1]["content"])
        self.assertIn("auth-service", messages[1]["content"])

    def test_build_summary_prompt(self):
        messages = build_summary_prompt(self.structured_report)
        self.assertEqual(len(messages), 2)
        self.assertIn("executive summary", messages[1]["content"])

    def test_build_chat_prompt(self):
        history = [{"role": "user", "content": "What is the primary affected service?"}]
        messages = build_chat_prompt(self.structured_report, chat_history=history, user_message="How do we fix it?")
        self.assertGreaterEqual(len(messages), 3)
        self.assertEqual(messages[0]["role"], "system")
        self.assertIn("auth-service", messages[0]["content"])
        self.assertEqual(messages[-1]["content"], "How do we fix it?")


class TestOpenAIClient(unittest.TestCase):
    """Tests for OpenAI Client communication and error handling using mocks."""

    def test_client_generate_completion_success(self):
        mock_response = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Analysis complete: Database connection pool leak detected."
        mock_response.choices = [mock_choice]
        mock_response.model = "gpt-4o-mini"
        mock_response.usage.prompt_tokens = 150
        mock_response.usage.completion_tokens = 50
        mock_response.usage.total_tokens = 200

        mock_openai_instance = MagicMock()
        mock_openai_instance.chat.completions.create.return_value = mock_response

        cfg = AIConfig(validate_on_init=False)
        cfg.api_key = "sk-fakekey"
        client = OpenAIClient(config=cfg, openai_instance=mock_openai_instance)

        result = client.generate_completion(messages=[{"role": "user", "content": "Hello"}])
        self.assertEqual(result["content"], "Analysis complete: Database connection pool leak detected.")
        self.assertEqual(result["model_used"], "gpt-4o-mini")
        self.assertEqual(result["tokens_used"]["total_tokens"], 200)

    def test_client_unconfigured_error(self):
        cfg = AIConfig(validate_on_init=False)
        cfg.api_key = ""
        client = OpenAIClient(config=cfg)
        with self.assertRaises(OpenAIClientError):
            client.generate_completion(messages=[{"role": "user", "content": "Hello"}])


class TestSchemas(unittest.TestCase):
    """Tests for Pydantic Schemas."""

    def test_chat_request_schema(self):
        req = AIChatRequest(
            incident_report={"report_id": "123"},
            message="What caused the error?",
            chat_history=[AIChatMessage(role="user", content="Hi")]
        )
        self.assertEqual(req.incident_report["report_id"], "123")
        self.assertEqual(req.message, "What caused the error?")
        self.assertEqual(len(req.chat_history), 1)

    def test_chat_response_schema(self):
        res = AIChatResponse(
            response="The database timed out.",
            model_used="gpt-4o-mini",
            tokens_used={"total_tokens": 100}
        )
        self.assertEqual(res.response, "The database timed out.")
        self.assertEqual(res.model_used, "gpt-4o-mini")


class TestAIService(unittest.TestCase):
    """Tests for AIService Orchestration."""

    def test_explain_incident_orchestration(self):
        mock_client = MagicMock()
        mock_client.generate_completion.return_value = {
            "content": "Explanation: Auth service failed due to DB pool exhaustion.",
            "model_used": "gpt-4o-mini",
            "tokens_used": {"prompt_tokens": 100, "completion_tokens": 30, "total_tokens": 130}
        }

        service = get_ai_service(client=mock_client)
        report = {
            "report_id": "rep-999",
            "root_cause": {"summary": "DB Pool Exhaustion", "primary_error": "Connection limit reached"},
            "sensitive": "sk-12345678901234567890"
        }

        resp = service.explain_incident(report, mask_pii=True)

        self.assertIsInstance(resp, AIIncidentExplanationResponse)
        self.assertIn("Explanation:", resp.explanation)
        self.assertEqual(resp.model_used, "gpt-4o-mini")

        # Verify that prompt received by client was sanitized
        call_args = mock_client.generate_completion.call_args[1]["messages"]
        user_content = call_args[1]["content"]
        self.assertNotIn("sk-12345678901234567890", user_content)
        self.assertIn("[MASKED_API_KEY]", user_content)


if __name__ == "__main__":
    unittest.main()
