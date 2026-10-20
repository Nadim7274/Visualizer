import React from 'react';
import { X, Star, Sparkles } from 'lucide-react';
import { VisualizerId } from '../types/audio';
import { VISUALIZERS } from '../constants/palettes';

interface VisualizerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVisualizer: VisualizerId;
  onSelectVisualizer: (id: VisualizerId) => void;
  favorites: VisualizerId[];
  onToggleFavorite: (id: VisualizerId) => void;
}

export function VisualizerSelectorModal({
  isOpen,
  onClose,
  activeVisualizer,
  onSelectVisualizer,
  favorites,
  onToggleFavorite,
}: VisualizerSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl max-h-[85vh] bg-[#0c0e15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">Acoustic Visualizer Library</h3>
            <span className="text-xs text-slate-400">· 12 Custom Render Engines</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visualizers Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {VISUALIZERS.map((v) => {
            const isActive = activeVisualizer === v.id;
            const isFav = favorites.includes(v.id);

            return (
              <div
                key={v.id}
                onClick={() => {
                  onSelectVisualizer(v.id);
                  onClose();
                }}
                className={`group relative flex flex-col p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-950/25 border-cyan-400 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-white/10 hover:border-white/25 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {v.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        Active
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(v.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <span className="text-[11px] text-cyan-400/90 font-medium mb-1">
                  {v.tagline}
                </span>

                <p className="text-xs text-slate-400 leading-relaxed mt-auto">
                  {v.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
