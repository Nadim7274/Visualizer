import React from 'react';
import { X, Sliders, RotateCcw, Keyboard, Palette as PaletteIcon, Zap, Shield } from 'lucide-react';
import { PaletteId, VisualizerSettings } from '../types/audio';
import { PALETTES } from '../constants/palettes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VisualizerSettings;
  onUpdateSettings: (newSettings: Partial<VisualizerSettings>) => void;
  currentPalette: PaletteId;
  onSelectPalette: (id: PaletteId) => void;
  onResetSettings: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentPalette,
  onSelectPalette,
  onResetSettings,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause playback' },
    { key: 'N', desc: 'Next track' },
    { key: 'P', desc: 'Previous track' },
    { key: '← / →', desc: 'Seek 5 seconds back / forward' },
    { key: '↑ / ↓', desc: 'Adjust master volume' },
    { key: 'F', desc: 'Toggle Fullscreen stage' },
    { key: 'Esc', desc: 'Close dialogs & exit fullscreen' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col w-full max-w-xl max-h-[85vh] bg-[#0c0e15] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">AETHER Engine Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Section: Color Palettes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PaletteIcon className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-white uppercase tracking-wider text-[11px]">Spectral Color Themes</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(PALETTES).map((pal) => (
                <button
                  key={pal.id}
                  onClick={() => onSelectPalette(pal.id)}
                  className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                    currentPalette === pal.id
                      ? 'border-cyan-400 bg-cyan-950/20'
                      : 'border-white/10 hover:border-white/20 bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pal.primary }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pal.secondary }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pal.accent }} />
                  </div>
                  <span className="text-[11px] font-medium text-white">{pal.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-white/10" />

          {/* Section: DSP & Visualization Dynamics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-white uppercase tracking-wider text-[11px]">Acoustic Dynamics</span>
            </div>

            {/* Sensitivity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span>Audio Reactivity Sensitivity</span>
                <span className="font-mono-nums text-cyan-300">{settings.sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={settings.sensitivity}
                onChange={(e) => onUpdateSettings({ sensitivity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Motion Speed */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span>Motion & Velocity Speed</span>
                <span className="font-mono-nums text-cyan-300">{settings.motionSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={settings.motionSpeed}
                onChange={(e) => onUpdateSettings({ motionSpeed: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Particle Density */}
            <div className="flex items-center justify-between pt-1">
              <span>Particle Density & Resolution</span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-white/10 rounded-lg">
                {(['low', 'medium', 'high'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => onUpdateSettings({ density: d })}
                    className={`px-3 py-1 rounded text-[11px] capitalize transition-colors ${
                      settings.density === d ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Reactive UI toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-white block font-medium">Ambient UI Reactivity</span>
                <span className="text-[11px] text-slate-500">Allow canvas backdrop to subtly pulse with sub-bass</span>
              </div>
              <input
                type="checkbox"
                checked={settings.reactiveUi}
                onChange={(e) => onUpdateSettings({ reactiveUi: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-white block font-medium">Reduced Motion Mode</span>
                <span className="text-[11px] text-slate-500">Dampens camera shake and rapid rotational transitions</span>
              </div>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="h-[1px] bg-white/10" />

          {/* Section: Keyboard Shortcuts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-white uppercase tracking-wider text-[11px]">Keyboard Navigation</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((sc) => (
                <div key={sc.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-white/5">
                  <span className="text-slate-400">{sc.desc}</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-white rounded font-mono text-[10px] border border-white/10">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-slate-950/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero telemetry · 100% Client-Side DSP</span>
          </div>
          <button
            onClick={onResetSettings}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
}
