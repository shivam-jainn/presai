import os
from dotenv import load_dotenv

load_dotenv()


class VoiceConfig:
    MODE = os.getenv("VOICE_MODE", "local").lower()  # local | agentkit_live

    # LiveKit / AgentKit runtime settings
    LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")
    LIVEKIT_ROOM_PREFIX = os.getenv("LIVEKIT_ROOM_PREFIX", "presai-voice")
    LIVEKIT_TOKEN_TTL_SECONDS = int(os.getenv("LIVEKIT_TOKEN_TTL_SECONDS", "3600"))

    # Inference model settings for agentkit_live voice loop
    INFERENCE_STT_MODEL = os.getenv("INFERENCE_STT_MODEL", "deepgram/flux-general-en")
    INFERENCE_STT_ENCODING = os.getenv("INFERENCE_STT_ENCODING", "pcm_s16le")
    INFERENCE_STT_SAMPLE_RATE = int(os.getenv("INFERENCE_STT_SAMPLE_RATE", "16000"))
    INFERENCE_STT_EOT_THRESHOLD = float(os.getenv("INFERENCE_STT_EOT_THRESHOLD", "0.7"))
    INFERENCE_STT_EOT_TIMEOUT_MS = int(os.getenv("INFERENCE_STT_EOT_TIMEOUT_MS", "5000"))
    INFERENCE_STT_EAGER_EOT_THRESHOLD = float(
        os.getenv("INFERENCE_STT_EAGER_EOT_THRESHOLD", "0.3")
    )

    INFERENCE_LLM_MODEL = os.getenv("INFERENCE_LLM_MODEL", "openai/gpt-4o-mini")
    INFERENCE_TTS_MODEL = os.getenv("INFERENCE_TTS_MODEL", "deepgram/aura-2")
    INFERENCE_TTS_VOICE = os.getenv("INFERENCE_TTS_VOICE", "aura-2-thalia-en")

    # Faster-Whisper local transcription settings
    FASTER_WHISPER_MODEL = os.getenv("FASTER_WHISPER_MODEL", "small")
    FASTER_WHISPER_DEVICE = os.getenv("FASTER_WHISPER_DEVICE", "cpu")
    FASTER_WHISPER_COMPUTE_TYPE = os.getenv("FASTER_WHISPER_COMPUTE_TYPE", "int8")
    FASTER_WHISPER_BEAM_SIZE = int(os.getenv("FASTER_WHISPER_BEAM_SIZE", "1"))
    FASTER_WHISPER_LANGUAGE = os.getenv("FASTER_WHISPER_LANGUAGE", "en")
