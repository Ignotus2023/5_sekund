import { memo } from 'react';
import type { Player } from '../types';

interface Props {
  players: Player[];
  activeId?: string;
  winScore: number; // 0 = tryb swobodny
  compact?: boolean;
}

interface CSSVarStyle extends React.CSSProperties {
  '--tw-ring-color'?: string;
}

function ScoreBoardImpl({ players, activeId, winScore, compact = false }: Props) {
  return (
    <ul
      className={`flex flex-wrap gap-2 list-none p-0 m-0 ${compact ? '' : 'justify-center'}`}
      role="list"
      aria-label="Wyniki graczy"
    >
      {players.map((p) => {
        const isActive = p.id === activeId;
        const style: CSSVarStyle = {
          background: `linear-gradient(135deg, ${p.color}22, ${p.color}11)`,
          boxShadow: isActive ? `0 0 0 2px ${p.color}` : undefined,
          '--tw-ring-color': `${p.color}55`,
        };
        return (
          <li
            key={p.id}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2 transition
              ${isActive ? 'ring-4 ring-offset-2 scale-105 shadow-md' : 'opacity-90'}`}
            style={style}
            aria-current={isActive ? 'true' : undefined}
            aria-label={
              `${p.name}: ${p.score} ${p.score === 1 ? 'punkt' : 'punktów'}` +
              (winScore > 0 ? ` z ${winScore}` : '') +
              (isActive ? ', tura aktywna' : '')
            }
          >
            <span className="text-2xl" aria-hidden>
              {p.emoji}
            </span>
            <div className="leading-tight">
              <div className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1">
                {isActive && (
                  <span aria-hidden className="text-xs" style={{ color: p.color }}>
                    ▶
                  </span>
                )}
                {p.name}
              </div>
              <div className="text-xs text-slate-700 tabular-nums">
                {p.score}
                {winScore > 0 ? ` / ${winScore}` : ''} pkt
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export const ScoreBoard = memo(ScoreBoardImpl);
