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
        Generates a comprehensive, deterministic SRE diagnostic report utilizing the full
        incident analysis report (severity, category, confidence, root cause, statistics,
        timeline, top recurring error patterns, affected services, and recommendations).
        """
        root_cause = report.get("root_cause", {}) if isinstance(report.get("root_cause"), dict) else {}
        severity = report.get("severity", "HIGH")
        confidence = report.get("confidence", "85%")
        category = report.get("incident_category", root_cause.get("category", "UNKNOWN"))
        affected_services = report.get("affected_services", [])
        statistics = report.get("statistics", {}) if isinstance(report.get("statistics"), dict) else {}
        timeline = report.get("timeline", [])
        top_errors = report.get("top_errors", [])
        recs = report.get("recommendations", [])

        # Extract timestamps and occurrence count
        first_seen = root_cause.get("first_seen", "N/A")
        occurrences = root_cause.get("occurrences", 1)
        primary_service = root_cause.get("service", "unknown")

        # Compute overall last seen timestamp across top errors and timeline
        last_seen = "N/A"
        if top_errors and isinstance(top_errors[0], dict) and top_errors[0].get("last_seen"):
            last_seen = top_errors[0].get("last_seen")
        elif timeline and isinstance(timeline[-1], dict) and timeline[-1].get("timestamp"):
            last_seen = timeline[-1].get("timestamp")
        if last_seen == "N/A":
            last_seen = first_seen

        # Build clean, production-grade Markdown output
        lines = []
        lines.append("> ⚡ **Rule-Based Investigation Mode**: Operating in deterministic SRE diagnostic mode based on verified system telemetry and structured log analysis.\n")

        # Incident Telemetry Summary Table
        lines.append("### 📊 Incident Telemetry & Diagnostic Metrics")
        lines.append("| Telemetry Metric | Diagnostic Value |")
        lines.append("| :--- | :--- |")
        lines.append(f"| **Severity Rating** | `{severity}` |")
        lines.append(f"| **Diagnostic Confidence** | `{confidence}` |")
        lines.append(f"| **Incident Category** | `{category}` |")
        lines.append(f"| **Primary Failing Service** | `{primary_service}` |")
        lines.append(f"| **Affected Microservices** | {', '.join([f'`{s}`' for s in affected_services]) if affected_services else '`None`'} |")
        lines.append(f"| **First Onset Timestamp** | `{first_seen}` |")
        lines.append(f"| **Latest Event Timestamp** | `{last_seen}` |")
        lines.append(f"| **Root Cause Occurrences** | `{occurrences} count` |")
        lines.append("")

        # System Aggregate Statistics
        lines.append("### 📈 Aggregate Log Telemetry Statistics")
        lines.append(f"- **Total Ingested Log Records**: `{statistics.get('total_logs', 0)}`")
        lines.append(f"- **Total Error / Critical Events**: `{statistics.get('total_errors', 0)}`")
        lines.append(f"- **Total Warning Events**: `{statistics.get('total_warnings', 0)}`")
        lines.append(f"- **Total Impacted Microservices**: `{statistics.get('affected_service_count', len(affected_services))}`")
        lines.append("")

        # Root Cause Analysis
        lines.append("### 🔍 Root Cause Analysis & Error Signature")
        lines.append(f"**Primary Diagnosis**: {root_cause.get('summary', 'Operational failure detected.')}")
        lines.append(f"**Error Signature**: `{root_cause.get('primary_error', 'N/A')}`")
        lines.append(f"**Category Classification**: `{category}`")
        lines.append(f"**Diagnostic Details**: {root_cause.get('explanation', 'N/A')}")
        lines.append("")

        # Chronological Incident Timeline
        if timeline and isinstance(timeline, list) and len(timeline) > 0:
            lines.append("### ⏱️ Chronological Incident Timeline Highlights")
            lines.append("| Timestamp | Level | Service | Event Description |")
            lines.append("| :--- | :--- | :--- | :--- |")
            for evt in timeline[:10]:
                if isinstance(evt, dict):
                    ts = evt.get("timestamp", "N/A")
                    lvl = evt.get("level", "INFO")
                    srv = evt.get("service", "unknown")
                    msg = evt.get("message", "").replace("|", "\\|")
                    if len(msg) > 85:
                        msg = msg[:85] + "..."
                    lines.append(f"| `{ts}` | `{lvl}` | `{srv}` | {msg} |")
            lines.append("")

        # Top Recurring Errors
        if top_errors and isinstance(top_errors, list) and len(top_errors) > 0:
            lines.append("### 🚨 Top Recurring Error Patterns")
            for idx, err in enumerate(top_errors[:5], 1):
                if isinstance(err, dict):
                    srv = err.get("service", "unknown")
                    msg = err.get("message", "")
                    count = err.get("count", 1)
                    err_first = err.get("first_seen", "N/A")
                    err_last = err.get("last_seen", "N/A")
                    err_cat = err.get("category", category)
                    lines.append(f"{idx}. **`{srv}`** — {msg}")
                    lines.append(f"   - *Occurrences*: `{count}` | *First Seen*: `{err_first}` | *Last Seen*: `{err_last}` | *Category*: `{err_cat}`")
            lines.append("")

        # Recommended SRE Remediation Steps
        if recs and isinstance(recs, list) and len(recs) > 0:
            lines.append("### 🛡️ Recommended SRE Remediation Action Plan")
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
                    model_used="logsense-rule-engine",
                    tokens_used={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
                )
            raise



def get_ai_service(client: Optional[OpenAIClient] = None, config: Optional[AIConfig] = None) -> AIService:
    """
    Factory function returning an initialized AIService instance.
    """
    return AIService(client=client, config=config)
