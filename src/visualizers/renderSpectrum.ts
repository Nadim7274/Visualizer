import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

// Track persistent peak values for smooth decay
const peakValues: number[] = new Array(128).fill(0);

export function renderSpectrum({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
}: VisualizerRenderContext) {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const freqData = metrics.frequencyData;
  const numBars = settings.density === 'high' ? 84 : settings.density === 'medium' ? 56 : 36;
  const barGap = 4;
  const totalGapWidth = barGap * (numBars - 1);
  const barWidth = Math.max(3, (width * 0.82 - totalGapWidth) / numBars);
  const startX = (width - (numBars * barWidth + totalGapWidth)) / 2;
  const baseY = height * 0.78;
  const maxHeight = height * 0.46 * settings.sensitivity;

  const dataLen = freqData.length || 1;

  // Background subtle atmospheric aura centered on bars
  const bgGlow = ctx.createRadialGradient(
    width / 2,
    baseY - maxHeight * 0.4,
    10,
    width / 2,
    baseY - maxHeight * 0.4,
    width * 0.45
  );
  bgGlow.addColorStop(0, setAlpha(palette.glow, 0.22 * (0.8 + metrics.energy * 0.4)));
  bgGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < numBars; i++) {
    // Logarithmic distribution for natural human hearing curve
    const logIndex = Math.floor(Math.pow(i / numBars, 1.55) * Math.min(dataLen * 0.72, 420));
    const val = (freqData[logIndex] || 0) / 255;
    const barH = Math.max(2, val * maxHeight);

    // Smooth peak decay
    if (barH > peakValues[i]) {
      peakValues[i] = barH;
    } else {
      peakValues[i] = Math.max(0, peakValues[i] - 1.4);
    }

    const x = startX + i * (barWidth + barGap);
    const y = baseY - barH;

    // Bar gradient with smooth luminous tone
    const grad = ctx.createLinearGradient(0, y, 0, baseY);
    grad.addColorStop(0, palette.accent);
    grad.addColorStop(0.4, palette.primary);
    grad.addColorStop(1, setAlpha(palette.secondary, 0.6));

    ctx.fillStyle = grad;
    const radius = Math.min(barWidth / 2, 3);
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, [radius, radius, 0, 0]);
    ctx.fill();

    // Floating peak cap with soft glow
    const peakY = baseY - peakValues[i] - 2;
    ctx.fillStyle = palette.primary;
    ctx.fillRect(x, peakY, barWidth, 1.5);

    // Subtle downward reflection
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.roundRect(x, baseY + 3, barWidth, barH * 0.3, [0, 0, radius, radius]);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Base hairline horizon
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX - 20, baseY);
  ctx.lineTo(startX + numBars * (barWidth + barGap) + 20, baseY);
  ctx.stroke();

  // Frequency technical markings along the base
  ctx.font = '10px "Space Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  const markers = [
    { label: '30Hz', frac: 0.05 },
    { label: '120Hz', frac: 0.22 },
    { label: '500Hz', frac: 0.42 },
    { label: '2kHz', frac: 0.65 },
    { label: '8kHz', frac: 0.85 },
    { label: '16kHz', frac: 0.98 },
  ];

  const totalWidth = numBars * (barWidth + barGap);
  markers.forEach((m) => {
    const mx = startX + m.frac * totalWidth;
    ctx.fillText(m.label, mx - 12, baseY + 18);
  });
}
