import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Download, Trash2, Sparkles } from 'lucide-react';

export function DoodleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState('#38bdf8');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [neonGlow, setNeonGlow] = useState(true);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const colors = ['#38bdf8', '#c084fc', '#fbbf24', '#34d399', '#f43f5e', '#ffffff'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initial background
    ctx.fillStyle = '#08090d';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    lastPoint.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (isEraser) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#08090d';
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = color;
      if (neonGlow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = brushSize * 2.5;
      } else {
        ctx.shadowBlur = 0;
      }
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.restore();

    lastPoint.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#08090d';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `aether-artwork-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-full text-slate-200">
      {/* Drawing Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-900/60 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  color === c && !isEraser ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          {/* Brush Sizes */}
          <div className="flex items-center gap-1.5">
            {[2, 4, 8, 16].map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  brushSize === size ? 'bg-white/20 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          {/* Neon Glow Toggle */}
          <button
            onClick={() => setNeonGlow(!neonGlow)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
              neonGlow ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Glow</span>
          </button>

          {/* Eraser Toggle */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`p-1.5 rounded-md transition-colors ${
              isEraser ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
}
