"""
Events system for streaming real-time progress updates to clients.
Used for voice processing, ingestion, and other async operations.
"""
import asyncio
from typing import Dict, Optional, Any, Callable
from datetime import datetime
from uuid import uuid4
from enum import Enum
import json

from utils.logger import logger


class EventType(str, Enum):
    """Types of events that can be emitted."""
    VOICE_START = "voice_start"
    VOICE_CONNECTED = "voice_connected"
    VOICE_LISTENING = "voice_listening"
    VOICE_TRANSCRIBING = "voice_transcribing"
    VOICE_TRANSCRIPTION_UPDATE = "voice_transcription_update"
    VOICE_THINKING = "voice_thinking"
    VOICE_PROCESSING = "voice_processing"
    VOICE_NAVIGATION = "voice_navigation"
    VOICE_COMPLETE = "voice_complete"
    VOICE_ERROR = "voice_error"
    INGESTION_START = "ingestion_start"
    INGESTION_PROGRESS = "ingestion_progress"
    INGESTION_COMPLETE = "ingestion_complete"
    INGESTION_ERROR = "ingestion_error"


class EventPriority(str, Enum):
    """Event priority levels."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class Event:
    """Represents a single event in the system."""
    
    def __init__(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        session_id: str,
        priority: EventPriority = EventPriority.NORMAL,
    ):
        self.id = str(uuid4())
        self.type = event_type
        self.data = data
        self.session_id = session_id
        self.priority = priority
        self.timestamp = datetime.utcnow()
        self.created_at = int(self.timestamp.timestamp() * 1000)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "type": self.type.value,
            "data": self.data,
            "session_id": self.session_id,
            "priority": self.priority.value,
            "timestamp": self.created_at,
        }
    
    def to_json(self) -> str:
        """Convert event to JSON string."""
        return json.dumps(self.to_dict())


class EventManager:
    """
    Central event manager for broadcasting events to connected clients.
    Supports Server-Sent Events (SSE) pattern.
    """
    
    _instance: Optional["EventManager"] = None
    
    def __new__(cls) -> "EventManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self) -> None:
        if self._initialized:
            return
        
        self._initialized = True
        # session_id -> list of queues (multiple clients per session)
        self._subscribers: Dict[str, list[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()
        
        logger.info("EventManager initialized")
    
    async def subscribe(self, session_id: str) -> asyncio.Queue:
        """
        Subscribe to events for a specific session.
        Returns a queue that will receive events.
        """
        queue: asyncio.Queue = asyncio.Queue()
        
        async with self._lock:
            if session_id not in self._subscribers:
                self._subscribers[session_id] = []
            self._subscribers[session_id].append(queue)
            
        logger.debug(f"New subscriber for session {session_id}")
        return queue
    
    async def unsubscribe(self, session_id: str, queue: asyncio.Queue) -> None:
        """Unsubscribe from events for a session."""
        async with self._lock:
            if session_id in self._subscribers:
                try:
                    self._subscribers[session_id].remove(queue)
                except ValueError:
                    pass
                
                # Clean up empty session entries
                if not self._subscribers[session_id]:
                    del self._subscribers[session_id]
        
        logger.debug(f"Unsubscribed from session {session_id}")
    
    async def publish(self, event: Event) -> None:
        """
        Publish an event to all subscribers of the session.
        Non-blocking - uses put_nowait with error handling.
        """
        logger.debug("📢 Publishing event | type=%s session=%s subscribers=%d", 
                    event.type.value, event.session_id, self.get_subscriber_count(event.session_id))
        
        async with self._lock:
            if event.session_id not in self._subscribers:
                logger.warning("⚠️ No subscribers for session %s", event.session_id)
                return
            
            queues_to_remove = []
            
            for queue in self._subscribers[event.session_id]:
                try:
                    queue.put_nowait(event)
                    logger.debug("   ✓ Event queued successfully (queue_size=%d)", queue.qsize())
                except asyncio.QueueFull:
                    # Queue is full, mark for removal
                    logger.warning("✗ Queue full for session %s", event.session_id)
                    queues_to_remove.append(queue)
                except Exception as e:
                    logger.error("✗ Error publishing event: %s", e)
                    queues_to_remove.append(queue)
            
            # Clean up problematic queues
            for queue in queues_to_remove:
                try:
                    self._subscribers[event.session_id].remove(queue)
                except ValueError:
                    pass
    
    async def emit(
        self,
        event_type: EventType,
        session_id: str,
        data: Dict[str, Any],
        priority: EventPriority = EventPriority.NORMAL,
    ) -> Event:
        """
        Convenience method to create and publish an event in one call.
        Returns the created event.
        """
        event = Event(event_type, data, session_id, priority)
        logger.debug("🎯 Event created | type=%s session=%s data_keys=%s", 
                    event_type.value, session_id, list(data.keys()))
        await self.publish(event)
        return event
    
    def get_subscriber_count(self, session_id: str) -> int:
        """Get number of subscribers for a session."""
        return len(self._subscribers.get(session_id, []))


# Global event manager instance
event_manager = EventManager()


# Helper functions for common event types
async def emit_voice_event(
    event_type: EventType,
    session_id: str,
    data: Dict[str, Any],
    priority: EventPriority = EventPriority.NORMAL,
) -> Event:
    """Emit a voice-related event."""
    logger.debug("🎙️ Voice event emitted | type=%s session=%s", event_type.value, session_id)
    return await event_manager.emit(event_type, session_id, data, priority)


async def emit_ingestion_event(
    event_type: EventType,
    session_id: str,
    data: Dict[str, Any],
    priority: EventPriority = EventPriority.NORMAL,
) -> Event:
    """Emit an ingestion-related event."""
    return await event_manager.emit(event_type, session_id, data, priority)


# SSE endpoint helper
async def event_stream_generator(
    session_id: str,
    on_connect: Optional[Callable] = None,
    on_disconnect: Optional[Callable] = None,
):
    """
    Generator for Server-Sent Events stream.
    Yields events as they arrive for the given session.
    """
    queue = await event_manager.subscribe(session_id)
    
    logger.info("📡 SSE stream started | session=%s", session_id)
    
    try:
        if on_connect:
            await on_connect()  # Await if it's a coroutine
        
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                logger.debug("📨 SSE event sent | type=%s session=%s", event.type.value, event.session_id)
                # Use named event type so EventSource.addEventListener() fires correctly.
                # Send the inner data dict directly so consumers can do
                # JSON.parse(e.data).transcript without an extra nesting level.
                yield f"event: {event.type.value}\ndata: {json.dumps(event.data)}\n\n"
            except asyncio.TimeoutError:
                # Send keepalive
                yield ": keepalive\n\n"
            except asyncio.CancelledError:
                break
    finally:
        await event_manager.unsubscribe(session_id, queue)
        logger.info("🔴 SSE stream ended | session=%s", session_id)
        if on_disconnect:
            await on_disconnect()  # Await if it's a coroutine
