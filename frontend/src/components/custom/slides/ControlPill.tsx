import { motion } from "motion/react";
import { Mic, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

export default function ControlPill() {
  return (
    <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center items-center pb-8 px-4">
      <div className="glass rounded-full mx-auto max-w-2xl flex items-center justify-between px-2 py-2 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        
        {/* Previous Button */}
        <button className="flex flex-col items-center justify-center text-slate-400 p-4 hover:bg-surface-container-high hover:text-primary rounded-full transition-all group">
          <ChevronLeft className="w-6 h-6 group-active:scale-90 transition-transform" />
          <span className="font-inter font-semibold text-[10px] uppercase tracking-widest mt-1">Previous</span>
        </button>

        {/* Voice AI Widget */}
        <div className="flex items-center gap-6 px-8 py-2 mx-4 bg-surface-container-highest/50 rounded-full border border-primary/20 voice-glow">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center justify-center bg-primary text-background rounded-full p-4 shadow-[0_0_20px_rgba(211,187,255,0.4)] cursor-pointer"
          >
            <Mic className="w-6 h-6 fill-current" />
          </motion.div>

          {/* Animated Waveform */}
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
                className="w-[3px] bg-primary rounded-full"
              />
            ))}
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-primary font-figtree font-bold text-xs tracking-tight">AI CONDUCTOR</span>
            <span className="text-on-surface-variant text-[10px] font-medium">LISTENING...</span>
          </div>
        </div>

        {/* Next Button */}
        <button className="flex flex-col items-center justify-center text-slate-400 p-4 hover:bg-surface-container-high hover:text-primary rounded-full transition-all group">
          <ChevronRight className="w-6 h-6 group-active:scale-90 transition-transform" />
          <span className="font-inter font-semibold text-[10px] uppercase tracking-widest mt-1">Next</span>
        </button>

        {/* Library Button */}
        <button className="flex flex-col items-center justify-center text-slate-400 p-4 hover:bg-surface-container-high hover:text-primary rounded-full transition-all group">
          <LayoutGrid className="w-6 h-6 group-active:scale-90 transition-transform" />
          <span className="font-inter font-semibold text-[10px] uppercase tracking-widest mt-1">Library</span>
        </button>
      </div>
    </div>
  );
}
