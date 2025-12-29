
import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import uuid
from typing import List
import glob
from constants import VALID_EXTENSIONS, SKIP_EXTENSIONS

# Text parsers
from pypdf import PdfReader
from docx import Document

class RAGService:
    def __init__(self):
        """
        Initialize the RAG Service.
        Sets up the ChromaDB persistent client and loads the local embedding model.
        """
        # Persistent storage for ChromaDB
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "../data/chroma")
        os.makedirs(self.db_path, exist_ok=True)
        
        self.chroma_client = chromadb.PersistentClient(path=self.db_path)
        
        # Load embedding model locally
        # This might take a moment on first load
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def _get_collection(self, project_id: int):
        """Retrieve or create a ChromaDB collection for a specific project."""
        name = f"project_{project_id}"
        return self.chroma_client.get_or_create_collection(name=name)

    def delete_project_index(self, project_id: int):
        """Delete a project's index collection."""
        name = f"project_{project_id}"
        try:
            self.chroma_client.delete_collection(name=name)
            print(f"Deleted ChromaDB collection for project {project_id}")
        except Exception as e:
            print(f"Error deleting collection for project {project_id}: {e}")

    def ingest_source(self, project_id: int, source_path: str):
        """
        Ingest a file or directory into the RAG index.
        
        Args:
            project_id (int): The ID of the project.
            source_path (str): Absolute path to the file or directory.
            
        This method will:
        1. Walk the directory tree (if path is a dir).
        2. Filter files based on `VALID_EXTENSIONS` and `SKIP_EXTENSIONS`.
        3. Parse content from files (PDF, DOCX, text).
        4. Chunk the text.
        5. Generate embeddings locally.
        6. Upsert valid vectors to ChromaDB.
        """
        collection = self._get_collection(project_id)        

        files_to_process = []
        if os.path.isfile(source_path):
            files_to_process.append(source_path)
        elif os.path.isdir(source_path):
            for root, dirs, files in os.walk(source_path):
                # Skip common ignore dirs
                if any(x in root for x in SKIP_EXTENSIONS):
                    continue
                
                for file in files:
                    files_to_process.append(os.path.join(root, file))
        
        documents = []
        metadatas = []
        ids = []

        for file_path in files_to_process:
            ext = os.path.splitext(file_path)[1].lower()
            if ext not in VALID_EXTENSIONS:
                continue
            
            content = self._read_file(file_path, ext)
            if not content:
                continue

            # Simple chunking (e.g., 1000 chars with 100 overlap)
            chunks = self._chunk_text(content, chunk_size=1000, overlap=100)
            
            for i, chunk in enumerate(chunks):
                documents.append(chunk)
                metadatas.append({"source": file_path, "project_id": project_id})
                ids.append(str(uuid.uuid4()))

        # Batch upsert to avoid memory issues
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            batch_docs = documents[i:i+batch_size]
            batch_metas = metadatas[i:i+batch_size]
            batch_ids = ids[i:i+batch_size]
            
            # Embeddings are generated automatically by chromadb if functionality is default? 
            # But we are using our own model for control and local enforcement.
            embeddings = self.model.encode(batch_docs).tolist()
            
            collection.upsert(
                documents=batch_docs,
                embeddings=embeddings,
                metadatas=batch_metas,
                ids=batch_ids
            )

    def _read_file(self, path: str, ext: str) -> str:
        """
        Read content from a file based on its extension.
        Supports .pdf, .docx, and plain text files.
        """
        try:
            if ext == '.pdf':
                reader = PdfReader(path)
                return "\n".join([page.extract_text() for page in reader.pages])
            elif ext == '.docx':
                doc = Document(path)
                return "\n".join([p.text for p in doc.paragraphs])
            else:
                # Text based
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
        except Exception as e:
            print(f"Error reading {path}: {e}")
            return ""

    def _chunk_text(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text (str): Content to chunk.
            chunk_size (int): Max characters per chunk.
            overlap (int): Overlap characters between chunks.
            
        Returns:
            List[str]: List of text chunks.
        """
        if not text:
            return []
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += (chunk_size - overlap)
        return chunks

    def query_project(self, project_id: int, query_text: str, n_results: int = 3):
        """
        Query the RAG index for a project.
        
        Args:
            project_id (int): Project ID to query.
            query_text (str): The search query.
            n_results (int): Number of top results to return.
            
        Returns:
            List[dict]: List of matches containing content, metadata (source), and distance.
        """
        collection = self._get_collection(project_id)
        if collection.count() == 0:
            return []

        query_embedding = self.model.encode([query_text]).tolist()
        
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=n_results
        )
        
        # Format results
        hits = []
        if results['documents']:
            for i in range(len(results['documents'][0])):
                hits.append({
                    "content": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i] if results['distances'] else 0
                })
        return hits

# Global instance
rag_service = RAGService()
