/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { 
  Mic, 
  ArrowRight, 
  Upload, 
  CloudUpload, 
  Circle, 
  AudioLines, 
  Sparkles, 
  Terminal, 
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-6 md:px-12 py-4 max-w-[100vw] bg-background/60 backdrop-blur-2xl border-b border-border/40 z-50">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <AudioLines className="w-4 h-4 text-primary" />
          </div>
          <div className="font-figtree text-2xl font-black tracking-tighter text-foreground">presai</div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 bg-muted/40 px-6 py-2 rounded-full border border-border/50">
          <a className="font-headline font-semibold text-sm tracking-wide text-foreground hover:text-primary transition-colors" href="#demo">Demo</a>
          <a className="font-headline font-medium text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors" href="#features">Features</a>
          <a className="font-headline font-medium text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors" href="#pricing">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <a className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors" href="https://github.com/shivam-jainn/presai" target="_blank" rel="noopener noreferrer">
          </a>
          <Button onClick={signIn} className="font-bold px-6 py-2 rounded-full hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/20">
            Get Started
          </Button>
        </div>
      </nav>

      <main className="pt-32 overflow-hidden">
        {/* HERO SECTION */}
        <section className="max-w-[90rem] mx-auto px-6 md:px-12 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-10 z-10"
          >
            <div className="space-y-6">
              <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/30 bg-primary/5 text-primary gap-2 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Meet The Invisible Conductor
              </Badge>
              <h1 className="font-figtree text-6xl md:text-8xl lg:text-[6.5rem] font-black tracking-tighter leading-[0.9] text-foreground">
                Talk to <br/> your slides.
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-lg leading-relaxed font-light">
              Upload a deck. Ask anything. Jump anywhere. <br/>
              <span className="text-foreground font-medium">No clicking. No guessing.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button onClick={signIn} size="lg" className="rounded-full h-14 px-8 text-lg font-bold group">
                Start Presenting
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-bold bg-background">
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-6 pt-8 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2"><CloudUpload className="w-4 h-4"/> Instant Upload</div>
              <div className="flex items-center gap-2"><AudioLines className="w-4 h-4"/> Voice Controlled</div>
            </div>
          </motion.div>

          {/* Mock UI Slide Viewer */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="relative group perspective-[2000px] z-0"
          >
            {/* Glow effects */}
            <div className="absolute -inset-10 bg-gradient-to-tr from-primary/30 via-primary/5 to-transparent blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 rounded-full"></div>
            
            <div className="relative bg-surface-container rounded-[2.5rem] overflow-hidden aspect-[16/11] border border-border/50 shadow-2xl shadow-primary/10 transform-gpu transition-transform duration-700 group-hover:scale-[1.02]">
              {/* Top Window Bar Mock */}
              <div className="absolute top-0 w-full h-12 bg-background/50 backdrop-blur-md border-b border-border/50 flex items-center px-6 gap-2 z-10">
                <Circle className="w-3 h-3 fill-destructive text-destructive" />
                <Circle className="w-3 h-3 fill-amber-500 text-amber-500" />
                <Circle className="w-3 h-3 fill-green-500 text-green-500" />
              </div>

              <img 
                alt="Slide Preview" 
                className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:scale-105" 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2574&auto=format&fit=crop"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>

              {/* Dynamic Island Recorder Widget */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[85%] max-w-sm">
                <div className="glass-island bg-background/70 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-full flex items-center justify-between gap-4 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-inner">
                      <Mic className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="voice-wave flex items-end gap-1 h-8">
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div 
                          key={i} 
                          className="w-1.5 bg-primary rounded-full animate-bounce" 
                          style={{ height: `${Math.max(20, Math.random() * 100)}%`, animationDelay: `${i * 0.1}s`, animationDuration: '0.8s' }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-foreground font-semibold text-sm pr-2">"Skip to Q3 Revenue"</span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -top-6 -right-6 bg-background border border-border p-4 rounded-2xl shadow-xl">
               <Upload className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.div>
        </section>

        {/* PUNCHLINE SECTION */}
        <section className="py-40 relative">
          <div className="absolute inset-0 bg-primary/5 skew-y-3 origin-top-left -z-10"></div>
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <div className="font-figtree space-y-4">
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 0.3, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl md:text-7xl font-black text-foreground"
              >
                Slides shouldn’t be static.
              </motion.h2>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 0.6, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl font-black text-foreground"
              >
                Search shouldn’t be manual.
              </motion.h2>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-5xl md:text-7xl font-black text-primary drop-shadow-sm"
              >
                Navigation shouldn’t be dumb.
              </motion.h2>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="pt-16 flex flex-col items-center gap-6"
            >
              <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
              <p className="text-3xl font-headline italic font-light text-foreground">So we built <span className="font-bold font-figtree not-italic">presai</span>.</p>
            </motion.div>
          </div>
        </section>
      </main>
{/* THE MEGA FOOTER */}
      <footer className="relative bg-[#09090b] text-zinc-50 pt-40 pb-12 overflow-hidden rounded-t-[3rem] mt-20 border-t border-zinc-800/60 shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.5)]">
        
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[150px] rounded-[100%] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-[90rem] mx-auto px-6 md:px-12 relative z-10">
          
          {/* Top CTA */}
          <div className="flex flex-col items-center text-center space-y-10 mb-20">
            
            {/* Social Proof Pill */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md shadow-xl">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 overflow-hidden"><img src="https://i.pravatar.cc/100?img=1" alt="user" className="w-full h-full object-cover grayscale opacity-70" /></div>
                <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 overflow-hidden"><img src="https://i.pravatar.cc/100?img=2" alt="user" className="w-full h-full object-cover grayscale opacity-70" /></div>
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground border-2 border-zinc-900 shadow-inner">+2k</div>
              </div>
              <span className="text-sm font-medium text-zinc-300 pr-2">Presenters already joined</span>
            </div>

            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black font-figtree tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40">
              Give your slides <br/> a voice.
            </h2>
            
            <p className="text-zinc-400 text-xl md:text-2xl max-w-2xl font-light">
              Stop clicking. Start talking. Experience the future of presentations today.
            </p>
            
            <Button onClick={signIn} size="lg" className="relative rounded-full h-16 px-10 text-lg font-bold group bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] overflow-hidden transition-all hover:scale-105">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative flex items-center">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>

          {/* Giant Watermark & Floating Bottom Bar */}
          <div className="relative w-full flex flex-col items-center mt-32">
            
            {/* Fading Watermark */}
            <h1 className="text-[22vw] leading-[0.75] font-black tracking-tighter select-none font-figtree bg-clip-text text-transparent bg-gradient-to-b from-zinc-800/60 via-zinc-900/80 to-[#09090b]">
              presai.
            </h1>
            
            {/* Floating Glass Bar over the watermark */}
            <div className="absolute bottom-4 md:bottom-8 w-full max-w-4xl px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-500 text-sm font-medium z-20">
              
              <div className="flex items-center gap-2 bg-[#09090b]/50 py-1 px-3 rounded-full backdrop-blur-sm">
                <AudioLines className="w-4 h-4 text-primary" />
                <span>© {new Date().getFullYear()} presai Inc.</span>
              </div>
              
              <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-zinc-900/60 border border-zinc-800/50 backdrop-blur-xl shadow-2xl">
                <a href="https://github.com/shivam-jainn/presai" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                  GitHub
                </a>
                <div className="w-px h-4 bg-zinc-800"></div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  All systems go
                </div>
              </div>
              
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}