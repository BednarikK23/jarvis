import requests
from typing import List, Dict, Generator
import json

from config import settings

OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL

class OllamaClient:
    def list_models(self) -> List[str]:
        try:
            response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            models_data = response.json().get("models", [])
            return [model["name"] for model in models_data]
        except requests.RequestException as e:
            print(f"Error connecting to Ollama: {e}")
            return []

    def chat(self, model: str, messages: List[Dict[str, str]], stream: bool = True) -> Generator[str, None, None]:
        url = f"{OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream
        }
        
        try:
            with requests.post(url, json=payload, stream=stream) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        body = json.loads(line)
                        if "message" in body and "content" in body["message"]:
                            yield body["message"]["content"]
                        if body.get("done", False):
                            break
        except requests.RequestException as e:
             yield f"Error: Failed to communicate with Ollama ({str(e)})"
