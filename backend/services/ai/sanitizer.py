"""
LogSense AI - Incident Report Sanitizer
Sanitizes copies of incident reports by masking API keys, passwords, tokens, connection strings, emails, and IP addresses.
"""

import re
import copy
from typing import Any, Dict, List

# Regular Expressions for Sensitive Patterns
JWT_PATTERN = re.compile(r"eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*")
BEARER_PATTERN = re.compile(r"Bearer\s+[^\s'\"]+", re.IGNORECASE)
CONN_STRING_PATTERN = re.compile(r"(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp)://[^\s'\"]+", re.IGNORECASE)
ADO_CONN_PATTERN = re.compile(r"(?:Server|Data Source|Database)=[^;]+;(?:User Id|Uid|Password|Pwd)=[^;\s'\"]+", re.IGNORECASE)
API_KEY_PATTERN = re.compile(r"(?:sk-[a-zA-Z0-9_\-]{16,}|api[_-]?key[=:\s]+['\"]?[a-zA-Z0-9_\-]{16,}['\"]?|x-api-key[=:\s]+['\"]?[a-zA-Z0-9_\-]{16,}['\"]?)", re.IGNORECASE)
PASSWORD_PATTERN = re.compile(r"(?:password|passwd|pwd|secret|client_secret|access_token)[=:\s]+['\"]?[^'\";\s]{4,}['\"]?", re.IGNORECASE)
AWS_KEY_PATTERN = re.compile(r"(?:AKIA[0-9A-Z]{16}|aws_secret_access_key[=:\s]+['\"]?[a-zA-Z0-9/+=]{30,}['\"]?)", re.IGNORECASE)
EMAIL_PATTERN = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b")
IP_PATTERN = re.compile(r"\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b")


def sanitize_text(text: str, mask_emails: bool = True, mask_ips: bool = True) -> str:
    """
    Sanitizes a string by replacing sensitive data (tokens, keys, secrets, connection strings, emails, IPs) with masks.
    """
    if not isinstance(text, str) or not text:
        return text

    sanitized = text
    sanitized = BEARER_PATTERN.sub("Bearer [MASKED_BEARER_TOKEN]", sanitized)
    sanitized = JWT_PATTERN.sub("[MASKED_JWT_TOKEN]", sanitized)
    sanitized = CONN_STRING_PATTERN.sub("[MASKED_CONNECTION_STRING]", sanitized)
    sanitized = ADO_CONN_PATTERN.sub("[MASKED_CONNECTION_STRING]", sanitized)
    sanitized = API_KEY_PATTERN.sub("[MASKED_API_KEY]", sanitized)
    sanitized = PASSWORD_PATTERN.sub("[MASKED_SECRET]", sanitized)
    sanitized = AWS_KEY_PATTERN.sub("[MASKED_AWS_KEY]", sanitized)

    if mask_emails:
        sanitized = EMAIL_PATTERN.sub("[MASKED_EMAIL]", sanitized)
    if mask_ips:
        sanitized = IP_PATTERN.sub("[MASKED_IP]", sanitized)

    return sanitized


def _recursive_sanitize(item: Any, mask_emails: bool, mask_ips: bool) -> Any:
    """
    Recursively traverses data structures to sanitize string fields.
    """
    if isinstance(item, str):
        return sanitize_text(item, mask_emails=mask_emails, mask_ips=mask_ips)
    elif isinstance(item, dict):
        return {
            key: _recursive_sanitize(val, mask_emails=mask_emails, mask_ips=mask_ips)
            for key, val in item.items()
        }
    elif isinstance(item, list):
        return [
            _recursive_sanitize(val, mask_emails=mask_emails, mask_ips=mask_ips)
            for val in item
        ]
    elif isinstance(item, tuple):
        return tuple(
            _recursive_sanitize(val, mask_emails=mask_emails, mask_ips=mask_ips)
            for val in item
        )
    return item


def sanitize_incident_report(
    report: Dict[str, Any],
    mask_emails: bool = True,
    mask_ips: bool = True
) -> Dict[str, Any]:
    """
    Creates a deep copy of the incident report and sanitizes all contained text fields.
    Guarantees original incident report dictionary is not mutated.
    """
    if not isinstance(report, dict):
        return report

    copied_report = copy.deepcopy(report)
    return _recursive_sanitize(copied_report, mask_emails=mask_emails, mask_ips=mask_ips)
