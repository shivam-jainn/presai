from typing import Any
import json
import asyncio
from pathlib import Path
from datetime import timedelta
from uuid import uuid4
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from pydantic import BaseModel, Field
from livekit import api as livekit_api
from config.voice import VoiceConfig
from services.voice.retrieval import run_voice_slide_query
from services.voice.transcriber import local_whisper_transcriber
from services.events import EventType, emit_voice_event
from utils.logger import logger

router = APIRouter()


class VoiceQueryRequest(BaseModel):
    question: str = Field(min_length=1)
    filename: str = Field(min_length=1)
    session_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)
    current_slide: int | None = None   # caller's current slide for next/prev commands
    total_slides: int | None = None    # total deck size for boundary clamping


class VoiceQueryResponse(BaseModel):
    answer: str
    recommended_slide_number: int
    recommended_slide_index: int
    retrieval: list[dict[str, Any]]


class VoiceTranscribeResponse(BaseModel):
    transcript: str
    mode: str


class VoiceLivekitTokenRequest(BaseModel):
    filename: str = Field(min_length=1)
    session_id: str | None = None


class VoiceLivekitTokenResponse(BaseModel):
    token: str
    ws_url: str
    room_name: str
    identity: str


@router.post("/voice/query", response_model=VoiceQueryResponse)
async def query_voice_navigation(payload: VoiceQueryRequest):
    """
    Process a voice query and return recommended slide navigation.
    Searches through ingested presentation content to find relevant slides.
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = run_voice_slide_query(
            question,
            filename=payload.filename,
            session_id=payload.session_id,
            top_k=payload.top_k,
            current_slide=payload.current_slide,
            total_slides=payload.total_slides,
        )

        return VoiceQueryResponse(
            answer=result["answer"],
            recommended_slide_number=result["recommended_slide_number"],
            recommended_slide_index=result["recommended_slide_index"],
            retrieval=result["retrieval"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice query failed: {str(e)}")


@router.post("/voice/livekit/token", response_model=VoiceLivekitTokenResponse)
async def get_voice_livekit_token(payload: VoiceLivekitTokenRequest):
    """
    Generate LiveKit token for voice room connection.
    Works in both 'local' and 'agentkit_live' modes.
    In 'local' mode, connects to local LiveKit server for STT processing.
    
    Note: Each call creates a new participant identity for the same room.
    LiveKit will automatically manage job spawning when participants join.
    """
    logger.info("\n" + "="*80)
    logger.info(f"🎫 TOKEN REQUEST RECEIVED")
    logger.info(f"   Filename: {payload.filename}")
    logger.info(f"   Session ID: {payload.session_id}")
    logger.info(f"   VOICE_MODE: {VoiceConfig.MODE}")
    logger.info(f"   LIVEKIT_URL: {VoiceConfig.LIVEKIT_URL}")
    logger.info(f"{'='*80}")
    
    # Support both modes - local uses local LiveKit server, agentkit_live uses cloud
    if VoiceConfig.MODE == "agentkit_live":
        # Cloud mode - requires full LiveKit credentials
        if not (VoiceConfig.LIVEKIT_URL and VoiceConfig.LIVEKIT_API_KEY and VoiceConfig.LIVEKIT_API_SECRET):
            raise HTTPException(
                status_code=500,
                detail="LiveKit credentials are not configured on the server.",
            )
    elif VoiceConfig.MODE == "local":
        # Local mode - can use dev credentials or local server
        if not VoiceConfig.LIVEKIT_URL:
            raise HTTPException(
                status_code=500,
                detail="Local LiveKit server URL not configured.",
            )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid VOICE_MODE: {VoiceConfig.MODE}. Must be 'local' or 'agentkit_live'.",
        )

    filename = Path(payload.filename).name
    room_key = payload.session_id or filename
    safe_room_key = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in room_key)[:80]
    room_name = f"{VoiceConfig.LIVEKIT_ROOM_PREFIX}-{safe_room_key}".strip("-")
    identity = f"presai-ui-{uuid4().hex[:12]}"

    metadata = {
        "filename": filename,
        "session_id": payload.session_id or "",
    }

    # For local mode, use dev credentials if available
    api_key = VoiceConfig.LIVEKIT_API_KEY or "devkey"
    api_secret = VoiceConfig.LIVEKIT_API_SECRET or "devsecretdevsecretdevsecretdevsec"

    logger.info(f"📝 Generating token for room: {room_name}, identity: {identity}")
    logger.debug(f"   Metadata: {metadata}")
    logger.debug(f"   Attributes: filename={filename}, session_id={payload.session_id or ''}, role=ui_client")

    token = (
        livekit_api.AccessToken(api_key, api_secret)
        .with_identity(identity)
        .with_name("PresAI UI")
        .with_grants(
            livekit_api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
        .with_metadata(json.dumps(metadata))
        .with_attributes(
            {
                "filename": filename,
                "session_id": payload.session_id or "",
                "role": "ui_client",
            }
        )
        .with_ttl(timedelta(seconds=VoiceConfig.LIVEKIT_TOKEN_TTL_SECONDS))
        .to_jwt()
    )

    logger.info(f"✅ Token generated successfully")
    logger.debug(f"   Token TTL: {VoiceConfig.LIVEKIT_TOKEN_TTL_SECONDS}s")
    logger.debug(f"   Room prefix: {VoiceConfig.LIVEKIT_ROOM_PREFIX}")
    
    # Emit voice start event (non-blocking, don't wait)
    asyncio.create_task(
        emit_voice_event(
            EventType.VOICE_START,
            payload.session_id or room_name,
            {
                "room_name": room_name,
                "identity": identity,
                "mode": VoiceConfig.MODE,
            }
        )
    )

    logger.info(f"{'='*80}\n")

    return VoiceLivekitTokenResponse(
        token=token,
        ws_url=VoiceConfig.LIVEKIT_URL,
        room_name=room_name,
        identity=identity,
    )


@router.post("/voice/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file using local Whisper model.
    Only available in 'local' mode.
    """
    logger.info("\n" + "="*80)
    logger.info("🎤 TRANSCRIBE API CALLED")
    logger.info(f"   Filename: {file.filename}")
    logger.info(f"   Content-Type: {file.content_type}")
    logger.info(f"   VOICE_MODE: {VoiceConfig.MODE}")
    logger.info(f"{'='*80}")
    
    if VoiceConfig.MODE != "local":
        logger.error("❌ Transcription disabled - VOICE_MODE=%s", VoiceConfig.MODE)
        raise HTTPException(
            status_code=409,
            detail="Voice transcription is disabled in current mode. Use agentkit_live runtime for production.",
        )

    file_name = Path(file.filename or "voice.webm").name
    extension = Path(file_name).suffix.lower()
    if extension not in {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".mp4"}:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {extension}")

    try:
        raw_bytes = await file.read()
        logger.info(f"📥 Audio file read | size={len(raw_bytes)} bytes")
        
        if not raw_bytes:
            logger.error("❌ Audio payload is empty")
            raise HTTPException(status_code=400, detail="Audio payload is empty.")

        logger.info("🎙️ Starting transcription with Faster-Whisper...")
        transcript = local_whisper_transcriber.transcribe_file_bytes(raw_bytes, file_name=file_name)
        
        if not transcript:
            logger.error("❌ No speech detected in audio")
            raise HTTPException(status_code=422, detail="Unable to detect speech in audio.")
        
        logger.info("✅ Transcription successful: %r", transcript[:100] if len(transcript) > 100 else transcript)
        logger.info(f"{'='*80}\n")

        return VoiceTranscribeResponse(transcript=transcript, mode=VoiceConfig.MODE)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("❌ Transcription failed with exception: %s", e)
        raise HTTPException(status_code=500, detail=f"Voice transcription failed: {str(e)}")
