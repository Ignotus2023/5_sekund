import { useEffect, useState } from 'react';
import type { GameSettings, Player } from './types';
import { DEFAULT_BONUS } from './lib/tier';
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
};

type Screen = 'setup' | 'play' | 'result';

export default function App() {
  const [players, setPlayers] = usePersistedState<Player[]>('players', []);
  const [settings, setSettings] = usePersistedState<GameSettings>('settings', DEFAULT_SETTINGS);
  const [screen, setScreen] = useState<Screen>('setup');
  const [winnerId, setWinnerId] = useState<string | null>(null);

  // upewnij sie ze ustawienia maja wszystkie wymagane pola
  useEffect(() => {
    if (
      !settings.time ||
      !settings.time.bonusByTier ||
      typeof settings.time.baseSeconds !== 'number'
    ) {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [settings, setSettings]);

  const startGame = () => {
    setPlayers(players.map((p) => ({ ...p, score: 0 })));
    setWinnerId(null);
    setScreen('play');
  };

  const handleScore = (playerId: string, delta: number) => {
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.id === playerId ? { ...p, score: Math.max(0, p.score + delta) } : p
      );
      const winner =
        settings.winScore > 0 ? next.find((p) => p.score >= settings.winScore) : null;
      if (winner) {
        setWinnerId(winner.id);
        setScreen('result');
      }
      return next;
    });
  };

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
