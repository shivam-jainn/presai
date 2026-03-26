import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseConfig:
    # Qdrant
    QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
    COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "slides")
    
    # Vector dimensions (should match embedding model)
    VECTOR_SIZE = int(os.getenv("VECTOR_SIZE", "1536"))  # OpenAI ada-002 default
    
    # Other potential databases
    # REDIS_URL = os.getenv("REDIS_URL", "")
    # POSTGRES_URL = os.getenv("POSTGRES_URL", "")