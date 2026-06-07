import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameSettings, Phase, Player, Prompt, Tier } from '../types';
import { CountdownRing } from './CountdownRing';
import { ScoreBoard } from './ScoreBoard';
import { tierOf, TIER_LABEL } from '../lib/tier';
import { CATEGORY_BY_KEY } from '../lib/categories';
import { PROMPTS } from '../data/prompts';
import { pickRandom } from '../lib/utils';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import { useSpeech } from '../hooks/useSpeech';

// Czasówki — wyciągnięte ze "magicznych" wartości w kodzie.
const SPEAK_DELAY_MS = 250;
const AUTO_START_AFTER_TTS_MS = 300;

interface Props {
  players: Player[];
  settings: GameSettings;
  onScore: (playerId: string, delta: number) => void;
  onFinish: () => void;
  onExit: () => void;
}

interface UsedMap {
  [tier: string]: string[];
}

export function GameScreen({ players, settings, onScore, onFinish, onExit }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Pula użytych haseł żyje tylko w trakcie partii i nie ma UI, który by ją
  // czytał — trzymamy w refie, dzięki czemu unikamy wyścigu, w którym
  // funkcyjny setUsed czytałby starą wartość, gdy losowanie i zapis dzieją
  // się w jednym takcie eventu.
  const usedRef = useRef<UsedMap>({});
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [phase, setPhase] = useState<Phase>('handoff');

  // Refy synchronizowane ze state, żeby callback po przeczytaniu hasła
  // widział aktualną fazę i ID hasła (a nie wartości z momentu wywołania speak()).
  const phaseRef = useRef<Phase>('handoff');
  const currentPromptIdRef = useRef<string | null>(null);
  // Guard przeciw podwójnemu osądzeniu (np. double-tap "Zaliczone").
  const judgingRef = useRef(false);
  // Trzymamy ID timeoutu poprzedzającego speak() — czyścimy go w cancelSpeech,
  // żeby skip/start w trakcie 250 ms okienka nie wystrzelił starego hasła.
  const pendingSpeakTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    currentPromptIdRef.current = currentPrompt?.id ?? null;
  }, [currentPrompt]);

  const { play } = useAudio(settings.muted);
  const { speak, cancel: rawCancelSpeech, available: ttsAvailable } = useSpeech({
    rate: settings.speechRate,
    muted: settings.muted,
  });

  // Cancel także anuluje pending speak-timeout — odporne na szybkie sekwencje
  // newPrompt → skip → newPrompt, gdzie stare hasło zdążyłoby się zacząć czytać.
  const cancelSpeech = useCallback(() => {
    if (pendingSpeakTimeoutRef.current != null) {
      clearTimeout(pendingSpeakTimeoutRef.current);
      pendingSpeakTimeoutRef.current = null;
    }
    rawCancelSpeech();
  }, [rawCancelSpeech]);

  // Defensywny dostęp do aktywnego gracza — gdyby skład graczy się zmienił
  // poza grą (np. pusty localStorage), nie wywalamy całego ekranu.
  const safeIndex = players.length > 0 ? activeIndex % players.length : 0;
  const activePlayer = players[safeIndex];

  const activeTier: Tier = useMemo(
    () => (activePlayer ? tierOf(activePlayer.age) : '11-12'),
    [activePlayer],
  );
  const turnSeconds = useMemo(
    () =>
      settings.time.baseSeconds +
      (settings.time.handicapEnabled ? settings.time.bonusByTier[activeTier] : 0),
    [
      settings.time.baseSeconds,
      settings.time.handicapEnabled,
      settings.time.bonusByTier,
      activeTier,
    ],
  );

  // Losowanie hasła z synchronicznym zapisem do refa. Set zamiast
  // Array.includes daje O(1) lookup zamiast O(n).
  const drawPrompt = useCallback(
    (tier: Tier): Prompt | null => {
      const fullPool = PROMPTS[tier];
      const cats = settings.selectedCategories;
      const inCategory =
        cats.length === 0
          ? fullPool
          : fullPool.filter((p) => cats.includes(p.category));
      const pool = inCategory.length > 0 ? inCategory : fullPool;

      const usedSet = new Set(usedRef.current[tier] ?? []);
      let available = pool.filter((p) => !usedSet.has(p.id));
      let cleared = false;
      if (available.length === 0) {
        available = pool;
        cleared = true;
      }
      const picked = pickRandom(available);
      if (!picked) return null;
      usedRef.current = {
        ...usedRef.current,
        [tier]: cleared ? [picked.id] : [...(usedRef.current[tier] ?? []), picked.id],
      };
      return picked;
    },
    [settings.selectedCategories],
  );

  const timer = useTimer({
    onTick: (left) => {
      if (left > 1) play('tick');
    },
    onEnd: () => {
      play('end');
      setPhase('judged');
    },
  });

  // Startuje odliczanie. Używa currentPromptIdRef (świeży po commit Reacta),
  // bo wywoływana jest m.in. z onEnd TTS z domknięcia sprzed ustawienia hasła.
  const startTimer = useCallback(() => {
    if (!currentPromptIdRef.current) return;
    cancelSpeech();
    setPhase('running');
    timer.start(turnSeconds);
  }, [cancelSpeech, timer, turnSeconds]);

  const newPrompt = useCallback(() => {
    const prompt = drawPrompt(activeTier);
    setCurrentPrompt(prompt);
    setPhase('ready');
    timer.stop();
    cancelSpeech();
    judgingRef.current = false;
    if (!prompt) return;
    const promptId = prompt.id;

    pendingSpeakTimeoutRef.current = window.setTimeout(() => {
      pendingSpeakTimeoutRef.current = null;
      speak(prompt.text, {
        onEnd: () => {
          if (!ttsAvailable) return;
          if (currentPromptIdRef.current !== promptId) return;
          if (phaseRef.current !== 'ready') return;
          window.setTimeout(() => {
            if (
              currentPromptIdRef.current === promptId &&
              phaseRef.current === 'ready'
            ) {
              startTimer();
            }
          }, AUTO_START_AFTER_TTS_MS);
        },
      });
    }, SPEAK_DELAY_MS);
  }, [activeTier, cancelSpeech, drawPrompt, speak, startTimer, timer, ttsAvailable]);

  // Każda zmiana aktywnego gracza wraca do panelu handoff.
  // timer.stop i cancelSpeech są stabilnymi useCallback-ami, więc dodajemy
  // je do deps — zamiast wyłączać lintera.
  useEffect(() => {
    setPhase('handoff');
    setCurrentPrompt(null);
    judgingRef.current = false;
    timer.stop();
    cancelSpeech();
    return () => {
      cancelSpeech();
      timer.stop();
    };
  }, [activeIndex, cancelSpeech, timer]);

  // Awaryjne sprzątanie przy unmount (np. zakończenie / wyjście).
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const acceptTurn = () => {
    if (phase !== 'handoff') return;
    newPrompt();
  };

  const pauseTimer = () => {
    if (phase !== 'running') return;
    timer.pause();
    setPhase('paused');
  };

  const resumeTimer = () => {
    if (phase !== 'paused') return;
    timer.resume();
    setPhase('running');
  };

  const advance = () => {
    if (players.length === 0) return;
    setActiveIndex((i) => (i + 1) % players.length);
  };

  const judge = (success: boolean) => {
    // Guard przeciwko wielokrotnemu osądzeniu w jednym takcie (double-tap).
    if (judgingRef.current) return;
    if (phase !== 'running' && phase !== 'paused' && phase !== 'judged') return;
    judgingRef.current = true;
    timer.stop();
    if (success) {
      play('point');
      onScore(activePlayer.id, +1);
    } else {
      play('fail');
    }
    advance();
  };

  const skipPrompt = () => {
    // Skip działa wyłącznie w fazie 'ready' — w 'paused'/'judged' porzucenie
    // hasła bez sędziowania jest mylące dla prowadzącego.
    if (phase !== 'ready') return;
    newPrompt();
  };

  const readAgain = () => {
    if (currentPrompt) speak(currentPrompt.text);
  };

  const adjustScore = (delta: number) => {
    if (!activePlayer) return;
    onScore(activePlayer.id, delta);
  };

  // Zamykamy partię — najpierw ucinamy TTS i timer, dopiero potem oddajemy
  // kontrolę rodzicowi (unmount zrobi to samo, ale tu jest deterministycznie).
  const handleFinish = () => {
    cancelSpeech();
    timer.stop();
    onFinish();
  };
  const handleExit = () => {
    cancelSpeech();
    timer.stop();
    onExit();
  };

  if (!activePlayer) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Brak graczy.</p>
        <button className="btn-primary mt-3" onClick={handleExit}>
          Wróć do ustawień
        </button>
      </div>
    );
  }

  return (
    <main
      className="min-h-full flex flex-col p-3 sm:p-5 gap-3 max-w-3xl mx-auto w-full animate-fade-in"
      aria-label="Ekran rozgrywki"
    >
      <header className="flex items-center gap-2">
        <button
          className="btn-soft px-3 min-w-[48px]"
          onClick={handleExit}
          aria-label="Wyjdź do ustawień"
        >
          <span aria-hidden>←</span>
        </button>
        <div className="flex-1 overflow-x-auto">
          <ScoreBoard
            players={players}
            activeId={activePlayer.id}
            winScore={settings.winScore}
            compact
          />
        </div>
        <button
          className="btn-soft px-3 min-w-[48px]"
          onClick={handleFinish}
          aria-label="Zakończ partię"
        >
          <span aria-hidden>🏁</span>
        </button>
      </header>

      {phase === 'handoff' ? (
        <section
          key={`handoff-${activePlayer.id}`}
          className="rounded-3xl flex-1 flex flex-col items-center justify-center text-center px-4 py-10 shadow-md border-4 animate-pop-in"
          style={{
            background: `linear-gradient(135deg, ${activePlayer.color}33, ${activePlayer.color}11)`,
            borderColor: activePlayer.color,
          }}
          aria-labelledby="handoff-name"
        >
          <div className="text-sm uppercase font-bold tracking-wide text-slate-700">
            Teraz kolej
          </div>
          <div className="text-8xl my-3" aria-hidden>
            {activePlayer.emoji}
          </div>
          <div
            id="handoff-name"
            className="text-4xl sm:text-5xl font-black leading-tight text-slate-900"
          >
            {activePlayer.name}
          </div>
          <div className="text-sm text-slate-700 mt-2">
            poziom {TIER_LABEL[activeTier]} · ⏱ {turnSeconds} s
          </div>
          <button
            className="btn-primary text-2xl px-10 py-5 mt-8"
            onClick={acceptTurn}
            autoFocus
          >
            Zaczynamy! ▶
          </button>
          <div className="text-xs text-slate-600 mt-4 max-w-xs">
            Po kliknięciu lektor przeczyta hasło i ruszy odliczanie.
          </div>
        </section>
      ) : (
        <>
          <div
            className="rounded-3xl p-4 sm:p-6 text-center shadow-md border-4"
            style={{
              background: `linear-gradient(135deg, ${activePlayer.color}33, ${activePlayer.color}11)`,
              borderColor: activePlayer.color,
            }}
          >
            <div className="text-sm uppercase font-bold tracking-wide text-slate-700">
              Kolej
            </div>
            <div className="text-2xl sm:text-3xl font-black flex items-center justify-center gap-2 mt-1 text-slate-900">
              <span className="text-3xl" aria-hidden>
                {activePlayer.emoji}
              </span>
              <span>{activePlayer.name}</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-700 mt-1">
              poziom {TIER_LABEL[activeTier]} · ⏱ {turnSeconds} s
            </div>
          </div>

          <section
            className="card flex-1 flex flex-col items-center justify-center text-center py-8 min-h-[180px]"
            aria-label="Hasło do odgadnięcia"
          >
            {currentPrompt ? (
              <div
                key={currentPrompt.id}
                className="animate-pop-in"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="text-3xl sm:text-5xl font-black leading-tight px-2 text-slate-900">
                  {currentPrompt.text}
                </div>
                {CATEGORY_BY_KEY[currentPrompt.category] && (
                  <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide">
                    <span aria-hidden>{CATEGORY_BY_KEY[currentPrompt.category].emoji}</span>
                    <span>{CATEGORY_BY_KEY[currentPrompt.category].label}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-600">Brak haseł.</div>
            )}
            {!ttsAvailable && (
              <div
                className="mt-3 text-xs font-bold text-amber-800 bg-amber-100 rounded-lg px-2 py-1"
                role="note"
              >
                Lektor pl-PL niedostępny — przeczytaj hasło sam(a).
              </div>
            )}
          </section>

          <section className="flex justify-center" aria-label="Odliczanie">
            <CountdownRing
              remaining={phase === 'ready' ? turnSeconds : timer.remaining}
              duration={turnSeconds}
              announce={phase === 'running'}
            />
          </section>

          {phase === 'judged' && (
            <div
              className="text-center text-base font-bold text-rose-700 animate-fade-in"
              role="status"
              aria-live="assertive"
            >
              ⏱ Czas minął — czy zaliczył(a)?
            </div>
          )}

          <section className="flex flex-wrap gap-2 justify-center">
            <button className="btn-ghost" onClick={readAgain} disabled={!currentPrompt}>
              🔊 Przeczytaj ponownie
            </button>
            <button
              className="btn-ghost"
              onClick={skipPrompt}
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
                onClick={startTimer}
                disabled={!currentPrompt}
              >
                ▶ Start
              </button>
            )}
            {phase === 'running' && (
              <>
                <button className="btn-soft sm:col-span-1" onClick={pauseTimer}>
                  ⏸ Pauza
                </button>
                <button
                  className="btn-success sm:col-span-1"
                  onClick={() => judge(true)}
                >
                  ✅ Zaliczone
                </button>
                <button
                  className="btn-danger sm:col-span-1"
                  onClick={() => judge(false)}
                >
                  ❌ Pudło
                </button>
              </>
            )}
            {phase === 'paused' && (
              <>
                <button className="btn-primary sm:col-span-1" onClick={resumeTimer}>
                  ▶ Wznów
                </button>
                <button
                  className="btn-success sm:col-span-1"
                  onClick={() => judge(true)}
                >
                  ✅ Zaliczone
                </button>
                <button
                  className="btn-danger sm:col-span-1"
                  onClick={() => judge(false)}
                >
                  ❌ Pudło
                </button>
              </>
            )}
            {phase === 'judged' && (
              <>
                <button className="btn-soft sm:col-span-1" onClick={advance}>
                  ➡ Następny
                </button>
                <button
                  className="btn-success sm:col-span-1"
                  onClick={() => judge(true)}
                >
                  ✅ Zaliczone
                </button>
                <button
                  className="btn-danger sm:col-span-1"
                  onClick={() => judge(false)}
                >
                  ❌ Pudło
                </button>
              </>
            )}
          </section>

          <section className="card" aria-label="Korekta punktów">
            <div className="text-xs uppercase tracking-wide text-slate-700 mb-1 font-bold">
              Korekta punktów ({activePlayer.name})
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-soft"
                onClick={() => adjustScore(-1)}
                aria-label={`Odejmij punkt graczowi ${activePlayer.name}`}
              >
                −1 pkt
              </button>
              <button
                className="btn-soft"
                onClick={() => adjustScore(+1)}
                aria-label={`Dodaj punkt graczowi ${activePlayer.name}`}
              >
                +1 pkt
              </button>
              <div className="ml-auto self-center text-sm text-slate-900">
                <span className="font-bold">{activePlayer.name}</span>: {activePlayer.score} pkt
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
