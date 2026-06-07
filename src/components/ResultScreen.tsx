import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Player } from '../types';

interface Props {
  players: Player[];
  winnerId: string | null;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export function ResultScreen({ players, winnerId, onPlayAgain, onNewGame }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted.find((p) => p.id === winnerId) ?? sorted[0];

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      confetti({
        particleCount: 60,
        spread: 80,
        startVelocity: 35,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        colors: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'],
      });
      if (frame >= 5) clearInterval(interval);
    }, 350);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 text-center animate-fade-in">
      <header className="pt-6">
        <div className="text-6xl mb-2 animate-pop-in">🏆</div>
        <h1 className="text-3xl sm:text-4xl font-black">Zwycięzca!</h1>
      </header>

      {winner && (
        <div
          className="card text-center"
          style={{
            background: `linear-gradient(135deg, ${winner.color}33, ${winner.color}11)`,
            borderColor: winner.color,
          }}
        >
          <div className="text-7xl mb-1">{winner.emoji}</div>
          <div className="text-3xl font-black" style={{ color: winner.color }}>
            {winner.name}
          </div>
          <div className="text-xl font-bold tabular-nums mt-1">{winner.score} pkt</div>
        </div>
      )}

      <section className="card text-left">
        <h2 className="font-extrabold text-xl mb-3">Ranking</h2>
        <ol className="space-y-2">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ background: `${p.color}11`, borderLeft: `4px solid ${p.color}` }}
            >
              <div className="w-7 text-center font-black text-slate-500">{i + 1}</div>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 font-bold" style={{ color: p.color }}>
                {p.name}
              </div>
              <div className="font-extrabold tabular-nums">{p.score} pkt</div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col sm:flex-row gap-2">
        <button className="btn-primary flex-1 text-lg py-4" onClick={onPlayAgain}>
          🔁 Zagraj ponownie
        </button>
        <button className="btn-ghost flex-1 text-lg py-4" onClick={onNewGame}>
          👥 Nowa gra
        </button>
      </div>
    </div>
  );
}
