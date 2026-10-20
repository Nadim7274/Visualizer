import { VisualizerRenderContext } from './types';

export function renderOscilloscope({
  ctx,
  width,
  height,
  metrics,
  palette,
  settings,
  time,
}: VisualizerRenderContext) {
  // Pure dark CRT backdrop
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const centerY = height * 0.5;
  const timeData = metrics.timeData;
  const len = timeData ? timeData.length : 0;
  const sensitivity = settings.sensitivity;

  // Draw subtle reticle lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Center crosshairs
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  // Grid divisions
  for (let y = centerY - 150; y <= centerY + 150; y += 50) {
    if (y !== centerY) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
  }
  ctx.stroke();

  if (len === 0) return;

  // Draw 3 layered traces: Main beam, Ghost phosphor lag, and Harmonic phase-shift
  const traces = [
    { offset: 0, alpha: 0.95, width: settings.strokeWidth * 1.5, color: palette.primary },
    { offset: 25, alpha: 0.35, width: settings.strokeWidth * 2.5, color: palette.secondary },
    { offset: -25, alpha: 0.25, width: settings.strokeWidth * 3.5, color: palette.accent },
  ];

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  traces.forEach((trace) => {
    ctx.beginPath();
    ctx.strokeStyle = trace.color;
    ctx.lineWidth = trace.width;
    ctx.globalAlpha = trace.alpha * (0.8 + metrics.energy * 0.4);

    const step = Math.max(1, Math.floor(len / width));
    let first = true;

    for (let x = 0; x < width; x += 2) {
      const index = Math.floor((x / width) * len);
      // Sample waveform (-1 to 1)
      const raw = ((timeData[index] || 128) - 128) / 128;
      // Amplification with audio metrics
      const amp = (height * 0.22) * sensitivity * (1 + metrics.bass * 0.35);
      const phaseShift = Math.sin(x * 0.02 + time * 0.0016) * trace.offset * metrics.mid * 0.5;
      const y = centerY + raw * amp + phaseShift;

      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  });

  // Center luminous energy focal point
  if (metrics.beat) {
    ctx.beginPath();
    ctx.arc(width / 2, centerY, 80 * metrics.beatIntensity, 0, Math.PI * 2);
    ctx.fillStyle = palette.glow;
    ctx.globalAlpha = 0.4 * metrics.beatIntensity;
    ctx.fill();
  }

  ctx.restore();
}
