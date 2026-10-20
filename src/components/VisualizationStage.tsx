import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Upload,
  Play,
  Volume2,
} from 'lucide-react';
import { Palette, Track, VisualizerId, VisualizerSettings } from '../types/audio';
import { audioEngine } from '../services/audioEngine';
import { VISUALIZER_RENDERERS } from '../visualizers';
import { VISUALIZERS } from '../constants/palettes';
import { generateDemoTrack } from '../services/proceduralMusic';

interface VisualizationStageProps {
  activeVisualizer: VisualizerId;
  onSelectVisualizer: (id: VisualizerId) => void;
  palette: Palette;
  settings: VisualizerSettings;
  currentTrack: Track | null;
  isPlaying: boolean;
  onOpenVisualizerDrawer: () => void;
  onOpenLibrary: () => void;
}

export function VisualizationStage({
  activeVisualizer,
  onSelectVisualizer,
  palette,
  settings,
  currentTrack,
  isPlaying,
  onOpenVisualizerDrawer,
  onOpenLibrary,
}: VisualizationStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -100, y: -100, isDown: false });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Cycle to previous / next visualizer
  const currentIndex = VISUALIZERS.findIndex((v) => v.id === activeVisualizer);
  const activeMeta = VISUALIZERS[currentIndex] || VISUALIZERS[0];

  const handlePrevVisualizer = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = (currentIndex - 1 + VISUALIZERS.length) % VISUALIZERS.length;
    onSelectVisualizer(VISUALIZERS[prevIdx].id);
  };

  const handleNextVisualizer = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % VISUALIZERS.length;
    onSelectVisualizer(VISUALIZERS[nextIdx].id);
  };

  const handleQuickDemoPlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsGenerating(true);
      const demo = await generateDemoTrack('astral');
      audioEngine.addTracks([demo]);
      await audioEngine.play();
    } catch (err) {
      console.error('Failed to play demo', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Drag and drop audio files onto stage
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newTracks: Track[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name)) {
        const url = URL.createObjectURL(file);
        const title = file.name.replace(/\.[^/.]+$/, '');
        newTracks.push({
          id: `drop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title,
          artist: 'Local Audio',
          duration: 0,
          url,
          file,
          addedAt: Date.now(),
        });
      }
    });

    if (newTracks.length > 0) {
      audioEngine.addTracks(newTracks);
    }
  };

  // High-performance direct Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const renderLoop = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Fetch live audio analysis
      const metrics = audioEngine.getMetrics();
      const renderer = VISUALIZER_RENDERERS[activeVisualizer] || VISUALIZER_RENDERERS.aurora;

      renderer({
        canvas,
        ctx,
        width,
        height,
        metrics,
        palette,
        settings,
        time,
        mouse: mouseRef.current,
      });

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [activeVisualizer, palette, settings]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 w-full h-full overflow-hidden bg-[#07080b] select-none ${
        settings.reactiveUi ? 'transition-all duration-300' : ''
      }`}
    >
      {/* Visualizer Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseRef.current.x = e.clientX - rect.left;
          mouseRef.current.y = e.clientY - rect.top;
        }}
        onMouseDown={() => {
          mouseRef.current.isDown = true;
        }}
        onMouseUp={() => {
          mouseRef.current.isDown = false;
        }}
        onMouseLeave={() => {
          mouseRef.current.x = -100;
          mouseRef.current.y = -100;
          mouseRef.current.isDown = false;
        }}
        className="w-full h-full block cursor-default"
      />

      {/* Subtle Drag and Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-cyan-950/70 border-2 border-dashed border-cyan-400 backdrop-blur-sm pointer-events-none animate-fade-in">
          <Upload className="w-12 h-12 text-cyan-400 mb-3 animate-bounce" />
          <h3 className="text-lg font-semibold text-white">Drop Audio Files Here</h3>
          <p className="text-xs text-cyan-200 mt-1">Processed 100% locally in-browser</p>
        </div>
      )}

      {/* Floating Center Idle Overlay when no audio loaded */}
      {!currentTrack && !isPlaying && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="flex flex-col items-center max-w-md p-8 rounded-3xl bg-slate-950/60 border border-white/10 backdrop-blur-xl shadow-2xl pointer-events-auto">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Welcome to AETHER
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Experience responsive audio-driven visualizations. Drag & drop your local music, or launch the procedural demo synthesizer.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleQuickDemoPlay}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isGenerating ? 'Synthesizing...' : 'Play Demo Audio'}</span>
              </button>
              <button
                onClick={onOpenLibrary}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/15 hover:border-white/30 text-white text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Local Music</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unobtrusive Top-Right Visualizer Mode Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
        <button
          onClick={handlePrevVisualizer}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Previous Visualizer"
          aria-label="Previous Visualizer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenVisualizerDrawer}
          className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-200 hover:text-cyan-300 transition-colors"
        >
          <span>{activeMeta.name}</span>
          <span className="text-[10px] text-slate-500 font-mono-nums">
            {currentIndex + 1}/{VISUALIZERS.length}
          </span>
        </button>

        <button
          onClick={handleNextVisualizer}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Next Visualizer"
          aria-label="Next Visualizer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Spectrum Style Switcher (Appears at Top Center when in any Spectrum mode) */}
      {activeVisualizer.startsWith('spectrum') && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => onSelectVisualizer('spectrum')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeVisualizer === 'spectrum'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Studio Bars
          </button>
          <button
            onClick={() => onSelectVisualizer('spectrum-radial')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeVisualizer === 'spectrum-radial'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Radial Orbit
          </button>
          <button
            onClick={() => onSelectVisualizer('spectrum-mirror')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeVisualizer === 'spectrum-mirror'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mirror Horizon
          </button>
          <button
            onClick={() => onSelectVisualizer('spectrum-led')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeVisualizer === 'spectrum-led'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Analog LED
          </button>
        </div>
      )}

      {/* Unobtrusive Bottom-Left Floating Metadata Pill */}
      {currentTrack && (
        <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-md text-xs text-slate-300">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-white truncate max-w-[200px]">{currentTrack.title}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">{activeMeta.name} Mode</span>
        </div>
      )}
    </div>
  );
}
