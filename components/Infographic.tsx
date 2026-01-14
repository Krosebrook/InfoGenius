
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { Download, Sparkles, Edit3, Maximize2, X, ZoomIn, ZoomOut, RefreshCcw, Bookmark, Check, Volume2, ShieldCheck, AlertTriangle, Wand2, Mic, Film, Share2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { generateAudioNarration } from '../services/geminiService';
import LiveDiscussion from './LiveDiscussion';

interface InfographicProps {
  image: GeneratedImage;
  onEdit: (prompt: string) => void;
  onVerify: () => void;
  onAnimate: () => void;
  isEditing: boolean;
  onRefreshNews?: () => void;
  historyIndex?: number;
  historyTotal?: number;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

const Infographic: React.FC<InfographicProps> = ({ 
    image, 
    onEdit, 
    onVerify,
    onAnimate,
    isEditing, 
    onRefreshNews,
    historyIndex = 0,
    historyTotal = 1,
    isSaved = false,
    onToggleSave
}) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showEditControls, setShowEditControls] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [showLiveDiscussion, setShowLiveDiscussion] = useState(false);
  const [viewMode, setViewMode] = useState<'image' | 'video'>('image');
  
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    setAudioData(null);
    setIsGeneratingAudio(false);
    setZoomLevel(1);
    setEditPrompt('');
    setShowVerificationDetails(false);
    setShowLiveDiscussion(false);
    setViewMode(image.videoUri ? 'video' : 'image');
  }, [image.id, image.videoUri]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
    setIsFullscreen(false); 
    setShowEditControls(false);
    setShowVerificationDetails(false);
  };

  const handleApplyFix = () => {
      if (image.verification?.suggestedFix) {
          onEdit(image.verification.suggestedFix);
          setShowVerificationDetails(false);
      }
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    // Construct Unique Deep Link
    const url = new URL(window.location.href);
    url.searchParams.set('q', image.originalTopic || image.prompt);
    if (image.level) url.searchParams.set('l', image.level);
    if (image.style) url.searchParams.set('s', image.style);
    
    const shareUrl = url.toString();
    const shareTitle = `Knowledge Vision: ${image.originalTopic || image.prompt}`;
    const shareText = `Check out this AI-generated visual on ${image.originalTopic || image.prompt}!`;

    try {
      if (navigator.share) {
        // Create blob from image data for sharing files if supported
        const res = await fetch(image.data);
        const blob = await res.blob();
        const file = new File([blob], 'infographic.png', { type: 'image/png' });

        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          files: [file]
        });
      } else {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
        alert("Unique link copied to clipboard!");
      }
    } catch (e) {
      console.error("Share failed", e);
    } finally {
      setIsSharing(false);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
    setShowVerificationDetails(false);
    setShowLiveDiscussion(false);
  }

  const handleGenerateAudio = async () => {
    if (isGeneratingAudio || audioData) return;
    setIsGeneratingAudio(true);
    try {
        const topicToNarrate = image.originalTopic || image.prompt;
        const factsToNarrate = image.facts && image.facts.length > 0 ? image.facts : [];
        const audio = await generateAudioNarration(topicToNarrate, factsToNarrate, image.language || 'English');
        setAudioData(audio);
    } catch (e) {
        console.error("Audio gen failed", e);
        alert("Could not generate audio narration.");
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const renderEditForm = (isSticky: boolean = false) => (
    <div className={`w-full ${isSticky ? 'max-w-2xl mx-auto' : 'max-w-3xl -mt-6 sm:-mt-8 relative z-40 px-4'} animate-in slide-in-from-bottom-4 fade-in duration-300`}>
        <div className={`
            backdrop-blur-xl p-3 sm:p-2 sm:pr-3 rounded-2xl shadow-2xl 
            border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-2 items-center 
            ring-1 ring-black/5 dark:ring-white/5 
            ${isSticky ? 'shadow-black/50 border-white/20' : ''}
            bg-white/90 dark:bg-slate-800/90
            bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px]
        `}>
            <div className="pl-3 text-cyan-600 dark:text-cyan-400 hidden sm:block">
                <Edit3 className="w-5 h-5" />
            </div>
            <form onSubmit={handleSubmit} className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                <input
                    autoFocus
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Refine visual or content..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900/50 sm:bg-transparent border border-slate-200 dark:border-white/10 sm:border-none rounded-xl sm:rounded-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 px-4 py-3 sm:px-2 sm:py-2 font-medium text-base transition-all focus:bg-white dark:focus:bg-slate-900 shadow-inner"
                    disabled={isEditing}
                />
                <button
                    type="submit"
                    disabled={isEditing || !editPrompt.trim()}
                    className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                        isEditing || !editPrompt.trim() 
                        ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                    }`}
                >
                    {isEditing ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : <><span>Refine</span><Sparkles className="w-4 h-4" /></>}
                </button>
            </form>
        </div>
    </div>
  );

  const renderVerificationModal = () => (
      <div className="absolute top-20 right-6 z-40 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                {image.verification?.isAccurate ? <Check className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                Accuracy Report
            </h3>
            <button onClick={() => setShowVerificationDetails(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
            </button>
        </div>
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-500">Score</span>
                <span className={(image.verification?.score || 0) > 80 ? 'text-green-500' : 'text-amber-500'}>{image.verification?.score}/100</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                {image.verification?.critique}
            </div>
            {!image.verification?.isAccurate && image.verification?.suggestedFix && (
                <button onClick={handleApplyFix} className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2">
                    <Wand2 className="w-4 h-4" /> Auto-Fix Issues
                </button>
            )}
        </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto animate-in fade-in zoom-in duration-700 mt-8">
      <LiveDiscussion isOpen={showLiveDiscussion} onClose={() => setShowLiveDiscussion(false)} imageData={image.data} />

      <div className="relative group w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700/50 min-h-[400px] flex items-center justify-center">
        {viewMode === 'image' ? (
          <img 
            src={image.data} 
            alt={image.prompt} 
            onClick={() => setIsFullscreen(true)}
            className={`w-full h-auto object-contain max-h-[80vh] relative z-10 cursor-zoom-in border-2 border-slate-600/30 ${isEditing ? 'animate-pulse blur-[2px]' : ''}`}
          />
        ) : (
          <video 
            src={image.videoUri} 
            autoPlay 
            loop 
            controls 
            className="w-full h-auto max-h-[80vh] relative z-10"
          />
        )}
        
        {image.videoUri && (
          <div className="absolute top-6 left-6 z-40 flex bg-black/50 backdrop-blur-md rounded-xl p-1 border border-white/20">
            <button onClick={() => setViewMode('image')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'image' ? 'bg-cyan-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>Image</button>
            <button onClick={() => setViewMode('video')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'video' ? 'bg-cyan-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>Video</button>
          </div>
        )}

        <div className="absolute bottom-6 left-6 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <AudioPlayer base64Audio={audioData} isLoading={isGeneratingAudio} onGenerate={handleGenerateAudio} topic={image.originalTopic || image.prompt} />
        </div>

        {showVerificationDetails && renderVerificationModal()}

        <div id="step-infographic-actions" className="absolute top-6 right-6 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-30">
          <button onClick={handleShare} disabled={isSharing} className="backdrop-blur-md p-3 rounded-xl shadow-lg transition-all border border-white/10 bg-emerald-600 text-white hover:brightness-110" title="Share via Socials">
            {isSharing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
          </button>
          
          <button onClick={() => setShowLiveDiscussion(true)} disabled={isEditing} className="backdrop-blur-md p-3 rounded-xl shadow-lg transition-all border border-white/10 bg-indigo-600 text-white hover:brightness-110" title="Live Discussion"><Mic className="w-5 h-5" /></button>
          
          <button onClick={onAnimate} disabled={isEditing || !!image.videoUri} className={`backdrop-blur-md p-3 rounded-xl shadow-lg transition-all border border-white/10 ${image.videoUri ? 'bg-amber-600' : 'bg-black/60 hover:bg-amber-600'} text-white`} title={image.videoUri ? "Video Generated" : "Animate with Veo"}><Film className="w-5 h-5" /></button>

          <button onClick={() => image.verification ? setShowVerificationDetails(!showVerificationDetails) : onVerify()} disabled={isEditing} className={`backdrop-blur-md p-3 rounded-xl shadow-lg transition-all border border-white/10 ${image.verification ? (image.verification.isAccurate ? 'bg-green-500' : 'bg-amber-500') : 'bg-black/60'} text-white hover:bg-cyan-600`} title="Verify Accuracy">
             {image.verification ? (image.verification.isAccurate ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />) : <ShieldCheck className="w-5 h-5" />}
          </button>

          <button onClick={handleGenerateAudio} disabled={isGeneratingAudio || !!audioData} className={`backdrop-blur-md text-white p-3 rounded-xl shadow-lg transition-all border border-white/10 ${audioData ? 'bg-cyan-600' : 'bg-black/60 hover:bg-cyan-600'}`} title="Audio Summary"><Volume2 className="w-5 h-5" /></button>
          
          {onToggleSave && <button onClick={onToggleSave} className={`backdrop-blur-md p-3 rounded-xl shadow-lg transition-all border border-white/10 ${isSaved ? 'bg-amber-500' : 'bg-black/60'} text-white hover:bg-amber-500`}>{isSaved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}</button>}
          
          <button onClick={() => setShowEditControls(!showEditControls)} className={`backdrop-blur-md text-white p-3 rounded-xl shadow-lg transition-all border border-white/10 ${showEditControls ? 'bg-cyan-600' : 'bg-black/60 hover:bg-cyan-600'}`} title="Refine Infographic"><Edit3 className="w-5 h-5" /></button>
          
          <button onClick={() => setIsFullscreen(true)} className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 border border-white/10"><Maximize2 className="w-5 h-5" /></button>
        </div>
      </div>

      {showEditControls && renderEditForm(false)}
      
      <div className="mt-8 text-center px-4">
        <p className="text-xs text-slate-500 font-mono opacity-60 uppercase tracking-widest">Visual ID: {image.id}</p>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
                <div className="flex gap-2 pointer-events-auto bg-white/10 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg">
                    <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-md text-white"><ZoomOut className="w-5 h-5" /></button>
                    <button onClick={handleResetZoom} className="px-3 py-2 hover:bg-white/10 rounded-md text-white flex items-center gap-2"><RefreshCcw className="w-3 h-3" /><span className="text-xs font-bold">{Math.round(zoomLevel * 100)}%</span></button>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-md text-white"><ZoomIn className="w-5 h-5" /></button>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={handleCloseFullscreen} className="p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 shadow-lg border border-white/10"><X className="w-6 h-6" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                {viewMode === 'image' ? (
                  <img 
                    src={image.data} 
                    alt={image.prompt}
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                    className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg origin-center border-4 border-slate-700 ${isEditing ? 'animate-pulse' : ''}`}
                  />
                ) : (
                  <video src={image.videoUri} autoPlay loop controls className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border-2 border-slate-700" />
                )}
            </div>
            {showEditControls && <div className="absolute bottom-8 left-0 right-0 px-4 z-50">{renderEditForm(true)}</div>}
        </div>
      )}
    </div>
  );
};

export default Infographic;
