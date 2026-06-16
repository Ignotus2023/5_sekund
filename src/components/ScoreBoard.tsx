import { memo } from 'react';
import type { Player } from '../types';

interface Props {
  players: Player[];
  activeId?: string;
  winScore: number; // 0 = tryb swobodny
  compact?: boolean;
}

function ScoreBoardImpl({ players, activeId, winScore, compact = false }: Props) {
  return (
    <ul
      className={
        compact
          ? 'flex flex-nowrap gap-2 overflow-x-auto snap-x snap-mandatory list-none p-0 m-0 -mx-1 px-1 pb-1'
          : 'flex flex-wrap gap-2 justify-center list-none p-0 m-0'
      }
      role="list"
      aria-label="Wyniki graczy"
    >
      {players.map((p) => {
        const isActive = p.id === activeId;
        // Aktywny: cięższy border + bardziej nasycone tło + cień. BEZ scale/ring
        // — żeby aktywacja nie przesuwała sąsiadów i nie ucinała się przy
        // overflow-x-auto.
        const style: React.CSSProperties = {
          background: isActive
            ? `linear-gradient(135deg, ${p.color}44, ${p.color}22)`
            : `linear-gradient(135deg, ${p.color}1a, ${p.color}10)`,
          borderColor: isActive ? p.color : `${p.color}55`,
          boxShadow: isActive ? `0 4px 14px ${p.color}40` : undefined,
        };
        return (
          <li
            key={p.id}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2 py-1.5 sm:px-2.5 transition-all
              shrink-0 border-2 ${compact ? 'snap-start' : ''}
              ${isActive ? '' : 'opacity-75'}`}
            style={style}
            aria-current={isActive ? 'true' : undefined}
            aria-label={
              `${p.name}: ${p.score} ${p.score === 1 ? 'punkt' : 'punktów'}` +
              (winScore > 0 ? ` z ${winScore}` : '') +
              (isActive ? ', tura aktywna' : '')
            }
          >
            <span className="text-xl sm:text-2xl leading-none shrink-0" aria-hidden>
              {p.emoji}
            </span>
            <div className="leading-tight min-w-0">
              <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1 whitespace-nowrap">
                {isActive && (
                  <span
                    aria-hidden
                    className="text-[10px] leading-none"
                    style={{ color: p.color }}
                  >
                    ▶
                  </span>
                )}
                {p.name}
              </div>
              <div className="text-[11px] sm:text-xs tabular-nums whitespace-nowrap leading-tight mt-0.5">
                <span className="font-extrabold" style={{ color: p.color }}>
                  {p.score}
                </span>
                {winScore > 0 && (
                  <span className="text-slate-500">/{winScore}</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export const ScoreBoard = memo(ScoreBoardImpl);
