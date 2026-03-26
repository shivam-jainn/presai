import { motion, AnimatePresence } from "motion/react";
import { useSlideStore } from "../../../lib/store";

export default function RealTimeTranscript() {
  const { liveTranscript, isTranscribing } = useSlideStore();

  // Don't show if not transcribing or no transcript
  if (!isTranscribing && !liveTranscript) {
    return null;
  }

  return (
    <AnimatePresence>
      {(isTranscribing || liveTranscript) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"
        >
          <div className="glass-card rounded-2xl p-4 border border-primary/20 shadow-lg">
            <div className="flex items-start gap-3">
              {/* Live indicator */}
              {isTranscribing && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                </div>
              )}
              
              {/* Transcript text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed break-words">
                  {liveTranscript || "Listening..."}
                </p>
                
                {/* Typing indicator when actively transcribing */}
                {isTranscribing && !liveTranscript && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">Transcribing</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
