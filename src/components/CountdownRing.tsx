import { memo, useEffect, useRef } from 'react';

interface Props {
  remaining: number;
  duration: number;
  /** Czy ogłaszać upływ sekund czytnikom (tylko podczas aktywnego odliczania). */
  announce?: boolean;
}

const RING_RADIUS = 110;
const RING_STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function CountdownRingImpl({ remaining, duration, announce = false }: Props) {
  const safeDuration = Math.max(duration, 0.0001);
  const progress = Math.max(0, Math.min(1, remaining / safeDuration));
  const dash = CIRCUMFERENCE * progress;

  const ratio = progress;
  const color = ratio > 0.5 ? '#047857' : ratio > 0.25 ? '#b45309' : '#b91c1c';
  const wholeLeft = Math.max(0, Math.ceil(remaining));
  const pulsing = wholeLeft <= 1 && remaining > 0;

  // Ogłaszamy tylko pełne sekundy (nie 60× na sekundę).
  const lastAnnouncedRef = useRef<number>(-1);
  useEffect(() => {
    if (!announce) {
      lastAnnouncedRef.current = -1;
      return;
    }
    if (wholeLeft !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = wholeLeft;
    }
  }, [announce, wholeLeft]);

  return (
    <div
      className={`relative w-64 h-64 sm:w-72 sm:h-72 mx-auto ${pulsing ? 'animate-pulse-fast' : ''}`}
      role="timer"
      aria-label={
        announce
          ? `Pozostało ${wholeLeft} ${wholeLeft === 1 ? 'sekunda' : 'sekund'}`
          : `Czas tury: ${Math.ceil(safeDuration)} sekund`
      }
      aria-live={announce ? 'off' : 'off'}
    >
      <svg viewBox="0 0 256 256" className="w-full h-full -rotate-90" aria-hidden>
        <circle
          cx="128"
          cy="128"
          r={RING_RADIUS}
          stroke="#e2e8f0"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <circle
          cx="128"
          cy="128"
          r={RING_RADIUS}
          stroke={color}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <div className="text-7xl sm:text-8xl font-black tabular-nums" style={{ color }}>
          {wholeLeft}
        </div>
        <div className="text-sm text-slate-700 font-bold uppercase tracking-wide mt-1">
          {wholeLeft === 1 ? 'sekunda' : 'sekund'}
        </div>
      </div>
      {/* Osobny region live tylko dla ostatnich trzech sekund — żeby
          czytnik nie krzyczał całą turę, ale podkreślił finisz. */}
      {announce && wholeLeft > 0 && wholeLeft <= 3 && (
        <div className="sr-only" role="status" aria-live="assertive">
          {wholeLeft}
        </div>
      )}
    </div>
  );
}

// Memoizacja: re-renderuj tylko gdy zmieni się widoczna sekunda (zaokrąglona),
// duration albo announce. rAF aktualizuje remaining ~60×/s — bez memo cały
// scoreboard nad ringiem rerenderowałby się tak samo często.
export const CountdownRing = memo(CountdownRingImpl, (a, b) => {
  if (a.announce !== b.announce) return false;
  if (a.duration !== b.duration) return false;
  // Porównaj zaokrągloną sekundę + progress w grubych krokach (~5%).
  const aWhole = Math.ceil(a.remaining);
  const bWhole = Math.ceil(b.remaining);
  if (aWhole !== bWhole) return false;
  const aBucket = Math.floor((a.remaining / Math.max(a.duration, 0.0001)) * 20);
  const bBucket = Math.floor((b.remaining / Math.max(b.duration, 0.0001)) * 20);
  return aBucket === bBucket;
});
