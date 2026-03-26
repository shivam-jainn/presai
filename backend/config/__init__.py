"""
Unified Configuration for PresAI Backend
Clean, minimal environment variable management
"""
import os
from dotenv import load_dotenv
from typing import Literal, Optional

load_dotenv(override=True)


class Config:
    """Main configuration container"""
    
    # ============ Core Settings ============
    DEBUG = os.getenv("PRESAI_DEBUG", "false").lower() == "true"
    FILE_STORAGE_PATH = os.getenv("FILE_STORAGE_PATH", "content")
    
    # ============ Vector Database ============
    QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
    VECTOR_SIZE = int(os.getenv("VECTOR_SIZE", "768"))
    
    # ============ Embeddings Configuration ============
    EMBEDDINGS_PROVIDER: Literal["local", "openai"] = os.getenv("EMBEDDINGS_PROVIDER", "local").lower()
    EMBEDDINGS_MODEL_NAME = os.getenv("EMBEDDINGS_MODEL_NAME", "nomic-embed-text")
    EMBEDDINGS_MODEL_URL = os.getenv("EMBEDDINGS_MODEL_URL", "http://localhost:11434")
    EMBEDDINGS_API_KEY: Optional[str] = os.getenv("EMBEDDINGS_API_KEY")  # Only needed for OpenAI
    
    # ============ LLM Configuration ============
    LLM_PROVIDER: Literal["groq", "ollama", "lmstudio"] = os.getenv("LLM_PROVIDER", "groq").lower()
    LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "llama-3.1-70b-versatile")
    LLM_MODEL_URL = os.getenv("LLM_MODEL_URL", "")  # Only needed for ollama/lmstudio
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY")  # Only needed for groq
    
    # ============ STT (Speech-to-Text) Configuration ============
    STT_PROVIDER: Literal["groq", "deepgram"] = os.getenv("STT_PROVIDER", "groq").lower()
    STT_MODEL_NAME = os.getenv("STT_MODEL_NAME", "whisper-large-v3")  # For Groq
    STT_API_KEY: Optional[str] = os.getenv("STT_API_KEY")  # For Groq or Deepgram
    
    # Deepgram-specific STT settings
    DEEPGRAM_STT_MODEL = os.getenv("DEEPGRAM_STT_MODEL", "nova-3")
    DEEPGRAM_STT_ENCODING = os.getenv("DEEPGRAM_STT_ENCODING", "pcm_s16le")
    DEEPGRAM_STT_SAMPLE_RATE = int(os.getenv("DEEPGRAM_STT_SAMPLE_RATE", "16000"))
    
    # ============ TTS (Text-to-Speech) Configuration ============
    TTS_PROVIDER: Literal["deepgram"] = "deepgram"  # Only Deepgram for now
    TTS_MODEL_NAME = os.getenv("TTS_MODEL_NAME", "aura-2")
    TTS_VOICE = os.getenv("TTS_VOICE", "thalia")
    TTS_API_KEY: Optional[str] = os.getenv("TTS_API_KEY")  # Deepgram API key
    
    # ============ LiveKit Configuration ============
    LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "devsecretdevsecretdevsecretdevsec")
    LIVEKIT_ROOM_PREFIX = os.getenv("LIVEKIT_ROOM_PREFIX", "presai-voice")
    LIVEKIT_TOKEN_TTL_SECONDS = int(os.getenv("LIVEKIT_TOKEN_TTL_SECONDS", "3600"))
    
    # ============ Voice Mode ============
    VOICE_MODE: Literal["local", "agentkit_live"] = os.getenv("VOICE_MODE", "local").lower()
    
    # ============ Faster-Whisper Fallback (Local STT) ============
    WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
    WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    
    # ============ LLM Runtime Settings ============
    LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.0"))
    LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "256"))
    
    @property
    def embeddings_config(self) -> dict:
        """Get embeddings provider configuration"""
        if self.EMBEDDINGS_PROVIDER == "openai":
            return {
                "provider": "openai",
                "model": self.EMBEDDINGS_MODEL_NAME,
                "api_key": self.EMBEDDINGS_API_KEY,
            }
        else:  # local (Ollama)
            return {
                "provider": "ollama",
                "model": self.EMBEDDINGS_MODEL_NAME,
                "base_url": self.EMBEDDINGS_MODEL_URL,
            }
    
    @property
    def llm_config(self) -> dict:
        """Get LLM provider configuration"""
        if self.LLM_PROVIDER == "groq":
            return {
                "provider": "groq",
                "model": self.LLM_MODEL_NAME,
                "api_key": self.LLM_API_KEY,
                "base_url": "https://api.groq.com/openai/v1",
            }
        elif self.LLM_PROVIDER in ["ollama", "lmstudio"]:
            return {
                "provider": self.LLM_PROVIDER,
                "model": self.LLM_MODEL_NAME,
                "base_url": self.LLM_MODEL_URL or "http://localhost:11434",
            }
        else:
            raise ValueError(f"Unsupported LLM provider: {self.LLM_PROVIDER}")
    
    @property
    def stt_config(self) -> dict:
        """Get STT provider configuration"""
        if self.STT_PROVIDER == "groq":
            return {
                "provider": "groq",
                "model": self.STT_MODEL_NAME,
                "api_key": self.STT_API_KEY,
            }
        elif self.STT_PROVIDER == "deepgram":
            return {
                "provider": "deepgram",
                "model": self.DEEPGRAM_STT_MODEL,
                "api_key": self.STT_API_KEY,
                "encoding": self.DEEPGRAM_STT_ENCODING,
                "sample_rate": self.DEEPGRAM_STT_SAMPLE_RATE,
            }
        else:
            raise ValueError(f"Unsupported STT provider: {self.STT_PROVIDER}")
    
    @property
    def tts_config(self) -> dict:
        """Get TTS provider configuration"""
        return {
            "provider": "deepgram",
            "model": self.TTS_MODEL_NAME,
            "voice": self.TTS_VOICE,
            "api_key": self.TTS_API_KEY,
        }


# Global config instance
config = Config()
