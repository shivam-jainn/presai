from typing import Callable
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services.events import event_stream_generator
from utils.logger import logger

router = APIRouter()


@router.get("/events/{session_id}")
async def stream_events(session_id: str):
    """
    Server-Sent Events endpoint for real-time progress updates.
    Clients connect here to receive voice processing, ingestion, and other events.
    """
    async def on_connect():
        logger.info("Client connected to event stream | session=%s", session_id)
    
    async def on_disconnect():
        logger.info("Client disconnected from event stream | session=%s", session_id)
    
    return StreamingResponse(
        event_stream_generator(session_id, on_connect, on_disconnect),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
