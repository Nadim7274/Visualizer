import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

interface AuroraParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

let particles: AuroraParticle[] = [];

export function renderAurora({ ctx, width, height, metrics, palette, settings, time }: VisualizerRenderContext) {
  // Clear with deep atmospheric fade
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const bassBoost = metrics.bass * settings.sensitivity * 0.8;
  const energy = metrics.energy * settings.sensitivity;
  const speed = settings.motionSpeed * 0.85;

  // Luminous atmospheric glow in background
  const glowGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    10,
    width * 0.5,
    height * 0.45,
    width * 0.6
  );
  glowGrad.addColorStop(0, setAlpha(palette.glow, 0.28));
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw 5 layered flowing luminous ribbons
  const ribbonCount = 5;
  const baseBandY = height * 0.5;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let r = 0; r < ribbonCount; r++) {
    const rFrac = r / ribbonCount;
    const waveOffset = r * 0.8;
    const yOffset = (r - ribbonCount / 2) * 35;
    const ribbonAlpha = 0.22 + rFrac * 0.2;

    ctx.beginPath();
    ctx.moveTo(0, height);

    // Build the ribbon curve with sample points
    const points = 40;
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const progress = i / points;

      // Extract frequency slice for this segment
      const freqIndex = Math.floor(progress * Math.min(60, metrics.frequencyData.length || 1));
      const freqVal = (metrics.frequencyData[freqIndex] || 0) / 255;

      const wave1 = Math.sin(progress * 4.5 + time * 0.001 * speed + waveOffset) * (36 + bassBoost * 45);
      const wave2 = Math.cos(progress * 8.0 - time * 0.0014 * speed + waveOffset * 1.5) * (18 + freqVal * 25);
      const wave3 = Math.sin(progress * 12.0 + time * 0.0018 * speed) * (10 * (1 + metrics.treble));

      const y = baseBandY + yOffset + wave1 + wave2 + wave3;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.lineTo(width, height);
    ctx.closePath();

    // Create luminous vertical gradient
    const grad = ctx.createLinearGradient(0, baseBandY - 120, 0, height);
    const colorA = r % 2 === 0 ? palette.primary : palette.secondary;
    const colorB = palette.accent;

    grad.addColorStop(0, colorA);
    grad.addColorStop(0.4, colorB);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.globalAlpha = ribbonAlpha;
    ctx.fill();

    // Ribbon crest highlight stroke
    ctx.lineWidth = settings.strokeWidth + (r === 2 ? 1.5 : 0.5);
    ctx.strokeStyle = colorA;
    ctx.globalAlpha = 0.5 + energy * 0.4;
    ctx.stroke();
  }

  ctx.restore();

  // Floating star dust particles responding to treble
  const targetCount = settings.density === 'high' ? 90 : settings.density === 'medium' ? 50 : 25;
  if (particles.length !== targetCount) {
    particles = Array.from({ length: targetCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.8 + 0.3,
      alpha: Math.random() * 0.6 + 0.2,
    }));
  }

  ctx.fillStyle = palette.primary;
  for (const p of particles) {
    p.y -= p.speed * (1 + metrics.treble * 2.5);
    p.x += Math.sin(p.y * 0.01 + time * 0.001) * 0.5;

    if (p.y < 0) {
      p.y = height;
      p.x = Math.random() * width;
    }

    ctx.globalAlpha = p.alpha * (0.3 + metrics.treble * 0.7);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 + metrics.treble * 0.8), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}
