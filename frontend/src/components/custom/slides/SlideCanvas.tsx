import { motion } from "motion/react";

export default function SlideCanvas() {
  return (
    <main className="min-h-screen pt-24 pb-40 px-6 flex flex-col items-center justify-center">
      <div className="mb-4 text-center">
        <span className="font-inter text-primary text-[10px] uppercase tracking-[0.2em] font-bold">
          Current Presentation
        </span>
      </div>

      <div className="relative w-full max-w-6xl aspect-[16/9] group">
        {/* Depth Layer */}
        <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative h-full w-full bg-surface-container-low rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex items-center justify-center border border-outline-variant/10">
          {/* Slide Content Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low via-transparent to-surface-container-low/40" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_#d3bbff_0%,_transparent_70%)]" />
          </div>

          <div className="relative z-10 text-center px-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="font-figtree font-black text-5xl md:text-7xl tracking-tighter text-on-surface mb-6 drop-shadow-2xl"
            >
              The Future of <span className="text-primary">AI Voice</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="font-inter text-on-surface-variant max-w-xl mx-auto text-lg leading-relaxed font-light"
            >
              Transforming digital experiences through sentient-grade synthetic neural processing and emotive resonance.
            </motion.p>
          </div>

          {/* Subtle Decorative Element */}
          <div className="absolute bottom-12 right-12 flex items-end gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <div className="w-8 h-[1px] bg-primary/30 mb-[3px]" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div className="px-4 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/10">
          <span className="font-inter text-on-surface-variant text-xs font-semibold tracking-widest">
            SLIDE 4 / 24
          </span>
        </div>
      </div>
    </main>
  );
}
