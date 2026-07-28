"""
LogSense AI - Rule-Based AI Fallback Engine Unit Tests
Verifies service name validation, timestamp exclusion, descriptive root cause summaries,
and rich markdown generation in _build_fallback_response.
"""

import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from parser.log_parser import is_valid_service_name, parse_log_line
from services.analysis import determine_root_cause, detect_affected_services, normalize_logs
from services.ai.service import AIService


class TestRuleBasedEngine(unittest.TestCase):

    def test_service_name_validation(self):
        # Valid service names
        self.assertTrue(is_valid_service_name("auth-service"))
        self.assertTrue(is_valid_service_name("payment_gateway"))
        self.assertTrue(is_valid_service_name("user-service"))
        self.assertTrue(is_valid_service_name("k8s-cluster"))

        # Invalid service names (timestamps, dates, log levels, schemes, generic)
        self.assertFalse(is_valid_service_name("2026-07-14T08:00:00.000Z"))
        self.assertFalse(is_valid_service_name("2026-07-14"))
        self.assertFalse(is_valid_service_name("08:00:00"))
        self.assertFalse(is_valid_service_name("INFO"))
        self.assertFalse(is_valid_service_name("ERROR"))
        self.assertFalse(is_valid_service_name("CRITICAL"))
        self.assertFalse(is_valid_service_name("http"))
        self.assertFalse(is_valid_service_name("unknown"))
        self.assertFalse(is_valid_service_name("12345"))
        self.assertFalse(is_valid_service_name(None))

    def test_parse_log_line_service_extraction(self):
        # Test space-delimited log line with timestamp and level
        line = "2026-07-14T08:00:00.000Z INFO auth-service Session initialized"
        parsed = parse_log_line(line)
        self.assertEqual(parsed["timestamp"], "2026-07-14T08:00:00.000Z")
        self.assertEqual(parsed["level"], "INFO")
        self.assertEqual(parsed["service"], "auth-service")

        # Test bracketed log line
        line2 = "[2026-07-14T08:00:00Z] [ERROR] [checkout-service] Payment gateway timeout"
        parsed2 = parse_log_line(line2)
        self.assertEqual(parsed2["service"], "checkout-service")

    def test_detect_affected_services_never_includes_timestamps(self):
        raw_logs = [
            {"timestamp": "2026-07-14T08:00:00Z", "level": "ERROR", "service": "2026-07-14T08:00:00Z", "message": "msg1"},
            {"timestamp": "2026-07-14T08:01:00Z", "level": "ERROR", "service": "auth-service", "message": "msg2"},
            {"timestamp": "2026-07-14T08:02:00Z", "level": "WARN", "service": "INFO", "message": "msg3"},
            {"timestamp": "2026-07-14T08:03:00Z", "level": "ERROR", "service": "payment-gateway", "message": "msg4"},
        ]
        normalized = normalize_logs(raw_logs)
        affected = detect_affected_services(normalized)

        self.assertIn("auth-service", affected)
        self.assertIn("payment-gateway", affected)
        self.assertNotIn("2026-07-14T08:00:00Z", affected)
        self.assertNotIn("INFO", affected)
        self.assertEqual(len(affected), 2)

    def test_build_fallback_response_full_report_utilization(self):
        mock_report = {
            "status": "success",
            "incident_id": "inc-12345",
            "root_cause": {
                "summary": "Database Connection Pool Exhaustion in auth-service",
                "primary_error": "psycopg2.OperationalError: FATAL remaining connection slots reserved",
                "service": "auth-service",
                "category": "DATABASE",
                "explanation": "High connection pool load caused request drops.",
                "first_seen": "2026-07-14T08:00:00.000Z",
                "occurrences": 12
            },
            "incident_category": "DATABASE",
            "severity": "CRITICAL",
            "confidence": "94%",
            "affected_services": ["auth-service", "api-gateway"],
            "timeline": [
                {
                    "timestamp": "2026-07-14T08:00:00.000Z",
                    "service": "auth-service",
                    "level": "ERROR",
                    "message": "psycopg2.OperationalError: FATAL remaining connection slots reserved"
                }
            ],
            "top_errors": [
                {
                    "service": "auth-service",
                    "message": "psycopg2.OperationalError: FATAL remaining connection slots reserved",
                    "level": "ERROR",
                    "category": "DATABASE",
                    "count": 12,
                    "first_seen": "2026-07-14T08:00:00.000Z",
                    "last_seen": "2026-07-14T08:05:00.000Z"
                }
            ],
            "recommendations": [
                "Increase database connection pool size in backend service configuration."
            ],
            "statistics": {
                "total_logs": 100,
                "total_errors": 12,
                "total_warnings": 3,
                "affected_service_count": 2
            }
        }

        service = AIService()
        fallback_markdown = service._build_fallback_response(mock_report, "What caused the incident?")

        # 1. Professional Banner Check
        self.assertIn("Rule-Based Investigation Mode", fallback_markdown)
        self.assertNotIn("quota exceeded", fallback_markdown.lower())

        # 2. Telemetry metrics check
        self.assertIn("CRITICAL", fallback_markdown)
        self.assertIn("94%", fallback_markdown)
        self.assertIn("auth-service", fallback_markdown)
        self.assertIn("api-gateway", fallback_markdown)
        self.assertIn("2026-07-14T08:00:00.000Z", fallback_markdown)
        self.assertIn("2026-07-14T08:05:00.000Z", fallback_markdown)
        self.assertIn("12 count", fallback_markdown)

        # 3. Aggregate Statistics Check
        self.assertIn("Total Ingested Log Records**: `100`", fallback_markdown)
        self.assertIn("Total Error / Critical Events**: `12`", fallback_markdown)
        self.assertIn("Total Warning Events**: `3`", fallback_markdown)

        # 4. Timeline & Top Errors Check
        self.assertIn("Chronological Incident Timeline Highlights", fallback_markdown)
        self.assertIn("Top Recurring Error Patterns", fallback_markdown)

        # 5. Recommendations Check
        self.assertIn("Recommended SRE Remediation Action Plan", fallback_markdown)
        self.assertIn("Increase database connection pool size", fallback_markdown)


if __name__ == "__main__":
    unittest.main()
