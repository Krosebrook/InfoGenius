/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Volume2, Mic } from 'lucide-react';
import { decodeAudioData } from '../services/audioUtils';

interface AudioPlayerProps {
  base64Audio: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  topic: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Audio, isLoading, onGenerate, topic }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    // Reset state when audio source changes
    stopAudio();
    audioBufferRef.current = null;
    pauseTimeRef.current = 0;
    
    if (base64Audio) {
      initAudio(base64Audio);
    }
    
    return () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, [base64Audio]);

  const initAudio = async (b64: string) => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
        const buffer = await decodeAudioData(b64, ctx);
        audioBufferRef.current = buffer;
    } catch (e) {
        console.error("Failed to decode audio", e);
    }
  };

  const playAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    // Create a new source node (they are one-time use)
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    
    // Start playback
    // If paused, start from pauseTime. If stopped/fresh, start from 0.
    const offset = pauseTimeRef.current % audioBufferRef.current.duration;
    source.start(0, offset);
    
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
        // Only reset if we naturally finished, not manually stopped
        if (audioContextRef.current && audioContextRef.current.currentTime - startTimeRef.current >= (audioBufferRef.current?.duration || 0)) {
           setIsPlaying(false);
           pauseTimeRef.current = 0;
        }
    };
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioContextRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
        pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
        setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
    }
    sourceNodeRef.current = null;
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-sm border border-slate-200 dark:border-white/10 transition-all hover:border-cyan-500/30">
        
        {/* Play/Pause/Loading Button */}
        <button
            onClick={isPlaying ? pauseAudio : (base64Audio ? playAudio : onGenerate)}
            disabled={isLoading}
            className={`
                w-10 h-10 flex items-center justify-center rounded-full transition-all
                ${isLoading 
                    ? 'bg-slate-100 dark:bg-slate-700 cursor-wait' 
                    : base64Audio 
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }
            `}
            title={base64Audio ? (isPlaying ? "Pause" : "Play Narration") : "Generate Audio Narration"}
        >
            {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
            ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
            ) : base64Audio ? (
                <Play className="w-5 h-5 fill-current ml-0.5" />
            ) : (
                <Mic className="w-5 h-5" />
            )}
        </button>

        {/* Text/Visualizer Area */}
        <div className="flex flex-col min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isLoading ? "Synthesizing..." : isPlaying ? "Now Playing" : base64Audio ? "Ready to Play" : "AI Narrator"}
            </span>
            <div className="h-4 flex items-center gap-0.5 overflow-hidden">
                {isPlaying ? (
                    // Fake waveform animation
                    Array.from({ length: 20 }).map((_, i) => (
                        <div 
                            key={i} 
                            className="w-1 bg-cyan-500 rounded-full animate-pulse"
                            style={{ 
                                height: `${Math.random() * 100}%`,
                                animationDuration: `${0.5 + Math.random() * 0.5}s`
                            }}
                        ></div>
                    ))
                ) : (
                    // Static line
                    <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                )}
            </div>
        </div>

        {base64Audio && (
             <div className="px-2 text-cyan-600 dark:text-cyan-400">
                <Volume2 className="w-4 h-4" />
             </div>
        )}
    </div>
  );
};

export default AudioPlayer;
