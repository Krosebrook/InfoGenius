/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect } from 'react';
import { Mic, MicOff, X, Activity, Radio } from 'lucide-react';
import { useLiveSession } from '../hooks/useLiveSession';

interface LiveDiscussionProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
}

const LiveDiscussion: React.FC<LiveDiscussionProps> = ({ isOpen, onClose, imageData }) => {
  const { connect, disconnect, isConnected, isConnecting, volume, error } = useLiveSession();

  // Auto-connect when opened
  useEffect(() => {
    if (isOpen) {
        connect(imageData);
    } else {
        disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full relative overflow-hidden shadow-2xl flex flex-col items-center gap-6">
            
            {/* Header */}
            <div className="absolute top-4 right-4">
                <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-col items-center text-center gap-2 mt-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <Radio className="w-3 h-3 animate-pulse" /> Live Discussion
                </div>
                <h3 className="text-xl font-bold text-white">Ask anything</h3>
                <p className="text-slate-400 text-sm">Gemini is looking at your infographic.</p>
            </div>

            {/* Visualizer */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                 {/* Rings */}
                 <div className={`absolute inset-0 border-2 border-cyan-500 rounded-full transition-all duration-100 ease-out`}
                      style={{ transform: `scale(${1 + volume * 2})`, opacity: 0.5 - volume * 0.5 }}
                 ></div>
                 <div className={`absolute inset-0 border-2 border-blue-500 rounded-full transition-all duration-100 ease-out delay-75`}
                      style={{ transform: `scale(${1 + volume * 1.5})`, opacity: 0.6 - volume * 0.4 }}
                 ></div>
                 
                 {/* Core Icon */}
                 <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${isConnected ? 'bg-cyan-600 shadow-[0_0_30px_rgba(6,182,212,0.6)]' : 'bg-slate-700'}`}>
                     {isConnecting ? (
                         <Activity className="w-8 h-8 text-white animate-spin" />
                     ) : isConnected ? (
                         <Mic className="w-8 h-8 text-white" />
                     ) : (
                         <MicOff className="w-8 h-8 text-slate-400" />
                     )}
                 </div>
            </div>

            {/* Status Text */}
            <div className="h-6">
                {error ? (
                    <span className="text-red-400 text-sm font-medium">{error}</span>
                ) : isConnecting ? (
                    <span className="text-cyan-400 text-sm animate-pulse">Connecting to Gemini...</span>
                ) : isConnected ? (
                    <span className="text-emerald-400 text-sm font-medium">Listening... Go ahead.</span>
                ) : (
                    <span className="text-slate-500 text-sm">Disconnected</span>
                )}
            </div>

            <button 
                onClick={onClose} 
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
                End Session
            </button>
        </div>
    </div>
  );
};

export default LiveDiscussion;
