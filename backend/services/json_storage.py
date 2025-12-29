import json
import os
import uuid
from typing import List, Dict, Any, Optional

class JsonStorageService:
    def __init__(self, filename: str):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
        self.file_path = os.path.join(self.data_dir, filename)
        self._ensure_data_file()

    def _ensure_data_file(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir, exist_ok=True)
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w") as f:
                json.dump([], f)

    def _read_data(self) -> List[Dict[str, Any]]:
        self._ensure_data_file()
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []

    def _write_data(self, data: List[Dict[str, Any]]):
        self._ensure_data_file()
        with open(self.file_path, "w") as f:
            json.dump(data, f, indent=2)

    def get_all(self) -> List[Dict[str, Any]]:
        return self._read_data()

    def add_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        data = self._read_data()
        if "id" not in item:
            item["id"] = str(uuid.uuid4())
        data.append(item)
        self._write_data(data)
        return item

    def update_item(self, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = self._read_data()
        for item in data:
            if item.get("id") == item_id:
                item.update(updates)
                self._write_data(data)
                return item
        return None

    def delete_item(self, item_id: str) -> bool:
        data = self._read_data()
        initial_len = len(data)
        data = [item for item in data if item.get("id") != item_id]
        if len(data) < initial_len:
            self._write_data(data)
            return True
        return False
