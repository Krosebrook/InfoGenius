
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GeneratedImage } from './types';
import { initDB, saveImageToDB, removeImageFromDB, getAllSavedImages } from './services/db';
import { useInfographicSession } from './hooks/useInfographicSession';
import Infographic from './components/Infographic';
import Loading from './components/Loading';
import IntroScreen from './components/IntroScreen';
import SearchResults from './components/SearchResults';
import LibraryModal from './components/LibraryModal';
import TutorialOverlay from './components/TutorialOverlay';
import { transcribeAndParseIntent } from './services/geminiService';
import { Search, AlertCircle, GraduationCap, Palette, Atom, Sun, Moon, BookMarked, Mic, MicOff, Loader2, Sparkles, Wand2 } from 'lucide-react';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('infogenius_theme');
    return saved ? saved === 'dark' : true;
  });
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Voice Input State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const {
    topic, setTopic,
    complexityLevel, setComplexityLevel,
    visualStyle, setVisualStyle,
    language, setLanguage,
    isLoading, loadingMessage, loadingStep, loadingFacts, error, setError,
    imageHistory, setImageHistory, historyIndex, setHistoryIndex,
    currentSearchResults, setCurrentSearchResults,
    handleGenerate, handleAnimate, handleEdit, handleVerify, handleRefreshNews
  } = useInfographicSession({
      onAuthError: () => setHasApiKey(false)
  });

  useEffect(() => {
    localStorage.setItem('infogenius_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [isDarkMode]);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else { setHasApiKey(true); }
      } catch (e) { console.error(e); } finally { setCheckingKey(false); }
    };
    checkKey();
    
    const setupDB = async () => {
        try { 
          await initDB(); 
          const saved = await getAllSavedImages(); 
          setSavedImages(saved); 
          
          // Check for tutorial completion
          const tutorialDone = localStorage.getItem('infogenius_tutorial_done');
          if (!tutorialDone) setShowTutorial(true);
        } 
        catch (e) { console.error(e); }
    };
    setupDB();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      try { await window.aistudio.openSelectKey(); setHasApiKey(true); setError(null); } 
      catch (e) { console.error(e); }
    }
  };

  const restoreImage = (img: GeneratedImage) => {
     const idx = imageHistory.findIndex(i => i.id === img.id);
     if (idx !== -1) { setHistoryIndex(idx); } 
     else { setImageHistory([img, ...imageHistory]); setHistoryIndex(0); if (img.originalTopic) setTopic(img.originalTopic); }
     setIsLibraryOpen(false);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSave = async () => {
      if (imageHistory.length === 0) return;
      const currentImage = imageHistory[historyIndex];
      const isSaved = savedImages.some(img => img.id === currentImage.id);
      try {
          if (isSaved) { await removeImageFromDB(currentImage.id); setSavedImages(savedImages.filter(img => img.id !== currentImage.id)); } 
          else { await saveImageToDB(currentImage); setSavedImages([...savedImages, currentImage]); }
      } catch (e) { setError("Library update failed."); }
  };

  const handleDeleteFromLibrary = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try { await removeImageFromDB(id); setSavedImages(savedImages.filter(img => img.id !== id)); } catch (e) {}
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsLoadingVoice(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            const intent = await transcribeAndParseIntent(base64Audio);
            if (intent.topic) setTopic(intent.topic);
            if (intent.level) setComplexityLevel(intent.level as any);
            setError(null);
          };
        } catch (err: any) {
          setError("Failed to parse voice command.");
        } finally {
          setIsLoadingVoice(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const [isLoadingVoice, setIsLoadingVoice] = useState(false);

  const handleFinishTutorial = () => {
    localStorage.setItem('infogenius_tutorial_done', 'true');
    setShowTutorial(false);
  };

  const KeySelectionModal = () => (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Paid API Key Required</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">This app uses Gemini 3 Pro and Veo models which require a Google Cloud Project with <strong>Billing Enabled</strong>.</p>
            <button onClick={handleSelectKey} className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold shadow-lg">Select Paid API Key</button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-xs text-cyan-500 underline">Billing Documentation</a>
        </div>
    </div>
  );

  return (
    <>
    {!checkingKey && !hasApiKey && <KeySelectionModal />}
    <LibraryModal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} images={savedImages} onSelect={restoreImage} onDelete={handleDeleteFromLibrary} />
    {showTutorial && <TutorialOverlay onComplete={handleFinishTutorial} />}
    
    {showIntro ? <IntroScreen onComplete={() => setShowIntro(false)} /> : (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans pb-20 relative transition-colors">
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-100 to-white dark:from-slate-900 dark:to-slate-950 z-0"></div>
      
      <header className="border-b border-slate-200 dark:border-white/10 sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/60 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-cyan-600 rounded-lg shadow-lg shadow-cyan-500/20">
              <Atom className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <span className="font-display font-bold text-lg md:text-2xl tracking-tight">InfoGenius <span className="text-cyan-600 dark:text-cyan-400">Vision</span></span>
          </div>
          <div className="flex items-center gap-3">
              <button id="step-library" onClick={() => setIsLibraryOpen(true)} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-700/30 hover:brightness-110 transition-all">
                <BookMarked className="w-4 h-4" />
                <span>Library ({savedImages.length})</span>
              </button>
              
              {/* Persistent Animated Theme Toggle */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-white/10">
                <button 
                  onClick={() => setIsDarkMode(false)} 
                  className={`p-1.5 rounded-xl transition-all ${!isDarkMode ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400'}`}
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsDarkMode(true)} 
                  className={`p-1.5 rounded-xl transition-all ${isDarkMode ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
          </div>
        </div>
      </header>

      <main className="px-3 sm:px-6 py-4 md:py-8 relative z-10">
        <div className={`max-w-6xl mx-auto transition-all ${imageHistory.length > 0 ? 'mb-8' : 'min-h-[75vh] flex flex-col justify-center'}`}>
          {!imageHistory.length && (
            <div className="text-center mb-16 space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-widest border border-cyan-500/20 mb-4">
                <Sparkles className="w-3 h-3" /> AI-Grounded Visual Research
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-bold tracking-tighter leading-[0.85]">
                Visualize any <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:to-indigo-400 drop-shadow-sm">Complex Knowledge.</span>
              </h1>
              <p className="text-sm md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                Transform abstract data into interactive diagrams, grounded maps, and cinematic summaries powered by Gemini 3 and Veo AI.
              </p>
            </div>
          )}
          
          <form id="step-search" onSubmit={handleGenerate} className={`relative z-20 transition-all ${isLoading ? 'opacity-50 pointer-events-none blur-sm' : ''}`}>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-3 rounded-[2.5rem] shadow-2xl group transition-all hover:shadow-cyan-500/10">
                <div className="relative flex items-center">
                    <div className="absolute left-8 flex items-center gap-3">
                      <Search className="w-7 h-7 text-slate-400 transition-colors group-focus-within:text-cyan-500" />
                    </div>
                    <input 
                      type="text" 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)} 
                      placeholder="Enter a topic (e.g. History of Roman Aqueducts)" 
                      className="w-full pl-20 pr-16 py-6 md:py-8 bg-transparent border-none outline-none text-lg md:text-3xl font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                    />
                    <div className="absolute right-6 flex items-center gap-3">
                       {isLoadingVoice ? (
                         <div className="p-3">
                           <Loader2 className="w-7 h-7 animate-spin text-cyan-500" />
                         </div>
                       ) : (
                         <button 
                            id="step-mic"
                            type="button" 
                            onClick={isRecording ? handleStopRecording : handleStartRecording} 
                            className={`p-4 rounded-[1.5rem] transition-all relative ${isRecording ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title={isRecording ? "Stop Recording" : "Record Voice Command"}
                          >
                            {isRecording && <span className="absolute inset-0 rounded-[1.5rem] animate-ping bg-red-500/30"></span>}
                            {isRecording ? <MicOff className="w-6 h-6 relative z-10" /> : <Mic className="w-6 h-6" />}
                          </button>
                       )}
                    </div>
                </div>
                
                <div id="step-config" className="flex flex-col md:flex-row gap-3 p-3 mt-3">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950/40 rounded-[1.5rem] border border-slate-100 dark:border-white/5 px-6 py-4 flex items-center gap-4 transition-all hover:bg-white dark:hover:bg-slate-850 hover:shadow-sm">
                        <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col w-full">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Target Audience</label>
                          <select value={complexityLevel} onChange={(e) => setComplexityLevel(e.target.value as any)} className="bg-transparent border-none text-base font-bold w-full outline-none text-slate-800 dark:text-white cursor-pointer">
                            <option value="Elementary">Elementary (Ages 6-11)</option>
                            <option value="High School">High School (Ages 12-18)</option>
                            <option value="College">University Student</option>
                            <option value="Expert">Technical Expert</option>
                          </select>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950/40 rounded-[1.5rem] border border-slate-100 dark:border-white/5 px-6 py-4 flex items-center gap-4 transition-all hover:bg-white dark:hover:bg-slate-850 hover:shadow-sm">
                        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                          <Palette className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col w-full">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Visual Aesthetic</label>
                          <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value as any)} className="bg-transparent border-none text-base font-bold w-full outline-none text-slate-800 dark:text-white cursor-pointer">
                            <option value="Default">Standard Scientific</option>
                            <option value="Minimalist">Modern Minimalist</option>
                            <option value="Realistic">Photorealistic 8K</option>
                            <option value="Cartoon">Educational Graphic</option>
                            <option value="Vintage">Scientific Lithograph</option>
                            <option value="Futuristic">Digital HUD/Cyber</option>
                            <option value="3D Render">Isometric 3D</option>
                            <option value="Sketch">Technical Blueprint</option>
                          </select>
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading || !topic.trim()} className={`w-full md:w-auto px-10 py-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${!topic.trim() ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600' : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-cyan-600/20'}`}>
                      <span>RESEARCH & GENERATE</span>
                      <Wand2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </form>
        </div>

        {isLoading && <Loading status={loadingMessage} step={loadingStep} facts={loadingFacts} />}
        
        {error && <div className="max-w-3xl mx-auto mt-12 p-8 bg-red-50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900/30 rounded-[2rem] flex items-center gap-6 text-red-800 dark:text-red-200 animate-in shake duration-500 shadow-xl shadow-red-500/5">
          <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-2xl">
            <AlertCircle className="w-8 h-8 flex-shrink-0 text-red-500" />
          </div>
          <div>
            <h4 className="font-bold text-lg mb-1">Heads up!</h4>
            <p className="font-medium opacity-80 leading-relaxed">{error}</p>
          </div>
        </div>}

        {imageHistory.length > 0 && !isLoading && (
            <div className="animate-in slide-in-from-bottom-12 duration-1000">
                <Infographic 
                    key={imageHistory[historyIndex].id}
                    image={imageHistory[historyIndex]} 
                    onEdit={handleEdit} 
                    onVerify={handleVerify}
                    onAnimate={handleAnimate}
                    isEditing={isLoading}
                    onRefreshNews={handleRefreshNews}
                    historyIndex={historyIndex}
                    historyTotal={imageHistory.length}
                    isSaved={savedImages.some(img => img.id === imageHistory[historyIndex].id)}
                    onToggleSave={handleToggleSave}
                />
                <SearchResults results={currentSearchResults} />
            </div>
        )}
      </main>
    </div>
    )}
    </>
  );
};
export default App;
