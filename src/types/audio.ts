export type VisualizerId =
  | 'spectrum'
  | 'spectrum-radial'
  | 'spectrum-mirror'
  | 'spectrum-led'
  | 'aurora'
  | 'oscilloscope'
  | 'cosmos'
  | 'liquid'
  | 'nebula'
  | 'geometry'
  | 'tunnel'
  | 'particles'
  | 'monolith'
  | 'bloom'
  | 'retro-terminal';

export type PaletteId =
  | 'midnight'
  | 'aurora'
  | 'ultraviolet'
  | 'solar'
  | 'arctic'
  | 'monochrome'
  | 'dreamscape'
  | 'toxic';

export interface Palette {
  id: PaletteId;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  glow: string;
  stops: [string, string, string];
}

export interface AudioMetrics {
  bass: number; // 0 to 1
  mid: number; // 0 to 1
  treble: number; // 0 to 1
  energy: number; // 0 to 1
  beat: boolean; // transient kick hit
  beatIntensity: number; // 0 to 1 decay envelope
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  rms: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  url: string;
  file?: File;
  isProcedural?: boolean;
  coverArt?: string;
  addedAt: number;
}

export interface VisualizerSettings {
  sensitivity: number; // 0.5 to 2.5
  motionSpeed: number; // 0.2 to 2.0
  density: 'low' | 'medium' | 'high';
  bloomIntensity: number; // 0 to 1
  strokeWidth: number; // 1 to 5
  reactiveUi: boolean;
  reducedMotion: boolean;
  performanceQuality: 'auto' | 'high' | 'eco';
}

export type ExperienceId =
  | null
  | 'focus'
  | 'ambient'
  | 'particles'
  | 'zen'
  | 'doodle'
  | 'memory'
  | 'breathing'
  | 'clock';

export interface AmbientChannel {
  id: 'rain' | 'wind' | 'fire' | 'ocean' | 'brown' | 'pink';
  name: string;
  description: string;
  volume: number; // 0 to 1
  muted: boolean;
  active: boolean;
}
