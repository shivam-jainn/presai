from typing import List
from langchain_openai import OpenAIEmbeddings
from langchain_ollama import OllamaEmbeddings
from pydantic import SecretStr
from utils.logger import logger
from config.embedding_config import EmbeddingConfig

class EmbeddingService:
    def __init__(self):
        config = EmbeddingConfig()
        logger.info(f"Loading config : ${config}")
        provider = config.PROVIDER
        model = config.MODEL
        api_key = config.API_KEY
        base_url = config.BASE_URL
        secret_api_key = SecretStr(api_key) if api_key else None

        if provider == "openai":
            self.embeddings = OpenAIEmbeddings(model=model, api_key=secret_api_key)
        elif provider == "groq":
            # Groq uses OpenAI-compatible API
            provider_base_url = str(getattr(config, "provider_config", {}).get("base_url", ""))
            self.embeddings = OpenAIEmbeddings(
                model=model, 
                api_key=secret_api_key,
                base_url=provider_base_url,
            )
        elif provider in ["ollama", "lmstudio"]:
            self.embeddings = OllamaEmbeddings(model=model, base_url=base_url)
        else:
            raise ValueError(f"Unsupported embeddings provider: {provider}")
        
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
