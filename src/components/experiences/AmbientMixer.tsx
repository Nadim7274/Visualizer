import React, { useState } from 'react';
import { audioEngine } from '../../services/audioEngine';
import { AmbientChannel } from '../../types/audio';
import { CloudRain, Wind, Flame, Waves, Radio, Volume2, VolumeX } from 'lucide-react';

const INITIAL_CHANNELS: AmbientChannel[] = [
  { id: 'rain', name: 'Rainfall', description: 'Soft precipitation and gentle droplets', volume: 0.5, muted: false, active: false },
  { id: 'wind', name: 'Mountain Wind', description: 'Atmospheric breeze with slow modulations', volume: 0.4, muted: false, active: false },
  { id: 'fire', name: 'Fireplace', description: 'Warm embers and irregular timber crackle', volume: 0.5, muted: false, active: false },
  { id: 'ocean', name: 'Ocean Surf', description: 'Rhythmic tidal swells and rolling waves', volume: 0.5, muted: false, active: false },
  { id: 'brown', name: 'Brown Noise', description: 'Deep low-frequency calming rumble', volume: 0.45, muted: false, active: false },
  { id: 'pink', name: 'Pink Noise', description: 'Balanced acoustic spectrum for focus', volume: 0.35, muted: false, active: false },
];

export function AmbientMixer() {
  const [channels, setChannels] = useState<AmbientChannel[]>(INITIAL_CHANNELS);
  const [masterVolume, setMasterVolume] = useState(() => audioEngine.getAmbientMasterVolume());

  const getIcon = (id: AmbientChannel['id']) => {
    switch (id) {
      case 'rain': return <CloudRain className="w-4 h-4" />;
      case 'wind': return <Wind className="w-4 h-4" />;
      case 'fire': return <Flame className="w-4 h-4" />;
      case 'ocean': return <Waves className="w-4 h-4" />;
      case 'brown': return <Radio className="w-4 h-4" />;
      case 'pink': return <Radio className="w-4 h-4" />;
    }
  };

  const handleToggleActive = (id: AmbientChannel['id']) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const nextActive = !ch.active;
          audioEngine.setAmbientChannel(id, nextActive, ch.volume, ch.muted);
          return { ...ch, active: nextActive };
        }
        return ch;
      })
    );
  };

  const handleVolumeChange = (id: AmbientChannel['id'], vol: number) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          audioEngine.setAmbientChannel(id, ch.active, vol, ch.muted);
          return { ...ch, volume: vol };
        }
        return ch;
      })
    );
  };

  const handleToggleMute = (id: AmbientChannel['id']) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const nextMuted = !ch.muted;
          audioEngine.setAmbientChannel(id, ch.active, ch.volume, nextMuted);
          return { ...ch, muted: nextMuted };
        }
        return ch;
      })
    );
  };

  const handleMasterVolume = (vol: number) => {
    setMasterVolume(vol);
    audioEngine.setAmbientMasterVolume(vol);
  };

  return (
    <div className="flex flex-col h-full p-6 text-slate-200 overflow-y-auto">
      {/* Master Volume Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-white/10 rounded-2xl mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Ambience Master</span>
          <p className="text-xs text-slate-500 mt-0.5">Procedural synthesizers running locally in-browser</p>
        </div>
        <div className="flex items-center gap-3 w-40">
          <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => handleMasterVolume(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <span className="font-mono-nums text-xs text-slate-400 w-8 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Sound Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className={`flex flex-col p-4 rounded-xl border transition-all ${
              ch.active
                ? 'bg-slate-900/80 border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'bg-slate-950/40 border-white/5 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleToggleActive(ch.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    ch.active
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={ch.active ? 'Disable' : 'Enable'}
                >
                  {getIcon(ch.id)}
                </button>
                <div>
                  <h4 className="text-sm font-medium text-white">{ch.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-tight">{ch.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggleMute(ch.id)}
                disabled={!ch.active}
                className={`p-1.5 rounded-md transition-colors ${
                  ch.muted
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-slate-400 hover:text-white disabled:opacity-30'
                }`}
                title={ch.muted ? 'Unmute' : 'Mute'}
              >
                {ch.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={!ch.active || ch.muted}
                value={ch.volume}
                onChange={(e) => handleVolumeChange(ch.id, parseFloat(e.target.value))}
                className="w-full accent-cyan-400 disabled:opacity-40"
              />
              <span className="font-mono-nums text-xs text-slate-400 w-7 text-right">
                {ch.muted ? '0%' : `${Math.round(ch.volume * 100)}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
