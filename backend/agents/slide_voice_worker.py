import sys
import asyncio
import json
from pathlib import Path
from typing import Any
import time

from livekit import agents, rtc
from livekit.plugins import deepgram, groq

# Allow running this file directly: `python agents/slide_voice_worker.py dev`
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from config.voice import VoiceConfig
from services.voice.retrieval import run_voice_slide_query
from services.events import event_manager, EventType, emit_voice_event
from utils.logger import logger

RECOMMENDATION_TOPIC = "presai.slide.recommendation"
DEBUG_LOG_PATH = "/Users/shivamjain/Development/presai/.cursor/debug-ec09e7.log"


def _dbg(run_id: str, hypothesis_id: str, location: str, message: str, data: dict[str, Any] | None = None) -> None:
    try:
        payload = {
            "sessionId": "ec09e7",
            "runId": run_id,
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data or {},
            "timestamp": int(time.time() * 1000),
        }
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=True) + "\n")
    except Exception:
        # Never break the voice loop because of debug logging.
        pass


class PresAIAgent(agents.Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are PresAI voice conductor. Keep responses short and natural. "
                "If user asks navigation commands, confirm quickly and continue."
            )
        )


def _safe_int(value: object) -> int | None:
    try:
        if value is None:
            return None
        if isinstance(value, bool):
            return None
        return int(str(value).strip())
    except Exception:
        return None


def _parse_navigation_intent(transcript: str) -> dict[str, Any] | None:
    """
    Parse lightweight navigation intents from raw transcript.
    Returns a payload fragment (type=nav) or None.
    """
    text = " ".join(transcript.strip().lower().split())
    if not text:
        return None

    # next / previous
    if text in {"next", "next slide", "forward", "go next", "go forward"}:
        return {"type": "nav", "action": "next"}
    if text in {
        "previous",
        "prev",
        "previous slide",
        "prev slide",
        "back",
        "go back",
        "go previous",
    }:
        return {"type": "nav", "action": "prev"}

    # goto slide N patterns
    # Examples: "slide 4", "go to slide 4", "go to 4", "jump to slide 10"
    tokens = text.replace("#", " ").replace(",", " ").split()
    if not tokens:
        return None

    # Find last integer token as the target slide number.
    maybe_numbers = [_safe_int(tok) for tok in tokens]
    numbers = [n for n in maybe_numbers if isinstance(n, int)]
    if not numbers:
        return None

    prefixes = {"slide", "slides", "goto", "go", "jump", "to"}
    if any(tok in prefixes for tok in tokens) or text.startswith("slide "):
        target_slide_number = max(numbers[-1], 1)
        return {
            "type": "nav",
            "action": "goto",
            "target_slide_number": target_slide_number,
            "target_slide_index": target_slide_number - 1,
        }

    return None


