import React from 'react';
import {
  X,
  Timer,
  Sliders,
  Sparkles,
  Flower2,
  Paintbrush,
  Brain,
  Wind,
  Clock,
} from 'lucide-react';
import { ExperienceId } from '../types/audio';
import { FocusRoom } from './experiences/FocusRoom';
import { AmbientMixer } from './experiences/AmbientMixer';
import { ParticlePlayground } from './experiences/ParticlePlayground';
import { ZenGarden } from './experiences/ZenGarden';
import { DoodleCanvas } from './experiences/DoodleCanvas';
import { MemoryGame } from './experiences/MemoryGame';
import { BreathingGuide } from './experiences/BreathingGuide';
import { AmbientClock } from './experiences/AmbientClock';

interface ExperienceDrawerProps {
  activeExperience: ExperienceId;
  onSelectExperience: (id: ExperienceId) => void;
  onClose: () => void;
}

export function ExperienceDrawer({
  activeExperience,
  onSelectExperience,
  onClose,
}: ExperienceDrawerProps) {
  if (!activeExperience) return null;

  const experiences = [
    { id: 'focus' as const, name: 'Focus Room', icon: Timer, desc: 'Pomodoro timer' },
    { id: 'ambient' as const, name: 'Ambient Mixer', icon: Sliders, desc: 'Procedural noise' },
    { id: 'particles' as const, name: 'Particles', icon: Sparkles, desc: 'Kinetic physics' },
    { id: 'zen' as const, name: 'Zen Garden', icon: Flower2, desc: 'Raked sand' },
    { id: 'doodle' as const, name: 'Doodle', icon: Paintbrush, desc: 'Neon drawing' },
    { id: 'memory' as const, name: 'Memory Game', icon: Brain, desc: 'Concentration' },
    { id: 'breathing' as const, name: 'Breathing', icon: Wind, desc: 'Paced breath' },
    { id: 'clock' as const, name: 'Desk Clock', icon: Clock, desc: 'Minimalist time' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl h-[88vh] bg-[#0b0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-slate-900/60">
          {/* Experience Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {experiences.map((exp) => {
              const Icon = exp.icon;
              const isActive = activeExperience === exp.id;
              return (
                <button
                  key={exp.id}
                  onClick={() => onSelectExperience(exp.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{exp.name}</span>
                </button>
              );
            })}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-4 shrink-0"
            aria-label="Close Experience"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Experience Content Viewport */}
        <div className="flex-1 overflow-hidden relative">
          {activeExperience === 'focus' && <FocusRoom onClose={onClose} />}
          {activeExperience === 'ambient' && <AmbientMixer />}
          {activeExperience === 'particles' && <ParticlePlayground />}
          {activeExperience === 'zen' && <ZenGarden />}
          {activeExperience === 'doodle' && <DoodleCanvas />}
          {activeExperience === 'memory' && <MemoryGame />}
          {activeExperience === 'breathing' && <BreathingGuide />}
          {activeExperience === 'clock' && <AmbientClock />}
        </div>
      </div>
    </div>
  );
}
