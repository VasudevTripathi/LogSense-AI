"""
LogSense AI - AI Orchestration Service
Orchestrates: Incident Report -> Sanitizer -> Prompt Builder -> OpenAI Client -> Structured Response.
No FastAPI routing logic.
"""

from typing import Dict, Any, Optional, List
from config import AIConfig, get_ai_config
from services.ai.client import OpenAIClient, OpenAIClientError
from services.ai.sanitizer import sanitize_incident_report
from services.ai.prompts import (
    build_incident_explanation_prompt,
    build_summary_prompt,
    build_chat_prompt
)
from services.ai.schemas import (
    AIChatRequest,
    AIChatResponse,
    AIChatMessage,
    AIIncidentExplanationRequest,
    AIIncidentExplanationResponse,
    AISummaryRequest,
    AISummaryResponse
)


class AIService:
    """
    Core AI orchestration service.
    Coordinates incident report sanitization, prompt construction, OpenAI API invocation,
    and returns structured Pydantic model responses.
    """
    def __init__(self, client: Optional[OpenAIClient] = None, config: Optional[AIConfig] = None):
        self.config = config or get_ai_config()
        self.client = client or OpenAIClient(config=self.config)

    def explain_incident(
        self,
        incident_report: Dict[str, Any],
        mask_pii: bool = True,
        model: Optional[str] = None
    ) -> AIIncidentExplanationResponse:
        """
        Generates a detailed AI explanation for an incident report.
        """
        report_to_use = sanitize_incident_report(incident_report) if mask_pii else incident_report
        messages = build_incident_explanation_prompt(report_to_use)

        completion = self.client.generate_completion(messages=messages, model=model)

        return AIIncidentExplanationResponse(
            explanation=completion["content"],
            model_used=completion["model_used"],
            tokens_used=completion["tokens_used"]
        )

    def generate_summary(
        self,
        incident_report: Dict[str, Any],
        mask_pii: bool = True,
        model: Optional[str] = None
    ) -> AISummaryResponse:
        """
        Generates an executive summary for an incident report.
        """
        report_to_use = sanitize_incident_report(incident_report) if mask_pii else incident_report
        messages = build_summary_prompt(report_to_use)

        completion = self.client.generate_completion(messages=messages, model=model)

        return AISummaryResponse(
            summary=completion["content"],
            model_used=completion["model_used"],
            tokens_used=completion["tokens_used"]
        )

    def process_chat(self, request: AIChatRequest) -> AIChatResponse:
        """
        Orchestrates an interactive AI chat turn based on an incident report context.
        """
        report_to_use = (
            sanitize_incident_report(request.incident_report)
            if request.mask_pii
            else request.incident_report
        )

        history_dicts = []
        if request.chat_history:
            for msg in request.chat_history:
                if isinstance(msg, AIChatMessage):
                    history_dicts.append({"role": msg.role, "content": msg.content})
                elif isinstance(msg, dict):
                    history_dicts.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        messages = build_chat_prompt(
            incident_report=report_to_use,
            chat_history=history_dicts,
            user_message=request.message
        )

        completion = self.client.generate_completion(messages=messages)

        return AIChatResponse(
            response=completion["content"],
            model_used=completion["model_used"],
            tokens_used=completion["tokens_used"]
        )


def get_ai_service(client: Optional[OpenAIClient] = None, config: Optional[AIConfig] = None) -> AIService:
    """
    Factory function returning an initialized AIService instance.
    """
    return AIService(client=client, config=config)
