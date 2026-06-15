import type { GameSettings, Player } from '../types';
import { CountdownRing } from './CountdownRing';
import { ScoreBoard } from './ScoreBoard';
import { useTurn } from '../hooks/useTurn';
import { HandoffPanel } from './game/HandoffPanel';
import { PlayerBanner } from './game/PlayerBanner';
import { PromptCard } from './game/PromptCard';
import { TurnControls } from './game/TurnControls';
import { ScoreAdjustPanel } from './game/ScoreAdjustPanel';

interface Props {
  players: Player[];
  settings: GameSettings;
  onScore: (playerId: string, delta: number) => void;
  onFinish: () => void;
  onExit: () => void;
}

export function GameScreen({ players, settings, onScore, onFinish, onExit }: Props) {
  const turn = useTurn({ players, settings, onScore });

  const handleFinish = () => {
    turn.cancelAll();
    onFinish();
  };
  const handleExit = () => {
    turn.cancelAll();
    onExit();
  };

  if (!turn.activePlayer) {
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
            activeId={turn.activePlayer.id}
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

      {turn.phase === 'handoff' ? (
        <HandoffPanel
          player={turn.activePlayer}
          tier={turn.activeTier}
          turnSeconds={turn.turnSeconds}
          onAccept={turn.acceptTurn}
        />
      ) : (
        <>
          <PlayerBanner
            player={turn.activePlayer}
            tier={turn.activeTier}
            turnSeconds={turn.turnSeconds}
          />

          <PromptCard prompt={turn.currentPrompt} ttsAvailable={turn.ttsAvailable} />

          <section className="flex justify-center" aria-label="Odliczanie">
            <CountdownRing
              remaining={turn.phase === 'ready' ? turn.turnSeconds : turn.timerRemaining}
              duration={turn.turnSeconds}
              announce={turn.phase === 'running'}
            />
          </section>

          {turn.phase === 'judged' && (
            <div
              className="text-center text-base font-bold text-rose-700 animate-fade-in"
              role="status"
              aria-live="assertive"
            >
              ⏱ Czas minął — czy zaliczył(a)?
            </div>
          )}

          <TurnControls
            phase={turn.phase}
            hasPrompt={!!turn.currentPrompt}
            onStart={turn.startTimer}
            onPause={turn.pauseTimer}
            onResume={turn.resumeTimer}
            onAccept={() => turn.judge(true)}
            onReject={() => turn.judge(false)}
            onAdvance={turn.advance}
            onReadAgain={turn.readAgain}
            onSkip={turn.skipPrompt}
          />

          <ScoreAdjustPanel player={turn.activePlayer} onAdjust={turn.adjustScore} />
        </>
      )}
    </main>
  );
}
