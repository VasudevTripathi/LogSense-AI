# LogSense AI

LogSense AI is an AI-powered web application designed for parsing, analyzing, and visualizing complex system logs to provide automated root cause analysis, real-time error tracking, and interactive AI debugging.

---

## Technology Stack

### Frontend
- **Framework & Tooling**: React (Vite)
- **Styling**: Tailwind CSS, shadcn/ui design tokens
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios
- **Visualization**: Recharts

### Backend
- **API Framework**: FastAPI
- **Server**: Uvicorn
- **Data Validation**: Pydantic

### Database
- **Engine**: SQLite

---

## Directory Structure

```
LogSense AI/
├── README.md
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── Header.jsx
│       ├── layouts/
│       │   └── MainLayout.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── UploadLogs.jsx
│       │   ├── AIAnalysis.jsx
│       │   └── AIChat.jsx
│       ├── services/
│       │   └── api.js
│       ├── hooks/
│       │   └── useLogs.js
│       ├── assets/
│       └── lib/
│           └── utils.js
└── backend/
    ├── main.py
    ├── requirements.txt
    ├── api/
    │   └── routes.py
    ├── services/
    │   └── __init__.py
    ├── parser/
    │   └── __init__.py
    ├── database/
    │   ├── __init__.py
    │   └── connection.py
    ├── models/
    │   └── __init__.py
    └── uploads/
        └── .gitkeep
```

---

## Setup Instructions

### Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.9+ and `pip`

### 1. Frontend Setup

Navigate to the `frontend` folder and install dependencies:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

### 2. Backend Setup

Navigate to the `backend` folder and install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Start the FastAPI server using Uvicorn (after cd backend):

```bash
python -m uvicorn main:app --reload
```

The API will be available at `http://localhost:8000` with interactive API documentation at `http://localhost:8000/docs`.

---

## Future Features

- **Automated Log Parsing**: Support for log formats (.log, .txt, .json, syslog, stack trace extraction).
- **LLM Root Cause Analysis**: OpenAI-compatible API integration for automatic anomaly detection and solution recommendations.
- **Interactive AI Debug Assistant**: Conversational querying of uploaded log context and stack traces.
- **System Metrics & Visualizations**: Interactive log level breakdown, failure timelines, and frequency distributions.
- **Log Export & Reports**: Downloadable analysis summaries and PDF export capabilities.
