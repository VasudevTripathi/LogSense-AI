# LogSense AI — Application Log Parsing, Incident Analysis & SRE AI Copilot

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](file:///d:/LogSense%20AI/backend/config.py)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Database](https://img.shields.io/badge/database-SQLite-003B57.svg)](https://www.sqlite.org)
[![Frontend](https://img.shields.io/badge/frontend-React%2018%20%7C%20Tailwind-61DAFB.svg)](https://react.dev)
[![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o--mini-412991.svg)](https://openai.com)

**LogSense AI** is an intelligent, production-grade application log parsing and diagnostic platform. It combines rule-based deterministic log ingestion with a specialized SRE AI Copilot to deliver real-time root cause analysis, cascade failure correlation, executive incident reports, and interactive troubleshooting.

---

## Key Features

- ⚡ **High-Performance Log Ingestion**: Multi-format log parser supporting standard text (`.log`), plaintext (`.txt`), and CSV (`.csv`) with automatic severity normalization.
- 🔍 **Interactive Log Explorer**: Paginated search, filtering by service name, log level, and upload batch (`upload_id`).
- 📊 **Analytics & Incident Dashboard**: Aggregated operational metrics, error frequency trends, and microservice health indicators.
- 🎯 **Deterministic Incident Analysis Engine**: Rule-based root cause calculation, confidence scoring, affected service detection, and failure timeline generation.
- 🤖 **SRE AI Copilot & Chat**: OpenAI-powered diagnostic assistant providing interactive Q&A anchored strictly on structured incident reports.
- 🛡️ **PII & Credential Sanitizer**: Automatic masking of sensitive data (API keys, JWTs, Bearer tokens, passwords, connection strings, emails, IPs) before AI transmission.
- 📑 **Executive Report & Export Center**: Export investigation reports to Markdown (`.md`), JSON (`.json`), or printable PDF.

---

## System Architecture & Flow

```
+------------------+      +--------------------+      +-------------------------+
| Log File Upload  | ---> | Log Parser         | ---> | SQLite Persistence      |
| (.log, .txt,csv) |      | (Regex & Standard) |      | (database/logsense.db)  |
+------------------+      +--------------------+      +-------------------------+
                                                                   |
                                                                   v
+------------------+      +--------------------+      +-------------------------+
| SRE AI Copilot   | <--- | Data Sanitizer     | <--- | Incident Analysis Engine|
| (POST /ai/chat)  |      | & Prompt Builder   |      | (Deterministic Rules)   |
+------------------+      +--------------------+      +-------------------------+
```

---

## Tech Stack

### Backend
- **Framework**: Python 3.10+ & FastAPI (`v0.100+`)
- **Database**: SQLite3 (`database/operations.py`)
- **AI Integration**: OpenAI SDK (`openai>=1.0.0`)
- **Config & Env**: `python-dotenv` & Pydantic v2
- **Testing**: Python `unittest`

### Frontend
- **Framework**: React 18 & Vite
- **Styling**: Vanilla CSS & Tailwind CSS (`v3.4`)
- **Icons**: Material Symbols Outlined
- **HTTP Client**: Axios

---

## Environment Configuration

Copy `backend/.env.example` to `backend/.env` and configure environment parameters:

```bash
# Server Settings
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# OpenAI AI Service
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

---

## Quickstart & Local Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ & npm

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start FastAPI Uvicorn dev server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API server will run at `http://localhost:8000`. Access interactive API documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Welcome & Metadata | `200` |
| `GET` | `/health` | Diagnostic Health Check (DB & AI status) | `200` |
| `POST` | `/upload` | Upload & ingest log file | `200`, `400`, `500` |
| `GET` | `/dashboard` | Retrieve aggregated dashboard metrics | `200` |
| `GET` | `/logs` | Search & filter log explorer (paginated) | `200` |
| `GET` | `/logs/meta` | Get filter dropdown metadata | `200` |
| `POST` | `/analyze` | Run Incident Analysis Engine | `200` |
| `POST` | `/ai/chat` | AI Copilot Q&A endpoint | `200`, `400`, `404`, `429`, `500`, `504` |

---

## Running Test Suites

### Backend Unit Tests
Run all 26 automated unit tests (Infrastructure, Endpoints, Deployment Readiness):

```bash
cd backend
python -m unittest discover -s tests
```

### Frontend Production Build
Validate production bundling:

```bash
cd frontend
npm run build
```

---

## Production Deployment

### Option A: Docker Deployment (Uvicorn)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Option B: Render / Vercel / Cloud Run
- **Backend (Render/Fly.io)**: Build command `pip install -r requirements.txt`, Start command `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **Frontend (Vercel/Netlify)**: Build command `npm run build`, Output directory `dist`.

---

## License

Distributed under the [MIT License](https://opensource.org/licenses/MIT).
