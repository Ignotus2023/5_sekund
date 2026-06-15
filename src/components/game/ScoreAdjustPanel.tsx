import type { Player } from '../../types';

interface Props {
  player: Player;
  onAdjust: (delta: number) => void;
}

export function ScoreAdjustPanel({ player, onAdjust }: Props) {
  return (
    <section className="card" aria-label="Korekta punktów">
      <div className="text-xs uppercase tracking-wide text-slate-700 mb-1 font-bold">
        Korekta punktów ({player.name})
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-soft"
          onClick={() => onAdjust(-1)}
          aria-label={`Odejmij punkt graczowi ${player.name}`}
        >
          −1 pkt
        </button>
        <button
          className="btn-soft"
          onClick={() => onAdjust(+1)}
          aria-label={`Dodaj punkt graczowi ${player.name}`}
        >
          +1 pkt
        </button>
        <div className="ml-auto self-center text-sm text-slate-900">
          <span className="font-bold">{player.name}</span>: {player.score} pkt
        </div>
      </div>
    </section>
  );
}
