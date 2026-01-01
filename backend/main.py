from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from database import engine, Base
from routers import models, chat, projects, knowledge, tools
from config import settings


# Create database tables
Base.metadata.create_all(bind=engine)

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Jarvis Backend")

# Mount static directory for plots
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# Configure CORS
origins = settings.ALLOWED_ORIGINS

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
app.include_router(knowledge.router)
app.include_router(tools.router)

@app.get("/")
def read_root():
    return {"message": "Jarvis Backend is running"}

@app.on_event("startup")
def startup_event():
    # Ensure data directory exists
    os.makedirs(settings.DATA_DIR, exist_ok=True)
