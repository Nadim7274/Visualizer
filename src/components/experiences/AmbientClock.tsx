import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../services/audioEngine';

export function AmbientClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const metrics = audioEngine.getMetrics();
  const currentTrack = audioEngine.getCurrentTrack();

  return (
    <div className="flex flex-col items-center justify-between h-full p-8 text-slate-200 select-none">
      {/* Top tag */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 font-mono-nums">
        <span>AETHER CHRONOMETER</span>
        <span>·</span>
        <span>24H UTC LOCAL</span>
      </div>

      {/* Main Clock Face */}
      <div className="flex flex-col items-center my-auto">
        <div className="flex items-baseline font-mono-nums tracking-tighter text-white">
          <span className="text-7xl sm:text-9xl font-light">{hours}</span>
          <span className="text-6xl sm:text-8xl text-cyan-400/80 mx-1 sm:mx-2 animate-pulse">:</span>
          <span className="text-7xl sm:text-9xl font-light">{minutes}</span>
          <span className="text-2xl sm:text-4xl text-slate-500 ml-3 sm:ml-4 font-normal">{seconds}</span>
        </div>

        <p className="text-sm sm:text-base text-slate-400 mt-4 tracking-wide font-light">
          {dateString}
        </p>

        {/* Audio Reactive Glow bar */}
        <div className="w-48 h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${Math.min(100, (metrics.energy + 0.1) * 100)}%` }}
          />
        </div>
      </div>

      {/* Now Playing Footer snippet */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {currentTrack ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-medium">{currentTrack.title}</span>
            <span>—</span>
            <span>{currentTrack.artist}</span>
          </>
        ) : (
          <span>Audio visualizer idling</span>
        )}
      </div>
    </div>
  );
}
