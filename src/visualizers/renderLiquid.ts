import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

interface LiquidBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  phase: number;
  colorIdx: number;
}

let blobs: LiquidBlob[] = [];

export function renderLiquid({
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

  const cx = width * 0.5;
  const cy = height * 0.5;
  const count = settings.density === 'high' ? 8 : settings.density === 'medium' ? 6 : 4;

  if (blobs.length !== count) {
    blobs = Array.from({ length: count }, (_, i) => ({
      x: cx + (Math.random() - 0.5) * width * 0.4,
      y: cy + (Math.random() - 0.5) * height * 0.4,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      baseRadius: 100 + i * 25,
      phase: Math.random() * Math.PI * 2,
      colorIdx: i % 3,
    }));
  }

  const bassFactor = 1 + metrics.bass * settings.sensitivity * 1.6;
  const colors = [palette.primary, palette.secondary, palette.accent];

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  blobs.forEach((blob, idx) => {
    // Wander motion
    blob.x += blob.vx * settings.motionSpeed;
    blob.y += blob.vy * settings.motionSpeed;

    // Bounce off margins
    if (blob.x < width * 0.2 || blob.x > width * 0.8) blob.vx *= -1;
    if (blob.y < height * 0.2 || blob.y > height * 0.8) blob.vy *= -1;

    const currentRadius = blob.baseRadius * bassFactor;
    const color = colors[blob.colorIdx];

    // Radial gradient glow
    const grad = ctx.createRadialGradient(
      blob.x,
      blob.y,
      currentRadius * 0.1,
      blob.x,
      blob.y,
      currentRadius
    );
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, setAlpha(color, 0.5));
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;

    // Draw deformed organic wave contour
    ctx.beginPath();
    const vertices = 24;
    for (let i = 0; i < vertices; i++) {
      const angle = (i / vertices) * Math.PI * 2;
      const freqSample = (metrics.frequencyData[i * 4] || 0) / 255;
      const distortion = Math.sin(angle * 4 + time * 0.003 + blob.phase) * (20 + freqSample * 40 * settings.sensitivity);
      const r = currentRadius + distortion;
      const vx = blob.x + Math.cos(angle) * r;
      const vy = blob.y + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(vx, vy);
      } else {
        ctx.lineTo(vx, vy);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Caustic fluid edge
    ctx.lineWidth = settings.strokeWidth;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.25 + metrics.mid * 0.35;
    ctx.stroke();
  });

  ctx.restore();
}
