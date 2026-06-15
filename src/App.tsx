import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { GameScreen as GameScreenName, GameSettings, Player } from './types';
import { DEFAULT_BONUS } from './lib/tier';
import { sanitizePlayers, sanitizeSettings } from './lib/sanitize';
import { usePersistedState } from './hooks/usePersistedState';
import { PlayerSetup } from './components/PlayerSetup';

// GameScreen ciągnie cały bank haseł (prompts.ts ~12 kB gz) + canvas-confetti
// (ResultScreen) — lazy-loadujemy oba, żeby ekran startowy odpalał się
// szybciej. Vite/Rollup automatycznie wydzieli te chunky.
const GameScreen = lazy(() =>
  import('./components/GameScreen').then((m) => ({ default: m.GameScreen })),
);
const ResultScreen = lazy(() =>
  import('./components/ResultScreen').then((m) => ({ default: m.ResultScreen })),
);

function ScreenFallback({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] flex flex-col items-center justify-center text-slate-700 gap-3"
    >
      <div
        className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-700 animate-spin"
        aria-hidden
      />
      <p className="text-sm font-bold">{label}</p>
    </div>
  );
}

const DEFAULT_SETTINGS: GameSettings = {
  time: {
    baseSeconds: 5,
    handicapEnabled: true,
    bonusByTier: { ...DEFAULT_BONUS },
  },
  winScore: 10,
  speechRate: 0.95,
  muted: false,
  selectedCategories: [], // [] = wszystkie kategorie
};

export default function App() {
  const [players, setPlayers] = usePersistedState<Player[]>('players', []);
  const [settings, setSettings] = usePersistedState<GameSettings>('settings', DEFAULT_SETTINGS);
  const [screen, setScreen] = useState<GameScreenName>('setup');
  const [winnerId, setWinnerId] = useState<string | null>(null);

  // Jednorazowa sanitacja po hydracji z localStorage: kompletna walidacja
  // struktury, zakresów liczbowych i kolorów (osłona przed wstrzyknięciem
  // CSS przez interpolację `color` w `style`).
  const sanitizedRef = useRef(false);
  useEffect(() => {
    if (sanitizedRef.current) return;
    sanitizedRef.current = true;
    const cleanSettings = sanitizeSettings(settings, DEFAULT_SETTINGS);
    if (JSON.stringify(cleanSettings) !== JSON.stringify(settings)) {
      setSettings(cleanSettings);
    }
    const cleanPlayers = sanitizePlayers(players);
    if (JSON.stringify(cleanPlayers) !== JSON.stringify(players)) {
      setPlayers(cleanPlayers);
    }
  }, [players, settings, setPlayers, setSettings]);

  const startGame = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setWinnerId(null);
    setScreen('play');
  };

  // Czysty updater — bez side-effectów (poprawnie działa w StrictMode).
  const handleScore = (playerId: string, delta: number) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, score: Math.max(0, p.score + delta) } : p
      )
    );
  };

  // Wykrywanie zwycięzcy w efekcie reagującym na zmianę punktów —
  // wyodrębnione z updatera, żeby uniknąć podwójnego wywołania w StrictMode
  // i zapewnić deterministyczne wyłonienie pierwszego, który przekroczył próg.
  useEffect(() => {
    if (screen !== 'play') return;
    if (settings.winScore <= 0) return;
    const winner = players.find((p) => p.score >= settings.winScore);
    if (winner) {
      setWinnerId(winner.id);
      setScreen('result');
    }
  }, [players, screen, settings.winScore]);

  const finishGame = () => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    setWinnerId(sorted[0]?.id ?? null);
    setScreen('result');
  };

  const playAgain = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setWinnerId(null);
    setScreen('play');
  };

  const newGame = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setWinnerId(null);
    setScreen('setup');
  };

  return (
    <div className="min-h-full pb-6">
      {screen === 'setup' && (
        <PlayerSetup
          players={players}
          setPlayers={setPlayers}
          settings={settings}
          setSettings={setSettings}
          onStart={startGame}
        />
      )}
      {screen === 'play' && (
        <Suspense fallback={<ScreenFallback label="Ładuję grę…" />}>
          <GameScreen
            players={players}
            settings={settings}
            onScore={handleScore}
            onFinish={finishGame}
            onExit={newGame}
          />
        </Suspense>
      )}
      {screen === 'result' && (
        <Suspense fallback={<ScreenFallback label="Ładuję wynik…" />}>
          <ResultScreen
            players={players}
            winnerId={winnerId}
            onPlayAgain={playAgain}
            onNewGame={newGame}
          />
        </Suspense>
      )}
    </div>
  );
}
