import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

interface NebulaParticle {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  size: number;
  colorIdx: number;
  alpha: number;
}

let nebulaParticles: NebulaParticle[] = [];

export function renderNebula({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
  time,
}: VisualizerRenderContext) {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxDim = Math.min(width, height) * 0.45;
  const targetCount = settings.density === 'high' ? 350 : settings.density === 'medium' ? 220 : 120;

  if (nebulaParticles.length !== targetCount) {
    nebulaParticles = Array.from({ length: targetCount }, (_, i) => {
      const dist = Math.pow(Math.random(), 0.7) * maxDim;
      return {
        angle: Math.random() * Math.PI * 2,
        radius: dist,
        baseRadius: dist,
        speed: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 5 + 2,
        colorIdx: i % 3,
        alpha: Math.random() * 0.5 + 0.3,
      };
    });
  }

  const expansion = 1 + metrics.bass * settings.sensitivity * 0.8;
  const colors = [palette.primary, palette.secondary, palette.accent];

  // Deep nebula volumetric back-glow
  const bgGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxDim * expansion * 1.2);
  bgGlow.addColorStop(0, palette.glow);
  bgGlow.addColorStop(0.5, setAlpha(palette.secondary, 0.2));
  bgGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  nebulaParticles.forEach((p, idx) => {
    p.angle += p.speed * settings.motionSpeed * (1 + metrics.energy);
    // Audio responsive breathing radius
    const freqSample = (metrics.frequencyData[idx % 64] || 0) / 255;
    const currentR = p.baseRadius * expansion + Math.sin(time * 0.002 + p.angle * 3) * (15 + freqSample * 30);

    const x = cx + Math.cos(p.angle) * currentR;
    const y = cy + Math.sin(p.angle) * currentR * 0.7; // slight elliptical perspective

    const color = colors[p.colorIdx];
    const particleSize = p.size * (1 + metrics.treble * 1.2);

    const radGrad = ctx.createRadialGradient(x, y, 0, x, y, particleSize * 2.5);
    radGrad.addColorStop(0, color);
    radGrad.addColorStop(0.5, setAlpha(color, 0.4));
    radGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = radGrad;
    ctx.globalAlpha = p.alpha * (0.6 + metrics.mid * 0.6);

    ctx.beginPath();
    ctx.arc(x, y, particleSize * 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
