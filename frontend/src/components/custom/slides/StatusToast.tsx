import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Check, Mic, AlertCircle } from "lucide-react";
import { useSlideStore } from "../../../lib/store";
import { API_CONFIG } from "../../../lib/config";

type StatusType = "info" | "success" | "error";
type IconType = "spinner" | "check" | "mic" | "alert";

interface StatusState {
  visible: boolean;
  message: string;
  type: StatusType;
  icon: IconType;
}

const AUTO_DISMISS_TIMEOUT = 4000;

export default function StatusToast() {
  const ingestionSessionId = useSlideStore((state) => state.ingestionSessionId);
  const eventSourceRef = useRef<EventSource | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<StatusState>({
    visible: false,
    message: "",
    type: "info",
    icon: "spinner",
  });

  // Clear the auto-dismiss timer
  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  // Start the auto-dismiss timer
  const startDismissTimer = () => {
    clearDismissTimer();
    dismissTimerRef.current = setTimeout(() => {
      setStatus((prev) => ({ ...prev, visible: false }));
    }, AUTO_DISMISS_TIMEOUT);
  };

  // Update status and reset timer
  const showStatus = (newStatus: Omit<StatusState, "visible">) => {
    setStatus({ ...newStatus, visible: true });
    startDismissTimer();
  };

  useEffect(() => {
    // Only connect if we have a session ID
    if (!ingestionSessionId) {
      return;
    }

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new SSE connection
    const eventUrl = `${API_CONFIG.baseURL}/events/${ingestionSessionId}`;
    const eventSource = new EventSource(eventUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[StatusToast] SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const eventType = parsed.type;
        const payload = parsed.data || {};

        switch (eventType) {
          case "ingestion_start":
            showStatus({
              message: "Processing file...",
              type: "info",
              icon: "spinner",
            });
            break;

          case "ingestion_progress": {
            const stepMessage = payload.step || payload.message || "Processing...";
            showStatus({
              message: stepMessage,
              type: "info",
              icon: "spinner",
            });
            break;
          }

          case "ingestion_complete":
            showStatus({
              message: "Ready!",
              type: "success",
              icon: "check",
            });
            break;

          case "ingestion_error": {
            const errorMsg = payload.message || payload.error || "Processing failed";
            showStatus({
              message: errorMsg,
              type: "error",
              icon: "alert",
            });
            break;
          }

          case "voice_thinking":
            showStatus({
              message: "Processing your question...",
              type: "info",
              icon: "mic",
            });
            break;

          case "voice_navigation": {
            const slideNum = payload.slide_number || "?";
            showStatus({
              message: `Navigated to slide ${slideNum}`,
              type: "success",
              icon: "check",
            });
            break;
          }

          case "voice_connected":
            showStatus({
              message: "Voice connected",
              type: "success",
              icon: "check",
            });
            break;

          case "voice_error": {
            const voiceErrorMsg = payload.message || payload.error || "Voice error";
            showStatus({
              message: voiceErrorMsg,
              type: "error",
              icon: "alert",
            });
            break;
          }

          default:
            // Unknown event type - ignore
            break;
        }
      } catch (err) {
        console.error("[StatusToast] Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[StatusToast] SSE error:", error);
      // Don't show error toast for connection errors to avoid noise
    };

    // Cleanup on unmount or sessionId change
    return () => {
      clearDismissTimer();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [ingestionSessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearDismissTimer();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getIcon = () => {
    const iconClass = "h-4 w-4";
    switch (status.icon) {
      case "spinner":
        return <Loader2 className={`${iconClass} animate-spin`} />;
      case "check":
        return <Check className={iconClass} />;
      case "mic":
        return <Mic className={iconClass} />;
      case "alert":
        return <AlertCircle className={iconClass} />;
      default:
        return null;
    }
  };

  const getTypeStyles = () => {
    switch (status.type) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "info":
      default:
        return "text-neutral-700 dark:text-neutral-200";
    }
  };

  return (
    <AnimatePresence>
      {status.visible && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed top-4 right-4 z-40"
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-full 
                       bg-white/80 dark:bg-neutral-900/80 
                       backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/50
                       shadow-lg shadow-black/5 dark:shadow-black/20"
          >
            <span className={getTypeStyles()}>{getIcon()}</span>
            <span
              className={`text-sm font-medium ${getTypeStyles()}`}
            >
              {status.message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
