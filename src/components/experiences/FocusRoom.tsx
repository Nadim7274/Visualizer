import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Clock } from 'lucide-react';

interface FocusRoomProps {
  onClose?: () => void;
}

export function FocusRoom({}: FocusRoomProps) {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [intention, setIntention] = useState('');
  const [completedSessions, setCompletedSessions] = useState(() => {
    return parseInt(localStorage.getItem('aether_focus_sessions') || '0', 10);
  });

  const modeDurations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const handleModeChange = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    setTimeLeft(modeDurations[newMode]);
    setIsRunning(false);
  };

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'focus') {
        const nextCount = completedSessions + 1;
        setCompletedSessions(nextCount);
        localStorage.setItem('aether_focus_sessions', nextCount.toString());
        // Auto transition to short break
        handleModeChange('shortBreak');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, completedSessions]);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(modeDurations[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / modeDurations[mode];

  return (
    <div className="flex flex-col items-center justify-between h-full p-6 text-slate-200">
      {/* Top Mode Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-white/10 rounded-xl">
        <button
          onClick={() => handleModeChange('focus')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            mode === 'focus'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Deep Focus
        </button>
        <button
          onClick={() => handleModeChange('shortBreak')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            mode === 'shortBreak'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Short Rest
        </button>
        <button
          onClick={() => handleModeChange('longBreak')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            mode === 'longBreak'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Long Rest
        </button>
      </div>

      {/* Timer Circle */}
      <div className="relative flex flex-col items-center justify-center my-6">
        <svg className="w-56 h-56 transform -rotate-90">
          <circle
            cx="112"
            cy="112"
            r="98"
            className="text-white/5"
            strokeWidth="6"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="112"
            cy="112"
            r="98"
            className="text-cyan-400 transition-all duration-1000 ease-linear"
            strokeWidth="6"
            strokeDasharray={2 * Math.PI * 98}
            strokeDashoffset={2 * Math.PI * 98 * (1 - progress)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="font-mono-nums text-5xl font-light tracking-tight text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-xs uppercase tracking-wider text-slate-400 mt-1">
            {isRunning ? 'Session Active' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Intention Input */}
      <div className="w-full max-w-sm mb-4">
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 text-center">
          Current Focus Intention
        </label>
        <input
          type="text"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="What are you working on right now?"
          className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-center text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
        />
      </div>

      {/* Controls & Stats */}
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-transform active:scale-95 shadow-lg shadow-cyan-500/25"
            aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats counter */}
        <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Completed focus blocks:</span>
          <span className="font-mono-nums font-semibold text-white">{completedSessions}</span>
        </div>
      </div>
    </div>
  );
}
