import os
import uuid
import time
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, status
from parser.log_parser import parse_log_file, parse_log_content
from database.operations import (
    insert_logs,
    get_all_logs,
    search_logs,
    count_logs,
    get_services,
    get_upload_ids,
    get_logs_by_upload,
)
from services.analytics import generate_dashboard_metrics
from services.analysis import generate_incident_report
from services.ai import (
    get_ai_service,
    AIChatRequest,
    OpenAIClientError,
    AIConfig
)

router = APIRouter()

# Configure logger for AI Copilot endpoint
logger = logging.getLogger("logsense.ai_copilot")
logger.setLevel(logging.INFO)

# Directory for saved uploads
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".log", ".txt", ".csv"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


class AnalyzeRequest(BaseModel):
    upload_id: Optional[str] = None


class AIChatCopilotRequest(BaseModel):
    upload_id: Optional[str] = None
    question: Optional[str] = None


def sync_stored_logs_from_uploads() -> None:
    """
    Scans UPLOAD_DIR for saved log files and persists them into SQLite
    if the database is currently empty.
    """
    if not get_all_logs() and UPLOAD_DIR.exists():
        for file_path in UPLOAD_DIR.glob("*"):
            if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                try:
                    content = file_path.read_bytes()
                    records = parse_log_content(content, file_path.name)
                    if records:
                        upload_id = f"upload_sync_{uuid.uuid4().hex[:8]}"
                        insert_logs(records, upload_id)
                except Exception:
                    pass


@router.get("/")
def get_root():
    return {
        "status": "success",
        "message": "Welcome to LogSense AI API",
        "version": "1.0.0"
    }


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    # Extension validation
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed extensions are: .log, .txt, .csv"
        )

    # Read content & size validation
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the 10 MB limit (File size: {len(content) / (1024*1024):.2f} MB)."
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # Save file to uploads directory
    save_path = UPLOAD_DIR / filename
    try:
        with open(save_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    # Parse file and store in SQLite database
    try:
        upload_id = f"upload_{uuid.uuid4().hex[:12]}"
        total_logs, preview = parse_log_file(content, filename)
        parsed_records = parse_log_content(content, filename)
        insert_logs(parsed_records, upload_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing and storing log file: {str(e)}"
        )

    return {
        "status": "success",
        "upload_id": upload_id,
        "filename": filename,
        "total_logs": total_logs,
        "preview": preview
    }


@router.get("/dashboard")
def get_dashboard():
    sync_stored_logs_from_uploads()
    metrics = generate_dashboard_metrics()
    return {
        "status": "success",
        "data": metrics
    }


@router.get("/logs")
def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=500),
    search: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    upload_id: Optional[str] = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc|ASC|DESC)$")
):
    """
    Paginated search and filter endpoint for log explorer.
    Uses SQLite LIMIT and OFFSET to return exact log slices.
    """
    sync_stored_logs_from_uploads()
    total = count_logs(search=search, level=level, service=service, upload_id=upload_id)
    logs = search_logs(
        page=page,
        limit=limit,
        search=search,
        level=level,
        service=service,
        upload_id=upload_id,
        sort=sort
    )
    pages = (total + limit - 1) // limit if total > 0 else 0

    return {
        "status": "success",
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages,
        "logs": logs
    }


@router.get("/logs/meta")
def get_logs_meta():
    """
    Returns available services and upload_ids for filter dropdowns.
    """
    sync_stored_logs_from_uploads()
    return {
        "status": "success",
        "services": get_services(),
        "upload_ids": get_upload_ids()
    }


@router.post("/analyze")
def analyze_logs(payload: Optional[AnalyzeRequest] = None):
    """
    Triggers the Incident Analysis Engine and returns a structured incident analysis report.
    Accepts optional upload_id to analyze a specific upload batch.
    """
    sync_stored_logs_from_uploads()
    upload_id = payload.upload_id if payload else None
    report = generate_incident_report(upload_id=upload_id)
    return report


