from pathlib import Path
from fastapi import UploadFile
from utils.logger import logger
from config.base_config import BaseConfig

class Storage:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Storage, cls).__new__(cls)
            config = BaseConfig()
            cls._instance.base_path = config.FILE_STORAGE_PATH
            cls._instance.base_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Storage initialized at: {cls._instance.base_path}")
        return cls._instance

    def save_file(self, upload_file: UploadFile, filename: str) -> str:
        file_path = self.base_path / filename
        with open(file_path, "wb") as f:
            f.write(upload_file.file.read())
        logger.info(f"File saved to: {file_path}")
        return str(file_path)

    def get_file_path(self, filename: str) -> str:
        file_path = self.base_path / filename
        if not file_path.exists():
            logger.error(f"File not found: {filename}")
            raise FileNotFoundError(f"{filename} not found")
        return str(file_path)

    def delete_file(self, filename: str):
        file_path = self.base_path / filename
        if file_path.exists():
            file_path.unlink()
            logger.info(f"File deleted: {file_path}")

storage = Storage()
