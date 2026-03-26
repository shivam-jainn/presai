import { create } from "zustand";

export type IngestionStatus = "idle" | "ingesting" | "success" | "failed";
export type Theme = "light" | "dark" | "system";

interface SlideState {
  // Stable session ID generated once per page load. Used for LiveKit room
  // naming and SSE subscriptions so both channels always share the same key.
  voiceSessionId: string;

  // File state
  isFileUploaded: boolean;
  fileName: string | null;
  pptUrl: string | null;
  ingestionSessionId: string | null;
  uploadPickerRequest: number;
  
  // Ingestion state
  isIngesting: boolean;
  ingestionStatus: IngestionStatus;
  ingestionError: string | null;
  isPresentationReady: boolean;
  
  // Voice AI state
  isListening: boolean;
  latestVoiceTurnId: number;
  isVoiceThinking: boolean;
  lastVoiceQuestion: string | null;
  lastVoiceMessage: string | null;
  liveTranscript: string;
  isTranscribing: boolean;
  
  // Slide navigation
  currentSlide: number;
  totalSlides: number;
  slideContent: Record<number, string[]>;

  // Theme state
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Actions
  setFileUploaded: (uploaded: boolean, fileName?: string) => void;
  setPptUrl: (url: string | null) => void;
  setIngestionSessionId: (sessionId: string | null) => void;
  requestUploadPicker: () => void;
  setIngesting: (ingesting: boolean) => void;
  setIngestionStatus: (status: IngestionStatus, error?: string) => void;
  setIsPresentationReady: (ready: boolean) => void;
  setListening: (listening: boolean) => void;
  setLatestVoiceTurnId: (turnId: number) => void;
  setVoiceThinking: (thinking: boolean) => void;
  setLastVoiceQuestion: (question: string | null) => void;
  setLastVoiceMessage: (message: string | null) => void;
  setLiveTranscript: (transcript: string) => void;
  setTranscribing: (transcribing: boolean) => void;
  setCurrentSlide: (slide: number | ((prev: number) => number)) => void;
  setTotalSlides: (total: number) => void;
  setSlideContent: (content: Record<number, string[]>) => void;
  reset: () => void;
}

// Helper function to apply theme to document
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("presai-theme") as Theme | null;
  return stored || "dark";
}

const VOICE_SESSION_ID = crypto.randomUUID();

const initialState = {
  voiceSessionId: VOICE_SESSION_ID,
  isFileUploaded: false,
  fileName: null,
  pptUrl: null,
  ingestionSessionId: null,
  uploadPickerRequest: 0,
  isIngesting: false,
  ingestionStatus: "idle" as IngestionStatus,
  ingestionError: null,
  isPresentationReady: false,
  isListening: false,
  latestVoiceTurnId: 0,
  isVoiceThinking: false,
  lastVoiceQuestion: null,
  lastVoiceMessage: null,
  liveTranscript: "",
  isTranscribing: false,
  currentSlide: 0,
  totalSlides: 0,
  slideContent: {},
  theme: getInitialTheme(),
};

export const useSlideStore = create<SlideState>((set) => ({
  ...initialState,
  
  setFileUploaded: (uploaded, fileName) =>
    set({ isFileUploaded: uploaded, fileName: fileName || null }),
  
  setPptUrl: (url) =>
    set({ pptUrl: url }),

  setIngestionSessionId: (sessionId) =>
    set({ ingestionSessionId: sessionId }),

  requestUploadPicker: () =>
    set((state) => ({ uploadPickerRequest: state.uploadPickerRequest + 1 })),
  
  setIngesting: (ingesting) =>
    set({ isIngesting: ingesting }),
  
  setIngestionStatus: (status, error) =>
    set({ 
      ingestionStatus: status, 
      ingestionError: error || null,
      isIngesting: status === "ingesting",
      isPresentationReady: status === "success",
    }),
  
  setIsPresentationReady: (ready) =>
    set({ isPresentationReady: ready }),
  
  setListening: (listening) =>
    set({ isListening: listening }),

  setLatestVoiceTurnId: (turnId) =>
    set({ latestVoiceTurnId: Math.max(0, turnId) }),

  setVoiceThinking: (thinking) =>
    set({ isVoiceThinking: thinking }),

  setLastVoiceQuestion: (question) =>
    set({ lastVoiceQuestion: question }),

  setLastVoiceMessage: (message) =>
    set({ lastVoiceMessage: message }),

  setLiveTranscript: (transcript) =>
    set({ liveTranscript: transcript }),

  setTranscribing: (transcribing) =>
    set({ isTranscribing: transcribing }),
  
  setCurrentSlide: (slide) =>
    set((state) => ({
      currentSlide: typeof slide === "function" ? slide(state.currentSlide) : slide,
    })),
  
  setTotalSlides: (total) =>
    set({ totalSlides: total }),
  
  setSlideContent: (content) =>
    set({ slideContent: content }),

  setTheme: (theme) => {
    localStorage.setItem("presai-theme", theme);
    applyTheme(theme);
    set({ theme });
  },
  
  reset: () => {
    const currentTheme = useSlideStore.getState().theme;
    set({ ...initialState, theme: currentTheme, voiceSessionId: VOICE_SESSION_ID, isPresentationReady: false });
  },
}));

if (typeof window !== "undefined") {
  applyTheme(getInitialTheme());
}

export default useSlideStore;