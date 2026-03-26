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
  Code 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-8 py-4 max-w-screen-2xl left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-2xl z-50">
        <div className="font-figtree text-2xl font-black tracking-tighter text-foreground">presai</div>
        <div className="hidden md:flex items-center gap-8">
          <a className="font-headline font-bold text-sm tracking-wide text-primary border-b-2 border-primary/50 pb-1" href="#demo">Demo</a>
          <a className="font-headline font-medium text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors" href="https://github.com/shivam-jainn/presai" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <Button onClick={signIn} className="font-bold px-6 py-2 rounded-lg hover:scale-95 transition-all duration-200">
          Get Started
        </Button>
      </nav>

      <main className="pt-24">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-primary font-bold">The Invisible Conductor</span>
              <h1 className="font-figtree text-6xl md:text-8xl font-black tracking-tighter leading-tight text-foreground">
                Talk to your slides.
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed font-light">
              Upload a deck. Ask anything. Jump anywhere. <br/>
              <span className="text-foreground">No clicking. No guessing.</span>
            </p>

          </motion.div>

          {/* Mock UI Slide Viewer */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative bg-surface-container rounded-[2rem] overflow-hidden aspect-[4/3] border border-border shadow-2xl">
              <img 
                alt="Slide Preview" 
                className="w-full h-full object-cover grayscale-[0.2] opacity-80" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiRbW1LwYQuxLuwOgyu8S387_EGOhaDRzGWdfd4xRpe0ZkjR_IwFuzCT1-XHdZwRDwZhkZS46n_zak5L6YBNKqOOq4AtZFY6diaVzjCJprU4Fcw9UY1kzIzFtapbnOJbFWAW42fZnXuuBXdqgJgxlDF9GK3Un_zudtYKeR0S8toniCjiPq2MRwxA7Gizi0wge9mJ-_N0PhqTB4AKPFSeEmbHClfp3-CsUdw4wpBpmHjIAhZm8VO44neMwEyQVQ9j_yLrt3wKi4IQ4S"
                referrerPolicy="no-referrer"
              />
              {/* Dynamic Island Recorder Widget */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[80%] max-w-md">
                <div className="glass-island px-6 py-4 rounded-full flex items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div className="voice-wave">
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div 
                          key={i} 
                          className="wave-bar wave-bar-anim" 
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-primary font-medium text-sm pr-2">Listening...</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* PUNCHLINE SECTION */}
        <section className="py-32 bg-muted/30 dark:bg-muted/10">
          <div className="max-w-4xl mx-auto px-8 text-center space-y-6">
            <div className="font-figtree space-y-2">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 0.4, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-extrabold text-foreground"
              >
                Slides shouldn’t be static.
              </motion.h2>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 0.6, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-extrabold text-foreground"
              >
                Search shouldn’t be manual.
              </motion.h2>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-6xl font-extrabold text-foreground"
              >
                Navigation shouldn’t be dumb.
              </motion.h2>
            </div>
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="pt-12 flex flex-col items-center gap-6"
            >
              <div className="h-[1px] w-24 bg-primary/30"></div>
              <p className="text-2xl font-headline italic font-light text-primary">So we fixed it.</p>
            </motion.div>
          </div>
        </section>

        {/* DEMO SECTION */}
        <section id="demo" className="py-24 max-w-7xl mx-auto px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="font-sans text-primary tracking-[0.3em] uppercase text-xs font-bold">Live Experience</span>
            <h3 className="font-figtree text-4xl font-bold text-foreground">The Canvas</h3>
          </div>
          <div className="relative bg-card rounded-[2.5rem] p-4 md:p-8 border border-border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Upload Sidebar */}
              <div className="md:col-span-1 bg-muted/50 dark:bg-muted/20 rounded-2xl p-6 flex flex-col items-center justify-center border border-dashed border-muted-foreground/30 group hover:border-primary/50 transition-colors cursor-pointer">
                <CloudUpload className="w-10 h-10 text-primary mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Drop PDF or PPTX</p>
              </div>
              {/* Main Preview Area */}
              <div className="md:col-span-3 aspect-video bg-background dark:bg-background/50 rounded-2xl overflow-hidden relative group border border-border">
                <img 
                  alt="Demo Content" 
                  className="w-full h-full object-cover opacity-60" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiid3V6qhjEO8SoNJHeF18V9uBowAKPNWdkJXCWfvc373Mn3N3dk7bRJ9f39Is_Ux6Dz3V-7C2yf_0kl3UfaOusTfzkff5uBoYn-_I9L-Au7ymvhTnvRi0kjdPzcd4dN93CnHl84v3ycXdHAFiTUacs2PwiL-w2wHVvIFuA1O66zGV9py43t5fzF3r3slHGsSfuzUlg7OisecWjT8opQE4DnVXjnRhPl22BPJ-FKeReJbT87kGfanTZMAbQiXYSQYuhGyEMmTMZNLK"
                  referrerPolicy="no-referrer"
                />
                {/* The Signature Voice Orb */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary-foreground blur-2xl opacity-40 animate-pulse"></div>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary-foreground relative flex items-center justify-center shadow-[0_0_50px_rgba(211,187,255,0.3)]">
                    <Circle className="w-10 h-10 text-primary-foreground fill-primary-foreground" />
                  </div>
                </div>
                {/* Focused Dynamic Island */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                  <div className="glass-island px-8 py-3 rounded-full flex items-center gap-6 shadow-2xl scale-110">
                    <AudioLines className="w-5 h-5 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-primary uppercase tracking-widest font-bold">Interrupt Mode</span>
                      <span className="text-sm text-foreground font-medium">"Jump to the revenue slide"</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-muted-foreground font-headline text-lg italic">"Go ahead. Interrupt it."</p>
            </div>
          </div>
        </section>

        {/* Bento Features */}
        <section className="max-w-7xl mx-auto px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-2 bg-card rounded-[2rem] p-10 flex flex-col justify-between transition-transform duration-300 border border-border shadow-sm"
            >
              <div>
                <h4 className="font-figtree text-3xl font-bold mb-4">Semantic Navigation</h4>
                <p className="text-muted-foreground leading-relaxed mb-8">Stop scrolling through 100 slides. Just ask "What was the result of the Q3 audit?" and Presai will take you there instantly.</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs font-bold uppercase tracking-tighter border-none">Instant</Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs font-bold uppercase tracking-tighter border-none">Accurate</Badge>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-primary rounded-[2rem] p-10 flex flex-col justify-between text-primary-foreground transition-transform duration-300 shadow-sm"
            >
              <Sparkles className="w-12 h-12" />
              <div>
                <h4 className="font-figtree text-3xl font-bold mb-2">AI Native</h4>
                <p className="text-primary-foreground/80">Built on the latest LLMs to understand context, not just keywords.</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-8 max-w-7xl mx-auto mt-20 bg-muted/30 dark:bg-muted/10 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="font-figtree text-xl font-bold text-foreground">presai</div>
            <p className="font-headline text-sm text-muted-foreground max-w-xs">
              Built fast. Works faster. © 2024 presai.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-4">
            <div className="flex gap-8">
              <a className="text-muted-foreground hover:text-primary font-headline text-sm transition-colors" href="#demo">Demo</a>
              <a className="text-muted-foreground hover:text-primary font-headline text-sm transition-colors" href="https://github.com/shivam-jainn/presai" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
            <div className="pt-8 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <Code className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
