import os
from dotenv import load_dotenv

load_dotenv()

class MiscConfig:
    # Ingestion settings
    BATCH_SIZE = int(os.getenv("INGESTION_BATCH_SIZE", "16"))
    
    # File processing
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB in bytes
    ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", ".pptx,.ppt").split(",")
    
    # API settings
    API_VERSION = os.getenv("API_VERSION", "v1")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # External services
    # LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")
    # LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
    # LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")