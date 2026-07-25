"""
LogSense AI - Main Application Server
FastAPI production application setup, middleware, exception handling, CORS, and API router initialization.
"""

import time
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config import APP_VERSION, get_app_config
from api.routes import router as api_router

# Configure Application Logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("logsense.server")

app_config = get_app_config()

# Initialize FastAPI Application with Production Metadata
app = FastAPI(
    title="LogSense AI API",
    description=(
        "Production-grade backend API for LogSense AI application log parsing, "
        "deterministic incident analysis, and interactive SRE AI Copilot."
    ),
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "LogSense AI Team",
        "url": "https://github.com/VasudevTripathi/LogSense-AI",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    }
)

# Configure Production CORS Middleware
allowed_origins = app_config.get_cors_origins()
logger.info(f"Configuring CORS with allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True if allowed_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Structured Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    timestamp_str = datetime.now(timezone.utc).isoformat()
    client_ip = request.client.host if request.client else "unknown"

    try:
        response = await call_next(request)
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        logger.info(
            f"[{timestamp_str}] {request.method} {request.url.path} -> "
            f"Status {response.status_code} ({process_time_ms}ms) | Client: {client_ip}"
        )
        return response
    except Exception as exc:
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(
            f"[{timestamp_str}] {request.method} {request.url.path} -> "
            f"Unhandled Error ({process_time_ms}ms) | Client: {client_ip} | Exception: {str(exc)}"
        )
        raise exc


from starlette.exceptions import HTTPException as StarletteHTTPException

# Consistent JSON Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    timestamp_str = datetime.now(timezone.utc).isoformat()
    detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "detail": detail_msg,
            "error": {
                "code": exc.status_code,
                "message": detail_msg,
                "timestamp": timestamp_str
            }
        }
    )


@app.exception_handler(HTTPException)
async def fastapi_http_exception_handler(request: Request, exc: HTTPException):
    return await http_exception_handler(request, exc)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    timestamp_str = datetime.now(timezone.utc).isoformat()
    detail_msg = f"Validation Error: {exc.errors()}"
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "detail": detail_msg,
            "error": {
                "code": 422,
                "message": "Invalid request payload format.",
                "details": exc.errors(),
                "timestamp": timestamp_str
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    timestamp_str = datetime.now(timezone.utc).isoformat()
    err_msg = str(exc) or "An unexpected internal server error occurred."
    logger.error(f"[{timestamp_str}] Unhandled Exception: {err_msg}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "detail": err_msg,
            "error": {
                "code": 500,
                "message": err_msg,
                "timestamp": timestamp_str
            }
        }
    )


# Include API Router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=app_config.host,
        port=app_config.port,
        reload=(app_config.environment == "development")
    )
