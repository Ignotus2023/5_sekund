import { useEffect, useRef, useState } from 'react';
import type { GameScreen as GameScreenName, GameSettings, Player } from './types';
import { DEFAULT_BONUS } from './lib/tier';
import { sanitizePlayers, sanitizeSettings } from './lib/sanitize';
import { usePersistedState } from './hooks/usePersistedState';
import { PlayerSetup } from './components/PlayerSetup';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';

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
        <GameScreen
          players={players}
          settings={settings}
          onScore={handleScore}
          onFinish={finishGame}
          onExit={newGame}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          players={players}
          winnerId={winnerId}
          onPlayAgain={playAgain}
          onNewGame={newGame}
        />
      )}
    </div>
  );
}
