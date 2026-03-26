import os
import importlib
import tempfile
from typing import Optional, Any, Iterable

from config.voice import VoiceConfig
from utils.logger import logger


class LocalWhisperTranscriber:
    def __init__(self) -> None:
        self._model: Any = None

    def _get_model(self) -> Any:
        if self._model is None:
            try:
                whisper_module = importlib.import_module("faster_whisper")
                WhisperModel = getattr(whisper_module, "WhisperModel")
            except Exception as exc:
                logger.error(f"faster-whisper is not installed or failed to import: {exc}")
                raise

            logger.info(
                "🧠 Loading Faster-Whisper model '%s' on device '%s' (%s)",
                VoiceConfig.FASTER_WHISPER_MODEL,
                VoiceConfig.FASTER_WHISPER_DEVICE,
                VoiceConfig.FASTER_WHISPER_COMPUTE_TYPE,
            )
            self._model = WhisperModel(
                VoiceConfig.FASTER_WHISPER_MODEL,
                device=VoiceConfig.FASTER_WHISPER_DEVICE,
                compute_type=VoiceConfig.FASTER_WHISPER_COMPUTE_TYPE,
            )
            logger.info("✅ Faster-Whisper model loaded successfully")

        return self._model

    def transcribe_file_bytes(self, file_bytes: bytes, file_name: Optional[str] = None) -> str:
        suffix = ".webm"
        if file_name and "." in file_name:
            suffix = f".{file_name.rsplit('.', 1)[-1].lower()}"

        temp_path = ""
        try:
            logger.debug("📝 Creating temporary file | suffix=%s size=%d bytes", suffix, len(file_bytes))
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(file_bytes)
                temp_path = tmp.name
            logger.debug("   Temp file created: %s", temp_path)

            model = self._get_model()
            logger.info("🎙️ Starting Faster-Whisper transcription...")
            logger.debug("   Beam size: %s", VoiceConfig.FASTER_WHISPER_BEAM_SIZE)
            logger.debug("   Language: %s", VoiceConfig.FASTER_WHISPER_LANGUAGE)
            
            segments, _ = model.transcribe(
                temp_path,
                beam_size=VoiceConfig.FASTER_WHISPER_BEAM_SIZE,
                language=VoiceConfig.FASTER_WHISPER_LANGUAGE,
            )
            
            logger.debug("   ✓ Transcription completed, processing segments...")

            segment_list: Iterable[Any] = segments
            transcript_parts = []
            for i, segment in enumerate(segment_list, 1):
                text = str(getattr(segment, "text", "")).strip()
                if text:
                    transcript_parts.append(text)
                    logger.debug("      Segment %d: %r", i, text[:50] + ("..." if len(text) > 50 else ""))
            
            transcript = " ".join(transcript_parts).strip()
            
            logger.info("✅ Transcription complete | length=%d chars", len(transcript))
            if transcript:
                logger.info("   Transcript: %r", transcript[:100] + ("..." if len(transcript) > 100 else ""))
            else:
                logger.warning("⚠️ No speech detected - transcript is empty")
            
            return transcript
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
                logger.debug("   Temp file cleaned up: %s", temp_path)


local_whisper_transcriber = LocalWhisperTranscriber()
