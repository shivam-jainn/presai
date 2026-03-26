import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base configuration
class BaseConfig:
    # File paths
    FILE_STORAGE_PATH = Path(os.getenv("FILE_STORAGE_PATH", "data/uploads"))
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    
    # Environment
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"