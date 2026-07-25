"""
LogSense AI - AI Service Schemas
Pydantic data models for request and response structures reused by future API endpoints.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class AIChatMessage(BaseModel):
    """Represents a single message turn in chat history."""
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Text content of the message")


class AIChatRequest(BaseModel):
    """Request schema for AI Chat session."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    incident_report: Dict[str, Any] = Field(..., description="Structured incident report object")
    message: str = Field(..., description="User question or prompt")
    chat_history: Optional[List[AIChatMessage]] = Field(default_factory=list, description="Prior conversation history")
    mask_pii: bool = Field(default=True, description="Whether to sanitize sensitive details prior to AI call")


class AIChatResponse(BaseModel):
    """Response schema for AI Chat session."""
    response: str = Field(..., description="AI response text")
    model_used: str = Field(..., description="OpenAI model name used")
    tokens_used: Optional[Dict[str, int]] = Field(default=None, description="Token consumption details")


class AIIncidentExplanationRequest(BaseModel):
    """Request schema for incident explanations."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    incident_report: Dict[str, Any] = Field(..., description="Structured incident report object")
    mask_pii: bool = Field(default=True, description="Whether to sanitize sensitive details")


class AIIncidentExplanationResponse(BaseModel):
    """Response schema for incident explanations."""
    explanation: str = Field(..., description="Generated incident explanation")
    model_used: str = Field(..., description="OpenAI model name used")
    tokens_used: Optional[Dict[str, int]] = Field(default=None, description="Token consumption details")


class AISummaryRequest(BaseModel):
    """Request schema for executive summaries."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    incident_report: Dict[str, Any] = Field(..., description="Structured incident report object")
    mask_pii: bool = Field(default=True, description="Whether to sanitize sensitive details")


class AISummaryResponse(BaseModel):
    """Response schema for executive summaries."""
    summary: str = Field(..., description="Generated executive summary")
    model_used: str = Field(..., description="OpenAI model name used")
    tokens_used: Optional[Dict[str, int]] = Field(default=None, description="Token consumption details")
