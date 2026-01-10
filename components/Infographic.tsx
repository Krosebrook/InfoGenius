/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { Download, Sparkles, Edit3, Maximize2, X, ZoomIn, ZoomOut, RefreshCcw, Save, Newspaper, Undo2, Redo2, Bookmark, Check, Volume2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { generateAudioNarration } from '../services/geminiService';

interface InfographicProps {
  image: GeneratedImage;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
  onRefreshNews?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  historyIndex?: number;
  historyTotal?: number;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

const Infographic: React.FC<InfographicProps> = ({ 
    image, 
    onEdit, 
    isEditing, 
    onRefreshNews,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    historyIndex = 0,
    historyTotal = 1,
    isSaved = false,
    onToggleSave
}) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showEditControls, setShowEditControls] = useState(false);
  
  // Audio State
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
    setIsFullscreen(false); // Close fullscreen on edit submit to show loading state in main app
    setShowEditControls(false);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
  }

  const handleGenerateAudio = async () => {
    if (isGeneratingAudio || audioData) return; // Prevent regen if already exists or loading
    setIsGeneratingAudio(true);
    try {
        const topicToNarrate = image.originalTopic || image.prompt;
        const factsToNarrate = image.facts && image.facts.length > 0 ? image.facts : ["Detailed visual analysis", "Key educational concepts"];
        
        // Pass the image's selected language to the audio generation service
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
            {/* History Controls */}
            {(onUndo || onRedo) && (
                <div className="flex items-center gap-1 border-r border-slate-200 dark:border-white/10 pr-2 mr-1 sm:mr-2">
                    <button 
                        type="button"
                        onClick={onUndo} 
                        disabled={!canUndo || isEditing}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        title="Undo"
                    >
                        <Undo2 className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 min-w-[30px] text-center select-none">
                        {historyTotal - historyIndex}/{historyTotal}
                    </span>
                    <button 
                        type="button"
                        onClick={onRedo} 
                        disabled={!canRedo || isEditing}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        title="Redo"
                    >
                        <Redo2 className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="pl-1 text-cyan-600 dark:text-cyan-400 hidden sm:block">
                <Edit3 className="w-5 h-5" />
            </div>
            <form onSubmit={handleSubmit} className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Refine the visual (e.g., 'Make the background stars')..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900/50 sm:bg-transparent border border-slate-200 dark:border-white/10 sm:border-none rounded-xl sm:rounded-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 px-4 py-3 sm:px-2 sm:py-2 font-medium text-base transition-all focus:bg-white dark:focus:bg-slate-900 shadow-inner"
                    disabled={isEditing}
                />
                <div className="w-full sm:w-auto" title={!editPrompt.trim() ? "Please enter a prompt to enhance" : "Enhance image"}>
                    <button
                        type="submit"
                        disabled={isEditing || !editPrompt.trim()}
                        className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                            isEditing || !editPrompt.trim() 
                            ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/30 ring-1 ring-white/20'
                        }`}
                    >
                        {isEditing ? (
                            <span className="animate-spin w-5 h-5 block border-2 border-white/30 border-t-white rounded-full"></span>
                        ) : (
                            <>
                                <span>Enhance</span>
                                <Sparkles className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto animate-in fade-in zoom-in duration-700 mt-8">
      
      {/* Image Container */}
      <div className="relative group w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700/50">
        {/* Decorative Corner Markers */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-2xl z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-2xl z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-2xl z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-2xl z-20 pointer-events-none"></div>

        <img 
          src={image.data} 
          alt={image.prompt} 
          onClick={() => setIsFullscreen(true)}
          className={`w-full h-auto object-contain max-h-[80vh] bg-checkered relative z-10 cursor-zoom-in 
            border-2 border-slate-600/30 dark:border-slate-400/30
            ${isEditing ? 'animate-pulse sepia-0 blur-[2px] transition-all duration-500 ring-4 ring-cyan-500/20' : ''}
          `}
        />
        
        {/* Audio Player Overlay (Bottom Left) */}
        <div className="absolute bottom-6 left-6 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <AudioPlayer 
                base64Audio={audioData}
                isLoading={isGeneratingAudio}
                onGenerate={handleGenerateAudio}
                topic={image.originalTopic || image.prompt}
             />
        </div>

        {/* Hover Overlay for Quick Actions */}
        <div className="absolute top-6 right-6 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-30">
           {/* Add Narration Button */}
          <button 
            onClick={handleGenerateAudio}
            disabled={isGeneratingAudio || !!audioData}
            className={`backdrop-blur-md text-white p-3 rounded-xl shadow-lg transition-all border border-white/10 block hover:scale-105 active:scale-95 ${audioData ? 'bg-cyan-600 cursor-default' : 'bg-black/60 hover:bg-cyan-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
            title={audioData ? "Audio Generated" : "Generate Audio Narration"}
          >
            <Volume2 className="w-5 h-5" />
          </button>
          
          {onToggleSave && (
             <button 
                onClick={onToggleSave}
                className={`backdrop-blur-md p-3 rounded-xl shadow-lg transition-all border border-white/10 block hover:scale-105 active:scale-95 ${isSaved ? 'bg-amber-500 text-white' : 'bg-black/60 text-white hover:bg-amber-500'}`}
                title={isSaved ? "Remove from Library" : "Save to Library"}
            >
                {isSaved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          )}
          {onRefreshNews && (
            <button 
                onClick={onRefreshNews}
                disabled={isEditing}
                className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Search Results"
            >
                <Newspaper className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => setShowEditControls(!showEditControls)}
            className={`backdrop-blur-md text-white p-3 rounded-xl shadow-lg transition-all border border-white/10 block hover:scale-105 active:scale-95 ${showEditControls ? 'bg-cyan-600' : 'bg-black/60 hover:bg-cyan-600'}`}
            title={showEditControls ? "Hide Edit Controls" : "Edit Image"}
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block hover:scale-105 active:scale-95"
            title="Fullscreen View"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <a 
            href={image.data} 
            download={`infographic-${image.id}.png`}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block hover:scale-105 active:scale-95"
            title="Download Infographic"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Main Edit Bar (Toggleable) */}
      {showEditControls && renderEditForm(false)}
      
      <div className="mt-8 text-center space-y-2 px-4">
        <p className="text-xs text-slate-500 dark:text-slate-500 font-mono max-w-xl mx-auto truncate opacity-60">
            PROMPT: {image.prompt}
        </p>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
                <div className="flex gap-2 pointer-events-auto bg-white/10 backdrop-blur-md p-1 rounded-lg border border-black/5 dark:border-white/10 shadow-lg">
                    <button 
                        onClick={handleZoomOut} 
                        className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-all hover:scale-110 active:scale-95" 
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleResetZoom} 
                        className="px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 min-w-[4rem] justify-center" 
                        title="Reset Zoom"
                    >
                        <RefreshCcw className="w-3 h-3" />
                        <span className="text-xs font-bold">{Math.round(zoomLevel * 100)}%</span>
                    </button>
                    <button 
                        onClick={handleZoomIn} 
                        className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-all hover:scale-110 active:scale-95" 
                        title="Zoom In"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex gap-2">
                    {/* Add Audio Player to Fullscreen Toolbar */}
                    <AudioPlayer 
                        base64Audio={audioData}
                        isLoading={isGeneratingAudio}
                        onGenerate={handleGenerateAudio}
                        topic={image.originalTopic || image.prompt}
                    />

                    {onToggleSave && (
                        <button 
                            onClick={onToggleSave}
                            className={`p-3 text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center border border-white/20 ${isSaved ? 'bg-amber-500' : 'bg-slate-700 hover:bg-amber-500'}`}
                            title={isSaved ? "Remove from Library" : "Save to Library"}
                        >
                            {isSaved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                        </button>
                    )}
                    {onRefreshNews && (
                        <button 
                            onClick={onRefreshNews}
                            disabled={isEditing}
                            className="p-3 bg-slate-700 text-white rounded-full hover:bg-cyan-600 transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh Search Results"
                        >
                            <Newspaper className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={() => setShowEditControls(!showEditControls)}
                        className={`p-3 text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center border border-white/20 ${showEditControls ? 'bg-cyan-600' : 'bg-slate-700 hover:bg-cyan-600'}`}
                        title={showEditControls ? "Hide Edit Controls" : "Edit Image"}
                    >
                        <Edit3 className="w-5 h-5" />
                    </button>
                    <a 
                        href={image.data} 
                        download={`infographic-${image.id}.png`}
                        className="p-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center border border-white/20"
                        title="Download Infographic"
                    >
                        <Download className="w-5 h-5" />
                    </a>
                    <button 
                        onClick={handleCloseFullscreen}
                        className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 shadow-lg border border-black/5 dark:border-white/10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 pb-32">
                <img 
                    src={image.data} 
                    alt={image.prompt}
                    style={{ 
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.2s ease-out'
                    }}
                    className={`
                        max-w-full max-h-full object-contain shadow-2xl rounded-lg origin-center 
                        border-4 border-slate-700 dark:border-slate-500
                        ring-1 ring-black/5 dark:ring-white/5
                        hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300
                        ${isEditing ? 'animate-pulse blur-[1px] ring-4 ring-cyan-500/50' : ''}
                    `}
                />
            </div>

            {/* Sticky Edit Bar */}
            {showEditControls && (
                <div className="absolute bottom-8 left-0 right-0 px-4 z-50">
                    {renderEditForm(true)}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Infographic;
