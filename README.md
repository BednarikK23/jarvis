# Jarvis Local Assistant

A private, local AI assistant running on your machine using FastAPI, React, and Ollama.

## Architecture
*   **Frontend**: React (Vite) + Lucide Icons + CSS Modules.
*   **Backend**: FastAPI + SQLAlchemy (SQLite) + ChromaDB (Vector Store).
*   **AI**: Local LLM via **Ollama**.

## Prerequisites
This project runs on Linux (Mint/Ubuntu) and requires specific system packages.

### System Dependencies (APT)
```bash
sudo apt update
# 1. Python 3.12 and Virtual Environment
sudo apt install python3.12 python3.12-venv python3-pip

# 2. Node.js and npm (Use NodeSource/NVM for newer versions if needed)
sudo apt install nodejs npm

# 3. Git
sudo apt install git
```

### AI Engine
**Ollama** is required:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```
Make sure to pull a model (e.g., `ollama pull qwen2.5:14b`, `ollama pull qwen2.5:7b`, `ollama pull qwen2.5:7b-coder`).

## Manual Setup & Running

### 1. Configuration
The backend requires configuration.
1.  Navigate to `backend/`.
2.  Copy `.env.example` to `.env`.
3.  Adjust settings if needed (e.g., `DIGEST_LLM_MODEL`).

### 2. Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

### 3. Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
- App: **http://localhost:5173**


## Quick Start - After Initial Setup!
You can run both the backend and frontend using the provided convenience script:
```bash
./run.sh
```

## Features
- **Projects**: Organize chats by project.
- **Chat**: Talk to local LLMs.
- **RAG**: "Knowledge Base" indexes local folders for context-aware answers.
- **Data Analysis**: Analyze and plot data from CSVs.
- **Web Capabilities**:
    - **Search**: `/search <query>` (DuckDuckGo/Google/Wikipedia).
    - **Auto-Scrape**: Paste URLs to inject content into context.
- **Daily Digest**: Summaries of finance and tech news (configured via `DIGEST_LLM_MODEL`).

## License
MIT
