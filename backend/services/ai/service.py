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

    def _build_fallback_response(self, report: Dict[str, Any], question: str) -> str:
        """
        Generates a deterministic SRE diagnostic response when external AI providers hit rate limits or quota caps.
        """
        summary = report.get("summary", {}) if isinstance(report.get("summary"), dict) else {}
        root_cause = report.get("root_cause", {}) if isinstance(report.get("root_cause"), dict) else {}
        recs = report.get("recommendations", [])
        services = report.get("affected_services", [])

        lines = []
        lines.append("> ℹ️ **Notice**: OpenAI API rate limit / quota exceeded. Displaying rule-based SRE diagnostic analysis based on your stored log report:\n")

        q_lower = (question or "").lower()
        if "root cause" in q_lower or "why" in q_lower or "explain" in q_lower:
            lines.append("### Root Cause Analysis")
            lines.append(f"**Primary Summary**: {root_cause.get('summary', 'Operational failure detected.')}")
            lines.append(f"**Affected Microservice**: `{root_cause.get('service', 'unknown')}`")
            lines.append(f"**Category**: `{root_cause.get('category', 'UNKNOWN')}`")
            lines.append(f"**Details**: {root_cause.get('explanation', 'N/A')}")
        elif "summar" in q_lower:
            lines.append("### Executive Incident Summary")
            lines.append(f"- **Overall Status**: {summary.get('overall_status', 'CRITICAL')}")
            lines.append(f"- **Primary Root Cause**: {root_cause.get('summary', 'N/A')}")
            lines.append(f"- **Affected Services**: {', '.join(services) if services else 'None'}")
        elif "service" in q_lower or "failed" in q_lower:
            lines.append("### Service Failure Correlation")
            lines.append(f"The primary failing microservice identified by log signatures is `{root_cause.get('service', 'unknown')}`.")
            if services:
                lines.append(f"Infrastructure scope affected: {', '.join([f'`{s}`' for s in services])}.")
        else:
            lines.append("### Diagnostic Overview")
            lines.append(f"**Root Cause**: {root_cause.get('summary', 'Operational failure detected.')}")
            lines.append(f"**Microservice**: `{root_cause.get('service', 'unknown')}`")
            lines.append(f"**Explanation**: {root_cause.get('explanation', 'N/A')}")

        if recs and isinstance(recs, list):
            lines.append("\n### Recommended Remediation Steps")
            for i, r in enumerate(recs, 1):
                lines.append(f"{i}. {r}")

        return "\n".join(lines)

    def process_chat(self, request: AIChatRequest, allow_fallback: bool = True) -> AIChatResponse:
        """
        Orchestrates an interactive AI chat turn based on an incident report context.
        Falls back to rule-based analysis if external AI rate limits or quotas are reached.
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

        try:
            completion = self.client.generate_completion(messages=messages)
            return AIChatResponse(
                response=completion["content"],
                model_used=completion["model_used"],
                tokens_used=completion["tokens_used"]
            )
        except OpenAIClientError as e:
            err_msg = str(e)
            if allow_fallback and ("Rate limit" in err_msg or "rate_limit" in err_msg.lower() or "429" in err_msg or "quota" in err_msg.lower()):
                fallback_text = self._build_fallback_response(report_to_use, request.message)
                return AIChatResponse(
                    response=fallback_text,
                    model_used="logsense-rule-engine (rate-limit fallback)",
                    tokens_used={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
                )
            raise



def get_ai_service(client: Optional[OpenAIClient] = None, config: Optional[AIConfig] = None) -> AIService:
    """
    Factory function returning an initialized AIService instance.
    """
    return AIService(client=client, config=config)
