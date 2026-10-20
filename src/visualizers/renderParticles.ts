import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

interface KineticParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  size: number;
  colorIdx: number;
}

let particles: KineticParticle[] = [];

export function renderParticles({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
  mouse,
}: VisualizerRenderContext) {
  // Soft fade trail for beautiful particle motion
  ctx.fillStyle = setAlpha(palette.background, 0.15);
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const count = settings.density === 'high' ? 600 : settings.density === 'medium' ? 400 : 200;

  if (particles.length !== count) {
    particles = Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.min(width, height) * 0.42;
      return {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        originX: cx + Math.cos(angle) * dist,
        originY: cy + Math.sin(angle) * dist,
        size: Math.random() * 2.2 + 1.2,
        colorIdx: i % 3,
      };
    });
  }

  const colors = [palette.primary, palette.secondary, palette.accent];
  const bassForce = metrics.bass * settings.sensitivity * 2.8;
  const isBeat = metrics.beat;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const p of particles) {
    // Distance from center
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Orbital vortex rotational velocity
    const perpX = -dy / dist;
    const perpY = dx / dist;
    p.vx += perpX * 0.25 * settings.motionSpeed;
    p.vy += perpY * 0.25 * settings.motionSpeed;

    // Spring return to orbit
    p.vx += (p.originX - p.x) * 0.015;
    p.vy += (p.originY - p.y) * 0.015;

    // Bass / Beat gentle ripple outwards
    if (bassForce > 0.8 || isBeat) {
      const explodeFactor = isBeat ? 4.5 : bassForce;
      p.vx += (dx / dist) * explodeFactor;
      p.vy += (dy / dist) * explodeFactor;
    }

    // Mouse attraction / interaction
    if (mouse.x > 0 && mouse.y > 0) {
      const mdx = mouse.x - p.x;
      const mdy = mouse.y - p.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 180) {
        const pull = (180 - mdist) * (mouse.isDown ? -0.1 : 0.04);
        p.vx += (mdx / mdist) * pull;
        p.vy += (mdy / mdist) * pull;
      }
    }

    // Velocity damping
    p.vx *= 0.94;
    p.vy *= 0.94;

    p.x += p.vx;
    p.y += p.vy;

    // Draw particle
    const color = colors[p.colorIdx];
    const pSize = p.size * (1 + metrics.treble * 1.5);

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5 + metrics.energy * 0.5;

    ctx.beginPath();
    ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
