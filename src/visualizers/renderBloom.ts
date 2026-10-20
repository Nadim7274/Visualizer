import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

export function renderBloom({
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
  const maxRadius = Math.min(width, height) * 0.38;

  const energy = metrics.energy * settings.sensitivity;
  const bass = metrics.bass * settings.sensitivity;
  const rot = time * 0.0005 * settings.motionSpeed;

  ctx.save();
  ctx.translate(cx, cy);

  // Soft radiant center glow
  const centerGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, maxRadius * 1.2);
  centerGlow.addColorStop(0, palette.glow);
  centerGlow.addColorStop(0.5, setAlpha(palette.primary, 0.15));
  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  const rings = 5;
  const petalsPerRing = 12;

  ctx.globalCompositeOperation = 'screen';

  for (let r = 1; r <= rings; r++) {
    const fraction = r / rings;
    const ringRadius = maxRadius * fraction * (0.8 + bass * 0.4);
    const ringRot = rot * (r % 2 === 0 ? 1 : -1) * (1 + (rings - r) * 0.2);

    for (let p = 0; p < petalsPerRing; p++) {
      const angle = (p / petalsPerRing) * Math.PI * 2 + ringRot;
      const freqSample = (metrics.frequencyData[(p * 4 + r * 8) % 64] || 0) / 255;
      const petalLength = (35 + r * 20) * (1 + freqSample * 0.45 * settings.sensitivity);
      const petalWidth = (12 + r * 5) * (1 + energy * 0.3);

      ctx.save();
      ctx.rotate(angle);
      ctx.translate(ringRadius, 0);

      // Draw curved organic petal
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        petalWidth,
        -petalLength * 0.4,
        petalWidth * 0.8,
        -petalLength * 0.8,
        0,
        -petalLength
      );
      ctx.bezierCurveTo(
        -petalWidth * 0.8,
        -petalLength * 0.8,
        -petalWidth,
        -petalLength * 0.4,
        0,
        0
      );
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, -petalLength);
      const color = r % 2 === 0 ? palette.primary : palette.accent;
      grad.addColorStop(0, setAlpha(color, 0.15));
      grad.addColorStop(0.7, setAlpha(color, 0.55));
      grad.addColorStop(1, '#ffffff');

      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.35 + fraction * 0.45;
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = settings.strokeWidth * 0.8;
      ctx.globalAlpha = 0.3 + freqSample * 0.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  // Golden ratio stamen points in center
  const centerStamenCount = 24;
  ctx.fillStyle = palette.primary;
  for (let i = 0; i < centerStamenCount; i++) {
    const phi = i * 2.39996; // Golden angle
    const dist = Math.sqrt(i / centerStamenCount) * 28 * (1 + bass * 0.5);
    const px = Math.cos(phi + rot * 2) * dist;
    const py = Math.sin(phi + rot * 2) * dist;

    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(px, py, 1.8 + metrics.treble * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
