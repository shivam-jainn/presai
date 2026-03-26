from typing import List, Dict, Any
from langchain_community.document_loaders import UnstructuredPowerPointLoader
from utils.logger import logger

class PPTParser:
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        logger.info(f"Parsing PPT file: {file_path}")
        try:
            loader = UnstructuredPowerPointLoader(file_path, mode="elements")
            docs = loader.load()
            
            # Extract element data with page numbers
            elements = []
            for doc in docs:
                elements.append({
                    "text": doc.page_content,
                    "page": doc.metadata.get("page_number", 1),
                })
            
            logger.info(f"Parsed {len(elements)} elements from {file_path}")
            return elements
        except Exception as e:
            logger.error(f"Error parsing PPT file {file_path}: {e}")
            raise

parser = PPTParser()
