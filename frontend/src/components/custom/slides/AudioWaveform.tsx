import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface AudioWaveformProps {
  isActive: boolean;
}

export default function AudioWaveform({ isActive }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const smoothedDataRef = useRef<number[]>([]);
  const timeRef = useRef(0);
  const isUsingRealAudioRef = useRef(false);

  const WAVE_LINE_COUNT = 200;
  const WAVE_AMPLITUDE = 60;
  const CANVAS_HEIGHT = 150;

  // Initialize smoothed data array
  useEffect(() => {
    smoothedDataRef.current = new Array(WAVE_LINE_COUNT).fill(0);
  }, []);

  // Initialize audio analysis
  const initAudioAnalysis = useCallback(async () => {
    try {
      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount * 0.5) as Uint8Array;
      isUsingRealAudioRef.current = true;
    } catch {
      // Fallback to simulated waveform if mic access fails
      isUsingRealAudioRef.current = false;
    }
  }, []);

  // Cleanup audio resources
  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    analyserRef.current = null;
    frequencyDataRef.current = null;
    isUsingRealAudioRef.current = false;
  }, []);

  // Get wave height from frequency data or simulated wave
  const getWaveHeight = useCallback((pointIndex: number, totalPoints: number): number => {
    if (isUsingRealAudioRef.current && frequencyDataRef.current && analyserRef.current) {
      // Map point index to frequency bin (focus on lower frequencies)
      const binIndex = Math.floor((pointIndex / totalPoints) * (frequencyDataRef.current.length * 0.8));
      const value = frequencyDataRef.current[binIndex] || 0;
      return ((value / 255) * WAVE_AMPLITUDE);
    } else {
      // Simulated wave using multiple sine waves
      const t = timeRef.current;
      const x = pointIndex / totalPoints;
      
      // Combine multiple sine waves for organic motion
      const wave1 = Math.sin(t * 2 + x * Math.PI * 4) * 0.5;
      const wave2 = Math.sin(t * 3.5 + x * Math.PI * 6) * 0.3;
      const wave3 = Math.sin(t * 1.5 + x * Math.PI * 2) * 0.2;
      
      // Add some randomness
      const noise = Math.sin(t * 10 + pointIndex * 0.5) * 0.1;
      
      const combined = (wave1 + wave2 + wave3 + noise);
      return combined * WAVE_AMPLITUDE;
    }
  }, []);

  // Draw the waveform
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Update frequency data if using real audio
    if (isUsingRealAudioRef.current && analyserRef.current && frequencyDataRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      analyserRef.current.getByteFrequencyData(frequencyDataRef.current as any);
    } else {
      // Update time for simulated wave
      timeRef.current += 0.02;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get primary purple color
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary").trim() || "oklch(0.496 0.265 301.924)";

    const totalPoints = WAVE_LINE_COUNT;
    const centerY = canvas.height / 2;
    const waveWidth = canvas.width;
    const stepX = waveWidth / totalPoints;

    // Create gradient for the filled wave
    const gradient = ctx.createLinearGradient(0, centerY - WAVE_AMPLITUDE, 0, centerY + WAVE_AMPLITUDE);
    gradient.addColorStop(0, `color-mix(in oklch, ${primaryColor} 30%, transparent)`);
    gradient.addColorStop(0.5, `color-mix(in oklch, ${primaryColor} 70%, transparent)`);
    gradient.addColorStop(1, `color-mix(in oklch, ${primaryColor} 40%, transparent)`);

    // Draw the top half of the wave
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i <= totalPoints; i++) {
      const targetHeight = getWaveHeight(i, totalPoints);
      
      // Smooth interpolation (lerp)
      smoothedDataRef.current[i] += (targetHeight - smoothedDataRef.current[i]) * 0.15;
      const height = smoothedDataRef.current[i];

      const x = i * stepX;
      const y = centerY - height;
      
      // Use smooth curve through points
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * stepX;
        const prevY = centerY - smoothedDataRef.current[i - 1];
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
      }
    }

    // Complete the path by going back along the center line
    ctx.lineTo(waveWidth, centerY);
    ctx.closePath();

    // Fill the wave with gradient
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw the wave outline for more definition
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i <= totalPoints; i++) {
      const x = i * stepX;
      const y = centerY - smoothedDataRef.current[i];
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * stepX;
        const prevY = centerY - smoothedDataRef.current[i - 1];
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
      }
    }
    
    ctx.stroke();

    // Draw reflection (mirror wave below)
    const reflectionGradient = ctx.createLinearGradient(0, centerY, 0, centerY + WAVE_AMPLITUDE);
    reflectionGradient.addColorStop(0, `color-mix(in oklch, ${primaryColor} 40%, transparent)`);
    reflectionGradient.addColorStop(1, "transparent");
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let i = 0; i <= totalPoints; i++) {
      const x = i * stepX;
      const y = centerY + smoothedDataRef.current[i] * 0.5; // Reflection is smaller
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * stepX;
        const prevY = centerY + smoothedDataRef.current[i - 1] * 0.5;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
      }
    }
    
    ctx.lineTo(waveWidth, centerY);
    ctx.closePath();
    ctx.fillStyle = reflectionGradient;
    ctx.fill();

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [getWaveHeight]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = CANVAS_HEIGHT;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Start/stop animation based on isActive
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!isActive) return;
      await initAudioAnalysis();
      if (cancelled) return;
      draw();
    };

    if (isActive) {
      void start();
    } else {
      cleanupAudio();
      smoothedDataRef.current = new Array(WAVE_LINE_COUNT).fill(0);
      timeRef.current = 0;
    }

    return () => {
      cancelled = true;
      cleanupAudio();
    };
  }, [isActive, initAudioAnalysis, draw, cleanupAudio]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed bottom-0 left-0 w-full z-30 pointer-events-none"
          style={{ height: CANVAS_HEIGHT }}
        >
          {/* Glow effect container */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 0 -30px 60px -20px hsl(var(--primary) / 0.3)",
            }}
          />
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
              maskImage: "linear-gradient(to top, black 60%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to top, black 60%, transparent 100%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
