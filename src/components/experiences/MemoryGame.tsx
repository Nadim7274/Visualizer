import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Activity, Headphones, Disc3, Volume2, Mic, Radio } from 'lucide-react';

interface Card {
  id: number;
  symbol: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const SYMBOLS = [
  { symbol: 'Wave', icon: 'wave' },
  { symbol: 'Headphones', icon: 'headphones' },
  { symbol: 'Vinyl', icon: 'vinyl' },
  { symbol: 'Speaker', icon: 'speaker' },
  { symbol: 'Mic', icon: 'mic' },
  { symbol: 'Synth', icon: 'synth' },
];

export function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const initGame = () => {
    const deck: Card[] = [];
    const duplicated = [...SYMBOLS, ...SYMBOLS];
    // Shuffle
    for (let i = duplicated.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [duplicated[i], duplicated[j]] = [duplicated[j], duplicated[i]];
    }

    duplicated.forEach((item, index) => {
      deck.push({
        id: index,
        symbol: item.symbol,
        icon: item.icon,
        isFlipped: false,
        isMatched: false,
      });
    });

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setSeconds(0);
    setIsGameOver(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver]);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    const newFlipped = [...flippedIndices, index];
    setCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [idx1, idx2] = newFlipped;
      if (cards[idx1].symbol === cards[idx2].symbol) {
        // Matched
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;
            if (updated.every((c) => c.isMatched)) {
              setIsGameOver(true);
            }
            return updated;
          });
          setFlippedIndices([]);
        }, 400);
      } else {
        // Not matched
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isFlipped = false;
            updated[idx2].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'wave': return <Activity className="w-6 h-6 text-cyan-400" />;
      case 'headphones': return <Headphones className="w-6 h-6 text-purple-400" />;
      case 'vinyl': return <Disc3 className="w-6 h-6 text-amber-400" />;
      case 'speaker': return <Volume2 className="w-6 h-6 text-emerald-400" />;
      case 'mic': return <Mic className="w-6 h-6 text-rose-400" />;
      default: return <Radio className="w-6 h-6 text-sky-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full p-6 text-slate-200">
      {/* Header telemetry */}
      <div className="flex items-center justify-between w-full max-w-md p-3 bg-slate-900/60 border border-white/10 rounded-xl">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Moves: <strong className="text-white font-mono-nums">{moves}</strong></span>
          <span>Time: <strong className="text-white font-mono-nums">{seconds}s</strong></span>
        </div>
        <button
          onClick={initGame}
          className="flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-3 my-auto w-full max-w-md">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(idx)}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-300 transform ${
              card.isFlipped || card.isMatched
                ? 'bg-slate-900 border-cyan-500/40 rotate-0 shadow-md'
                : 'bg-slate-950/70 border-white/10 hover:border-white/25 active:scale-95'
            }`}
          >
            {card.isFlipped || card.isMatched ? (
              <div className="flex flex-col items-center gap-1">
                {renderIcon(card.icon)}
                <span className="text-[10px] text-slate-400 font-medium">{card.symbol}</span>
              </div>
            ) : (
              <div className="w-3 h-3 rounded-full bg-white/10" />
            )}
          </button>
        ))}
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="flex flex-col items-center gap-3 p-4 bg-cyan-950/80 border border-cyan-500/30 rounded-2xl text-center backdrop-blur-sm animate-fade-in">
          <Trophy className="w-8 h-8 text-cyan-400 animate-bounce" />
          <h4 className="text-base font-semibold text-white">Memory Matrix Completed</h4>
          <p className="text-xs text-slate-300">
            You solved all 6 harmonic pairs in <span className="font-mono-nums text-cyan-300 font-bold">{moves} moves</span> and{' '}
            <span className="font-mono-nums text-cyan-300 font-bold">{seconds} seconds</span>!
          </p>
          <button
            onClick={initGame}
            className="px-4 py-1.5 text-xs font-semibold bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
