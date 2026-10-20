import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

const radialPeaks: number[] = new Array(120).fill(0);

export function renderSpectrumRadial({
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
  const minDim = Math.min(width, height);
  const innerRadius = minDim * 0.16 * (1 + metrics.bass * 0.12 * settings.sensitivity);
  const maxBarLength = minDim * 0.22 * settings.sensitivity;

  const numBars = settings.density === 'high' ? 96 : settings.density === 'medium' ? 72 : 48;
  const rot = time * 0.0003 * settings.motionSpeed;

  ctx.save();
  ctx.translate(cx, cy);

  // Center radial ambient glow
  const centerGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, innerRadius * 1.5);
  centerGlow.addColorStop(0, setAlpha(palette.primary, 0.25));
  centerGlow.addColorStop(0.6, setAlpha(palette.glow, 0.15));
  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring border
  ctx.strokeStyle = setAlpha(palette.primary, 0.3);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius - 2, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle inner beat ring
  if (metrics.beatIntensity > 0.05) {
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = metrics.beatIntensity * 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius * 0.65 * (1 + metrics.beatIntensity * 0.2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  // Draw 360-degree radial frequency bars
  const dataLen = metrics.frequencyData.length || 1;
  const barAngularWidth = (Math.PI * 2) / numBars;

  for (let i = 0; i < numBars; i++) {
    // Symmetrical mirroring: left half and right half mirror low-to-high frequencies
    const normIndex = i < numBars / 2 ? i / (numBars / 2) : (numBars - i) / (numBars / 2);
    const logIndex = Math.floor(Math.pow(normIndex, 1.45) * Math.min(dataLen * 0.7, 380));
    const val = (metrics.frequencyData[logIndex] || 0) / 255;
    const barLen = Math.max(3, val * maxBarLength);

    if (barLen > radialPeaks[i]) {
      radialPeaks[i] = barLen;
    } else {
      radialPeaks[i] = Math.max(0, radialPeaks[i] - 1.2);
    }

    const angle = i * barAngularWidth + rot;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const x1 = cosA * innerRadius;
    const y1 = sinA * innerRadius;
    const x2 = cosA * (innerRadius + barLen);
    const y2 = sinA * (innerRadius + barLen);

    // Radial bar
    ctx.strokeStyle = val > 0.6 ? palette.accent : palette.primary;
    ctx.lineWidth = Math.max(1.5, (innerRadius * barAngularWidth) * 0.65);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Floating radial peak dot
    const peakX = cosA * (innerRadius + radialPeaks[i] + 4);
    const peakY = sinA * (innerRadius + radialPeaks[i] + 4);
    ctx.fillStyle = palette.primary;
    ctx.beginPath();
    ctx.arc(peakX, peakY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
