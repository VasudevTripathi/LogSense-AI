from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_root():
    return {
        "status": "success",
        "message": "Welcome to LogSense AI API",
        "version": "1.0.0"
    }

@router.post("/upload")
def upload_file():
    return {
        "status": "success",
        "message": "File uploaded successfully (mock)",
        "file_name": "api-production-gateway-2023-10-27.log",
        "size_mb": 14.2,
        "total_entries": 4892
    }

@router.get("/dashboard")
def get_dashboard():
    return {
        "status": "success",
        "data": {
            "total_logs": 24500,
            "errors": 124,
            "warnings": 450,
            "active_services": 8,
            "log_level_distribution": {
                "info": 65,
                "warning": 20,
                "error": 15
            }
        }
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
