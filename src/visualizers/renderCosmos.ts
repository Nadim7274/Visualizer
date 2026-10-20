import { VisualizerRenderContext } from './types';

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  size: number;
  color: string;
}

let stars: Star[] = [];

export function renderCosmos({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
}: VisualizerRenderContext) {
  // Deep space with slight trail fade
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const starCount = settings.density === 'high' ? 450 : settings.density === 'medium' ? 280 : 150;

  if (stars.length !== starCount) {
    stars = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      prevZ: 0,
      size: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.4 ? palette.primary : palette.accent,
    }));
  }

  // Speed boosted gently by music energy
  const baseSpeed = 2.2 * settings.motionSpeed;
  const warpSpeed = baseSpeed * (1 + metrics.bass * 1.4 + (metrics.beat ? 1.5 : 0));

  // Center galactic core glow
  const coreGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 220);
  coreGrad.addColorStop(0, palette.glow);
  coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.lineWidth = settings.strokeWidth;

  for (const star of stars) {
    star.prevZ = star.z;
    star.z -= warpSpeed;

    if (star.z <= 0) {
      star.z = width;
      star.prevZ = star.z;
      star.x = (Math.random() - 0.5) * width * 2;
      star.y = (Math.random() - 0.5) * height * 2;
    }

    const k = 300 / star.z;
    const px = star.x * k + cx;
    const py = star.y * k + cy;

    const prevK = 300 / star.prevZ;
    const prevPx = star.x * prevK + cx;
    const prevPy = star.y * prevK + cy;

    if (px < 0 || px > width || py < 0 || py > height) {
      star.z = 0; // reset
      continue;
    }

    const alpha = Math.min(1, (1 - star.z / width) * (0.5 + metrics.treble * 0.8));
    ctx.strokeStyle = star.color;
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(prevPx, prevPy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Star point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, star.size * (1 + metrics.energy), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
