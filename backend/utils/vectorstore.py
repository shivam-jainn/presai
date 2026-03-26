import uuid
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from utils.logger import logger
from config.database import DatabaseConfig
import json

class VectorStore:
    def __init__(self):
        config = DatabaseConfig()
        self.client = QdrantClient(url=config.QDRANT_URL, api_key=config.QDRANT_API_KEY or None)
        self.collection_name = config.COLLECTION_NAME
        self.vector_size = config.VECTOR_SIZE
        self._ensure_collection()
        logger.info(f"VectorStore connected to Qdrant at: {config.QDRANT_URL}")

    def _ensure_collection(self):
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name in collection_names:
                # Check if collection has correct vector size
                try:
                    collection_info = self.client.get_collection(self.collection_name)
                    # Handle both dict-style and object-style access
                    if hasattr(collection_info, 'vectors_config'):
                        vectors_config = collection_info.vectors_config
                        if hasattr(vectors_config, 'size'):
                            current_size = vectors_config.size
                        elif isinstance(vectors_config, dict) and 'size' in vectors_config:
                            current_size = vectors_config['size']
                        else:
                            current_size = None
                    else:
                        current_size = None
                        
                    if current_size is not None and current_size != self.vector_size:
                        logger.warning(f"Collection '{self.collection_name}' has wrong dimension (expected {self.vector_size}, got {current_size}). Recreating...")
                        self.client.delete_collection(self.collection_name)
                        self.client.create_collection(
                            collection_name=self.collection_name,
                            vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                        )
                except Exception as e:
                    logger.warning(f"Could not check collection dimensions: {e}")
            else:
                logger.info(f"Creating Qdrant collection: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                )
        except Exception as e:
            logger.error(f"Error ensuring collection exists: {e}")
            raise

    def upsert_embeddings(self, ids: List[str], vectors: List[List[float]], payloads: List[Dict[str, Any]]):
        if not vectors:
            return

        points = []
        for i, vector in enumerate(vectors):
            point_id = ids[i] if i < len(ids) else str(uuid.uuid4())
            points.append(PointStruct(
                id=point_id,
                vector=vector,
                payload=payloads[i]
            ))

        logger.info(f"Upserting {len(points)} points into Qdrant collection '{self.collection_name}'...")
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        logger.info("Upsert successful.")

vector_store = VectorStore()
