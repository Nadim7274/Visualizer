import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

const mirrorPeaks: number[] = new Array(128).fill(0);

export function renderSpectrumMirror({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
}: VisualizerRenderContext) {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const centerY = height * 0.5;
  const freqData = metrics.frequencyData;
  const numBars = settings.density === 'high' ? 88 : settings.density === 'medium' ? 64 : 44;
  const barGap = 3;
  const totalGapWidth = barGap * (numBars - 1);
  const barWidth = Math.max(3, (width * 0.86 - totalGapWidth) / numBars);
  const startX = (width - (numBars * barWidth + totalGapWidth)) / 2;
  const maxHeight = (height * 0.32) * settings.sensitivity;

  const dataLen = freqData.length || 1;

  // Horizon glow gradient
  const horizGlow = ctx.createRadialGradient(
    width / 2,
    centerY,
    5,
    width / 2,
    centerY,
    width * 0.45
  );
  horizGlow.addColorStop(0, setAlpha(palette.primary, 0.2));
  horizGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = horizGlow;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < numBars; i++) {
    const logIndex = Math.floor(Math.pow(i / numBars, 1.5) * Math.min(dataLen * 0.72, 400));
    const val = (freqData[logIndex] || 0) / 255;
    const barH = Math.max(2, val * maxHeight);

    if (barH > mirrorPeaks[i]) {
      mirrorPeaks[i] = barH;
    } else {
      mirrorPeaks[i] = Math.max(0, mirrorPeaks[i] - 1.4);
    }

    const x = startX + i * (barWidth + barGap);

    // Upper Bar Gradient
    const upperGrad = ctx.createLinearGradient(0, centerY - barH, 0, centerY);
    upperGrad.addColorStop(0, palette.accent);
    upperGrad.addColorStop(0.6, palette.primary);
    upperGrad.addColorStop(1, setAlpha(palette.secondary, 0.3));

    ctx.fillStyle = upperGrad;
    const radius = Math.min(barWidth / 2, 2.5);

    // Upper bar
    ctx.beginPath();
    ctx.roundRect(x, centerY - barH, barWidth, barH, [radius, radius, 0, 0]);
    ctx.fill();

    // Lower mirrored bar
    const lowerGrad = ctx.createLinearGradient(0, centerY, 0, centerY + barH);
    lowerGrad.addColorStop(0, setAlpha(palette.secondary, 0.3));
    lowerGrad.addColorStop(0.6, palette.primary);
    lowerGrad.addColorStop(1, palette.accent);

    ctx.fillStyle = lowerGrad;
    ctx.beginPath();
    ctx.roundRect(x, centerY, barWidth, barH, [0, 0, radius, radius]);
    ctx.fill();

    // Peak markers (top & bottom)
    ctx.fillStyle = palette.primary;
    ctx.fillRect(x, centerY - mirrorPeaks[i] - 2, barWidth, 1.5);
    ctx.fillRect(x, centerY + mirrorPeaks[i] + 1, barWidth, 1.5);
  }

  // Center vector waveform line
  const timeData = metrics.timeData;
  if (timeData && timeData.length > 0) {
    ctx.strokeStyle = setAlpha(palette.primary, 0.85);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const len = timeData.length;
    for (let x = 0; x < width; x += 3) {
      const idx = Math.floor((x / width) * len);
      const sample = ((timeData[idx] || 128) - 128) / 128;
      const y = centerY + sample * (24 * settings.sensitivity);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Horizon hairline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX - 20, centerY);
  ctx.lineTo(startX + numBars * (barWidth + barGap) + 20, centerY);
  ctx.stroke();
}
