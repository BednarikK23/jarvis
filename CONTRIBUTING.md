# Contributing to Jarvis Local

Welcome! This guide will help you set up the development environment and understand the project structure.

## Architecture

*   **Frontend**: React (Vite) + Lucide Icons + CSS Modules.
*   **Backend**: FastAPI + SQLAlchemy (SQLite) + ChromaDB (Vector Store).
*   **AI**: Local LLM via **Ollama**.

## Prerequisites

1.  **Python 3.10+**
2.  **Node.js 18+**
3.  **Ollama** running locally/remotely with a model pulled (e.g., `ollama pull mistral`).

## Setup

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the server:
```bash
uvicorn main:app --reload
```
API will be at `http://localhost:8000`. Only documentation at `/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
App will be at `http://localhost:5173`.

## Key Directories

*   `backend/services/`: Core logic (RAG, Chat, Analysis).
*   `backend/routers/`: API endpoints.
*   `frontend/src/components/`: React components.

## Features

*   **Chat**: Standard chat interface.
*   **RAG**: "Knowledge Base" in project settings. Indexes local folders.
*   **Data Analysis**: Ask to "plot" or "analyze" CSVs in your knowledge base.

## License

MIT
