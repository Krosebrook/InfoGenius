/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { GeneratedImage } from '../types';
import { X, Trash2, Calendar, Download, BookMarked, ArrowRight } from 'lucide-react';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, images, onSelect, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <BookMarked className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Personal Library</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {images.length} saved infographic{images.length !== 1 ? 's' : ''} stored locally
                    </p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
            {images.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <BookMarked className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Your library is empty</h3>
                    <p className="text-sm text-slate-500 max-w-xs mt-2">
                        Click the bookmark icon on any generated infographic to save it here forever.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.sort((a, b) => b.timestamp - a.timestamp).map((img) => (
                        <div 
                            key={img.id} 
                            onClick={() => onSelect(img)}
                            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden hover:shadow-xl hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col h-full"
                        >
                            <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <img 
                                    src={img.data} 
                                    alt={img.prompt} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                        Open in Editor <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-2 mb-2 flex-1" title={img.prompt}>
                                    {img.prompt}
                                </h4>
                                
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(img.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                        <a 
                                            href={img.data}
                                            download={`saved-${img.id}.png`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                        <button 
                                            onClick={(e) => onDelete(img.id, e)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove from Library"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
