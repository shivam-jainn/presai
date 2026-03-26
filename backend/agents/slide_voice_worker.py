import asyncio
import json
from typing import Any

from livekit import agents, rtc

from config.voice import 
from services.voice.retrieval import run_voice_slide_query
from utils.logger import logger

RECOMMENDATION_TOPIC = "presai.slide.recommendation"


class PresAIAgent(agents.Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are PresAI voice conductor. Keep responses short and natural. "
                "If user asks navigation commands, confirm quickly and continue."
            )
        )


async def entrypoint(ctx: agents.JobContext) -> None:
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    logger.info("Agent worker connected to room=%s", ctx.room.name)

    participant = await ctx.wait_for_participant()
    logger.info("Participant joined identity=%s", participant.identity)

    session: agents.AgentSession[Any] = agents.AgentSession(
        stt=agents.inference.STT(
            model=VoiceConfig.INFERENCE_STT_MODEL,
            encoding=VoiceConfig.INFERENCE_STT_ENCODING,  # type: ignore[arg-type]
            sample_rate=VoiceConfig.INFERENCE_STT_SAMPLE_RATE,
            extra_kwargs={
                "eot_threshold": VoiceConfig.INFERENCE_STT_EOT_THRESHOLD,
                "eot_timeout_ms": VoiceConfig.INFERENCE_STT_EOT_TIMEOUT_MS,
                "eager_eot_threshold": VoiceConfig.INFERENCE_STT_EAGER_EOT_THRESHOLD,
            },
        ),
        llm=agents.inference.LLM(model=VoiceConfig.INFERENCE_LLM_MODEL),
        tts=agents.inference.TTS(
            model=VoiceConfig.INFERENCE_TTS_MODEL,
            voice=VoiceConfig.INFERENCE_TTS_VOICE,
        ),
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
    )

    async def publish_recommendation(target: rtc.RemoteParticipant, transcript: str) -> None:
        attributes = target.attributes or {}
        filename = attributes.get("filename")
        session_id = attributes.get("session_id") or None

        if not filename:
            await ctx.room.local_participant.publish_data(
                json.dumps(
                    {
                        "type": "error",
                        "message": "Missing filename context in participant attributes.",
                    }
                ),
                topic=RECOMMENDATION_TOPIC,
                destination_identities=[target.identity],
            )
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
            }
        except LookupError as e:
            payload = {
                "type": "error",
                "message": str(e),
            }
        except Exception as e:
            logger.exception("Failed to compute slide recommendation")
            payload = {
                "type": "error",
                "message": f"Failed to compute recommendation: {e}",
            }

        await ctx.room.local_participant.publish_data(
            json.dumps(payload),
            topic=RECOMMENDATION_TOPIC,
            destination_identities=[target.identity],
        )

    def on_user_input_transcribed(event: agents.UserInputTranscribedEvent) -> None:
        if not event.is_final:
            return

        transcript = event.transcript.strip()
        if not transcript:
            return

        speaker = ctx.room.remote_participants.get(event.speaker_id or "") if event.speaker_id else None
        target = speaker or participant
        asyncio.create_task(publish_recommendation(target, transcript))

    def on_session_closed(_: agents.CloseEvent) -> None:
        ctx.shutdown("agent session closed")

    session.on("user_input_transcribed", on_user_input_transcribed)
    session.on("close", on_session_closed)

    await session.start(agent=PresAIAgent(), room=ctx.room)
    await asyncio.Event().wait()


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
