import type { Player, Tier } from '../../types';
import { TIER_LABEL } from '../../lib/tier';

interface Props {
  player: Player;
  tier: Tier;
  turnSeconds: number;
}

export function PlayerBanner({ player, tier, turnSeconds }: Props) {
  return (
    <div
      className="rounded-3xl p-4 sm:p-6 text-center shadow-md border-4"
      style={{
        background: `linear-gradient(135deg, ${player.color}33, ${player.color}11)`,
        borderColor: player.color,
      }}
    >
      <div className="text-sm uppercase font-bold tracking-wide text-slate-700">
        Kolej
      </div>
      <div className="text-2xl sm:text-3xl font-black flex items-center justify-center gap-2 mt-1 text-slate-900">
        <span className="text-3xl" aria-hidden>
          {player.emoji}
        </span>
        <span>{player.name}</span>
      </div>
      <div className="text-xs sm:text-sm text-slate-700 mt-1">
        poziom {TIER_LABEL[tier]} · ⏱ {turnSeconds} s
      </div>
    </div>
  );
}
