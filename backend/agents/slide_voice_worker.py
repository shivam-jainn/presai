from __future__ import annotations

import asyncio
import json
import sys
import time
from pathlib import Path
from typing import Any

from livekit import agents, rtc
from livekit.plugins import deepgram

# Allow running this file directly without installing the package.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from config.voice import VoiceConfig
from services.events import EventType, emit_voice_event
from services.voice.retrieval import run_voice_slide_query
from utils.logger import logger

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

RECOMMENDATION_TOPIC = "presai.slide.recommendation"


# ──────────────────────────────────────────────────────────────────────────────
# Navigation intent parser
# ──────────────────────────────────────────────────────────────────────────────

def _safe_int(value: object) -> int | None:
    try:
        if value is None or isinstance(value, bool):
            return None
        return int(str(value).strip())
    except Exception:
        return None


def _parse_navigation_intent(transcript: str) -> dict[str, Any] | None:
    """
    Parse lightweight navigation intents from a raw transcript string.

    Returns a payload fragment with ``type="nav"`` or ``None`` when no
    navigation intent is detected.
    """
    text = " ".join(transcript.strip().lower().split())
    if not text:
        return None

    # Direct next / previous commands.
    if text in {"next", "next slide", "forward", "go next", "go forward"}:
        return {"type": "nav", "action": "next"}
    if text in {"previous", "prev", "previous slide", "prev slide",
                "back", "go back", "go previous"}:
        return {"type": "nav", "action": "prev"}

    # "slide N" / "go to slide N" / "jump to N" patterns.
    tokens = text.replace("#", " ").replace(",", " ").split()
    numbers = [n for n in (_safe_int(t) for t in tokens) if isinstance(n, int)]
    if not numbers:
        return None

    nav_keywords = {"slide", "slides", "goto", "go", "jump", "to"}
    if any(tok in nav_keywords for tok in tokens) or text.startswith("slide "):
        target = max(numbers[-1], 1)
        return {
            "type": "nav",
            "action": "goto",
            "target_slide_number": target,
            "target_slide_index": target - 1,
        }

    return None


class PresAIAgent(agents.Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are the PresAI voice conductor. "
                "Keep responses short and natural. "
                "Confirm navigation commands quickly and continue."
            )
        )


