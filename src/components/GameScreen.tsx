import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameSettings, Player, Prompt, Tier } from '../types';
import { CountdownRing } from './CountdownRing';
import { ScoreBoard } from './ScoreBoard';
import { tierOf, TIER_LABEL } from '../lib/tier';
import { CATEGORY_BY_KEY } from '../lib/categories';
import { PROMPTS } from '../data/prompts';
import { pickRandom } from '../lib/utils';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  players: Player[];
  settings: GameSettings;
  onScore: (playerId: string, delta: number) => void;
  onFinish: () => void;
  onExit: () => void;
}

type Phase = 'handoff' | 'ready' | 'running' | 'judged' | 'paused';

interface UsedMap {
  [tier: string]: string[];
}

export function GameScreen({ players, settings, onScore, onFinish, onExit }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [used, setUsed] = useState<UsedMap>({});
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [phase, setPhase] = useState<Phase>('handoff');

  // Refy synchronizowane ze state, żeby callback po przeczytaniu hasła
  // widział aktualną fazę i ID hasła (a nie wartości z momentu wywołania speak()).
  const phaseRef = useRef<Phase>('handoff');
  const currentPromptIdRef = useRef<string | null>(null);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    currentPromptIdRef.current = currentPrompt?.id ?? null;
  }, [currentPrompt]);

  const { play } = useAudio(settings.muted);
  const { speak, cancel: cancelSpeech, available: ttsAvailable } = useSpeech({
    rate: settings.speechRate,
    muted: settings.muted,
  });

  const activePlayer = players[activeIndex];
  const activeTier: Tier = useMemo(() => tierOf(activePlayer.age), [activePlayer]);
  const turnSeconds = useMemo(
    () =>
      settings.time.baseSeconds +
      (settings.time.handicapEnabled ? settings.time.bonusByTier[activeTier] : 0),
    [settings, activeTier]
  );

  const drawPrompt = (tier: Tier): Prompt | null => {
    const fullPool = PROMPTS[tier];
    const cats = settings.selectedCategories;
    const inCategory =
      cats.length === 0 ? fullPool : fullPool.filter((p) => cats.includes(p.category));
    // Jesli wybrane kategorie nie maja zadnego hasla na tym poziomie - fallback do calej puli
    const pool = inCategory.length > 0 ? inCategory : fullPool;
    const usedIds = used[tier] ?? [];
    let available = pool.filter((p) => !usedIds.includes(p.id));
    if (available.length === 0) {
      // wyczerpana pula - reset
      setUsed((u) => ({ ...u, [tier]: [] }));
      available = pool;
    }
    return pickRandom(available);
  };

  const newPrompt = () => {
    const prompt = drawPrompt(activeTier);
    setCurrentPrompt(prompt);
    setPhase('ready');
    timer.stop();
    if (prompt) {
      setUsed((u) => ({ ...u, [activeTier]: [...(u[activeTier] ?? []), prompt.id] }));
      const promptId = prompt.id;
      // Auto-czytaj nowe haslo, a po przeczytaniu sam wystartuj odliczanie.
      // Jesli TTS niedostepny lub wyciszony — nie autostartujemy, grajacy klika "Start".
      setTimeout(() => {
        speak(prompt.text, {
          onEnd: () => {
            if (!ttsAvailable) return;
            if (currentPromptIdRef.current !== promptId) return;
            if (phaseRef.current !== 'ready') return;
            // Krotka chwila zanim startuje timer ("gotowy... start!")
            window.setTimeout(() => {
              if (
                currentPromptIdRef.current === promptId &&
                phaseRef.current === 'ready'
              ) {
                startTimer();
              }
            }, 300);
          },
        });
      }, 250);
    }
  };

  const timer = useTimer({
    onTick: (left) => {
      if (left > 1) play('tick');
    },
    onEnd: () => {
      play('end');
      setPhase('judged');
    },
  });

  // Na początku każdej tury (start gry oraz po każdej zmianie aktywnego gracza)
  // pokaż panel "Teraz: <gracz>" i poczekaj na jego potwierdzenie. Dopiero wtedy
  // wylosuj i przeczytaj hasło — dzięki temu telefon można podać następnej osobie.
  useEffect(() => {
    setPhase('handoff');
    setCurrentPrompt(null);
    timer.stop();
    cancelSpeech();
    return () => {
      cancelSpeech();
      timer.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const acceptTurn = () => {
    if (phase !== 'handoff') return;
    newPrompt();
  };

  // sprzątanie przy wyjściu
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const startTimer = () => {
    // Czytamy z refa, nie z domknięcia — auto-start wywoływany z callbacka
    // przekazanego do speak() ma w closurze currentPrompt z renderu sprzed
    // jego ustawienia, więc bezpośredni odczyt zwracałby null.
    if (!currentPromptIdRef.current) return;
    cancelSpeech();
    setPhase('running');
    timer.start(turnSeconds);
  };

  const pauseTimer = () => {
    timer.pause();
    setPhase('paused');
  };

  const resumeTimer = () => {
    timer.resume();
    setPhase('running');
  };

  const judge = (success: boolean) => {
    timer.stop();
    if (success) {
      play('point');
      onScore(activePlayer.id, +1);
    } else {
      play('fail');
    }
    advance();
  };

  const advance = () => {
    // sprawdz wygranie
    const updatedScore = activePlayer.score + 0; // App ma już aktualny score
    void updatedScore;
    // wygrana sprawdzana w App po onScore (przez efekt)
    setActiveIndex((i) => (i + 1) % players.length);
  };

  const skipPrompt = () => {
    if (phase === 'running') return;
    newPrompt();
  };

  const readAgain = () => {
    if (currentPrompt) speak(currentPrompt.text);
  };

  const adjustScore = (delta: number) => {
    onScore(activePlayer.id, delta);
  };

  return (
    <div className="min-h-full flex flex-col p-3 sm:p-5 gap-3 max-w-3xl mx-auto w-full animate-fade-in">
      <header className="flex items-center gap-2">
        <button className="btn-soft px-3" onClick={onExit} aria-label="Wyjdź">
          ←
        </button>
        <div className="flex-1 overflow-x-auto">
          <ScoreBoard players={players} activeId={activePlayer.id} winScore={settings.winScore} compact />
        </div>
        <button
          className="btn-soft px-3"
          onClick={onFinish}
          aria-label="Zakończ partię"
          title="Zakończ partię"
        >
          🏁
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
        >
          <div className="text-sm uppercase font-bold tracking-wide text-slate-600">
            Teraz kolej
          </div>
          <div className="text-8xl my-3" aria-hidden>
            {activePlayer.emoji}
          </div>
          <div
            className="text-4xl sm:text-5xl font-black leading-tight"
            style={{ color: activePlayer.color }}
          >
            {activePlayer.name}
          </div>
          <div className="text-sm text-slate-600 mt-2">
            poziom {TIER_LABEL[activeTier]} · ⏱ {turnSeconds} s
          </div>
          <button
            className="btn-primary text-2xl px-10 py-5 mt-8"
            onClick={acceptTurn}
            autoFocus
          >
            Gotowy! ▶
          </button>
          <div className="text-xs text-slate-500 mt-4 max-w-xs">
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
            <div className="text-sm uppercase font-bold tracking-wide text-slate-600">Kolej</div>
            <div className="text-2xl sm:text-3xl font-black flex items-center justify-center gap-2 mt-1">
              <span className="text-3xl">{activePlayer.emoji}</span>
              <span style={{ color: activePlayer.color }}>{activePlayer.name}</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1">
              poziom {TIER_LABEL[activeTier]} · ⏱ {turnSeconds} s
            </div>
          </div>

          <section className="card flex-1 flex flex-col items-center justify-center text-center py-8 min-h-[180px]">
            {currentPrompt ? (
              <div key={currentPrompt.id} className="animate-pop-in">
                <div className="text-3xl sm:text-5xl font-black leading-tight px-2">
                  {currentPrompt.text}
                </div>
                {currentPrompt.category && CATEGORY_BY_KEY[currentPrompt.category] && (
                  <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide">
                    <span>{CATEGORY_BY_KEY[currentPrompt.category].emoji}</span>
                    <span>{CATEGORY_BY_KEY[currentPrompt.category].label}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500">Brak haseł.</div>
            )}
            {!ttsAvailable && (
              <div className="mt-3 text-xs text-amber-700 bg-amber-100 rounded-lg px-2 py-1">
                Lektor pl-PL niedostępny na tym urządzeniu.
              </div>
            )}
          </section>

          <section className="flex justify-center">
            <CountdownRing
              remaining={phase === 'ready' ? turnSeconds : timer.remaining}
              duration={turnSeconds}
            />
          </section>

          <section className="flex flex-wrap gap-2 justify-center">
            <button className="btn-ghost" onClick={readAgain}>🔊 Przeczytaj ponownie</button>
            <button className="btn-ghost" onClick={skipPrompt} disabled={phase === 'running'}>
              🔀 Pomiń hasło
            </button>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {phase === 'ready' && (
              <button className="btn-primary col-span-full text-xl py-5" onClick={startTimer}>
                ▶ Start
              </button>
            )}
            {phase === 'running' && (
              <>
                <button className="btn-soft sm:col-span-1" onClick={pauseTimer}>⏸ Pauza</button>
                <button className="btn-success sm:col-span-1" onClick={() => judge(true)}>
                  ✅ Zaliczone
                </button>
                <button className="btn-danger sm:col-span-1" onClick={() => judge(false)}>
                  ❌ Pudło
                </button>
              </>
            )}
            {phase === 'paused' && (
              <>
                <button className="btn-primary sm:col-span-1" onClick={resumeTimer}>▶ Wznów</button>
                <button className="btn-success sm:col-span-1" onClick={() => judge(true)}>
                  ✅ Zaliczone
                </button>
                <button className="btn-danger sm:col-span-1" onClick={() => judge(false)}>
                  ❌ Pudło
                </button>
              </>
            )}
            {phase === 'judged' && (
              <>
                <button className="btn-success sm:col-span-1" onClick={() => judge(true)}>
                  ✅ Zaliczone
                </button>
                <button className="btn-danger sm:col-span-1" onClick={() => judge(false)}>
                  ❌ Pudło
                </button>
                <button className="btn-soft sm:col-span-1" onClick={advance}>
                  ➡ Następny
                </button>
              </>
            )}
          </section>

          <section className="card">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Korekta punktów</div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-soft" onClick={() => adjustScore(-1)}>−1 pkt</button>
              <button className="btn-soft" onClick={() => adjustScore(+1)}>+1 pkt</button>
              <div className="ml-auto self-center text-sm">
                <span className="font-bold">{activePlayer.name}</span>: {activePlayer.score} pkt
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
