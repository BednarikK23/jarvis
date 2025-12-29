from fastapi import APIRouter
from services.ollama_client import OllamaClient

router = APIRouter(
    prefix="/api/models",
    tags=["models"]
)

ollama_client = OllamaClient()

@router.get("/")
def get_models():
    """
    List available models from the local Ollama instance.
    """
    models = ollama_client.list_models()
    return {"models": models}
