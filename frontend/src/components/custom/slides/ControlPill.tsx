import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Mic, ChevronLeft, ChevronRight, LayoutGrid, Loader2 } from "lucide-react";
import { Room, RoomEvent } from "livekit-client";
import { ApiError, getVoiceLivekitToken } from "../../../lib/api";
import { VOICE_CONFIG } from "../../../lib/config";
import { useSlideStore } from "../../../lib/store";

const DEBUG_ENDPOINT = "http://127.0.0.1:7775/ingest/c06982f1-f21b-42df-bbba-e4c25338cbe2";
const DEBUG_SESSION_ID = "ec09e7";

const emitDebugLog = (payload: {
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
}) => {
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: payload.runId,
      hypothesisId: payload.hypothesisId,
      location: payload.location,
      message: payload.message,
      data: payload.data ?? {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
};

export default function ControlPill() {
  const { 
    isFileUploaded, 
    isIngesting, 
    isListening,
    isVoiceThinking,
    latestVoiceTurnId,
    lastVoiceQuestion,
    lastVoiceMessage,
    fileName,
    ingestionSessionId,
    currentSlide,
    totalSlides,
    setListening,
    setVoiceThinking,
    setLatestVoiceTurnId,
    setLastVoiceQuestion,
    setLastVoiceMessage,
    setCurrentSlide 
  } = useSlideStore();

  const livekitRoomRef = useRef<Room | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<string>("");

  const isDisabled = isIngesting || isConnecting;
  const canNavigate = isFileUploaded && totalSlides > 0 && !isDisabled;
  const canGoPrevious = canNavigate && currentSlide > 0;
  const canGoNext = canNavigate && currentSlide < totalSlides - 1;
  
  const showListening = isFileUploaded && !isIngesting;
  const statusText = useMemo(() => {
    if (!showListening) return "UPLOAD FILE";
    if (isConnecting) return "CONNECTING…";
    if (voiceStatus) return voiceStatus;
    if (isListening && isVoiceThinking) return "THINKING…";
    if (isListening) return "LISTENING…";
    return "READY";
  }, [showListening, isConnecting, isListening, isVoiceThinking, voiceStatus]);

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleVoiceAI = () => {
    const runId = `voice-${Date.now()}`;
    const sessionId = ingestionSessionId || fileName?.replace(/[^a-z0-9]/gi, "-") || "default";


    if (!showListening) {
      return;
    }

    if (!fileName) {
      setVoiceError("No presentation is active for voice navigation.");
      return;
    }

    const stopVoiceCapture = async () => {
      // Close event stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      const room = livekitRoomRef.current;
      if (room) {
        await room.localParticipant.setMicrophoneEnabled(false);
        room.disconnect();
        livekitRoomRef.current = null;
      }
      setListening(false);
      setVoiceThinking(false);
      setVoiceStatus("");
    };

    if (isListening) {
      void stopVoiceCapture();
      return;
    }

    // Remove the mode check - support both local and agentkit_live
    // The backend will handle the appropriate LiveKit configuration

    const startAgentkitLive = async () => {
      setVoiceError(null);
      setVoiceStatus("Connecting...");
      setIsConnecting(true);
      setVoiceThinking(false);
      setLastVoiceQuestion(null);
      setLastVoiceMessage("Connecting…");

      try {
        // Connect to event stream first for real-time updates
        const eventUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/events/${sessionId}`;
        eventSourceRef.current = new EventSource(eventUrl);
        
        eventSourceRef.current.onopen = () => {
          setVoiceStatus("Connected - Ready to listen");
        };
        
        eventSourceRef.current.onerror = (error) => {
          console.error("Event stream error:", error);
          // Don't fail on event stream errors, continue with voice
        };
        
        eventSourceRef.current.addEventListener("voice_thinking", (event) => {
          const data = JSON.parse(event.data);
          setVoiceThinking(true);
          setVoiceStatus(`Processing: "${data.question?.substring(0, 30)}..."`);
        });
        
        eventSourceRef.current.addEventListener("voice_navigation", (event) => {
          const data = JSON.parse(event.data);
          setVoiceThinking(false);
          setVoiceStatus(`Navigating: ${data.action}`);
        });
        
        eventSourceRef.current.addEventListener("voice_connected", (event) => {
          setVoiceStatus("Voice assistant ready");
        });
        
        eventSourceRef.current.addEventListener("voice_error", (event) => {
          const data = JSON.parse(event.data);
          setVoiceError(data.message || "Voice processing error");
          setVoiceStatus("");
        });

        const tokenResult = await getVoiceLivekitToken(fileName, ingestionSessionId);

        const room = new Room();
        livekitRoomRef.current = room;

        room.on(RoomEvent.DataReceived, (payload: Uint8Array, _participant, _kind, topic?: string) => {

          if (topic !== "presai.slide.recommendation") {
            return;
          }

          try {
            const text = new TextDecoder().decode(payload);
            const event = JSON.parse(text) as {
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
            };

            const turnId = typeof event.turn_id === "number" ? event.turn_id : 0;
            if (turnId > 0 && turnId < latestVoiceTurnId) {
              return; // stale / out-of-order
            }
            if (turnId > 0) {
              setLatestVoiceTurnId(turnId);
            }

            if (event.question) {
              setLastVoiceQuestion(event.question);
            }

            if (event.type === "error") {
              const message = event.message || "Voice recommendation failed.";
              setVoiceError(message);
              setVoiceThinking(false);
              setLastVoiceMessage(null);

              // If STT is unauthorized, continuing to "listen" will never produce transcripts.
              // Stop the LiveKit session so UI doesn't stay stuck.
              if (message.includes("401") || message.includes("LIVEKIT_INFERENCE")) {
                livekitRoomRef.current?.disconnect();
                livekitRoomRef.current = null;
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

              if (event.action === "next") {
                setCurrentSlide((s) => Math.min(s + 1, Math.max(totalSlides - 1, 0)));
                setLastVoiceMessage("Next slide.");
                return;
              }
              if (event.action === "prev") {
                setCurrentSlide((s) => Math.max(s - 1, 0));
                setLastVoiceMessage("Previous slide.");
                return;
              }
              if (event.action === "goto" && typeof event.target_slide_index === "number") {
                const idx = Math.max(0, Math.min(event.target_slide_index, Math.max(totalSlides - 1, 0)));
                setCurrentSlide(idx);
                setLastVoiceMessage(
                  typeof event.target_slide_number === "number"
                    ? `Going to slide ${event.target_slide_number}.`
                    : "Going to that slide."
                );
                return;
              }
            }

            // slide recommendation payload
            if (typeof event.recommended_slide_index === "number") {
              const idx = Math.max(0, Math.min(event.recommended_slide_index, Math.max(totalSlides - 1, 0)));
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
          } catch {
            setVoiceError("Received invalid voice event payload.");
            setVoiceThinking(false);
            setLastVoiceMessage(null);
          }
        });

        room.on(RoomEvent.Disconnected, () => {
          setListening(false);
          setVoiceThinking(false);
          setLastVoiceMessage("Disconnected.");
        });

        await room.connect(tokenResult.ws_url, tokenResult.token);
        await room.localParticipant.setMicrophoneEnabled(true);

        const localAny = room.localParticipant as any;
        const audioTrackPublications = localAny?.audioTrackPublications;
        const audioTracks = localAny?.audioTracks;
        const hasAudioTrack =
          (audioTrackPublications && typeof audioTrackPublications.size === "number" && audioTrackPublications.size > 0) ||
          (audioTracks && typeof audioTracks.size === "number" && audioTracks.size > 0);

        // If the published audio track is muted, STT/VAD will never fire.
        let firstAudioPublication: any = undefined;
        try {
          if (audioTrackPublications && typeof audioTrackPublications.values === "function") {
            firstAudioPublication = audioTrackPublications.values().next().value;
          } else if (audioTracks && typeof audioTracks.values === "function") {
            firstAudioPublication = audioTracks.values().next().value;
          } else if (Array.isArray(audioTracks)) {
            firstAudioPublication = audioTracks[0];
          }
        } catch {
          // Best-effort only.
        }
        const isMuted =
          (firstAudioPublication as any)?.muted === true ||
          (firstAudioPublication as any)?.isMuted === true;
        setListening(true);
        setLastVoiceMessage("Live voice connected. Ask a question.");
        setVoiceStatus("Listening...");
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unable to connect live voice room.";
        setVoiceError(message);
        setVoiceThinking(false);
        setLastVoiceMessage(null);
        setVoiceStatus("");
        livekitRoomRef.current?.disconnect();
        livekitRoomRef.current = null;
      } finally {
        setIsConnecting(false);
      }
    };

    void startAgentkitLive();
  };

  useEffect(() => {
    return () => {
      // Clean up event stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Clean up LiveKit room
      livekitRoomRef.current?.disconnect();
      livekitRoomRef.current = null;
    };
  }, []);

  const handleLibrary = () => {
    // Library button handler
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center items-center pb-8 px-4">
      <div className="glass rounded-full mx-auto max-w-2xl flex items-center justify-between px-2 py-2 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        
        {/* Previous Button - Disabled when processing */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={`flex flex-col items-center justify-center p-4 rounded-full transition-all group ${
            !canGoPrevious
              ? "text-slate-600 cursor-not-allowed"
              : "text-slate-400 hover:bg-surface-container-high hover:text-primary"
          }`}
        >
          <ChevronLeft className={`w-6 h-6 ${canGoPrevious && "group-active:scale-90"} transition-transform`} />
          <span className="font-inter font-semibold text-[10px] uppercase tracking-widest mt-1">Previous</span>
        </button>

        {/* Center Section - Voice AI or Loading Animation */}
        {isIngesting ? (
          /* Loading State - Animated bars moving left to right */
          <div className="flex items-center gap-6 px-8 py-2 mx-4 bg-surface-container-highest/50 rounded-full border border-primary/20">
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center"
            >
              <div className="relative w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
                {/* Animated bars moving from left to right */}
                <div className="flex items-end gap-0.75 h-6">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [8, 28, 12, 24, 8],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                      className="w-0.75 bg-primary rounded-full"
                      style={{
                        opacity: 1 - (i * 0.1),
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-primary font-figtree font-bold text-xs tracking-tight">PROCESSING</span>
                <span className="text-on-surface-variant text-[10px] font-medium">ANALYZING SLIDES...</span>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Voice AI Widget */
          <div className={`flex items-center gap-5 px-6 sm:px-8 py-2 mx-4 bg-surface-container-highest/50 rounded-full border border-primary/20 voice-glow ${showListening ? 'voice-glow-active' : ''}`}>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleVoiceAI}
              className={`relative flex flex-col items-center justify-center rounded-full p-4 shadow-[0_0_20px_rgba(211,187,255,0.35)] cursor-pointer transition-all ${
                showListening 
                  ? "bg-primary text-background" 
                  : "bg-primary/20 text-primary"
              }`}
            >
              <Mic className="w-6 h-6 fill-current" />
              {isListening && (
                <span className={`absolute -inset-1 rounded-full border ${isVoiceThinking ? "border-primary/80" : "border-primary/50"} animate-pulse`} />
              )}
            </motion.div>

            {/* Animated Waveform - show when listening */}
            {showListening && isListening && (
              <div className="flex items-center gap-1 h-8">
                {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [8, 24, 8] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: delay,
                      ease: "easeInOut"
                    }}
                    className="w-0.75 bg-primary rounded-full"
                  />
                ))}
              </div>
            )}

            <div className="hidden sm:flex flex-col">
              <span className="text-primary font-figtree font-bold text-xs tracking-tight">AI CONDUCTOR</span>
              <span className="text-on-surface-variant text-[10px] font-medium">
                {statusText}
              </span>
            </div>

            {(isConnecting || (isListening && isVoiceThinking)) && (
              <div className="flex items-center pr-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Next Button - Disabled when processing */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`flex flex-col items-center justify-center p-4 rounded-full transition-all group ${
            !canGoNext
              ? "text-slate-600 cursor-not-allowed"
              : "text-slate-400 hover:bg-surface-container-high hover:text-primary"
          }`}
        >
          <ChevronRight className={`w-6 h-6 ${canGoNext && "group-active:scale-90"} transition-transform`} />
          <span className="font-inter font-semibold text-[10px] uppercase tracking-widest mt-1">Next</span>
        </button>

        {/* Library Button - Disabled when processing */}
        <button
          onClick={handleLibrary}
          disabled={isDisabled}
          className={`flex flex-col items-center justify-center p-4 rounded-full transition-all group ${
            isDisabled
              ? "text-slate-600 cursor-not-allowed"
              : "text-slate-400 hover:bg-surface-container-high hover:text-primary"
          }`}
        >
          <LayoutGrid className={`w-6 h-6 ${!isDisabled && "group-active:scale-90"} transition-transform`} />
          <span className="font-inter font-semibold text-[10px] uppercase tracking-widest mt-1">Library</span>
        </button>
      </div>
      {(voiceError || lastVoiceMessage || (isListening && isVoiceThinking)) && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/20 max-w-[90vw]">
          {voiceError ? (
            <p className="text-xs font-medium text-red-400">{voiceError}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {lastVoiceQuestion && (
                <p className="text-[11px] font-semibold text-on-surface-variant/80 truncate max-w-[80vw]">
                  You: {lastVoiceQuestion}
                </p>
              )}
              <div className="flex items-center gap-2">
                {(isListening && isVoiceThinking) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking…
                  </span>
                )}
                {lastVoiceMessage && (
                  <p className="text-xs font-medium text-on-surface-variant">
                    {lastVoiceMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
