"""
LogSense AI - Reusable AI Prompt Builder Module
Constructs OpenAI prompt message payloads from structured incident reports.
Never uses raw logs.
"""

from typing import Dict, Any, List, Optional


def format_structured_report_summary(report: Dict[str, Any]) -> str:
    """
    Formats a structured incident report dictionary into a clean markdown summary text block.
    Extracts high-level report components without dumping raw logs.
    """
    if not isinstance(report, dict):
        return "No structured incident report available."

    lines = []
    lines.append(f"Incident Report ID: {report.get('report_id', 'N/A')}")

    # Summary section
    summary = report.get("summary", {})
    if isinstance(summary, dict):
        lines.append("## Overall Summary")
        lines.append(f"- Status: {summary.get('overall_status', 'N/A')}")
        lines.append(f"- Severity Score: {summary.get('severity_score', 'N/A')}")
        lines.append(f"- Total Logs Analyzed: {summary.get('total_logs', 0)}")
        lines.append(f"- Error Count: {summary.get('total_errors', 0)}")
        lines.append(f"- Critical Count: {summary.get('total_critical', 0)}")
        lines.append(f"- Primary Category: {summary.get('root_cause_category', 'N/A')}")

    # Root cause
    root_cause = report.get("root_cause", {})
    if isinstance(root_cause, dict):
        lines.append("## Root Cause Analysis")
        lines.append(f"- Summary: {root_cause.get('summary', 'N/A')}")
        lines.append(f"- Primary Error: {root_cause.get('primary_error', 'N/A')}")
        lines.append(f"- Service: {root_cause.get('service', 'N/A')}")
        lines.append(f"- Category: {root_cause.get('category', 'N/A')}")
        lines.append(f"- Explanation: {root_cause.get('explanation', 'N/A')}")
        lines.append(f"- Occurrences: {root_cause.get('occurrences', 0)}")

    # Affected Services
    affected_services = report.get("affected_services") or (summary.get("affected_services") if isinstance(summary, dict) else [])
    if affected_services:
        lines.append(f"## Affected Services: {', '.join(affected_services)}")

    # Top Error Patterns
    top_errors = report.get("top_errors") or report.get("aggregated_errors") or []
    if top_errors and isinstance(top_errors, list):
        lines.append("## Top Aggregated Errors")
        for err in top_errors[:5]:
            if isinstance(err, dict):
                lines.append(f"- [{err.get('level', 'ERROR')}] Service: {err.get('service', 'unknown')} (Count: {err.get('count', 1)}): {err.get('message', '')[:120]}")

    # Recommendations
    recommendations = report.get("recommendations", [])
    if recommendations and isinstance(recommendations, list):
        lines.append("## Recommended Actions")
        for rec in recommendations:
            lines.append(f"- {rec}")

    # Timeline
    timeline = report.get("incident_timeline", [])
    if timeline and isinstance(timeline, list):
        lines.append("## Key Timeline Events")
        for ev in timeline[:5]:
            if isinstance(ev, dict):
                lines.append(f"- [{ev.get('timestamp', 'N/A')}] [{ev.get('level', 'INFO')}] {ev.get('service', 'unknown')}: {ev.get('message', '')[:100]}")

    # Custom or Extra Metadata
    standard_keys = {
        "report_id", "summary", "root_cause", "affected_services",
        "top_errors", "aggregated_errors", "recommendations", "incident_timeline"
    }
    extra_keys = {k: v for k, v in report.items() if k not in standard_keys}
    if extra_keys:
        lines.append("## Additional Context")
        for k, v in extra_keys.items():
            lines.append(f"- {k}: {v}")

    return "\n".join(lines)


def build_incident_explanation_prompt(incident_report: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Builds chat completion messages for requesting an in-depth explanation of a structured incident report.
    """
    formatted_report = format_structured_report_summary(incident_report)

    system_prompt = (
        "You are LogSense AI, an expert Senior SRE and System Diagnostics Engineer. "
        "Analyze the structured incident report provided and deliver a clear, technical explanation "
        "of what occurred, root cause drivers, impact scope, and recommended resolution steps."
    )

    user_prompt = (
        "Please explain this incident based strictly on the following structured incident report:\n\n"
        f"{formatted_report}\n\n"
        "Provide your analysis with:\n"
        "1. Executive Overview\n"
        "2. Detailed Root Cause Analysis\n"
        "3. System Impact Assessment\n"
        "4. Actionable Mitigation Steps"
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]


def build_summary_prompt(incident_report: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Builds chat completion messages for generating an executive summary from a structured incident report.
    """
    formatted_report = format_structured_report_summary(incident_report)

    system_prompt = (
        "You are LogSense AI, an executive technical advisor. "
        "Summarize incident findings concisely for technical leaders and managers."
    )

    user_prompt = (
        "Generate a brief executive summary based on this structured incident report:\n\n"
        f"{formatted_report}\n\n"
        "Highlight operational impact, failure cause, and recommended immediate action items."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]


def build_chat_prompt(
    incident_report: Dict[str, Any],
    chat_history: Optional[List[Dict[str, str]]] = None,
    user_message: str = ""
) -> List[Dict[str, str]]:
    """
    Builds chat completion messages for an interactive session context anchored on a structured incident report.
    """
    formatted_report = format_structured_report_summary(incident_report)

    system_prompt = (
        "You are LogSense AI, an interactive DevOps and Site Reliability Engineering assistant. "
        "Answer questions and assist the user using the structured incident report context provided below.\n\n"
        "=== INCIDENT CONTEXT ===\n"
        f"{formatted_report}\n"
        "========================\n\n"
        "Always stay relevant to the incident context. Provide concise, helpful responses."
    )

    messages = [{"role": "system", "content": system_prompt}]

    if chat_history and isinstance(chat_history, list):
        for msg in chat_history:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                role = str(msg["role"]).lower()
                if role in ("user", "assistant"):
                    messages.append({"role": role, "content": str(msg["content"])})

    if user_message and user_message.strip():
        messages.append({"role": "user", "content": user_message.strip()})

    return messages
