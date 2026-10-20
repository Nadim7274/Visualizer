import { VisualizerId } from '../types/audio';
import { VisualizerRenderer } from './types';
import { renderAurora } from './renderAurora';
import { renderOscilloscope } from './renderOscilloscope';
import { renderSpectrum } from './renderSpectrum';
import { renderSpectrumRadial } from './renderSpectrumRadial';
import { renderSpectrumMirror } from './renderSpectrumMirror';
import { renderSpectrumLED } from './renderSpectrumLED';
import { renderCosmos } from './renderCosmos';
import { renderLiquid } from './renderLiquid';
import { renderNebula } from './renderNebula';
import { renderGeometry } from './renderGeometry';
import { renderTunnel } from './renderTunnel';
import { renderParticles } from './renderParticles';
import { renderMonolith } from './renderMonolith';
import { renderBloom } from './renderBloom';
import { renderRetroTerminal } from './renderRetroTerminal';

export const VISUALIZER_RENDERERS: Record<VisualizerId, VisualizerRenderer> = {
  spectrum: renderSpectrum,
  'spectrum-radial': renderSpectrumRadial,
  'spectrum-mirror': renderSpectrumMirror,
  'spectrum-led': renderSpectrumLED,
  aurora: renderAurora,
  oscilloscope: renderOscilloscope,
  cosmos: renderCosmos,
  liquid: renderLiquid,
  nebula: renderNebula,
  geometry: renderGeometry,
  tunnel: renderTunnel,
  particles: renderParticles,
  monolith: renderMonolith,
  bloom: renderBloom,
  'retro-terminal': renderRetroTerminal,
};

export * from './types';
