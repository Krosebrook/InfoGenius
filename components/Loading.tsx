
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { Loader2, BrainCircuit, BookOpen, Atom, Globe, Film, Video, Zap, Activity, Sparkles, Cpu, Scan } from 'lucide-react';

interface LoadingProps {
  status: string;
  step: number;
  facts?: string[];
}

const Loading: React.FC<LoadingProps> = ({ status, step, facts = [] }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (facts.length > 0) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % facts.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [facts]);

  const videoMessages = [
    "Synthesizing motion frames...",
    "Rendering knowledge in 4D...",
    "Harmonizing visual context with Veo AI...",
    "Structuring cinematic flow...",
    "Refining high-fidelity textures...",
  ];
  const [videoMessageIndex, setVideoMessageIndex] = useState(0);

  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setVideoMessageIndex(prev => (prev + 1) % videoMessages.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Advanced Particle Neural-Net effect with Data Packets and Perspective Grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
    }

    interface Signal {
      p1: Particle;
      p2: Particle;
      progress: number;
      speed: number;
    }

    let particles: Particle[] = [];
    let signals: Signal[] = [];
    let gridOffset = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.floor((canvas.width * canvas.height) / 18000) + 25;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
        color: step === 3 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(6, 182, 212, 0.5)'
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    let animationFrame: number;
    
    const drawGrid = () => {
        // Simple perspective grid floor
        ctx.strokeStyle = step === 3 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(6, 182, 212, 0.1)';
        ctx.lineWidth = 1;
        const horizonY = canvas.height * 0.8;
        
        // Vertical perspective lines
        for (let i = 0; i < canvas.width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, canvas.height);
            ctx.lineTo(canvas.width / 2 + (i - canvas.width/2) * 0.2, horizonY * 0.5);
            ctx.stroke();
        }

        // Horizontal moving lines
        gridOffset = (gridOffset + 0.5) % 40;
        for (let i = 0; i < canvas.height; i += 40) {
             const y = i + gridOffset;
             if (y > canvas.height) continue;
             ctx.beginPath();
             ctx.moveTo(0, y);
             ctx.lineTo(canvas.width, y);
             ctx.stroke();
        }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawGrid();
      
      const connectionDist = 130;
      
      // Update and draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = step === 3 ? `rgba(245, 158, 11, ${alpha})` : `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Randomly spawn a signal packet if connected
            if (Math.random() < 0.002) {
              signals.push({
                p1: p,
                p2: p2,
                progress: 0,
                speed: 0.02 + Math.random() * 0.03
              });
            }
          }
        }
      });

      // Update and draw signals (data packets)
      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        s.progress += s.speed;
        
        if (s.progress >= 1) {
          signals.splice(i, 1);
          continue;
        }

        const currX = s.p1.x + (s.p2.x - s.p1.x) * s.progress;
        const currY = s.p1.y + (s.p2.y - s.p1.y) * s.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 2, 0, Math.PI * 2);
        ctx.fillStyle = step === 3 ? '#fbbf24' : '#22d3ee'; // Amber or Cyan bright
        ctx.shadowBlur = 6;
        ctx.shadowColor = step === 3 ? '#fbbf24' : '#22d3ee';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [step]);

  // Flying Item Animation Component
  const FlyingItem = ({ delay, position, type, content }: { delay: number, position: number, type: 'icon' | 'text', content: any }) => {
    // spiral pattern
    const angle = (position / 8) * Math.PI * 2; 
    const radiusX = 50; // Percentage
    
    return (
      <div 
        className={`absolute flex items-center justify-center font-bold opacity-0 select-none ${type === 'text' ? 'text-cyan-600 dark:text-cyan-400 text-[10px] md:text-xs tracking-[0.2em] bg-white/90 dark:bg-slate-900/90 border border-cyan-500/30 px-3 py-1 rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur-md' : 'text-amber-500 dark:text-amber-400'}`}
        style={{ 
          animation: `orbit-in 4s infinite ease-in-out ${delay}s`,
          left: '50%',
          top: '50%',
          zIndex: 10 
        }}
      >
        {type === 'icon' ? React.createElement(content, { className: "w-5 h-5 md:w-6 md:h-6" }) : content}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-5xl mx-auto mt-12 min-h-[450px] md:min-h-[600px] overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] backdrop-blur-2xl group">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-80" />
      
      <style>{`
        @keyframes orbit-in {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(150px) rotate(0deg) scale(0.5); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(180deg) translateX(50px) rotate(-180deg) scale(0); opacity: 0; }
        }
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          100% { transform: rotate(-360deg); }
        }
        @keyframes shimmer-bar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(255,255,255,0.8)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.8)_100%)] pointer-events-none z-10"></div>

      {/* Central "Reactor" */}
      <div className="relative z-20 mb-16 scale-[0.8] md:scale-100 animate-[float_4s_ease-in-out_infinite]">
        
        {/* Outer Rotating Ring (Dashed) */}
        <div className={`absolute inset-[-40px] border-[1px] rounded-full opacity-30 animate-[spin-slow_20s_linear_infinite] ${step === 3 ? 'border-amber-500 border-dashed' : 'border-cyan-500 border-dashed'}`}></div>
        
        {/* Inner Counter-Rotating Ring (Partial) */}
        <div className={`absolute inset-[-20px] border-2 rounded-full border-t-transparent border-b-transparent opacity-50 animate-[spin-reverse-slow_10s_linear_infinite] ${step === 3 ? 'border-amber-500' : 'border-cyan-500'}`}></div>

        {/* Glow Core */}
        <div className={`absolute inset-0 rounded-full blur-[60px] opacity-40 animate-pulse ${step === 3 ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>

        {/* Main Icon Container */}
        <div className="relative bg-white/10 dark:bg-white/5 p-2 rounded-full backdrop-blur-sm border border-white/20">
           <div className={`bg-white dark:bg-slate-900 p-8 rounded-full flex items-center justify-center w-32 h-32 border-2 shadow-[0_0_30px_rgba(0,0,0,0.1)] transition-all duration-500 ${step === 3 ? 'border-amber-500/50 shadow-amber-500/20' : 'border-cyan-500/50 shadow-cyan-500/20'}`}>
              {step === 3 ? (
                <Film className="w-14 h-14 text-amber-500 animate-pulse" />
              ) : (
                <div className="relative">
                   <BrainCircuit className="w-14 h-14 text-cyan-500 relative z-10" />
                   <Scan className="w-14 h-14 text-cyan-500/30 absolute inset-0 animate-ping" />
                </div>
              )}
           </div>
        </div>
        
        {/* Orbiting Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
           <FlyingItem content={BookOpen} type="icon" delay={0} position={1} />
           <FlyingItem content="NEURAL MAPPING" type="text" delay={0.5} position={2} />
           <FlyingItem content={step === 3 ? Video : Zap} type="icon" delay={1.0} position={3} />
           <FlyingItem content={step === 3 ? "VEO ENGINE" : "DATA STREAM"} type="text" delay={1.5} position={4} />
           <FlyingItem content={Activity} type="icon" delay={2.0} position={5} />
           <FlyingItem content="VERIFYING" type="text" delay={2.5} position={6} />
           <FlyingItem content={Sparkles} type="icon" delay={3.0} position={7} />
           <FlyingItem content="GENERATING" type="text" delay={3.5} position={8} />
        </div>
      </div>

      {/* Info Card */}
      <div className="relative z-30 w-full max-w-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.5rem] p-8 md:p-10 shadow-2xl border border-slate-200 dark:border-white/10 text-center flex flex-col items-center mx-4">
        
        {/* Status Header */}
        <div className="flex items-center gap-3 mb-8 bg-slate-100 dark:bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
            <div className={`w-2 h-2 rounded-full animate-ping ${step === 3 ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
            <div className={`w-2 h-2 rounded-full absolute ${step === 3 ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.2em] uppercase">
                {step === 3 ? videoMessages[videoMessageIndex] : status}
            </h3>
        </div>
        
        {/* Main Fact Area */}
        <div className="flex-1 flex items-center justify-center min-h-[90px] px-2 w-full">
            {step === 3 ? (
                <div className="flex flex-col items-center gap-3">
                    <Cpu className="w-8 h-8 text-amber-500/50 animate-pulse" />
                    <div className="text-slate-500 dark:text-slate-400 text-sm italic font-medium max-w-sm leading-relaxed">
                      "Motion synthesis requires deep context awareness. Veo is rendering frame-by-frame coherence..."
                    </div>
                </div>
            ) : facts.length > 0 ? (
                <div key={currentFactIndex} className="animate-in slide-in-from-bottom-4 fade-in zoom-in duration-500 w-full">
                    <p className="text-xl md:text-2xl text-slate-800 dark:text-slate-100 font-serif-display leading-tight italic">
                      "{facts[currentFactIndex]}"
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4 text-slate-400 italic text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                    <span>Establishing neural uplink with Google...</span>
                  </div>
                </div>
            )}
        </div>
        
        {/* Animated Progress Bar */}
        <div className="w-full mt-10">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                <span>Processing</span>
                <span>{step === 3 ? 'Target: 100%' : `${Math.min(step * 33 + 10, 95)}%`}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-1000 ease-out relative overflow-hidden ${step === 3 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                  style={{ width: step === 3 ? '60%' : `${step * 33 + 10}%` }}
                >
                    {/* Shimmer Effect */}
                    <div 
                        className="absolute inset-0 w-full h-full animate-[shimmer-bar_2s_linear_infinite]"
                        style={{
                            backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,0.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0.15) 75%,transparent 75%,transparent)',
                            backgroundSize: '20px 20px'
                        }}
                    ></div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Loading;
