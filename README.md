# Jarvis Local Assistant

A private, local AI assistant running on your machine using fastAPI, React, and Ollama.

## prerequisites
- **Linux** (tested on Mint)
- **Python 3.12+**
- **Node.js v18+ & npm**
- **Ollama** (installed and running with models pulled, e.g., `ollama pull qwen2.5-coder:7b`)

## Setup

1. **Clone/Navigate to project**:
   ```bash
   cd path/to/jarvis
   ```

2. **Backend Setup**:
   The backend uses a Python virtual environment.
   ```bash
   # If not already set up
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

## Running the App

### 1. Start Ollama
Ensure Ollama is serving in the background:
```bash
ollama serve
```

### 2. Start Backend
In a terminal:
```bash
cd backend
../.venv/bin/uvicorn main:app --reload
```
- The API will be available at `http://localhost:8000`.
- **Interactive Documentation**: Visit `http://localhost:8000/docs` to test endpoints manually.

### 3. Start Frontend
In a new terminal window:
```bash
cd frontend
npm run dev
```
- Open **http://localhost:5173** to use the Jarvis App.
- It will automatically connect to the backend at port 8000.

## Project Structure
- `backend/`: FastAPI application (Python)
- `frontend/`: React application (JavaScript/Vite)
- `data/`: Local database (SQLite) and storage

## Features
- **Projects**: Create projects to organize your chats.
- **Chat**: Talk to local LLMs (e.g., Qwen).
- **History**: Chats are saved locally in `data/jarvis.db`.
- **Web Capabilities**:
    - **Search**: Type `/search <query>` in the chat to search the web. The system attempts to use DuckDuckGo, then Google, and falls back to Wikipedia if necessary.
    - **Auto-Scrape**: Paste any HTTP/HTTPS link in your message. The content will be largely fetched, cleaned, and injected into the conversation context for the AI to read.
