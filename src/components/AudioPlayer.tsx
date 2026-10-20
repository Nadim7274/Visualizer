import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  LayoutGrid,
} from 'lucide-react';
import { Track } from '../types/audio';
import { audioEngine } from '../services/audioEngine';

interface AudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onOpenLibrary: () => void;
  onOpenExperienceDrawer: () => void;
}

export function AudioPlayer({
  currentTrack,
  isPlaying,
  onOpenLibrary,
  onOpenExperienceDrawer,
}: AudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => audioEngine.getVolume());
  const [isMuted, setIsMuted] = useState(() => audioEngine.getIsMuted());
  const [isShuffle, setIsShuffle] = useState(() => audioEngine.getIsShuffle());
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>(() =>
    audioEngine.getRepeatMode()
  );

  useEffect(() => {
    const unsubTime = audioEngine.onTimeUpdate((cur, dur) => {
      setCurrentTime(cur);
      if (dur && !isNaN(dur)) setDuration(dur);
    });

    return () => {
      unsubTime();
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    audioEngine.seek(targetTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
    if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = audioEngine.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleToggleShuffle = () => {
    const next = audioEngine.toggleShuffle();
    setIsShuffle(next);
  };

  const handleCycleRepeat = () => {
    const next = audioEngine.cycleRepeat();
    setRepeatMode(next);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative z-30 flex flex-col border-t border-white/10 bg-[#08090d]/90 backdrop-blur-xl px-4 sm:px-6 py-2.5 shrink-0 select-none">
      {/* Interactive Progress Timeline */}
      <div className="relative flex items-center group -mt-3.5 mb-1 cursor-pointer">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          disabled={!currentTrack}
          className="w-full h-2 accent-cyan-400 cursor-pointer disabled:opacity-30"
          aria-label="Audio progress slider"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3 w-1/4 min-w-[140px] sm:min-w-[200px]">
          {/* Procedural Art Thumbnail */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-900 to-indigo-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
            <span className="font-mono text-xs font-bold text-cyan-300">
              {currentTrack ? currentTrack.title.substring(0, 2).toUpperCase() : 'AE'}
            </span>
          </div>

          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-medium text-white truncate">
              {currentTrack ? currentTrack.title : 'No Track Selected'}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
              <span>{currentTrack ? currentTrack.artist : 'Select audio to begin'}</span>
              {currentTrack?.isProcedural && (
                <span className="text-[10px] text-cyan-400 font-medium">· Synth</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Playback Controls & Time */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Shuffle */}
            <button
              onClick={handleToggleShuffle}
              className={`p-1.5 rounded-md transition-colors ${
                isShuffle ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
              title={isShuffle ? 'Shuffle enabled' : 'Enable shuffle'}
              aria-label="Toggle shuffle"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {/* Previous */}
            <button
              onClick={() => audioEngine.prevTrack()}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Previous Track"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => audioEngine.togglePlay()}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-slate-950 hover:bg-cyan-300 transition-transform active:scale-95 shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Next */}
            <button
              onClick={() => audioEngine.nextTrack()}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title="Next Track"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Repeat */}
            <button
              onClick={handleCycleRepeat}
              className={`p-1.5 rounded-md transition-colors ${
                repeatMode !== 'off' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
              aria-label="Cycle repeat mode"
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-3.5 h-3.5" />
              ) : (
                <Repeat className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Time text */}
          <div className="flex items-center gap-1 text-[11px] font-mono-nums text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Drawer Controls */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[140px]">
          {/* Volume control */}
          <div className="hidden sm:flex items-center gap-2 w-28">
            <button
              onClick={handleToggleMute}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full accent-cyan-400 h-1.5"
              aria-label="Volume slider"
            />
          </div>

          {/* Experiences drawer trigger */}
          <button
            onClick={onOpenExperienceDrawer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-white transition-colors"
            title="Open Experiences"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Activities</span>
          </button>

          {/* Queue library trigger */}
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-white transition-colors"
            title="Open Queue"
          >
            <ListMusic className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
