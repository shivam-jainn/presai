from typing import Any
import json
from pathlib import Path
from datetime import timedelta
from uuid import uuid4
from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from livekit import api as livekit_api
from config.voice import VoiceConfig
from services.ingestion.pipeline import IngestionPipeline
from services.voice.retrieval import run_voice_slide_query
from services.voice.transcriber import local_whisper_transcriber
from utils.logger import logger
from utils.storage import storage

router = APIRouter()


class VoiceQueryRequest(BaseModel):
    question: str = Field(min_length=1)
    filename: str = Field(min_length=1)
    session_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


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

@router.post("/ingest")
async def ingest_ppt_route(request: Request, file: UploadFile = File(...), session_id: str | None = Form(None)):
    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()

    if not filename:
        raise HTTPException(status_code=400, detail="Missing file name.")

    if extension not in {".ppt", ".pptx"}:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {filename}. Only PPT/PPTX files are allowed."
        )
    
    try:
        file.filename = filename
        logger.info(f"Incoming ingest request for file: {filename}")
        pipeline = IngestionPipeline()
        result = await pipeline.ingest(file, ingestion_session_id=session_id)

        result["file_url"] = str(request.url_for("get_ppt_file", filename=result["filename"]))
        return result
    except Exception as e:
        logger.error(f"Ingestion route failed for {filename}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during PPT ingestion: {str(e)}"
        )

@router.get("/file/{filename}")
async def get_ppt_file(filename: str):
    """Serve the uploaded PPTX file for rendering in the frontend."""
    try:
        file_path = storage.get_file_path(filename)
        return FileResponse(
            path=file_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=filename
        )
    except FileNotFoundError as e:
        logger.error(f"File not found: {filename}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error serving file {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice/query", response_model=VoiceQueryResponse)
async def query_voice_navigation(payload: VoiceQueryRequest):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = run_voice_slide_query(
            question,
            filename=payload.filename,
            session_id=payload.session_id,
            top_k=payload.top_k,
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
    if VoiceConfig.MODE != "agentkit_live":
        raise HTTPException(
            status_code=409,
            detail="LiveKit token endpoint is available only when VOICE_MODE=agentkit_live.",
        )

    if not (VoiceConfig.LIVEKIT_URL and VoiceConfig.LIVEKIT_API_KEY and VoiceConfig.LIVEKIT_API_SECRET):
        raise HTTPException(
            status_code=500,
            detail="LiveKit credentials are not configured on the server.",
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

    token = (
        livekit_api.AccessToken(VoiceConfig.LIVEKIT_API_KEY, VoiceConfig.LIVEKIT_API_SECRET)
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

    return VoiceLivekitTokenResponse(
        token=token,
        ws_url=VoiceConfig.LIVEKIT_URL,
        room_name=room_name,
        identity=identity,
    )


@router.post("/voice/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice_audio(file: UploadFile = File(...)):
    if VoiceConfig.MODE != "local":
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
        if not raw_bytes:
            raise HTTPException(status_code=400, detail="Audio payload is empty.")

        transcript = local_whisper_transcriber.transcribe_file_bytes(raw_bytes, file_name=file_name)
        if not transcript:
            raise HTTPException(status_code=422, detail="Unable to detect speech in audio.")

        return VoiceTranscribeResponse(transcript=transcript, mode=VoiceConfig.MODE)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice transcription failed: {str(e)}")