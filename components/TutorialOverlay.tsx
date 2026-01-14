
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, Search, GraduationCap, Mic, Film, ArrowDown } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const steps = [
    {
      title: "Vision of Knowledge",
      content: "Welcome to InfoGenius. I'm here to help you transform complex topics into breathtaking, AI-verified visuals and cinematic summaries.",
      icon: Sparkles,
      highlightId: null
    },
    {
      title: "Neural Search",
      content: "Type any complex topic. We use Google Search and Maps to ground our AI in real-world facts before we ever start drawing.",
      icon: Search,
      highlightId: "step-search"
    },
    {
      title: "Voice Intelligence",
      content: "Speak naturally. Click the mic to say something like 'Life cycle of a star for college students'. We'll understand your intent instantly.",
      icon: Mic,
      highlightId: "step-mic"
    },
    {
      title: "Customized Complexity",
      content: "Select your audience and aesthetic. From 'Elementary Lithographs' to 'Expert Blueprints', we adapt the content depth for you.",
      icon: GraduationCap,
      highlightId: "step-config"
    },
    {
      title: "Cinematic Narratives",
      content: "Once generated, you can verify facts, generate audio narrations, or use Veo AI to create a cinematic explainer video.",
      icon: Film,
      highlightId: "step-library"
    }
  ];

  useEffect(() => {
    const updateSpotlight = () => {
      const id = steps[step].highlightId;
      if (id) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Check if element is visible
          if (rect.width > 0 && rect.height > 0) {
              setSpotlightRect(rect);
              // Scroll element into view
              el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          } else {
              setSpotlightRect(null);
          }
        } else {
          setSpotlightRect(null);
        }
      } else {
        setSpotlightRect(null);
      }
    };

    // Small timeout to allow for transitions or rendering
    const timer = setTimeout(updateSpotlight, 100);
    
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true); // Capture phase to detect all scrolling

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [step]);

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[400] overflow-hidden animate-in fade-in duration-500 text-slate-900 dark:text-white">
      {/* Dynamic Background with Spotlight */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[4px] pointer-events-none transition-colors duration-500">
        {spotlightRect && (
          <div 
            className="absolute bg-transparent ring-[2000px] ring-slate-950/80 rounded-2xl transition-all duration-500 ease-out border-2 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.5)]"
            style={{
              top: spotlightRect.top - 8,
              left: spotlightRect.left - 8,
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
            }}
          />
        )}
      </div>

      <div className="relative h-full flex items-center justify-center p-6 pointer-events-none">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col relative">
          
          <button onClick={onComplete} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors z-10" title="Close Tutorial">
            <X className="w-6 h-6" />
          </button>

           <div className="absolute top-6 left-6 z-10">
              <span className="text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                  Step {step + 1} / {steps.length}
              </span>
           </div>

          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white mb-8 shadow-2xl shadow-cyan-500/20 animate-in zoom-in duration-500 key={step}">
              <currentStep.icon className="w-10 h-10" />
            </div>

            <h3 className="text-3xl font-bold mb-4 tracking-tight animate-in slide-in-from-bottom-2 duration-300 key={step}-title">
                {currentStep.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed text-lg animate-in slide-in-from-bottom-2 duration-300 delay-75 key={step}-desc">
                {currentStep.content}
            </p>

            <div className="flex items-center gap-2 mb-10">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 transition-all duration-500 rounded-full ${i === step ? 'w-10 bg-cyan-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>

            <div className="w-full flex items-center justify-between gap-4">
              <button 
                onClick={handleBack} 
                disabled={step === 0}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleNext} 
                className="flex-[2] py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 transform hover:translate-y-[-2px] active:translate-y-0 transition-all"
              >
                {step === steps.length - 1 ? 'Start Exploring' : 'Continue'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {step < steps.length - 1 && (
                <button onClick={onComplete} className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors">
                    Skip Tutorial
                </button>
            )}
          </div>
        </div>
        
        {spotlightRect && (
          <div 
            className="absolute pointer-events-none animate-bounce flex flex-col items-center gap-2 text-cyan-400 transition-all duration-500"
            style={{
               top: spotlightRect.bottom + 40,
               left: spotlightRect.left + spotlightRect.width / 2 - 12
            }}
          >
            <ArrowDown className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
                Focused Feature
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialOverlay;