async def entrypoint(ctx: agents.JobContext) -> None:
    run_id = f"worker-{int(time.time() * 1000)}"
    # Extract session_id from room name or participant attributes
    session_id = ctx.room.name.replace(f"{VoiceConfig.LIVEKIT_ROOM_PREFIX}-", "") if ctx.room and ctx.room.name else "unknown"
    
    _dbg(
        run_id,
        "H6",
        "slide_voice_worker.py:entrypoint",
        "Worker entrypoint starting",
        {"room": getattr(ctx, "room", None) and getattr(ctx.room, "name", None), "session_id": session_id},
    )
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    logger.info("Agent worker connected to room=%s", ctx.room.name)
    _dbg(run_id, "H6", "slide_voice_worker.py:entrypoint", "Connected to room", {"room": ctx.room.name})
    
    # Emit voice connected event
    try:
        await emit_voice_event(
            EventType.VOICE_CONNECTED,
            session_id,
            {"room_name": ctx.room.name, "status": "connected"}
        )
    except Exception:
        pass  # Don't fail on event emission

    # Room-level instrumentation to prove we are actually receiving/subscribing audio.
    def _on_track_subscribed(track: rtc.Track, pub: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant) -> None:
        try:
            _dbg(
                run_id,
                "H7",
                "slide_voice_worker.py:room.track_subscribed",
                "Track subscribed",
                {
                    "participant_identity": participant.identity,
                    "track_kind": str(getattr(track, "kind", "")),
                    "source": str(getattr(pub, "source", "")),
                    "sid": str(getattr(pub, "sid", "")),
                    "mime": str(getattr(pub, "mime_type", "")),
                },
            )
        except Exception:
            pass

    def _on_track_subscription_failed(sid: str, participant: rtc.RemoteParticipant) -> None:
        _dbg(
            run_id,
            "H7",
            "slide_voice_worker.py:room.track_subscription_failed",
            "Track subscription failed",
            {"sid": sid, "participant_identity": participant.identity},
        )

    ctx.room.on("track_subscribed", _on_track_subscribed)
    ctx.room.on("track_subscription_failed", _on_track_subscription_failed)

    participant = await ctx.wait_for_participant()
    logger.info("Participant joined identity=%s", participant.identity)
    _dbg(
        run_id,
        "H6",
        "slide_voice_worker.py:entrypoint",
        "Participant joined",
        {"identity": participant.identity, "attributes": participant.attributes or {}},
    )

    # Monotonic, per-room counter to correlate turn lifecycle.
    # We keep latest-per-identity to drop stale/out-of-order publishes.
    turn_counter = 0
    latest_turn_id_by_identity: dict[str, int] = {}

    # Use Deepgram plugin directly for STT (avoids LiveKit inference authentication)
    # This uses your DEEPGRAM_API_KEY directly
    # Note: Using Nova-3 model as Flux requires v2 endpoint which isn't supported in current LiveKit plugin
    stt_plugin = deepgram.STT(
        model="nova-3",
        language="en",
    )
    
    session: agents.AgentSession[Any] = agents.AgentSession(
        stt=stt_plugin,
        # Slide navigation is implemented via `run_voice_slide_query()` + data
        # publishing in `publish_recommendation()`. LLM/TTS are not required.
        # Keeping this STT-only prevents startup crashes when OPENAI_API_KEY
        # (or other LLM providers) are not configured.
        turn_handling={
            "turn_detection": "vad",
            "endpointing": {"mode": "dynamic", "min_delay": 0.35, "max_delay": 2.0},
            "interruption": {
                "enabled": True,
                "mode": "adaptive",
                "min_duration": 0.2,
                "min_words": 1,
                "resume_false_interruption": True,
                "false_interruption_timeout": 1.5,
            },
        },
        # Avoid any preemptive generation that would require an LLM.
        preemptive_generation=False,
    )

    async def publish_recommendation(
        target: rtc.RemoteParticipant,
        transcript: str,
        *,
        turn_id: int,
    ) -> None:
        attributes = target.attributes or {}
        filename = attributes.get("filename")
        session_id = attributes.get("session_id") or None

        # Drop if no longer latest for this identity.
        if latest_turn_id_by_identity.get(target.identity) != turn_id:
            return

        if not filename:
            await ctx.room.local_participant.publish_data(
                json.dumps(
                    {
                        "type": "error",
                        "message": "Missing filename context in participant attributes.",
                        "turn_id": turn_id,
                    }
                ),
                topic=RECOMMENDATION_TOPIC,
                destination_identities=[target.identity],
            )
            return

        # Let the UI show an immediate "thinking" indicator for this turn.
        if latest_turn_id_by_identity.get(target.identity) == turn_id:
            await ctx.room.local_participant.publish_data(
                json.dumps(
                    {
                        "type": "processing",
                        "turn_id": turn_id,
                        "question": transcript,
                    }
                ),
                topic=RECOMMENDATION_TOPIC,
                destination_identities=[target.identity],
            )
            
            # Emit thinking event
            try:
                await emit_voice_event(
                    EventType.VOICE_THINKING,
                    session_id or "unknown",
                    {"turn_id": turn_id, "question": transcript}
                )
            except Exception:
                pass

        nav_intent = _parse_navigation_intent(transcript)
        if nav_intent is not None:
            payload: dict[str, Any] = {
                **nav_intent,
                "turn_id": turn_id,
                "question": transcript,
            }

            if latest_turn_id_by_identity.get(target.identity) != turn_id:
                return

            await ctx.room.local_participant.publish_data(
                json.dumps(payload),
                topic=RECOMMENDATION_TOPIC,
                destination_identities=[target.identity],
            )
            
            # Emit navigation event
            try:
                await emit_voice_event(
                    EventType.VOICE_NAVIGATION,
                    session_id or "unknown",
                    {
                        "turn_id": turn_id,
                        "action": nav_intent.get("action"),
                        "question": transcript,
                    }
                )
            except Exception:
                pass
            return

        try:
            result = run_voice_slide_query(
                transcript,
                filename=filename,
                session_id=session_id,
                top_k=5,
            )
            payload: dict[str, Any] = {
                "type": "slide_recommendation",
                "question": transcript,
                "answer": result["answer"],
                "recommended_slide_number": result["recommended_slide_number"],
                "recommended_slide_index": result["recommended_slide_index"],
                "turn_id": turn_id,
            }
        except LookupError as e:
            payload = {
                "type": "error",
                "message": str(e),
                "turn_id": turn_id,
            }
        except Exception as e:
            logger.exception("Failed to compute slide recommendation")
            payload = {
                "type": "error",
                "message": f"Failed to compute recommendation: {e}",
                "turn_id": turn_id,
            }

        # Drop if no longer latest for this identity (e.g., user barged in).
        if latest_turn_id_by_identity.get(target.identity) != turn_id:
            return

        await ctx.room.local_participant.publish_data(
            json.dumps(payload),
            topic=RECOMMENDATION_TOPIC,
            destination_identities=[target.identity],
        )

    def on_user_input_transcribed(event: agents.UserInputTranscribedEvent) -> None:
        nonlocal turn_counter
        if not event.is_final:
            return

        transcript = event.transcript.strip()
        if not transcript:
            return
        _dbg(
            run_id,
            "H7",
            "slide_voice_worker.py:on_user_input_transcribed",
            "Final transcript received",
            {"speaker_id": event.speaker_id or "", "chars": len(transcript)},
        )

        speaker = ctx.room.remote_participants.get(event.speaker_id or "") if event.speaker_id else None
        target = speaker or participant

        turn_counter += 1
        turn_id = turn_counter
        latest_turn_id_by_identity[target.identity] = turn_id
        _dbg(
            run_id,
            "H7",
            "slide_voice_worker.py:on_user_input_transcribed",
            "Publishing recommendation task scheduled",
            {"target_identity": target.identity, "turn_id": turn_id},
        )
        asyncio.create_task(publish_recommendation(target, transcript, turn_id=turn_id))

    def on_session_closed(_: agents.CloseEvent) -> None:
        ctx.shutdown("agent session closed")

    stt_error_published = False

    async def _publish_stt_error_to_ui(message: str) -> None:
        nonlocal stt_error_published
        if stt_error_published:
            return
        stt_error_published = True
        try:
            await ctx.room.local_participant.publish_data(
                json.dumps(
                    {
                        "type": "error",
                        "message": message,
                        "turn_id": 0,
                    }
                ),
                topic=RECOMMENDATION_TOPIC,
                destination_identities=[participant.identity],
            )
            _dbg(run_id, "H9", "slide_voice_worker.py:publish_stt_error", "Published STT error to UI", {"message": message})
        except Exception:
            logger.exception("Failed to publish STT error to UI")

    session.on("user_input_transcribed", on_user_input_transcribed)
    session.on("close", on_session_closed)
    def on_session_error(e: Any) -> None:
        _dbg(
            run_id,
            "H8",
            "slide_voice_worker.py:session.error",
            "Session error event",
            {"error": str(getattr(e, "error", e))},
        )

        err_str = str(getattr(e, "error", e))
        if "stt_error" not in err_str:
            return

        if ("401" in err_str) or ("Unauthorized" in err_str):
            asyncio.create_task(
                _publish_stt_error_to_ui(
                    "Live voice STT failed with 401 Unauthorized. "
                    "Set LIVEKIT_INFERENCE_API_KEY and LIVEKIT_INFERENCE_API_SECRET "
                    "in your backend environment, then restart the voice worker."
                )
            )
        else:
            asyncio.create_task(_publish_stt_error_to_ui(err_str))

    session.on("error", on_session_error)
    session.on(
        "close",
        lambda e: _dbg(
            run_id,
            "H8",
            "slide_voice_worker.py:session.close",
            "Session close event",
            {"reason": str(getattr(e, "reason", ""))},
        ),
    )

    try:
        logger.info("Starting voice session (STT-only) for room=%s", ctx.room.name)
        _dbg(run_id, "H8", "slide_voice_worker.py:session.start", "Starting session.start", {})
        await session.start(agent=PresAIAgent(), room=ctx.room)
        _dbg(run_id, "H8", "slide_voice_worker.py:session.start", "session.start returned", {})
        await asyncio.Event().wait()
    except Exception:
        logger.exception("Voice agent session crashed for room=%s", ctx.room.name)
        _dbg(run_id, "H8", "slide_voice_worker.py:session.start", "Session crashed", {})
        raise


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
