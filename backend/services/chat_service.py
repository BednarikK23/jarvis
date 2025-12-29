
from sqlalchemy.orm import Session
from typing import Generator, List, Dict, Any, Optional
import json
import re

import models
import schemas
from services.ollama_client import OllamaClient
from services.rag_service import rag_service
from services.analysis_service import analysis_service
from prompts import DATA_ANALYSIS_PROMPT

class ChatService:
    def __init__(self):
        self.ollama_client = OllamaClient()

    def process_message(
        self, 
        db: Session, 
        chat_id: int, 
        message_content: str, 
        model: str
    ) -> Generator[str, None, None]:
        """
        Process a new user message:
        1. Save to DB.
        2. Build context (RAG, System Prompt, Analysis Prompt).
        3. Stream response from LLM.
        4. Execute analysis code if generated.
        5. Save assistant response to DB.
        """
        
        # 1. Fetch Chat & Project
        chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
        if not chat:
            raise ValueError("Chat not found")

        # 2. Save User Message
        user_msg = models.Message(chat_id=chat_id, role="user", content=message_content)
        db.add(user_msg)
        db.commit()

        # 3. Build Context
        context_messages = self._build_context(db, chat, message_content)

        # 4. Stream & Execute
        def generate() -> Generator[str, None, None]:
            full_response = ""
            content_accumulator = ""
            
            # Check for analysis intent
            is_analysis_request = self._is_analysis_request(message_content)

            try:
                # Stream from Ollama
                for chunk in self.ollama_client.chat(model=model, messages=context_messages, stream=True):
                    full_response += chunk
                    content_accumulator += chunk
                    yield chunk
                
                # Post-processing (Analysis Execution)
                if is_analysis_request:
                    analysis_output = self._handle_analysis_execution(content_accumulator)
                    if analysis_output:
                        yield analysis_output
                        full_response += analysis_output

            except Exception as e:
                error_msg = f"\n[Error: {str(e)}]"
                yield error_msg
                full_response += error_msg
            
            # 5. Save Assistant Message (in a separate DB session or re-using passed db carefully)
            # Since generator runs longer than the route function, we might need a fresh session 
            # or Ensure the session passed is still valid. 
            # Standard pattern is using a new session for the background/post-yield part usually, 
            # but here we can just use a local session for safety.
            from database import SessionLocal
            db_local = SessionLocal()
            try:
                asst_msg = models.Message(chat_id=chat_id, role="assistant", content=full_response)
                db_local.add(asst_msg)
                db_local.commit()
            finally:
                db_local.close()

        return generate()

    def _build_context(self, db: Session, chat: models.Chat, last_user_msg: str) -> List[Dict[str, str]]:
        messages = []
        
        # System Prompt
        if chat.project.system_prompt:
            messages.append({"role": "system", "content": chat.project.system_prompt})

        # RAG Context
        has_knowledge = db.query(models.KnowledgeSource).filter(
            models.KnowledgeSource.project_id == chat.project_id, 
            models.KnowledgeSource.status == 'indexed'
        ).first()

        if has_knowledge:
            retrieved_docs = rag_service.query_project(chat.project_id, last_user_msg)
            if retrieved_docs:
                context_str = "\n\n".join([f"Source: {doc['metadata']['source']}\nContent: {doc['content']}" for doc in retrieved_docs])
                rag_prompt = f"\n\nUse the following context from the user's files to answer the question if relevant:\n\n{context_str}\n\n"
                messages.append({"role": "system", "content": rag_prompt})

        # Analysis Prompt
        if self._is_analysis_request(last_user_msg):
            messages.append({"role": "system", "content": DATA_ANALYSIS_PROMPT})
            
        # Chat History (Current Request Messages - Usually passed from frontend, 
        # but in this refactor I'm simplifying to just context construction. 
        # If we need history, we should fetch it from DB or expect it in request.)
        # For now, let's assume we just send the current turn + context, or we should fetch last N messages.
        # The original code iterated `request.messages`.
        # Let's adjust api to pass `request.messages` to this method if needed, 
        # OR we can fetch from DB. Fetching from DB is more "backend-centric".
        
        # Let's fetch last 10 messages from DB for history
        history = db.query(models.Message).filter(models.Message.chat_id == chat.id).order_by(models.Message.created_at.asc()).all()
        # Exclude the very last one we just added? Or include it? 
        # We just added the user message. So it's in history.
        
        # We need to format them for Ollama
        # Limit to last N to avoid context window issues
        recent_history = history[-10:] 
        for msg in recent_history:
            messages.append({"role": msg.role, "content": msg.content})
            
        return messages

    def _is_analysis_request(self, text: str) -> bool:
        keywords = ['analyze', 'plot', 'graph', 'chart', 'visualize', 'calculate', 'correlation', 'load data']
        return any(kw in text.lower() for kw in keywords)

    def _handle_analysis_execution(self, text: str) -> Optional[str]:
        code_match = re.search(r"```python(.*?)```", text, re.DOTALL)
        if not code_match:
            return None
            
        code = code_match.group(1).strip()
        result = analysis_service.execute_code(code)
        
        output_msg = "\n\n*Executing Analysis...*\n"
        
        if result['stdout']:
            output_msg += f"\n**Output:**\n```\n{result['stdout']}\n```\n"
        if result['stderr']:
            output_msg += f"\n**Error:**\n```\n{result['stderr']}\n```\n"
            
        if result['images']:
            for img_path in result['images']:
                output_msg += f"\n![Analysis Plot]({img_path})\n"
                
        return output_msg

# Global instance
chat_service = ChatService()
