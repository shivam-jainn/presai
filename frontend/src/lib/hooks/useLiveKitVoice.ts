import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { ApiError, getVoiceLivekitToken } from "../api";
import { useSlideStore } from "../store";
import { API_CONFIG } from "../config";

export interface UseLiveKitVoiceReturn {
  isConnecting: boolean;
  voiceError: string | null;
  voiceStatus: string;
  start: () => void;
  stop: () => void;
}

interface RecommendationPayload {
  type?: string;
  message?: string;
  answer?: string;
  question?: string;
  turn_id?: number;
  action?: "next" | "prev" | "goto";
  recommended_slide_number?: number;
  recommended_slide_index?: number;
  target_slide_number?: number;
  target_slide_index?: number;
}

export function useLiveKitVoice(): UseLiveKitVoiceReturn {
  const {
    fileName,
    voiceSessionId,
    totalSlides,
    isListening,
    latestVoiceTurnId,
    setListening,
    setVoiceThinking,
    setLatestVoiceTurnId,
    setLastVoiceQuestion,
    setLastVoiceMessage,
    setLiveTranscript,
    setTranscribing,
    setCurrentSlide,
  } = useSlideStore();

  const roomRef = useRef<Room | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  // Fresh UUID generated on every start() so each connection uses a unique
  // LiveKit room name, guaranteeing a new agent job is dispatched.
  const connIdRef = useRef<string>("");

  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<string>("");


  const openEventStream = useCallback((sessionId: string) => {
    const url = `${API_CONFIG.baseURL}/events/${sessionId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onerror = () => {
    };

    es.addEventListener("voice_transcription_update", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as {
        transcript?: string;
        is_final?: boolean;
        speaker_id?: string;
      };
      if (data.transcript) {
        setLiveTranscript(data.transcript);
        setTranscribing(data.is_final === false);
      }
    });

    es.addEventListener("voice_thinking", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { question?: string };
      setVoiceThinking(true);
      if (data.question) {
        setVoiceStatus(`Processing: "${data.question.substring(0, 30)}…"`);
      }
    });

    es.addEventListener("voice_navigation", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { action?: string };
      setVoiceThinking(false);
      setVoiceStatus(`Navigating: ${data.action ?? "…"}`);
    });

    es.addEventListener("voice_connected", () => {
      setVoiceStatus("Voice assistant ready");
    });

    es.addEventListener("voice_error", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { message?: string };
      setVoiceError(data.message ?? "Voice processing error");
      setVoiceStatus("");
    });
  }, [
    setLiveTranscript,
    setTranscribing,
    setVoiceThinking,
    setVoiceError,
  ]);

  const closeEventStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const handleRecommendation = useCallback(
    (payload: Uint8Array, topic?: string) => {
      if (topic !== "presai.slide.recommendation") return;

      let event: RecommendationPayload;
      try {
        event = JSON.parse(new TextDecoder().decode(payload)) as RecommendationPayload;
      } catch {
        setVoiceError("Received invalid voice event payload.");
        setVoiceThinking(false);
        return;
      }

      const turnId = typeof event.turn_id === "number" ? event.turn_id : 0;

      if (turnId > 0 && turnId < latestVoiceTurnId) return;
      if (turnId > 0) setLatestVoiceTurnId(turnId);

      if (event.question) setLastVoiceQuestion(event.question);

      if (event.type === "error") {
        const msg = event.message ?? "Voice recommendation failed.";
        setVoiceError(msg);
        setVoiceThinking(false);
        setLastVoiceMessage(null);
        // Disconnect on auth errors.
        if (msg.includes("401") || msg.includes("LIVEKIT_INFERENCE")) {
          roomRef.current?.disconnect();
          roomRef.current = null;
          setListening(false);
        }
        return;
      }

      if (event.type === "processing") {
        setVoiceError(null);
        setVoiceThinking(true);
        setLastVoiceMessage("Thinking…");
        return;
      }

      if (event.type === "nav") {
        setVoiceError(null);
        setVoiceThinking(false);
        const maxIdx = Math.max(totalSlides - 1, 0);

        if (event.action === "next") {
          setCurrentSlide((s) => Math.min(s + 1, maxIdx));
          setLastVoiceMessage("Next slide.");
          return;
        }
        if (event.action === "prev") {
          setCurrentSlide((s) => Math.max(s - 1, 0));
          setLastVoiceMessage("Previous slide.");
          return;
        }
        if (event.action === "goto" && typeof event.target_slide_index === "number") {
          const idx = Math.max(0, Math.min(event.target_slide_index, maxIdx));
          setCurrentSlide(idx);
          setLastVoiceMessage(
            typeof event.target_slide_number === "number"
              ? `Going to slide ${event.target_slide_number}.`
              : "Going to that slide.",
          );
          return;
        }
      }

      if (typeof event.recommended_slide_index === "number") {
        const idx = Math.max(
          0,
          Math.min(event.recommended_slide_index, Math.max(totalSlides - 1, 0)),
        );
        setCurrentSlide(idx);
      }

      if (event.answer) {
        setVoiceError(null);
        setVoiceThinking(false);
        setLastVoiceMessage(event.answer);
        return;
      }

      if (typeof event.recommended_slide_number === "number") {
        setVoiceError(null);
        setVoiceThinking(false);
        setLastVoiceMessage(`Jumping to slide ${event.recommended_slide_number}.`);
      }
    },
    [
      latestVoiceTurnId,
      totalSlides,
      setLatestVoiceTurnId,
      setLastVoiceQuestion,
      setLastVoiceMessage,
      setVoiceError,
      setVoiceThinking,
      setCurrentSlide,
      setListening,
    ],
  );

  const stop = useCallback(async () => {
    closeEventStream();

    const room = roomRef.current;
    if (room) {
      await room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
      room.disconnect();
      roomRef.current = null;
    }

    setListening(false);
    setVoiceThinking(false);
    setLiveTranscript("");
    setTranscribing(false);
    setVoiceStatus("");
    // Reset turn counter so a fresh worker's turns (starting at 1) are never
    // filtered out by the stale-turn-id guard.
    setLatestVoiceTurnId(0);
  }, [
    closeEventStream,
    setListening,
    setVoiceThinking,
    setLiveTranscript,
    setTranscribing,
    setLatestVoiceTurnId,
  ]);

  const start = useCallback(async () => {
    if (!fileName) {
      setVoiceError("No presentation is active for voice navigation.");
      return;
    }

    setVoiceError(null);
    setVoiceStatus("Connecting…");
    setIsConnecting(true);
    setVoiceThinking(false);
    setLastVoiceQuestion(null);
    setLastVoiceMessage("Connecting…");

    // Fresh connection ID → unique room name → LiveKit always dispatches a new
    // agent job, even if the previous room still lingers on the server.
    const connId = crypto.randomUUID();
    connIdRef.current = connId;

    try {
      openEventStream(connId);

      // session_id = connId (room key, fresh per connect)
      // query_session_id = voiceSessionId (stable, matches ingestion)
      const tokenResult = await getVoiceLivekitToken(fileName, connId, voiceSessionId);

      const room = new Room({ adaptiveStream: false, dynacast: false });
      roomRef.current = room;

      room.on(RoomEvent.Reconnecting, () => setVoiceStatus("Reconnecting…"));
      room.on(RoomEvent.Reconnected, () => setVoiceStatus("Reconnected"));

      room.on(RoomEvent.Disconnected, () => {
        setListening(false);
        setVoiceThinking(false);
        setLastVoiceMessage("Disconnected.");
      });

      room.on(
        RoomEvent.DataReceived,
        (payload: Uint8Array, _participant, _kind, topic?: string) => {
          handleRecommendation(payload, topic);
        },
      );

      await room.connect(tokenResult.ws_url, tokenResult.token);

      // Enable local microphone for publishing audio
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      
      try {
        // Create and enable local audio track
        const localTracks = await room.localParticipant.createTracks({
          audio: true,
        });
        
        if (localTracks.length > 0) {
          await room.localParticipant.publishTrack(localTracks[0]);
          setVoiceStatus("Listening…");
        } else {
          throw new Error("Failed to create audio track");
        }
      } catch (error) {
        console.error("Failed to enable microphone:", error);
        throw new Error(
          "Could not access microphone. Please grant microphone permissions.",
        );
      }

      setListening(true);
      setLastVoiceMessage("Live voice connected. Ask a question.");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unable to connect to voice room.";
      setVoiceError(message);
      setVoiceThinking(false);
      setLastVoiceMessage(null);
      setVoiceStatus("");
      closeEventStream();
      roomRef.current?.disconnect();
      roomRef.current = null;
    } finally {
      setIsConnecting(false);
    }
  }, [
    fileName,
    voiceSessionId,
    openEventStream,
    closeEventStream,
    handleRecommendation,
    setListening,
    setVoiceThinking,
    setLastVoiceQuestion,
    setLastVoiceMessage,
  ]);

  // ── Public toggle ────────────────────────────────────────────────────────────

  const toggle = useCallback(() => {
    if (isListening) {
      void stop();
    } else {
      void start();
    }
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, []);

  return {
    isConnecting,
    voiceError,
    voiceStatus,
    start: toggle,
    stop,
  };
}