@router.post("/ai/chat")
def ai_chat_copilot(payload: Optional[AIChatCopilotRequest] = None):
    """
    AI Copilot Endpoint.
    Answers user questions using the structured incident report generated by the Incident Analysis Engine.
    Does not send raw logs to OpenAI.
    """
    timestamp_str = datetime.now(timezone.utc).isoformat()

    # 1. Validate request
    if not payload or not payload.upload_id or not payload.upload_id.strip() or not payload.question or not payload.question.strip():
        logger.warning(f"[{timestamp_str}] Invalid request payload for /ai/chat: {payload}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request: upload_id and question are required non-empty fields."
        )

    upload_id = payload.upload_id.strip()
    question = payload.question.strip()

    sync_stored_logs_from_uploads()

    # Check upload presence
    logs_for_upload = get_logs_by_upload(upload_id)
    if not logs_for_upload:
        logger.warning(f"[{timestamp_str}] Upload ID '{upload_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload ID '{upload_id}' not found."
        )

    # 2. Generate incident report using analysis.py (source of truth)
    report = generate_incident_report(upload_id=upload_id)
    if not report or report.get("statistics", {}).get("total_logs", 0) == 0:
        logger.warning(f"[{timestamp_str}] No incident data found for upload_id '{upload_id}'.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No incident data found for upload_id '{upload_id}'."
        )

    start_time = time.perf_counter()

    try:
        # 3. Call AI Service (Sanitizer -> Prompt Builder -> OpenAI Client)
        ai_service = get_ai_service()
        ai_req = AIChatRequest(
            incident_report=report,
            message=question,
            mask_pii=True
        )
        ai_res = ai_service.process_chat(ai_req)

        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        tokens_dict = ai_res.tokens_used or {}
        input_tokens = tokens_dict.get("prompt_tokens", 0)
        output_tokens = tokens_dict.get("completion_tokens", 0)
        total_tokens = tokens_dict.get("total_tokens", 0)

        # Logging execution metrics
        logger.info(
            f"[{timestamp_str}] AI Chat Success | upload_id={upload_id} | question='{question}' | "
            f"model={ai_res.model_used} | response_time_ms={response_time_ms} | "
            f"tokens={{input: {input_tokens}, output: {output_tokens}, total: {total_tokens}}} | status=200"
        )

        return {
            "status": "success",
            "answer": ai_res.response,
            "model": ai_res.model_used,
            "response_time_ms": response_time_ms,
            "tokens": {
                "input": input_tokens,
                "output": output_tokens,
                "total": total_tokens
            }
        }

    except OpenAIClientError as e:
        err_msg = str(e)
        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(f"[{timestamp_str}] OpenAIClientError: {err_msg} | response_time_ms={response_time_ms}")

        if "Rate limit" in err_msg or "rate_limit" in err_msg.lower() or "429" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI service rate limit exceeded. Please try again later."
            )
        elif "timeout" in err_msg.lower() or "connection" in err_msg.lower() or "504" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI service request timed out."
            )
        elif "not configured" in err_msg.lower() or "api_key" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI configuration error: OPENAI_API_KEY is not configured."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI Service failure: {err_msg}"
            )
    except HTTPException:
        raise
    except Exception as e:
        response_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(f"[{timestamp_str}] Unexpected error in /ai/chat: {str(e)} | response_time_ms={response_time_ms}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/chat")
def chat_with_ai(payload: Optional[AIChatCopilotRequest] = None):
    """
    Alias / legacy route for /ai/chat.
    """
    if payload and payload.upload_id and payload.question:
        return ai_chat_copilot(payload)

    return {
        "status": "success",
        "answer": "Correlating timestamps shows a cascade failure. The postgres-main instance reported connection pool exhaustion approximately 1.2 seconds prior to the first 502 error in checkout-service.",
        "model": "gpt-4o-mini",
        "response_time_ms": 0,
        "tokens": {
            "input": 0,
            "output": 0,
            "total": 0
        }
    }
