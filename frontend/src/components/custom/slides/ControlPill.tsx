import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useSlideStore } from "../../../lib/store";
import { useLiveKitVoice } from "../../../lib/hooks/useLiveKitVoice";

export default function ControlPill() {
  const {
    isFileUploaded,
    isIngesting,
    isListening,
    isVoiceThinking,
    lastVoiceQuestion,
    lastVoiceMessage,
    currentSlide,
    totalSlides,
    setCurrentSlide,
  } = useSlideStore();

  const { isConnecting, voiceError, voiceStatus, start } = useLiveKitVoice();

  // Visibility state for hover-reveal behaviour.
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDisabled = isIngesting || isConnecting;
  const canNavigate = isFileUploaded && totalSlides > 0 && !isDisabled;
  const canGoPrevious = canNavigate && currentSlide > 0;
  const canGoNext = canNavigate && currentSlide < totalSlides - 1;

  const showListening = isFileUploaded && !isIngesting;
  const isVoiceActive = isListening || isVoiceThinking;

  const statusText = useMemo(() => {
    if (!showListening) return "Upload file";
    if (isConnecting) return "Connecting…";
    if (voiceStatus) return voiceStatus;
    if (isListening && isVoiceThinking) return "Thinking…";
    if (isListening) return "Listening…";
    return "Ready";
  }, [showListening, isConnecting, isListening, isVoiceThinking, voiceStatus]);

  // Auto-show pill whenever voice is active.
  useEffect(() => {
    if (isVoiceActive) setIsVisible(true);
  }, [isVoiceActive]);

  const scheduleHide = useCallback(() => {
    if (isVoiceActive) return;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHovered && !isVoiceActive) setIsVisible(false);
    }, 300);
  }, [isHovered, isVoiceActive]);

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Spacebar toggle.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsVisible((prev) => (isVoiceActive ? true : !prev));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVoiceActive]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleDetectionZoneEnter = useCallback(() => {
    cancelHide();
    setIsVisible(true);
  }, [cancelHide]);

  const handleDetectionZoneLeave = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  const handlePillEnter = useCallback(() => {
    setIsHovered(true);
    cancelHide();
  }, [cancelHide]);

  const handlePillLeave = useCallback(() => {
    setIsHovered(false);
    scheduleHide();
  }, [scheduleHide]);

  const handlePrevious = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide(currentSlide + 1);
  };

  const slideCounterText = totalSlides > 0 ? `${currentSlide + 1} / ${totalSlides}` : "0 / 0";

  return (
    <>
      {/* Invisible hover detection zone at bottom of screen */}
      <div
        className="fixed bottom-0 left-0 w-full h-20 z-40"
        onMouseEnter={handleDetectionZoneEnter}
        onMouseLeave={handleDetectionZoneLeave}
      />

      {/* Main pill container */}
      <motion.div
        className="fixed bottom-0 left-0 w-full z-50 flex justify-center items-center pb-8 px-4 pointer-events-none"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 120 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={handlePillEnter}
        onMouseLeave={handlePillLeave}
      >
        <div className="glass-island rounded-full mx-auto max-w-2xl flex items-center gap-3 px-3 py-2 shadow-[0_24px_80px_rgba(0,0,0,0.4)] pointer-events-auto">

          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className={`flex items-center justify-center p-3 rounded-full transition-all group ${
              !canGoPrevious
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <ChevronLeft className={`w-5 h-5 ${canGoPrevious && "group-active:scale-90"} transition-transform`} />
          </button>

          {/* Slide Counter Badge */}
          <div className="flex items-center justify-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-xs font-medium text-primary tabular-nums">
              {slideCounterText}
            </span>
          </div>

          {/* Center Section — Voice AI or Ingesting Animation */}
          {isIngesting ? (
            <div className="flex items-center gap-4 px-5 py-2 mx-1 bg-surface-container-highest/50 rounded-full border border-primary/20">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="relative w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-5">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [6, 20, 10, 18, 6] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                        className="w-0.5 bg-primary rounded-full"
                        style={{ opacity: 1 - i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-primary font-medium text-xs tracking-tight">Processing</span>
                  <span className="text-muted-foreground text-[10px]">Analyzing slides...</span>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className={`flex items-center gap-3 px-4 py-2 mx-1 bg-surface-container-highest/50 rounded-full border border-primary/20 ${showListening ? "voice-glow-active" : ""}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={start}
                disabled={!showListening}
                className={`relative flex items-center justify-center rounded-full p-3 transition-all ${
                  showListening
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Mic className="w-5 h-5" />
                {isListening && (
                  <span
                    className={`absolute -inset-0.5 rounded-full border-2 ${
                      isVoiceThinking ? "border-primary/80" : "border-primary/40"
                    } animate-pulse`}
                  />
                )}
              </motion.button>

              {/* Animated Waveform — visible while listening */}
              <AnimatePresence>
                {showListening && isListening && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-1 h-6 overflow-hidden"
                  >
                    {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((delay, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [6, 20, 6] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay,
                          ease: "easeInOut",
                        }}
                        className="w-0.5 bg-primary rounded-full"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="hidden sm:flex flex-col min-w-[80px]">
                <span className="text-foreground font-medium text-xs tracking-tight">AI Conductor</span>
                <span className="text-muted-foreground text-[10px] truncate max-w-[120px]">
                  {statusText}
                </span>
              </div>

              {(isConnecting || (isListening && isVoiceThinking)) && (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`flex items-center justify-center p-3 rounded-full transition-all group ${
              !canGoNext
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <ChevronRight className={`w-5 h-5 ${canGoNext && "group-active:scale-90"} transition-transform`} />
          </button>
        </div>

        {/* Status / answer popup */}
        <AnimatePresence>
          {(voiceError || lastVoiceMessage || (isListening && isVoiceThinking)) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg max-w-[90vw]"
            >
              {voiceError ? (
                <p className="text-xs font-medium text-destructive">{voiceError}</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {lastVoiceQuestion && (
                    <p className="text-[11px] font-medium text-muted-foreground truncate max-w-[80vw]">
                      You: {lastVoiceQuestion}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {isListening && isVoiceThinking && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Thinking…
                      </span>
                    )}
                    {lastVoiceMessage && (
                      <p className="text-xs font-medium text-foreground">{lastVoiceMessage}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
