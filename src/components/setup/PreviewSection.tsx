import type { GameSettings, Player } from '../../types';
import { describeAge, tierOf } from '../../lib/tier';

interface Props {
  players: Player[];
  settings: GameSettings;
}

export function PreviewSection({ players, settings }: Props) {
  if (players.length === 0) return null;
  return (
    <section className="card" aria-labelledby="preview-heading">
      <h3
        id="preview-heading"
        className="font-bold text-slate-800 mb-2 text-sm uppercase"
      >
        Podgląd czasu
      </h3>
      <ul className="text-sm space-y-1">
        {players.map((p) => {
          const tier = tierOf(p.age);
          const bonus = settings.time.handicapEnabled
            ? settings.time.bonusByTier[tier] ?? 0
            : 0;
          return (
            <li key={p.id} className="flex items-center gap-2 text-slate-900">
              <span className="font-bold">
                <span aria-hidden>{p.emoji} </span>
                {p.name}
              </span>
              <span className="text-slate-600">({describeAge(p.age)})</span>
              <span className="ml-auto tabular-nums font-bold">
                ⏱ {settings.time.baseSeconds + bonus} s
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
