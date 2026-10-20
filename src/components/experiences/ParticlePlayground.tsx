import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

interface PlaygroundParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export function ParticlePlayground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState('#38bdf8');
  const particlesRef = useRef<PlaygroundParticle[]>([]);
  const mouseRef = useRef({ x: -100, y: -100, isDown: false });

  const colors = [
    { label: 'Cyan', hex: '#38bdf8' },
    { label: 'Violet', hex: '#c084fc' },
    { label: 'Solar', hex: '#fbbf24' },
    { label: 'Mint', hex: '#34d399' },
    { label: 'Rose', hex: '#fb7185' },
  ];

  const initParticles = (width: number, height: number) => {
    particlesRef.current = Array.from({ length: 300 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 3 + 1.5,
      alpha: Math.random() * 0.6 + 0.3,
      color: selectedColor,
    }));
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      initParticles(canvas.width, canvas.height);
    }
  };

  const createBurst = (x: number, y: number) => {
    const burstCount = 45;
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        alpha: 1,
        color: selectedColor,
      });
    }
    // Limit max particles
    if (particlesRef.current.length > 600) {
      particlesRef.current.splice(0, particlesRef.current.length - 600);
    }
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
      initParticles(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Dark canvas fade
      ctx.fillStyle = 'rgba(7, 9, 13, 0.25)';
      ctx.fillRect(0, 0, w, h);

      const metrics = audioEngine.getMetrics();
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isDown = mouseRef.current.isDown;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      particlesRef.current.forEach((p, idx) => {
        // Distance to cursor
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const force = (150 - dist) / 150;
          const pull = isDown ? -force * 8 : force * 2.5;
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;
        }

        // Music bass excitation
        if (metrics.bass > 0.4) {
          p.vx += (Math.random() - 0.5) * metrics.bass * 2;
          p.vy += (Math.random() - 0.5) * metrics.bass * 2;
        }

        // Velocity friction
        p.vx *= 0.96;
        p.vy *= 0.96;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.6 + metrics.treble * 0.4);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + metrics.energy * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [selectedColor]);

  return (
    <div className="flex flex-col h-full text-slate-200">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-wider text-slate-400">Particle Colors</span>
          <div className="flex items-center gap-1.5 ml-2">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c.hex)}
                className={`w-6 h-6 rounded-full border transition-transform ${
                  selectedColor === c.hex
                    ? 'border-white scale-110 shadow-sm'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Field</span>
        </button>
      </div>

      {/* Interactive Canvas */}
      <div className="relative flex-1 cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            mouseRef.current.x = e.clientX - rect.left;
            mouseRef.current.y = e.clientY - rect.top;
          }}
          onMouseDown={(e) => {
            mouseRef.current.isDown = true;
            const rect = e.currentTarget.getBoundingClientRect();
            createBurst(e.clientX - rect.left, e.clientY - rect.top);
          }}
          onMouseUp={() => {
            mouseRef.current.isDown = false;
          }}
          onMouseLeave={() => {
            mouseRef.current.x = -100;
            mouseRef.current.y = -100;
            mouseRef.current.isDown = false;
          }}
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-1.5 rounded-full bg-slate-950/70 border border-white/10 text-[11px] text-slate-400 backdrop-blur-sm">
          Click canvas to emit bursts · Move cursor to guide flow
        </div>
      </div>
    </div>
  );
}
