import { VisualizerRenderContext } from './types';

export function renderMonolith({
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
  const cy = height * 0.48;
  const sliceCount = 18;
  const sliceThickness = 12;
  const sliceSpacing = 8;
  const monolithWidth = Math.min(width * 0.28, 220);
  const monolithDepth = monolithWidth * 0.45;

  const rot = Math.sin(time * 0.0006 * settings.motionSpeed) * 0.25;

  ctx.save();
  ctx.translate(cx, cy);

  // Background subtle halo
  const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, monolithWidth * 2);
  halo.addColorStop(0, palette.glow);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  // Render slices from bottom to top
  const totalHeight = sliceCount * (sliceThickness + sliceSpacing);
  const startY = totalHeight / 2;

  for (let i = 0; i < sliceCount; i++) {
    const fraction = i / sliceCount;
    // Frequency band for this slice (low slices = bass, high slices = treble)
    const freqIdx = Math.floor(fraction * 48);
    const freqVal = (metrics.frequencyData[freqIdx] || 0) / 255;

    // Displacement offset driven by audio
    const xDisplace = Math.sin(i * 0.6 + time * 0.0016) * (freqVal * 20 * settings.sensitivity);
    const scale = 1 + (1 - Math.abs(fraction - 0.5) * 2) * 0.2;
    const w = monolithWidth * scale * (1 + freqVal * 0.1);
    const d = monolithDepth * scale;
    const y = startY - i * (sliceThickness + sliceSpacing);

    ctx.save();
    ctx.translate(xDisplace, y);
    ctx.rotate(rot);

    // Isometric slab rendering (Top face, Front face, Right face)
    const isoAngle = Math.PI / 6; // 30 degrees
    const cosA = Math.cos(isoAngle);
    const sinA = Math.sin(isoAngle);

    // Front Face
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 2, sliceThickness);
    ctx.lineTo(-w / 2, sliceThickness);
    ctx.closePath();
    ctx.fillStyle = '#141822';
    ctx.fill();
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = settings.strokeWidth;
    ctx.globalAlpha = 0.4 + freqVal * 0.6;
    ctx.stroke();

    // Top Face (diamond)
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(0, -d * sinA);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(0, d * sinA);
    ctx.closePath();

    // Top face gradient with rim lighting
    const topGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    topGrad.addColorStop(0, '#1c2333');
    topGrad.addColorStop(0.5, '#28334a');
    topGrad.addColorStop(1, palette.accent);

    ctx.fillStyle = topGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.5 + freqVal * 0.5;
    ctx.stroke();

    // Glowing accent laser line through slice core
    if (freqVal > 0.3) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 10, sliceThickness / 2);
      ctx.lineTo(w / 2 - 10, sliceThickness / 2);
      ctx.strokeStyle = palette.primary;
      ctx.lineWidth = 2;
      ctx.globalAlpha = freqVal;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Base reflection horizon
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-width * 0.4, startY + 40);
  ctx.lineTo(width * 0.4, startY + 40);
  ctx.stroke();

  ctx.restore();
}
