import { VisualizerRenderContext } from './types';

export function renderGeometry({
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

  const bassScale = 1 + metrics.bass * settings.sensitivity * 0.6;
  const rot = time * 0.0008 * settings.motionSpeed;

  ctx.save();
  ctx.translate(cx, cy);

  // Concentric geometric rings (hexagons, octagons, dodecagons)
  const layerCount = 6;
  for (let l = 1; l <= layerCount; l++) {
    const fraction = l / layerCount;
    const r = maxRadius * fraction * bassScale;
    const sides = 3 + l * 2; // triangle, pentagon, heptagon, etc.
    const dir = l % 2 === 0 ? 1 : -1;
    const angleOffset = rot * dir * (0.8 + l * 0.2);

    ctx.save();
    ctx.rotate(angleOffset);

    // Draw polygon
    ctx.beginPath();
    for (let s = 0; s < sides; s++) {
      const theta = (s / sides) * Math.PI * 2;
      const freqVal = (metrics.frequencyData[(s * 8 + l * 12) % 128] || 0) / 255;
      const vertexR = r * (1 + freqVal * 0.15 * settings.sensitivity);

      const vx = Math.cos(theta) * vertexR;
      const vy = Math.sin(theta) * vertexR;

      if (s === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();

    ctx.lineWidth = settings.strokeWidth * (l === layerCount ? 1.5 : 1);
    ctx.strokeStyle = l % 2 === 0 ? palette.primary : palette.accent;
    ctx.globalAlpha = 0.4 + (l / layerCount) * 0.5;
    ctx.stroke();

    // Sacred geometry star cross lines to center
    if (l % 2 === 0) {
      ctx.beginPath();
      for (let s = 0; s < sides; s++) {
        const theta = (s / sides) * Math.PI * 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(theta) * r, Math.sin(theta) * r);
      }
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = palette.secondary;
      ctx.globalAlpha = 0.25;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Treble-driven outer constellation points
  const outerPoints = 32;
  const outerR = maxRadius * 1.15 * bassScale;
  ctx.fillStyle = palette.primary;
  for (let i = 0; i < outerPoints; i++) {
    const theta = (i / outerPoints) * Math.PI * 2 + rot * 2;
    const freqVal = (metrics.frequencyData[i * 4] || 0) / 255;
    const pR = outerR + freqVal * 40;
    const px = Math.cos(theta) * pR;
    const py = Math.sin(theta) * pR;

    ctx.globalAlpha = 0.5 + freqVal * 0.5;
    ctx.beginPath();
    ctx.arc(px, py, 2 + metrics.treble * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
