import asyncio
import uuid
from typing import List, Dict, Any, Optional
from fastapi import UploadFile
from utils.logger import logger
from utils.storage import storage
from utils.embeddings import EmbeddingService
from utils.vectorstore import vector_store
from services.ingestion.parser import parser
from services.ingestion.cleaner import cleaner
from config.misc import MiscConfig

class IngestionPipeline:
    def __init__(self, batch_size: Optional[int] = None):
        config = MiscConfig()
        self.embedding_service = EmbeddingService()
        self.batch_size = batch_size or config.BATCH_SIZE
        logger.info(f"IngestionPipeline initialized with batch size {self.batch_size}")

    async def ingest(self, upload_file: UploadFile, ingestion_session_id: Optional[str] = None) -> Dict[str, Any]:
        filename = upload_file.filename or "uploaded.pptx"
        session_id = ingestion_session_id or str(uuid.uuid4())
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
            
            # Group all text elements by slide to create one vector per slide
            slide_texts: Dict[int, str] = {}
            for chunk in clean_chunks:
                page_num = chunk.get("page", 1)
                if page_num not in slide_texts:
                    slide_texts[page_num] = ""
                # Concatenate all text from this slide
                slide_texts[page_num] += (" " + chunk["text"])
            
            # Clean up the concatenated text
            slide_texts = {page: text.strip() for page, text in slide_texts.items() if text.strip()}
            
            # Prepare texts for embedding (one per slide)
            texts_for_embedding = [slide_texts[page] for page in sorted(slide_texts.keys())]
            logger.info(f"Creating {len(texts_for_embedding)} slide embeddings (one per slide)")
            
            # Embed all slide texts
            all_vectors = await asyncio.to_thread(self.embedding_service.embed, texts_for_embedding)
            
            # 5. Store in Qdrant (one entry per slide)
            logger.info("Step 5: Storing slide embeddings in Qdrant...")
            ids = [str(uuid.uuid4()) for _ in range(len(all_vectors))]
            payloads: List[Dict[str, Any]] = []
            for page_num in sorted(slide_texts.keys()):
                payloads.append({
                    "text": slide_texts[page_num],
                    "slide_number": page_num,
                    "slide_heading": clean_chunks[0].get("heading", "") if clean_chunks else "",
                    "filename": filename,
                    "session_id": session_id,
                    "source_file_path": file_path,
                })
            
            logger.info("="*80)
            logger.info("📝 DATA BEING STORED IN QDRANT:")
            logger.info("="*80)
            for i, payload in enumerate(payloads, 1):
                logger.info(f"\n[Chunk {i}]")
                logger.info(f"   Slide Number: {payload['slide_number']}")
                logger.info(f"   Text Content: {payload['text']}")
                logger.info(f"   Filename: {payload['filename']}")
                logger.info(f"   Session ID: {payload['session_id']}")
            logger.info("="*80)
            
            vector_store.upsert_embeddings(ids, all_vectors, payloads)
            
            # Organize chunks by slide page number for frontend display
            slide_contents: Dict[int, List[str]] = {}
            for chunk in clean_chunks:
                page_num = chunk.get("page", 1)
                if page_num not in slide_contents:
                    slide_contents[page_num] = []
                slide_contents[page_num].append(chunk["text"])
            
            logger.info(f"--- Pipeline completed for {filename}. Stored {len(all_vectors)} chunks. ---")
            logger.info(f"   Total unique slides: {len(slide_contents)}")
            logger.info(f"   Slide numbers: {sorted(slide_contents.keys())}")
            
            return {
                "status": "success",
                "chunks_stored": len(all_vectors),
                "filename": filename,
                "ingestion_session_id": session_id,
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
