"""
LogSense AI - AI Infrastructure Services Package
Exposes core configuration, client wrappers, prompt builders, sanitizers, Pydantic schemas, and orchestration services.
"""

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

__all__ = [
    "AIConfig",
    "get_ai_config",
    "OpenAIClient",
    "OpenAIClientError",
    "sanitize_text",
    "sanitize_incident_report",
    "format_structured_report_summary",
    "build_incident_explanation_prompt",
    "build_summary_prompt",
    "build_chat_prompt",
    "AIChatMessage",
    "AIChatRequest",
    "AIChatResponse",
    "AIIncidentExplanationRequest",
    "AIIncidentExplanationResponse",
    "AISummaryRequest",
    "AISummaryResponse",
    "AIService",
    "get_ai_service"
]