async def entrypoint(ctx: agents.JobContext) -> None:
    run_id = f"worker-{int(time.time() * 1000)}"

    # Derive the session ID from the room name (matches what the token endpoint
    # encodes: presai-voice-{session_id}).
    room_name = ctx.room.name if ctx.room else ""
    session_id = room_name.replace(f"{VoiceConfig.LIVEKIT_ROOM_PREFIX}-", "", 1) or "unknown"

    logger.info("Worker starting | run_id=%s room=%s session_id=%s", run_id, room_name, session_id)

    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    logger.info("Worker connected | room=%s", ctx.room.name)

    # Notify the SSE bus that the voice assistant is connected.
    try:
        await emit_voice_event(
            EventType.VOICE_CONNECTED,
            session_id,
            {"room_name": ctx.room.name, "status": "connected"},
        )
    except Exception:
        pass

    participant: rtc.RemoteParticipant | None = None

    def _on_track_subscribed(
        track: rtc.Track,
        pub: rtc.RemoteTrackPublication,
        remote: rtc.RemoteParticipant,
    ) -> None:
        logger.info(
            "🎵 Track subscribed | kind=%s mime=%s participant=%s track_sid=%s",
            track.kind, pub.mime_type, remote.identity, track.sid,
        )
        logger.debug(
            "   Track details: muted=%s attached=%s",
            track.muted, pub.is_attached()
        )

    def _on_track_subscription_failed(sid: str, remote: rtc.RemoteParticipant) -> None:
        logger.error("Track subscription failed | sid=%s participant=%s", sid, remote.identity)

    def _on_participant_connected(remote: rtc.RemoteParticipant) -> None:
        nonlocal participant
        logger.info("👤 Participant connected | identity=%s sid=%s", remote.identity, remote.sid)
        logger.debug("   Attributes: %s", remote.attributes)
        participant = remote

    def _on_participant_disconnected(remote: rtc.RemoteParticipant) -> None:
        logger.info(
            "Participant disconnected | identity=%s (worker remains alive for reconnection)",
            remote.identity,
        )

    ctx.room.on("track_subscribed", _on_track_subscribed)
    ctx.room.on("track_subscription_failed", _on_track_subscription_failed)
    ctx.room.on("participant_connected", _on_participant_connected)
    ctx.room.on("participant_disconnected", _on_participant_disconnected)

    participant = await ctx.wait_for_participant()
    logger.info("✅ Participant joined | identity=%s", participant.identity)

    # ── Turn tracking ────────────────────────────────────────────────────────

    turn_counter = 0
    # Maps participant identity → latest turn_id so stale tasks are dropped.
    latest_turn_id: dict[str, int] = {}

    stt_plugin = deepgram.STT(model="nova-3", language="en")
    logger.info("🎙️ STT plugin initialized | model=deepgram/nova-3 language=en")

    session: agents.AgentSession[Any] = agents.AgentSession(
        stt=stt_plugin,
        # STT-only mode — no LLM or TTS required.
        preemptive_generation=False,
    )
    logger.debug("   AgentSession created | preemptive_generation=False")

    async def _publish(target: rtc.RemoteParticipant, payload: dict[str, Any]) -> None:
        """Publish a JSON payload to a single participant on the recommendation topic."""
        await ctx.room.local_participant.publish_data(
            json.dumps(payload),
            topic=RECOMMENDATION_TOPIC,
            destination_identities=[target.identity],
        )

    async def publish_recommendation(
        target: rtc.RemoteParticipant,
        transcript: str,
        *,
        turn_id: int,
    ) -> None:
        attrs = target.attributes or {}
        filename = attrs.get("filename")
        participant_session_id = attrs.get("session_id") or session_id

        # Drop if a newer turn superseded this one.
        if latest_turn_id.get(target.identity) != turn_id:
            logger.debug("Dropping stale turn_id=%d for %s", turn_id, target.identity)
            return

        if not filename:
            logger.error("Missing filename attribute for participant %s", target.identity)
            await _publish(target, {
                "type": "error",
                "message": "Missing filename context — re-upload the presentation.",
                "turn_id": turn_id,
            })
            return

        if latest_turn_id.get(target.identity) == turn_id:
            await _publish(target, {
                "type": "processing",
                "turn_id": turn_id,
                "question": transcript,
            })
            try:
                await emit_voice_event(
                    EventType.VOICE_THINKING,
                    participant_session_id,
                    {"turn_id": turn_id, "question": transcript},
                )
            except Exception:
                pass

        # Try navigation first (cheap, no vector store).
        nav = _parse_navigation_intent(transcript)
        if nav is not None:
            payload: dict[str, Any] = {**nav, "turn_id": turn_id, "question": transcript}
            if latest_turn_id.get(target.identity) != turn_id:
                return
            await _publish(target, payload)
            try:
                await emit_voice_event(
                    EventType.VOICE_NAVIGATION,
                    participant_session_id,
                    {"turn_id": turn_id, "action": nav.get("action"), "question": transcript},
                )
            except Exception:
                pass
            logger.info("Navigation published | action=%s turn_id=%d", nav.get("action"), turn_id)
            return

        # Vector-store semantic query.
        try:
            result = run_voice_slide_query(
                transcript,
                filename=filename,
                session_id=participant_session_id,
                top_k=3,
            )
            payload = {
                "type": "slide_recommendation",
                "question": transcript,
                "answer": result["answer"],
                "recommended_slide_number": result["recommended_slide_number"],
                "recommended_slide_index": result["recommended_slide_index"],
                "turn_id": turn_id,
            }
            logger.info(
                "Slide recommendation | slide=%d turn_id=%d",
                result["recommended_slide_number"], turn_id,
            )
        except LookupError as exc:
            payload = {"type": "error", "message": str(exc), "turn_id": turn_id}
            logger.warning("LookupError during slide query | %s", exc)
        except Exception:
            logger.exception("Slide query failed for transcript=%r", transcript)
            payload = {
                "type": "error",
                "message": "Failed to compute slide recommendation.",
                "turn_id": turn_id,
            }

        if latest_turn_id.get(target.identity) != turn_id:
            return
        await _publish(target, payload)

    # ── Session event handlers ───────────────────────────────────────────────

    def on_user_input_transcribed(event: agents.UserInputTranscribedEvent) -> None:
        nonlocal turn_counter
        
        logger.debug("\n" + "="*80)
        logger.debug("🎤 TRANSCRIPTION EVENT RECEIVED")
        logger.debug(f"   Speaker ID: {event.speaker_id or '?'}")
        logger.debug(f"   Is Final: {event.is_final}")
        logger.debug(f"   Transcript: {repr(event.transcript[:100] if len(event.transcript) > 100 else event.transcript)}")
        logger.debug(f"   Raw event attrs: {dir(event)}")
        logger.debug("="*80)

        # Relay intermediate transcripts to SSE for the live overlay.
        if not event.is_final:
            logger.debug("   → Intermediate transcript (not final)")
            try:
                asyncio.create_task(
                    emit_voice_event(
                        EventType.VOICE_TRANSCRIPTION_UPDATE,
                        session_id,
                        {
                            "transcript": event.transcript,
                            "is_final": False,
                            "speaker_id": event.speaker_id or "",
                        },
                    )
                )
                logger.debug("   ✓ SSE event dispatched for intermediate transcript")
            except Exception as e:
                logger.error("   ✗ Failed to emit SSE event: %s", e)
            return

        transcript = event.transcript.strip()
        if not transcript:
            logger.debug("⚠️ Empty final transcript received — skipping")
            return

        logger.info("✅ Final transcript | speaker=%s text=%r", event.speaker_id or "?", transcript)

        # Resolve target participant (falls back to first joiner).
        speaker = (
            ctx.room.remote_participants.get(event.speaker_id or "")
            if event.speaker_id
            else None
        )
        logger.debug("   Resolving target participant: speaker=%s fallback=%s", 
                    speaker.identity if speaker else None, 
                    participant.identity if participant else None)
        target = speaker or participant
        if target is None:
            logger.warning("❌ No target participant — dropping transcript")
            return

        logger.debug("   📡 Emitting final transcript to SSE...")
        try:
            asyncio.create_task(
                emit_voice_event(
                    EventType.VOICE_TRANSCRIPTION_UPDATE,
                    session_id,
                    {
                        "transcript": transcript,
                        "is_final": True,
                        "speaker_id": event.speaker_id or "",
                    },
                )
            )
            logger.debug("   ✓ SSE event dispatched for final transcript")
        except Exception as e:
            logger.error("   ✗ Failed to emit final SSE event: %s", e)

        turn_counter += 1
        turn_id = turn_counter
        latest_turn_id[target.identity] = turn_id
        logger.debug("   Turn counter incremented: turn_id=%d", turn_id)

        logger.debug("   🚀 Spawning publish_recommendation task...")
        asyncio.create_task(
            publish_recommendation(target, transcript, turn_id=turn_id)
        )
        logger.debug("="*80 + "\n")

    def on_session_closed(_: agents.CloseEvent) -> None:
        logger.info("Agent session closed — shutting down worker")
        ctx.shutdown("agent session closed")

    session.on("user_input_transcribed", on_user_input_transcribed)
    session.on("close", on_session_closed)

    try:
        logger.info("🚀 Starting voice session | room=%s stt=deepgram/nova-3", ctx.room.name)
        await session.start(agent=PresAIAgent(), room=ctx.room)
        logger.info("✅ Voice session started — listening for speech")
        logger.info("   Session will process audio from subscribed tracks...")
        await asyncio.Event().wait()
    except Exception:
        logger.exception("❌ Voice agent session crashed | room=%s", ctx.room.name)
        raise


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(entrypoint_fnc=entrypoint)
    )
