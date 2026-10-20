import { AudioMetrics, Palette, VisualizerSettings } from '../types/audio';

export interface VisualizerRenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  metrics: AudioMetrics;
  palette: Palette;
  settings: VisualizerSettings;
  time: number;
  mouse: { x: number; y: number; isDown: boolean };
}

export type VisualizerRenderer = (ctx: VisualizerRenderContext) => void;
