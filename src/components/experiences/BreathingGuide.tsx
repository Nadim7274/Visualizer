import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function BreathingGuide() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [progress, setProgress] = useState(0); // 0 to 1 inside current phase
  const [cycleCount, setCycleCount] = useState(0);
  const [technique, setTechnique] = useState<'box' | 'calm'>('box');

  // Box: 4s inhale, 4s hold, 4s exhale, 4s rest
  // Calm: 4s inhale, 7s hold, 8s exhale
  const durations = technique === 'box'
    ? { Inhale: 4000, Hold: 4000, Exhale: 4000, Rest: 4000 }
    : { Inhale: 4000, Hold: 7000, Exhale: 8000, Rest: 1000 };

  useEffect(() => {
    if (!isActive) return;

    let startTime = Date.now();
    let currentPhase = phase;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const curDuration = durations[currentPhase];

      if (elapsed >= curDuration) {
        // Transition to next phase
        startTime = Date.now();
        if (currentPhase === 'Inhale') {
          currentPhase = 'Hold';
        } else if (currentPhase === 'Hold') {
          currentPhase = 'Exhale';
        } else if (currentPhase === 'Exhale') {
          currentPhase = technique === 'box' ? 'Rest' : 'Inhale';
          if (technique === 'calm') setCycleCount((c) => c + 1);
        } else {
          currentPhase = 'Inhale';
          setCycleCount((c) => c + 1);
        }
        setPhase(currentPhase);
        setProgress(0);
      } else {
        setProgress(elapsed / curDuration);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isActive, technique, phase]);

  const handleReset = () => {
    setIsActive(false);
    setPhase('Inhale');
    setProgress(0);
    setCycleCount(0);
  };

  // Compute visual circle scale
  let circleScale = 1;
  if (phase === 'Inhale') {
    circleScale = 1 + progress * 0.8;
  } else if (phase === 'Hold') {
    circleScale = 1.8;
  } else if (phase === 'Exhale') {
    circleScale = 1.8 - progress * 0.8;
  } else {
    circleScale = 1.0;
  }

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'Inhale': return 'Breathe in slowly through your nose...';
      case 'Hold': return 'Hold your breath gently...';
      case 'Exhale': return 'Release slowly through your mouth...';
      case 'Rest': return 'Rest before the next breath...';
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full p-6 text-slate-200">
      {/* Technique switch */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-white/10 rounded-xl">
        <button
          onClick={() => {
            setTechnique('box');
            handleReset();
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            technique === 'box' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Box Breathing (4-4-4-4)
        </button>
        <button
          onClick={() => {
            setTechnique('calm');
            handleReset();
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            technique === 'calm' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Deep Calm (4-7-8)
        </button>
      </div>

      {/* Breathing Sphere */}
      <div className="relative flex flex-col items-center justify-center my-8">
        <div
          className="w-48 h-48 rounded-full border border-cyan-400/40 bg-radial from-cyan-400/20 via-cyan-900/10 to-transparent flex items-center justify-center transition-transform duration-300 ease-out shadow-2xl shadow-cyan-500/20"
          style={{ transform: `scale(${circleScale})` }}
        >
          <div className="w-24 h-24 rounded-full bg-cyan-400/10 border border-cyan-400/30 backdrop-blur-sm" />
        </div>

        <div className="absolute flex flex-col items-center pointer-events-none">
          <span className="text-2xl font-light tracking-wide text-white font-sans">
            {isActive ? phase : 'Ready'}
          </span>
          <span className="text-xs text-slate-400 mt-1">
            {isActive ? `${Math.round((1 - progress) * (durations[phase] / 1000))}s` : 'Press play to begin'}
          </span>
        </div>
      </div>

      {/* Instructional text */}
      <p className="text-xs text-slate-400 text-center max-w-xs h-6">
        {isActive ? getPhaseInstruction() : 'Take a moment to align your breath with sound.'}
      </p>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-transform active:scale-95 shadow-lg shadow-cyan-500/25"
          >
            {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Cycles completed: <strong className="text-slate-300 font-mono-nums">{cycleCount}</strong>
        </span>
      </div>
    </div>
  );
}
