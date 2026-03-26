import os
import importlib
import tempfile
from typing import Optional, Any, Iterable

from config import config
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
                "Loading Faster-Whisper model '%s' on device '%s' (%s)",
                config.WHISPER_MODEL,
                config.WHISPER_DEVICE,
                config.WHISPER_COMPUTE_TYPE,
            )
            self._model = WhisperModel(
                config.WHISPER_MODEL,
                device=config.WHISPER_DEVICE,
                compute_type=config.WHISPER_COMPUTE_TYPE,
            )
            logger.info("Faster-Whisper model loaded successfully")

        return self._model

    def transcribe_file_bytes(self, file_bytes: bytes, file_name: Optional[str] = None) -> str:
        suffix = ".webm"
        if file_name and "." in file_name:
            suffix = f".{file_name.rsplit('.', 1)[-1].lower()}"

        temp_path = ""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(file_bytes)
                temp_path = tmp.name

            model = self._get_model()
            logger.info("Starting Faster-Whisper transcription...")
            
            segments, _ = model.transcribe(
                temp_path,
                beam_size=VoiceConfig.FASTER_WHISPER_BEAM_SIZE,
                language=VoiceConfig.FASTER_WHISPER_LANGUAGE,
            )

            segment_list: Iterable[Any] = segments
            transcript_parts = []
            for i, segment in enumerate(segment_list, 1):
                text = str(getattr(segment, "text", "")).strip()
                if text:
                    transcript_parts.append(text)
            
            transcript = " ".join(transcript_parts).strip()
            
            logger.info("Transcription complete | length=%d chars", len(transcript))
            
            return transcript
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)


local_whisper_transcriber = LocalWhisperTranscriber()
