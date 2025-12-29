#!/bin/bash

# Function to kill processes on exit
cleanup() {
    echo "Stopping Jarvis..."
    kill $BACKEND_PID 2>/dev/null
    exit
}

# Trap Control-C and other termination signals
trap cleanup SIGINT SIGTERM

echo "Starting Jarvis Backend..."
cd backend
../.venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

echo "Backend running (PID: $BACKEND_PID)"
echo "Waiting for backend to be ready..."
sleep 2

echo "Starting Jarvis Frontend..."
cd frontend
npm run dev

# Wait for frontend to exit (this script stays alive)
wait $BACKEND_PID
