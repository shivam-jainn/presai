import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Mic, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Room, RoomEvent } from "livekit-client";
import { ApiError, getVoiceLivekitToken } from "../../../lib/api";
import { VOICE_CONFIG } from "../../../lib/config";
import { useSlideStore } from "../../../lib/store";

export default function ControlPill() {
  const { 
    isFileUploaded, 
    isIngesting, 
    isListening,
    fileName,
    ingestionSessionId,
    currentSlide,
    totalSlides,
    setListening,
    setCurrentSlide 
  } = useSlideStore();

  const livekitRoomRef = useRef<Room | null>(null);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const isDisabled = isIngesting || isVoiceProcessing;
  const canNavigate = isFileUploaded && totalSlides > 0 && !isDisabled;
  const canGoPrevious = canNavigate && currentSlide > 0;
  const canGoNext = canNavigate && currentSlide < totalSlides - 1;
  
  const showListening = isFileUploaded && !isIngesting;

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
    if (!showListening) {
      return;
    }

    if (!fileName) {
      setVoiceError("No presentation is active for voice navigation.");
      return;
    }

    const stopVoiceCapture = async () => {
      const room = livekitRoomRef.current;
      if (room) {
        await room.localParticipant.setMicrophoneEnabled(false);
        room.disconnect();
        livekitRoomRef.current = null;
      }
      setListening(false);
    };

    if (isListening) {
      void stopVoiceCapture();
      return;
    }

    if (VOICE_CONFIG.mode !== "agentkit_live") {
      setVoiceError("Set VITE_VOICE_MODE=agentkit_live for realtime voice.");
      return;
    }

    const startAgentkitLive = async () => {
      setVoiceError(null);
      setVoiceFeedback("Connecting to live voice room...");
      setIsVoiceProcessing(true);

      try {
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
              recommended_slide_number?: number;
              recommended_slide_index?: number;
            };

            if (typeof event.recommended_slide_index === "number") {
              setCurrentSlide(event.recommended_slide_index);
            }

            if (event.type === "error") {
              setVoiceError(event.message || "Voice recommendation failed.");
              setVoiceFeedback(null);
              return;
            }

            if (typeof event.recommended_slide_number === "number") {
              setVoiceFeedback(`ahh found it. Jumping to slide ${event.recommended_slide_number}.`);
              setVoiceError(null);
            } else if (event.answer) {
              setVoiceFeedback(event.answer);
              setVoiceError(null);
            }
          } catch {
            setVoiceError("Received invalid voice event payload.");
            setVoiceFeedback(null);
          }
        });

        room.on(RoomEvent.Disconnected, () => {
          setListening(false);
          setVoiceFeedback("Disconnected from live voice room.");
        });

        await room.connect(tokenResult.ws_url, tokenResult.token);
        await room.localParticipant.setMicrophoneEnabled(true);

        setListening(true);
        setVoiceFeedback("Live voice connected. Ask your question naturally.");
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unable to connect live voice room.";
        setVoiceError(message);
        setVoiceFeedback(null);
        livekitRoomRef.current?.disconnect();
        livekitRoomRef.current = null;
      } finally {
        setIsVoiceProcessing(false);
      }
    };

    void startAgentkitLive();
  };

  useEffect(() => {
    return () => {
      livekitRoomRef.current?.disconnect();
      livekitRoomRef.current = null;
    };
  }, []);

  const handleLibrary = () => {
    console.log("Library clicked");
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
          /* Normal Voice AI Widget */
          <div className={`flex items-center gap-6 px-8 py-2 mx-4 bg-surface-container-highest/50 rounded-full border border-primary/20 voice-glow ${showListening ? 'voice-glow-active' : ''}`}>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleVoiceAI}
              className={`flex flex-col items-center justify-center rounded-full p-4 shadow-[0_0_20px_rgba(211,187,255,0.4)] cursor-pointer transition-all ${
                showListening 
                  ? "bg-primary text-background" 
                  : "bg-primary/20 text-primary"
              }`}
            >
              <Mic className="w-6 h-6 fill-current" />
            </motion.div>

            {/* Animated Waveform - only show when listening */}
            {showListening && (
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
                {showListening
                  ? isVoiceProcessing
                    ? "THINKING..."
                    : isListening
                      ? "LISTENING..."
                      : "READY"
                  : "UPLOAD FILE"}
              </span>
            </div>
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
      {(voiceFeedback || voiceError) && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/20 max-w-[90vw]">
          <p className={`text-xs font-medium ${voiceError ? "text-red-400" : "text-on-surface-variant"}`}>
            {voiceError || voiceFeedback}
          </p>
        </div>
      )}
    </div>
  );
}
