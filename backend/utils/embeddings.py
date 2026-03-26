from typing import List
from langchain_openai import OpenAIEmbeddings
from langchain_ollama import OllamaEmbeddings
from pydantic import SecretStr
from utils.logger import logger
from config import config

class EmbeddingService:
    def __init__(self):
        provider = config.EMBEDDINGS_PROVIDER
        model = config.EMBEDDINGS_MODEL_NAME
        
        if provider == "openai":
            if not config.EMBEDDINGS_API_KEY:
                raise ValueError("EMBEDDINGS_API_KEY is required for OpenAI provider")
            self.embeddings = OpenAIEmbeddings(
                model=model, 
                api_key=SecretStr(config.EMBEDDINGS_API_KEY)
            )
        else:  # local (Ollama)
            self.embeddings = OllamaEmbeddings(
                model=model, 
                base_url=config.EMBEDDINGS_MODEL_URL
            )
        
        logger.info(f"EmbeddingService initialized with provider: {provider}, model: {model}")

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        
        logger.info(f"Embedding {len(texts)} texts...")
        vectors = self.embeddings.embed_documents(texts)
        logger.info("Successfully generated embeddings.")
        return vectors

    def embed_query(self, text: str) -> List[float]:
        query_text = text.strip()
        if not query_text:
            raise ValueError("Query text cannot be empty.")

        logger.info("Embedding query text for retrieval...")
        return self.embeddings.embed_query(query_text)
