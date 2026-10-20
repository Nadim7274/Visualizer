import { VisualizerRenderContext } from './types';

let tunnelZ = 0;

export function renderTunnel({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
}: VisualizerRenderContext) {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.max(width, height) * 0.7;

  // Advance tunnel depth smoothly
  const speed = (1.5 + metrics.bass * 2.2 * settings.sensitivity + (metrics.beat ? 2.0 : 0)) * settings.motionSpeed;
  tunnelZ = (tunnelZ + speed) % 100;

  const ringCount = 20;
  const spokes = 16;
  const colors = [palette.primary, palette.secondary, palette.accent];

  ctx.save();
  ctx.lineWidth = settings.strokeWidth;

  // Perspective spokes radiating from center
  ctx.strokeStyle = palette.secondary;
  ctx.globalAlpha = 0.25 + metrics.mid * 0.3;
  ctx.beginPath();
  for (let s = 0; s < spokes; s++) {
    const angle = (s / spokes) * Math.PI * 2 + tunnelZ * 0.005;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
  }
  ctx.stroke();

  // Perspective rings moving forward
  for (let i = ringCount; i >= 1; i--) {
    const ringDepth = (i * 50 - tunnelZ) / (ringCount * 50);
    if (ringDepth <= 0 || ringDepth > 1) continue;

    // Perspective projection: smaller when far, larger when close
    const radius = Math.pow(1 - ringDepth, 2.2) * maxRadius;
    const alpha = Math.pow(1 - ringDepth, 1.2);
    const color = colors[i % colors.length];

    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * (0.4 + metrics.energy * 0.6);

    ctx.beginPath();
    // Polygon tunnel shape (octagon with slight waviness based on audio)
    const sides = 8;
    for (let s = 0; s <= sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + tunnelZ * 0.01;
      const freqSample = (metrics.frequencyData[(s * 10 + i * 4) % 64] || 0) / 255;
      const modRadius = radius * (1 + freqSample * 0.12 * settings.sensitivity);

      const x = cx + Math.cos(angle) * modRadius;
      const y = cy + Math.sin(angle) * modRadius;

      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Vanishing point core glow
  const centerGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 80 * (1 + metrics.bass));
  centerGlow.addColorStop(0, '#ffffff');
  centerGlow.addColorStop(0.3, palette.glow);
  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, 80 * (1 + metrics.bass), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
