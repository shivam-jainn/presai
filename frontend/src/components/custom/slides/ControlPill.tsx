import { motion } from "motion/react";
import { Mic, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { useSlideStore } from "../../../lib/store";

export default function ControlPill() {
  const { 
    isFileUploaded, 
    isIngesting, 
    isListening,
    currentSlide,
    totalSlides,
    setListening,
    setCurrentSlide 
  } = useSlideStore();

  const isDisabled = isIngesting;
  const canNavigate = isFileUploaded && totalSlides > 0 && !isIngesting;
  const canGoPrevious = canNavigate && currentSlide > 0;
  const canGoNext = canNavigate && currentSlide < totalSlides - 1;
  
  // Voice AI should only be active when file is uploaded and not ingesting
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
    // Toggle listening state
    setListening(!isListening);
  };

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
                {showListening ? (isListening ? "SPEAKING..." : "READY") : "UPLOAD FILE"}
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
    </div>
  );
}
