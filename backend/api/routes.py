import os
import uuid
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
)
from services.analytics import generate_dashboard_metrics
from services.analysis import generate_incident_report

router = APIRouter()

# Directory for saved uploads
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".log", ".txt", ".csv"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


class AnalyzeRequest(BaseModel):
    upload_id: Optional[str] = None


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


@router.post("/chat")
def chat_with_ai():
    return {
        "status": "success",
        "reply": "Correlating timestamps shows a cascade failure. The postgres-main instance reported connection pool exhaustion approximately 1.2 seconds prior to the first 502 error in checkout-service.",
        "timestamp": "14:22:18 UTC"
    }
