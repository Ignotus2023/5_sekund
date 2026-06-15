import type { Phase } from '../../types';

interface Props {
  phase: Phase;
  hasPrompt: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onAccept: () => void;
  onReject: () => void;
  onAdvance: () => void;
  onReadAgain: () => void;
  onSkip: () => void;
}

/**
 * Sterowanie turą — układ trzech przycisków w grid-cols-3.
 * Pozycje przycisków sędziujących (Zaliczone/Pudło) są STAŁE w kolumnach 2/3
 * we wszystkich fazach (running/paused/judged), żeby kciuk prowadzącego nie
 * musiał szukać przycisku po zmianie fazy. Lewy slot zmienia się: Pauza ↔
 * Wznów ↔ Następny.
 */
export function TurnControls({
  phase,
  hasPrompt,
  onStart,
  onPause,
  onResume,
  onAccept,
  onReject,
  onAdvance,
  onReadAgain,
  onSkip,
}: Props) {
  return (
    <>
      <section className="flex flex-wrap gap-2 justify-center">
        <button className="btn-ghost" onClick={onReadAgain} disabled={!hasPrompt}>
          🔊 Przeczytaj ponownie
        </button>
        <button
          className="btn-ghost"
          onClick={onSkip}
          disabled={phase !== 'ready'}
          title={phase !== 'ready' ? 'Pomijać można tylko przed startem odliczania' : undefined}
        >
          🔀 Pomiń hasło
        </button>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {phase === 'ready' && (
          <button
            className="btn-primary col-span-full text-xl py-5"
            onClick={onStart}
            disabled={!hasPrompt}
          >
            ▶ Start
          </button>
        )}
        {phase === 'running' && (
          <>
            <button className="btn-soft sm:col-span-1" onClick={onPause}>
              ⏸ Pauza
            </button>
            <button className="btn-success sm:col-span-1" onClick={onAccept}>
              ✅ Zaliczone
            </button>
            <button className="btn-danger sm:col-span-1" onClick={onReject}>
              ❌ Pudło
            </button>
          </>
        )}
        {phase === 'paused' && (
          <>
            <button className="btn-primary sm:col-span-1" onClick={onResume}>
              ▶ Wznów
            </button>
            <button className="btn-success sm:col-span-1" onClick={onAccept}>
              ✅ Zaliczone
            </button>
            <button className="btn-danger sm:col-span-1" onClick={onReject}>
              ❌ Pudło
            </button>
          </>
        )}
        {phase === 'judged' && (
          <>
            <button className="btn-soft sm:col-span-1" onClick={onAdvance}>
              ➡ Następny
            </button>
            <button className="btn-success sm:col-span-1" onClick={onAccept}>
              ✅ Zaliczone
            </button>
            <button className="btn-danger sm:col-span-1" onClick={onReject}>
              ❌ Pudło
            </button>
          </>
        )}
      </section>
    </>
  );
}
