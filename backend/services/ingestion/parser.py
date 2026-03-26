from pathlib import Path
from typing import List, Dict, Any
from langchain_community.document_loaders import UnstructuredPowerPointLoader
from utils.logger import logger

class PPTParser:
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        logger.info(f"Parsing PPT file: {file_path}")
        try:
            extension = Path(file_path).suffix.lower()
            if extension not in {".ppt", ".pptx"}:
                raise ValueError(f"Unsupported extension for parser: {extension}")

            loader = UnstructuredPowerPointLoader(file_path, mode="elements")
            docs = loader.load()
            
            # Extract element data with page numbers
            elements: List[Dict[str, Any]] = []
            for doc in docs:
                metadata = dict(getattr(doc, "metadata", {}) or {})
                page_number = metadata.get("page_number") or metadata.get("page") or 1
                elements.append({
                    "text": doc.page_content,
                    "page": page_number,
                })
            
            logger.info(f"Parsed {len(elements)} elements from {file_path}")
            return elements
        except Exception as e:
            logger.error(f"Error parsing PPT file {file_path}: {e}")
            raise

parser = PPTParser()
