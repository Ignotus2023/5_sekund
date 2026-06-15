import type { Player, Tier } from '../../types';
import { TIER_LABEL } from '../../lib/tier';

interface Props {
  player: Player;
  tier: Tier;
  turnSeconds: number;
  onAccept: () => void;
}

export function HandoffPanel({ player, tier, turnSeconds, onAccept }: Props) {
  return (
    <section
      key={`handoff-${player.id}`}
      className="rounded-3xl flex-1 flex flex-col items-center justify-center text-center px-4 py-10 shadow-md border-4 animate-pop-in"
      style={{
        background: `linear-gradient(135deg, ${player.color}33, ${player.color}11)`,
        borderColor: player.color,
      }}
      aria-labelledby="handoff-name"
    >
      <div className="text-sm uppercase font-bold tracking-wide text-slate-700">
        Teraz kolej
      </div>
      <div className="text-8xl my-3" aria-hidden>
        {player.emoji}
      </div>
      <div
        id="handoff-name"
        className="text-4xl sm:text-5xl font-black leading-tight text-slate-900"
      >
        {player.name}
      </div>
      <div className="text-sm text-slate-700 mt-2">
        poziom {TIER_LABEL[tier]} · ⏱ {turnSeconds} s
      </div>
      <button
        className="btn-primary text-2xl px-10 py-5 mt-8"
        onClick={onAccept}
        autoFocus
      >
        Zaczynamy! ▶
      </button>
      <div className="text-xs text-slate-600 mt-4 max-w-xs">
        Po kliknięciu lektor przeczyta hasło i ruszy odliczanie.
      </div>
    </section>
  );
}
