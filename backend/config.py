import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    # LLM Settings
    DIGEST_LLM_MODEL = os.getenv("DIGEST_LLM_MODEL", "qwen2.5:14b")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # Paths
    # Ensure these are relative to where the app is run (usually backend dir)
    DATA_DIR = os.getenv("DATA_DIR", "../data")
    STATIC_DIR = os.getenv("STATIC_DIR", "../static")
    
    # Server Settings
    _origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
    ALLOWED_ORIGINS = [origin.strip() for origin in _origins_str.split(",") if origin.strip()]

settings = Settings()
