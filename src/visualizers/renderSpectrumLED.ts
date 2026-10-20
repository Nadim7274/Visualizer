import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

const ledPeaks: number[] = new Array(64).fill(0);

export function renderSpectrumLED({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
}: VisualizerRenderContext) {
  // Dark studio rack backplane
  ctx.fillStyle = '#06080c';
  ctx.fillRect(0, 0, width, height);

  const freqData = metrics.frequencyData;
  const numColumns = settings.density === 'high' ? 48 : settings.density === 'medium' ? 32 : 24;
  const colGap = 5;
  const totalGapWidth = colGap * (numColumns - 1);
  const colWidth = Math.max(6, (width * 0.78 - totalGapWidth) / numColumns);
  const startX = (width - (numColumns * colWidth + totalGapWidth)) / 2;

  const totalSegments = 22;
  const segmentH = Math.max(3, Math.min(12, height * 0.018));
  const segmentGap = 2.5;
  const totalLedHeight = totalSegments * (segmentH + segmentGap);
  const baseY = height * 0.5 + totalLedHeight * 0.5;

  const dataLen = freqData.length || 1;

  for (let c = 0; c < numColumns; c++) {
    const logIndex = Math.floor(Math.pow(c / numColumns, 1.55) * Math.min(dataLen * 0.75, 420));
    const val = (freqData[logIndex] || 0) / 255;
    // Scaled by sensitivity
    const activeSegments = Math.round(val * totalSegments * settings.sensitivity);

    if (activeSegments > ledPeaks[c]) {
      ledPeaks[c] = activeSegments;
    } else {
      ledPeaks[c] = Math.max(0, ledPeaks[c] - 0.25);
    }

    const x = startX + c * (colWidth + colGap);

    for (let s = 0; s < totalSegments; s++) {
      const y = baseY - (s + 1) * (segmentH + segmentGap);
      const isLit = s < activeSegments;
      const isPeak = s === Math.round(ledPeaks[c]) && s > 0;

      // Color scheme based on height in ladder (Studio VU meter: Green/Cyan -> Amber -> Red)
      let segmentColor: string;
      if (s >= totalSegments - 3) {
        segmentColor = '#f43f5e'; // Red warning peak
      } else if (s >= totalSegments - 7) {
        segmentColor = '#fbbf24'; // Amber mid-high
      } else {
        segmentColor = palette.primary; // Primary theme color
      }

      if (isPeak) {
        // Peak hold segment glowing bright
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = segmentColor;
        ctx.shadowBlur = 6;
        ctx.fillRect(x, y, colWidth, segmentH);
        ctx.shadowBlur = 0;
      } else if (isLit) {
        // Active lit LED
        ctx.fillStyle = segmentColor;
        ctx.shadowColor = segmentColor;
        ctx.shadowBlur = 4;
        ctx.fillRect(x, y, colWidth, segmentH);
        ctx.shadowBlur = 0;
      } else {
        // Dim unlit LED cell
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(x, y, colWidth, segmentH);
      }
    }
  }

  // Base rack chassis border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(startX - 14, baseY - totalLedHeight - 14, (numColumns * (colWidth + colGap)) + 28, totalLedHeight + 28);

  // Studio Rack label
  ctx.font = '10px "Space Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText('ANALOG SEGMENTED EQ // PEAK DECIBEL LADDER', startX, baseY + 28);
}
