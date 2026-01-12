
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { Loader2, BrainCircuit, BookOpen, Atom, Globe, Film, Video, Zap, Activity, Sparkles } from 'lucide-react';

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

  // Enhanced Particle Neural-Net effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{x: number, y: number, vx: number, vy: number, r: number, color: string}> = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.floor((canvas.width * canvas.height) / 15000) + 20;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2 + 0.5,
        color: step === 3 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.4)'
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    let animationFrame: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const connectionDist = 120;
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        
        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = step === 3 ? `rgba(245, 158, 11, ${alpha})` : `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      animationFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [step]);

  const FlyingItem = ({ delay, position, type, content }: { delay: number, position: number, type: 'icon' | 'text', content: any }) => {
    const startLeft = position % 2 === 0 ? '-20%' : '120%';
    const startTop = `${(position * 12) % 100}%`;
    return (
      <div className={`absolute flex items-center justify-center font-bold opacity-0 select-none ${type === 'text' ? 'text-cyan-600 dark:text-cyan-400 text-[10px] md:text-xs tracking-[0.2em] bg-white/80 dark:bg-slate-900/80 border border-cyan-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur-md' : 'text-amber-500 dark:text-amber-400'}`}
        style={{ animation: `implode 3s infinite ease-in ${delay}s`, top: startTop, left: startLeft, zIndex: 10 }}>
        {type === 'icon' ? React.createElement(content, { className: "w-5 h-5 md:w-6 md:h-6" }) : content}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-5xl mx-auto mt-12 min-h-[400px] md:min-h-[550px] overflow-hidden rounded-[2.5rem] bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-xl group">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-60" />
      
      <style>{`
        @keyframes implode {
          0% { transform: translate(0, 0) scale(1.5) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate(calc(50vw - 50%), calc(40vh - 50%)) scale(0) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse-core-enhanced {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4), 0 0 0 0 rgba(6, 182, 212, 0.1); transform: scale(1); }
          50% { box-shadow: 0 0 0 20px rgba(6, 182, 212, 0), 0 0 0 40px rgba(6, 182, 212, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0), 0 0 0 0 rgba(6, 182, 212, 0); transform: scale(1); }
        }
        @keyframes fast-scan {
          0% { top: -10%; opacity: 0; }
          50% { opacity: 0.5; }
          100% { top: 110%; opacity: 0; }
        }
      `}</style>

      {/* Cyber Scan Line */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-[fast-scan_4s_linear_infinite]"></div>
      </div>

      <div className="relative z-20 mb-12 scale-[0.7] md:scale-125">
        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-[120px] opacity-25 z-0"></div>
        <div className="relative bg-white/40 dark:bg-white/5 p-2 rounded-full animate-[pulse-core-enhanced_3s_infinite]">
           <div className={`bg-white dark:bg-slate-950 p-6 rounded-full flex items-center justify-center w-28 h-28 border border-white/20 shadow-inner transition-colors duration-500 ${step === 3 ? 'border-amber-500/50' : 'border-cyan-500/50'}`}>
              {step === 3 ? (
                <Film className="w-12 h-12 text-amber-500 animate-pulse" />
              ) : (
                <BrainCircuit className="w-12 h-12 text-cyan-500 animate-pulse" />
              )}
           </div>
        </div>
        
        {/* Swirling Bits */}
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
           <FlyingItem content={BookOpen} type="icon" delay={0} position={1} />
           <FlyingItem content="NEURAL MAPPING" type="text" delay={0.3} position={2} />
           <FlyingItem content={step === 3 ? Video : Zap} type="icon" delay={0.6} position={3} />
           <FlyingItem content={step === 3 ? "VEV RENDERING" : "DATA STREAM"} type="text" delay={0.9} position={4} />
           <FlyingItem content={Activity} type="icon" delay={1.2} position={5} />
           <FlyingItem content="CROSS-REFERENCING" type="text" delay={1.5} position={6} />
           <FlyingItem content={Sparkles} type="icon" delay={1.8} position={7} />
           <FlyingItem content="VISUAL GENIUS" type="text" delay={2.1} position={8} />
        </div>
      </div>

      <div className="relative z-30 w-full max-w-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 shadow-2xl border border-slate-200 dark:border-white/10 text-center flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-1.5 rounded-lg transition-colors ${step === 3 ? 'bg-amber-100 text-amber-600' : 'bg-cyan-100 text-cyan-600'}`}>
              {step === 1 && <Globe className="w-4 h-4 animate-spin" />}
              {step === 2 && <Atom className="w-4 h-4 animate-spin" />}
              {step === 3 && <Film className="w-4 h-4 animate-bounce" />}
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.3em] uppercase">
                {step === 3 ? videoMessages[videoMessageIndex] : status}
            </h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center min-h-[80px] px-6">
            {step === 3 ? (
                <div className="text-slate-500 text-sm italic font-medium max-w-sm">
                  Cinematic summary in progress. We're using Veo AI to create a documentary-style sequence. This may take up to 2 minutes...
                </div>
            ) : facts.length > 0 ? (
                <div key={currentFactIndex} className="animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <p className="text-lg md:text-xl text-slate-800 dark:text-slate-100 font-serif-display leading-relaxed italic">
                      "{facts[currentFactIndex]}"
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4 text-slate-400 italic text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synchronizing with Google Knowledge Graph...</span>
                  </div>
                </div>
            )}
        </div>
        
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800/50 mt-10 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(6,182,212,0.5)] ${step === 3 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'}`}
              style={{ width: step === 3 ? '55%' : `${step * 33 + 10}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
