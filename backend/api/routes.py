import os
import uuid
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from parser.log_parser import parse_log_file, parse_log_content
from database.operations import insert_logs, get_all_logs
from services.analytics import generate_dashboard_metrics

router = APIRouter()

# Directory for saved uploads
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".log", ".txt", ".csv"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


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


@router.post("/analyze")
def analyze_logs():
    return {
        "status": "success",
        "message": "AI Analysis initiated (mock)",
        "analysis_id": "anlz-mock-8842",
        "confidence": "96%",
        "root_cause": "Database connection pool exhaustion in auth-service"
    }


@router.post("/chat")
def chat_with_ai():
    return {
        "status": "success",
        "reply": "Correlating timestamps shows a cascade failure. The postgres-main instance reported connection pool exhaustion approximately 1.2 seconds prior to the first 502 error in checkout-service.",
        "timestamp": "14:22:18 UTC"
    }
