import asyncio
import uuid
from typing import List, Dict, Any
from fastapi import UploadFile
from utils.logger import logger
from utils.storage import storage
from utils.embeddings import EmbeddingService
from utils.vectorstore import vector_store
from services.ingestion.parser import parser
from services.ingestion.cleaner import cleaner
from config.misc import MiscConfig

class IngestionPipeline:
    def __init__(self, batch_size: int = None):
        config = MiscConfig()
        self.embedding_service = EmbeddingService()
        self.batch_size = batch_size or config.BATCH_SIZE
        logger.info(f"IngestionPipeline initialized with batch size {self.batch_size}")

    async def ingest(self, upload_file: UploadFile) -> Dict[str, Any]:
        filename = upload_file.filename
        file_path = None
        
        try:
            logger.info(f"--- Starting Pipeline for file: {filename} ---")
            
            # 1. Save File
            logger.info("Step 1: Saving file to persistent storage...")
            file_path = storage.save_file(upload_file, filename)
            
            # 2. Parse
            logger.info("Step 2: Parsing PPT...")
            raw_chunks = parser.parse(file_path)
            
            # 3. Clean
            logger.info("Step 3: Cleaning text chunks...")
            clean_chunks = cleaner.clean(raw_chunks)
            if not clean_chunks:
                logger.warning("No valid text found in the PPT.")
                return {"chunks_stored": 0, "filename": filename}
            
            # 4. Embed (Batching and Parallelism)
            logger.info("Step 4: Embedding text chunks...")
            # Extract text for embedding
            texts_for_embedding = [chunk["text"] for chunk in clean_chunks]
            batches = [texts_for_embedding[i:i + self.batch_size] for i in range(0, len(texts_for_embedding), self.batch_size)]
            
            # Using asyncio.to_thread for OpenAIEmbeddings since it's blocking in LangChain
            tasks = [asyncio.to_thread(self.embedding_service.embed, batch) for batch in batches]
            logger.info(f"Running {len(tasks)} parallel embedding batch tasks.")
            
            nested_vectors = await asyncio.gather(*tasks)
            all_vectors = [vec for batch in nested_vectors for vec in batch]
            
            # 5. Store in Qdrant
            logger.info("Step 5: Storing embeddings in Qdrant...")
            ids = [str(uuid.uuid4()) for _ in range(len(all_vectors))]
            payloads = [{"text": chunk["text"], "slide_id": str(chunk["page"])} for chunk in clean_chunks]
            
            vector_store.upsert_embeddings(ids, all_vectors, payloads)
            
            logger.info(f"--- Pipeline completed for {filename}. Stored {len(all_vectors)} chunks. ---")
            
            # Organize chunks by slide page number for frontend display
            slide_contents: Dict[int, List[str]] = {}
            for chunk in clean_chunks:
                page_num = chunk.get("page", 1)
                if page_num not in slide_contents:
                    slide_contents[page_num] = []
                slide_contents[page_num].append(chunk["text"])
            
            return {
                "status": "success",
                "chunks_stored": len(all_vectors),
                "filename": filename,
                "slides": slide_contents,
                "total_slides": len(slide_contents)  # Actual number of unique slides
            }
            
        except Exception as e:
            logger.error(f"Error in ingestion pipeline: {e}")
            raise
        finally:
            # We skip deletion of file as per the requiremnet (Upload -> Save -> ...)
            # Keep file path around as it's locally stored.
            pass

# pipeline = IngestionPipeline()  # Remove global instantiation
