from datetime import datetime
from typing import List, Optional
import schemas
from services.json_storage import JsonStorageService

class TodoService:
    def __init__(self):
        self.storage = JsonStorageService("todos.json")

    def get_todos(self) -> List[schemas.TodoItem]:
        data = self.storage.get_all()
        return [schemas.TodoItem(**item) for item in data]

    def add_todo(self, text: str) -> schemas.TodoItem:
        new_item = {
            "id": str(int(datetime.now().timestamp() * 1000)),
            "text": text,
            "completed": False,
            "created_at": datetime.now().isoformat()
        }
        self.storage.add_item(new_item)
        return schemas.TodoItem(**new_item)

    def update_todo(self, todo_id: str, updates: schemas.TodoUpdate) -> Optional[schemas.TodoItem]:
        # Convert Pydantic model to dict, filtering out None
        update_dict = updates.model_dump(exclude_unset=True)
        updated_item = self.storage.update_item(todo_id, update_dict)
        if updated_item:
            return schemas.TodoItem(**updated_item)
        return None

    def delete_todo(self, todo_id: str) -> bool:
        return self.storage.delete_item(todo_id)
