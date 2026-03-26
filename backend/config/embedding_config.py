import os
from dotenv import load_dotenv

load_dotenv()

class EmbeddingConfig:
    PROVIDER = os.getenv("EMBEDDINGS_PROVIDER", "openai").lower()
    MODEL = os.getenv("EMBEDDINGS_MODEL", "text-embedding-3-small")
    API_KEY = os.getenv("EMBEDDINGS_API_KEY", os.getenv("OPENAI_API_KEY", ""))
    BASE_URL = os.getenv("EMBEDDINGS_BASE_URL", "http://localhost:11434")
    
    # Provider-specific defaults
    @property
    def provider_config(self):
        if self.PROVIDER == "groq":
            return {
                "base_url": "https://api.groq.com/openai/v1",
                "default_model": "text-embedding-004"
            }
        elif self.PROVIDER in ["ollama", "lmstudio"]:
            return {
                "base_url": self.BASE_URL,
                "default_model": "llama2"
            }
        else:  # openai
            return {
                "base_url": None,
                "default_model": "text-embedding-3-small"
            }