import React from 'react';
import { Sliders, Maximize2, Minimize2, Sparkles, Music2 } from 'lucide-react';
import { VisualizerId } from '../types/audio';

interface TopBarProps {
  activeVisualizer: VisualizerId;
  onOpenVisualizerDrawer: () => void;
  onOpenExperienceDrawer: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  onRandomize: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isPlaying: boolean;
}

export function TopBar({
  onOpenVisualizerDrawer,
  onOpenExperienceDrawer,
  onOpenLibrary,
  onOpenSettings,
  onRandomize,
  isFullscreen,
  onToggleFullscreen,
  isPlaying,
}: TopBarProps) {
  return (
    <header className="relative z-30 flex items-center justify-between gap-8 px-6 py-4 border-b border-white/10 bg-[#07080b]/80 backdrop-blur-xl shrink-0">
      {/* Zone 1: Single text element Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-widest text-white uppercase font-sans whitespace-nowrap hover:text-cyan-400 transition-colors"
        >
          AETHER
        </a>
        <span className="hidden sm:inline-block text-xs text-slate-500 font-light">
          A different way to feel sound.
        </span>
      </div>

      {/* Zone 2: Clean 4–5 single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={onOpenVisualizerDrawer}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Visualizers
        </button>
        <button
          onClick={onOpenExperienceDrawer}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Experiences
        </button>
        <button
          onClick={onOpenLibrary}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Audio Library
        </button>
        <button
          onClick={onRandomize}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Surprise Mode</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action cluster */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Sound Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            isPlaying
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-900 text-slate-500 border border-white/5'
          }`}
        >
          <Music2 className={`w-3 h-3 ${isPlaying ? 'animate-bounce' : ''}`} />
          <span className="font-mono-nums">{isPlaying ? 'LIVE DSP' : 'IDLE'}</span>
        </div>

        {/* Engine Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Audio Engine Settings"
          aria-label="Engine Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Stage'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
