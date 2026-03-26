import uuid
from typing import List, Dict, Any, cast
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Condition,
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from utils.logger import logger
from config.database import DatabaseConfig

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
                    vectors_config = getattr(collection_info, "vectors_config", None)
                    if vectors_config is not None:
                        if hasattr(vectors_config, 'size'):
                            current_size = vectors_config.size
                        elif isinstance(vectors_config, dict) and 'size' in vectors_config:
                            vector_config_dict = cast(Dict[str, Any], vectors_config)
                            raw_size = vector_config_dict.get("size")
                            if isinstance(raw_size, (int, float)):
                                current_size = int(raw_size)
                            else:
                                current_size = None
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

        points: List[PointStruct] = []
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

    def search_similar(
        self,
        query_vector: List[float],
        limit: int = 5,
        filename: str | None = None,
        session_id: str | None = None,
    ) -> List[Dict[str, Any]]:
        if not query_vector:
            return []

        search_filter = None
        filter_conditions: List[Condition] = []
        if filename:
            filter_conditions.append(
                FieldCondition(
                    key="filename",
                    match=MatchValue(value=filename),
                )
            )
        if session_id:
            filter_conditions.append(
                FieldCondition(
                    key="session_id",
                    match=MatchValue(value=session_id),
                )
            )

        if filter_conditions:
            search_filter = Filter(must=filter_conditions)

        results = self.client.search(  # type: ignore[attr-defined]
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=search_filter,
            limit=limit,
            with_payload=True,
        )

        formatted_results: List[Dict[str, Any]] = []
        for result in cast(List[Any], results):
            payload = dict(getattr(result, "payload", {}) or {})
            formatted_results.append(
                {
                    "score": float(getattr(result, "score", 0.0)),
                    "text": payload.get("text", ""),
                    "slide_number": payload.get("slide_number") or payload.get("slide_id"),
                    "slide_id": payload.get("slide_id"),
                    "filename": payload.get("filename"),
                    "session_id": payload.get("session_id"),
                    "source_file_path": payload.get("source_file_path"),
                }
            )

        return formatted_results

vector_store = VectorStore()
