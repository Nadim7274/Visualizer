import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

interface Stone {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  shade: string;
}

interface Blossom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  size: number;
}

export function ZenGarden() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stones, setStones] = useState<Stone[]>([
    { x: 180, y: 160, radius: 26, rotation: 0.4, shade: '#475569' },
    { x: 340, y: 280, radius: 34, rotation: -0.2, shade: '#334155' },
    { x: 220, y: 320, radius: 18, rotation: 1.1, shade: '#64748b' },
  ]);

  const blossomsRef = useRef<Blossom[]>([]);

  const handleClear = () => {
    setStones([]);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const shades = ['#334155', '#475569', '#64748b', '#1e293b'];
    const newStone: Stone = {
      x,
      y,
      radius: Math.floor(Math.random() * 16 + 18),
      rotation: Math.random() * Math.PI,
      shade: shades[Math.floor(Math.random() * shades.length)],
    };

    setStones((prev) => (prev.length >= 10 ? [...prev.slice(1), newStone] : [...prev, newStone]));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Populate initial drifting blossoms
      blossomsRef.current = Array.from({ length: 30 }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: Math.random() * 0.8 + 0.3,
        vy: Math.random() * 0.6 + 0.4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        size: Math.random() * 5 + 4,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Sand color gradient (calm warm dark tone)
      const sandGrad = ctx.createLinearGradient(0, 0, w, h);
      sandGrad.addColorStop(0, '#0c0e14');
      sandGrad.addColorStop(1, '#090a0f');
      ctx.fillStyle = sandGrad;
      ctx.fillRect(0, 0, w, h);

      const metrics = audioEngine.getMetrics();
      const audioPulse = metrics.bass * 4;

      // Draw horizontal raked sand grooves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1.5;
      for (let y = 15; y < h; y += 18) {
        ctx.beginPath();
        for (let x = 0; x < w; x += 10) {
          const wave = Math.sin(x * 0.015 + y * 0.05) * 2;
          if (x === 0) ctx.moveTo(x, y + wave);
          else ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }

      // Draw concentric ripple grooves around each stone
      stones.forEach((stone) => {
        const rippleCount = 6;
        for (let r = 1; r <= rippleCount; r++) {
          const rippleRadius = stone.radius + r * 14 + audioPulse;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 - r * 0.01})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(
            stone.x,
            stone.y,
            rippleRadius,
            rippleRadius * 0.85,
            stone.rotation,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      });

      // Draw stones
      stones.forEach((stone) => {
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(
          stone.x + 4,
          stone.y + 6,
          stone.radius * 1.1,
          stone.radius * 0.9,
          stone.rotation,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Stone gradient
        const stoneGrad = ctx.createRadialGradient(
          stone.x - stone.radius * 0.3,
          stone.y - stone.radius * 0.3,
          2,
          stone.x,
          stone.y,
          stone.radius
        );
        stoneGrad.addColorStop(0, '#94a3b8');
        stoneGrad.addColorStop(0.5, stone.shade);
        stoneGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = stoneGrad;
        ctx.beginPath();
        ctx.ellipse(
          stone.x,
          stone.y,
          stone.radius,
          stone.radius * 0.85,
          stone.rotation,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Subtle moss accent
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.beginPath();
        ctx.arc(stone.x - stone.radius * 0.2, stone.y - stone.radius * 0.2, stone.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      // Drifting gentle cherry blossom petals
      blossomsRef.current.forEach((b) => {
        b.x += b.vx * (1 + metrics.treble);
        b.y += b.vy * (1 + metrics.mid * 0.5);
        b.rot += b.rotSpeed;

        if (b.x > w) b.x = -10;
        if (b.y > h) b.y = -10;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);

        ctx.fillStyle = 'rgba(244, 114, 182, 0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.size, b.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [stones]);

  return (
    <div className="flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
        <div>
          <h4 className="text-sm font-medium text-white">Zen Raked Stone Garden</h4>
          <p className="text-[11px] text-slate-400">Click anywhere to place river stones with harmonic sand ripples</p>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Smooth Sand</span>
        </button>
      </div>

      <div className="relative flex-1 cursor-pointer">
        <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full h-full block" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-1.5 rounded-full bg-slate-950/70 border border-white/10 text-[11px] text-slate-400 backdrop-blur-sm">
          {stones.length} stones placed · Music drives subtle sand ripples
        </div>
      </div>
    </div>
  );
}
