import type { Player } from '../types';

interface Props {
  players: Player[];
  activeId?: string;
  winScore: number; // 0 = swobodny
  compact?: boolean;
}

export function ScoreBoard({ players, activeId, winScore, compact = false }: Props) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'justify-center'}`}>
      {players.map((p) => {
        const isActive = p.id === activeId;
        return (
          <div
            key={p.id}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2 transition
              ${isActive ? 'ring-4 ring-offset-2 scale-105 shadow-md' : 'opacity-90'}`}
            style={{
              background: `linear-gradient(135deg, ${p.color}22, ${p.color}11)`,
              boxShadow: isActive ? `0 0 0 2px ${p.color}` : undefined,
              ['--tw-ring-color' as string]: `${p.color}55`,
            }}
          >
            <span className="text-2xl" aria-hidden>
              {p.emoji}
            </span>
            <div className="leading-tight">
              <div className="font-bold text-sm sm:text-base" style={{ color: p.color }}>
                {p.name}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {p.score}{winScore > 0 ? ` / ${winScore}` : ''} pkt
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
