from datetime import datetime
from typing import List, Optional
import schemas
from services.json_storage import JsonStorageService

class CalendarService:
    def __init__(self):
        self.storage = JsonStorageService("calendar.json")

    def get_events(self) -> List[schemas.CalendarEvent]:
        data = self.storage.get_all()
        return [schemas.CalendarEvent(**item) for item in data]

    def add_event(self, event: schemas.CalendarEventCreate) -> schemas.CalendarEvent:
        new_event = {
            "id": str(int(datetime.now().timestamp() * 1000)),
            "title": event.title,
            "start": event.start,
            "end": event.end,
            "description": event.description,
            "location": event.location,
            "color": event.color
        }
        self.storage.add_item(new_event)
        return schemas.CalendarEvent(**new_event)
    
    def update_event(self, event_id: str, updates: schemas.CalendarEventUpdate) -> Optional[schemas.CalendarEvent]:
        update_dict = updates.model_dump(exclude_unset=True)
        # The model_dump(exclude_unset=True) already handles including 'color' if it's provided in updates.
        # No explicit 'if updates.color is not None' check is needed here as it's covered by model_dump.
        updated_item = self.storage.update_item(event_id, update_dict)
        if updated_item:
            return schemas.CalendarEvent(**updated_item)
        return None

    def delete_event(self, event_id: str) -> bool:
        return self.storage.delete_item(event_id)
