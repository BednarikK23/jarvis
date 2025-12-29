from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from database import engine, Base
from routers import models, chat, projects

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jarvis Backend")

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(models.router)
app.include_router(projects.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"message": "Jarvis Backend is running"}

@app.on_event("startup")
def startup_event():
    # Ensure data directory exists
    os.makedirs("../data", exist_ok=True)
