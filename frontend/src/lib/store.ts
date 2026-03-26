import { create } from "zustand";

export type IngestionStatus = "idle" | "ingesting" | "success" | "failed";

interface SlideState {
  // File state
  isFileUploaded: boolean;
  fileName: string | null;
  pptUrl: string | null;
  uploadPickerRequest: number;
  
  // Ingestion state
  isIngesting: boolean;
  ingestionStatus: IngestionStatus;
  ingestionError: string | null;
  
  // Voice AI state
  isListening: boolean;
  
  // Slide navigation
  currentSlide: number;
  totalSlides: number;
  slideContent: Record<number, string[]>;
  
  // Actions
  setFileUploaded: (uploaded: boolean, fileName?: string) => void;
  setPptUrl: (url: string | null) => void;
  requestUploadPicker: () => void;
  setIngesting: (ingesting: boolean) => void;
  setIngestionStatus: (status: IngestionStatus, error?: string) => void;
  setListening: (listening: boolean) => void;
  setCurrentSlide: (slide: number) => void;
  setTotalSlides: (total: number) => void;
  setSlideContent: (content: Record<number, string[]>) => void;
  reset: () => void;
}

const initialState = {
  isFileUploaded: false,
  fileName: null,
  pptUrl: null,
  uploadPickerRequest: 0,
  isIngesting: false,
  ingestionStatus: "idle" as IngestionStatus,
  ingestionError: null,
  isListening: false,
  currentSlide: 0,
  totalSlides: 0,
  slideContent: {},
};

export const useSlideStore = create<SlideState>((set) => ({
  ...initialState,
  
  setFileUploaded: (uploaded, fileName) =>
    set({ isFileUploaded: uploaded, fileName: fileName || null }),
  
  setPptUrl: (url) =>
    set({ pptUrl: url }),

  requestUploadPicker: () =>
    set((state) => ({ uploadPickerRequest: state.uploadPickerRequest + 1 })),
  
  setIngesting: (ingesting) =>
    set({ isIngesting: ingesting }),
  
  setIngestionStatus: (status, error) =>
    set({ 
      ingestionStatus: status, 
      ingestionError: error || null,
      isIngesting: status === "ingesting",
    }),
  
  setListening: (listening) =>
    set({ isListening: listening }),
  
  setCurrentSlide: (slide) =>
    set({ currentSlide: slide }),
  
  setTotalSlides: (total) =>
    set({ totalSlides: total }),
  
  setSlideContent: (content) =>
    set({ slideContent: content }),
  
  reset: () => set(initialState),
}));

export default useSlideStore;