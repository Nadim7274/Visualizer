import React, { useState, useEffect, useCallback } from 'react';
import {
  VisualizerId,
  PaletteId,
  VisualizerSettings,
  ExperienceId,
  Track,
} from './types/audio';
import { audioEngine } from './services/audioEngine';
import { PALETTES, VISUALIZERS } from './constants/palettes';
import { generateDemoTrack } from './services/proceduralMusic';
import { TopBar } from './components/TopBar';
import { VisualizationStage } from './components/VisualizationStage';
import { AudioPlayer } from './components/AudioPlayer';
import { VisualizerSelectorModal } from './components/VisualizerSelectorModal';
import { ExperienceDrawer } from './components/ExperienceDrawer';
import { TrackLibraryModal } from './components/TrackLibraryModal';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_SETTINGS: VisualizerSettings = {
  sensitivity: 0.85,
  motionSpeed: 0.85,
  density: 'medium',
  bloomIntensity: 0.7,
  strokeWidth: 2,
  reactiveUi: true,
  reducedMotion: false,
  performanceQuality: 'auto',
};

export default function App() {
  // Audio state
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Visualizer & Theme state: default to 'spectrum'
  const [activeVisualizer, setActiveVisualizer] = useState<VisualizerId>(() => {
    const saved = localStorage.getItem('aether_visualizer');
    return (saved as VisualizerId) || 'spectrum';
  });

  const [currentPalette, setCurrentPalette] = useState<PaletteId>(() => {
    return (localStorage.getItem('aether_palette') as PaletteId) || 'aurora';
  });

  const [settings, setSettings] = useState<VisualizerSettings>(() => {
    try {
      const saved = localStorage.getItem('aether_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [favorites, setFavorites] = useState<VisualizerId[]>(() => {
    try {
      const saved = localStorage.getItem('aether_favorites');
      return saved ? JSON.parse(saved) : ['spectrum', 'spectrum-radial', 'spectrum-mirror', 'aurora', 'oscilloscope'];
    } catch {
      return ['spectrum', 'spectrum-radial', 'spectrum-mirror', 'aurora', 'oscilloscope'];
    }
  });

  // UI Dialog States
  const [activeExperience, setActiveExperience] = useState<ExperienceId>(null);
  const [isVisualizerModalOpen, setIsVisualizerModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initial demo preload: load default synthesized track on first turn so the app is instantly ready
  useEffect(() => {
    let isMounted = true;
    generateDemoTrack('astral')
      .then((track) => {
        if (isMounted) {
          audioEngine.addTracks([track]);
        }
      })
      .catch((err) => console.warn('Could not load initial demo track', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to Audio Engine state updates
  useEffect(() => {
    const unsubTrack = audioEngine.onTrackChange((track) => setCurrentTrack(track));
    const unsubState = audioEngine.onPlaybackState((playing) => setIsPlaying(playing));
    const unsubPlaylist = audioEngine.onPlaylistChange((list) => setPlaylist(list));

    return () => {
      unsubTrack();
      unsubState();
      unsubPlaylist();
    };
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('aether_visualizer', activeVisualizer);
  }, [activeVisualizer]);

  useEffect(() => {
    localStorage.setItem('aether_palette', currentPalette);
  }, [currentPalette]);

  useEffect(() => {
    localStorage.setItem('aether_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('aether_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleUpdateSettings = (partial: Partial<VisualizerSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setCurrentPalette('aurora');
    setActiveVisualizer('spectrum');
  };

  const handleToggleFavorite = (id: VisualizerId) => {
    setFavorites((prev: VisualizerId[]) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Fullscreen support
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Error attempting to exit fullscreen:', err);
        });
      }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Randomize preset (picks compatible visualizer + palette with smooth transition without stopping audio)
  const handleRandomize = useCallback(() => {
    const allVis = VISUALIZERS.map((v) => v.id);
    const randomVis = allVis[Math.floor(Math.random() * allVis.length)];
    const allPalettes = Object.keys(PALETTES) as PaletteId[];
    const randomPal = allPalettes[Math.floor(Math.random() * allPalettes.length)];

    setActiveVisualizer(randomVis);
    setCurrentPalette(randomPal);
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          audioEngine.togglePlay();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          audioEngine.nextTrack();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          audioEngine.prevTrack();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audioEngine) {
            // seek back 5s
            const metrics = audioEngine.getMetrics();
            // We use currentTime from audio element directly
            const cur = (audioEngine as unknown as { audioElement?: HTMLAudioElement }).audioElement?.currentTime || 0;
            audioEngine.seek(cur - 5);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audioEngine) {
            const cur = (audioEngine as unknown as { audioElement?: HTMLAudioElement }).audioElement?.currentTime || 0;
            audioEngine.seek(cur + 5);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          audioEngine.setVolume(Math.min(1, audioEngine.getVolume() + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          audioEngine.setVolume(Math.max(0, audioEngine.getVolume() - 0.05));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'Escape':
          e.preventDefault();
          setIsVisualizerModalOpen(false);
          setIsLibraryModalOpen(false);
          setIsSettingsModalOpen(false);
          setActiveExperience(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleFullscreen]);

  const palette = (PALETTES as Record<PaletteId, import('./types/audio').Palette>)[currentPalette] || PALETTES.aurora;

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden bg-[#07080b] text-slate-100 font-sans"
      style={{
        backgroundColor: palette.background,
      }}
    >
      {/* Top Bar (Hidden in Fullscreen presentation mode) */}
      {!isFullscreen && (
        <TopBar
          activeVisualizer={activeVisualizer}
          onOpenVisualizerDrawer={() => setIsVisualizerModalOpen(true)}
          onOpenExperienceDrawer={() => setActiveExperience('focus')}
          onOpenLibrary={() => setIsLibraryModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onRandomize={handleRandomize}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          isPlaying={isPlaying}
        />
      )}

      {/* Main Visualizer Stage */}
      <VisualizationStage
        activeVisualizer={activeVisualizer}
        onSelectVisualizer={(id) => setActiveVisualizer(id)}
        palette={palette}
        settings={settings}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onOpenVisualizerDrawer={() => setIsVisualizerModalOpen(true)}
        onOpenLibrary={() => setIsLibraryModalOpen(true)}
      />

      {/* Persistent Audio Player (bottom bar) */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onOpenLibrary={() => setIsLibraryModalOpen(true)}
        onOpenExperienceDrawer={() => setActiveExperience('focus')}
      />

      {/* Modals & Experiences */}
      <VisualizerSelectorModal
        isOpen={isVisualizerModalOpen}
        onClose={() => setIsVisualizerModalOpen(false)}
        activeVisualizer={activeVisualizer}
        onSelectVisualizer={(id) => setActiveVisualizer(id)}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />

      <ExperienceDrawer
        activeExperience={activeExperience}
        onSelectExperience={(id) => setActiveExperience(id)}
        onClose={() => setActiveExperience(null)}
      />

      <TrackLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        playlist={playlist}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        currentPalette={currentPalette}
        onSelectPalette={(id) => setCurrentPalette(id)}
        onResetSettings={handleResetSettings}
      />
    </div>
  );
}
