import { useEffect, useRef } from 'react';
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
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Focus na nagłówku — czytnik ekranu przeczyta zwycięstwo, klawiatura
    // ląduje w sensownym miejscu po przejściu z ekranu gry.
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (startedRef.current) return; // StrictMode dev — chronimy przed podwójnym intervalem
    startedRef.current = true;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const interval = window.setInterval(() => {
      frame++;
      confetti({
        particleCount: 60,
        spread: 80,
        startVelocity: 35,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        colors: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'],
      });
      if (frame >= 5) window.clearInterval(interval);
    }, 350);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main
      className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 text-center animate-fade-in"
      aria-label="Wynik partii"
    >
      <header className="pt-6">
        <div className="text-6xl mb-2 animate-pop-in" aria-hidden>
          🏆
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl sm:text-4xl font-black focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-600 rounded-xl px-2"
        >
          Zwycięzca!
        </h1>
      </header>

      {winner && (
        <div
          className="card text-center border-4"
          style={{
            background: `linear-gradient(135deg, ${winner.color}33, ${winner.color}11)`,
            borderColor: winner.color,
          }}
          role="status"
          aria-live="polite"
        >
          <div className="text-7xl mb-1" aria-hidden>
            {winner.emoji}
          </div>
          <div className="text-3xl font-black text-slate-900">{winner.name}</div>
          <div className="text-xl font-bold tabular-nums mt-1 text-slate-700">
            {winner.score} {winner.score === 1 ? 'punkt' : 'pkt'}
          </div>
        </div>
      )}

      <section className="card text-left" aria-label="Ranking końcowy">
        <h2 className="font-extrabold text-xl mb-3 text-slate-900">Ranking</h2>
        <ol className="space-y-2" role="list">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ background: `${p.color}11`, borderLeft: `4px solid ${p.color}` }}
              aria-label={`Miejsce ${i + 1}: ${p.name}, ${p.score} ${p.score === 1 ? 'punkt' : 'pkt'}`}
            >
              <div className="w-7 text-center font-black text-slate-700">{i + 1}</div>
              <span className="text-2xl" aria-hidden>
                {p.emoji}
              </span>
              <div className="flex-1 font-bold text-slate-900">{p.name}</div>
              <div className="font-extrabold tabular-nums text-slate-900">{p.score} pkt</div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col sm:flex-row gap-2">
        <button className="btn-primary flex-1 text-lg py-4" onClick={onPlayAgain}>
          🔁 Rewanż (te same drużyny)
        </button>
        <button className="btn-ghost flex-1 text-lg py-4" onClick={onNewGame}>
          ⚙ Zmień graczy i ustawienia
        </button>
      </div>
    </main>
  );
}
