import { VisualizerRenderContext } from './types';
import { setAlpha } from '../utils/colors';

export function renderRetroTerminal({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
  time,
}: VisualizerRenderContext) {
  // Deep CRT phosphor background
  ctx.fillStyle = '#050a06';
  ctx.fillRect(0, 0, width, height);

  const phosphorColor = palette.primary || '#4ade80';
  const dimPhosphor = setAlpha(phosphorColor, 0.27);

  // Draw phosphor frame container with rounded CRT corners
  const margin = 24;
  const crtW = width - margin * 2;
  const crtH = height - margin * 2;

  ctx.save();
  ctx.strokeStyle = dimPhosphor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin, margin, crtW, crtH);

  // CRT Header Telemetry
  ctx.font = '11px "Space Mono", monospace';
  ctx.fillStyle = phosphorColor;

  const pad = 16;
  const headerY = margin + pad + 8;
  const bassDb = Math.round(metrics.bass * 100);
  const midDb = Math.round(metrics.mid * 100);
  const trebDb = Math.round(metrics.treble * 100);
  const rmsVal = (metrics.rms * 100).toFixed(1);

  ctx.fillText('AETHER // ACOUSTIC DSP TERMINAL', margin + pad, headerY);
  ctx.fillText(`RMS: ${rmsVal}%`, margin + pad + 240, headerY);
  ctx.fillText(`FFT: [BASS:${bassDb}% | MID:${midDb}% | HI:${trebDb}%]`, margin + pad + 350, headerY);

  const fpsText = 'CH: STEREO // 44.1kHz';
  const fpsWidth = ctx.measureText(fpsText).width;
  ctx.fillText(fpsText, margin + crtW - pad - fpsWidth, headerY);

  // Horizontal divider
  ctx.strokeStyle = dimPhosphor;
  ctx.beginPath();
  ctx.moveTo(margin, headerY + 10);
  ctx.lineTo(margin + crtW, headerY + 10);
  ctx.stroke();

  // Waveform oscilloscope section (top half)
  const oscY = margin + crtH * 0.35;
  const oscHeight = crtH * 0.22;
  const timeData = metrics.timeData;
  const len = timeData.length;

  ctx.strokeStyle = phosphorColor;
  ctx.lineWidth = settings.strokeWidth * 1.5;
  ctx.beginPath();

  const startX = margin + pad;
  const drawW = crtW - pad * 2;
  for (let x = 0; x < drawW; x += 3) {
    const idx = Math.floor((x / drawW) * len);
    const sample = ((timeData[idx] || 128) - 128) / 128;
    const y = oscY + sample * (oscHeight * 0.5) * settings.sensitivity;

    if (x === 0) ctx.moveTo(startX + x, y);
    else ctx.lineTo(startX + x, y);
  }
  ctx.stroke();

  // ASCII Frequency Waterfall matrix (bottom half)
  const asciiY = margin + crtH * 0.56;
  const asciiChars = [' ', '·', ':', '+', '*', '%', '#', '@'];
  const cols = Math.min(64, Math.floor(drawW / 14));
  const rows = 8;

  ctx.font = '10px "Space Mono", monospace';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const freqIdx = Math.floor((c / cols) * 60);
      const val = (metrics.frequencyData[freqIdx] || 0) / 255;
      const noise = Math.sin(c * 0.5 + r * 0.8 + time * 0.002) * 0.15;
      const combined = Math.max(0, Math.min(1, val * (1 - r * 0.1) + noise));

      const charIdx = Math.floor(combined * (asciiChars.length - 1));
      const char = asciiChars[charIdx];

      const px = startX + c * (drawW / cols);
      const py = asciiY + r * 15;

      ctx.fillStyle = combined > 0.6 ? phosphorColor : dimPhosphor;
      ctx.fillText(char, px, py);
    }
  }

  // Scanlines effect across entire CRT screen
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  for (let y = margin; y < margin + crtH; y += 3) {
    ctx.fillRect(margin, y, crtW, 1.2);
  }

  // Subtle CRT corner vignette
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    crtW * 0.35,
    width / 2,
    height / 2,
    crtW * 0.65
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0, 10, 5, 0.75)');
  ctx.fillStyle = vignette;
  ctx.fillRect(margin, margin, crtW, crtH);

  ctx.restore();
}
