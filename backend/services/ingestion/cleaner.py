from typing import List, Dict, Any
from utils.logger import logger

class TextCleaner:
    def clean(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.info(f"Cleaning {len(chunks)} text chunks...")
        cleaned_chunks = []
        
        for chunk in chunks:
            # Handle both dict and string formats for backwards compatibility
            if isinstance(chunk, dict):
                text = chunk.get("text", "").strip()
                page = chunk.get("page", 1)
            else:
                text = str(chunk).strip()
                page = 1
            
            # Remove empty strings
            if not text:
                continue
            
            # Additional cleaning if needed
            cleaned_chunks.append({"text": text, "page": page})
            
        # Potentially merge small chunks if needed, but for PPT, each slide element is often small
        logger.info(f"Cleaned elements: {len(cleaned_chunks)}")
        return cleaned_chunks

cleaner = TextCleaner()
