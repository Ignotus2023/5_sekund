import { useState } from 'react';
import type { GameSettings, Tier } from '../../types';
import { TIERS, TIER_LABEL } from '../../lib/tier';

interface Props {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
}

export function HandicapSection({ settings, setSettings }: Props) {
  const [open, setOpen] = useState(false);

  const setBonus = (tier: Tier, value: number) => {
    setSettings({
      ...settings,
      time: {
        ...settings.time,
        bonusByTier: { ...settings.time.bonusByTier, [tier]: value },
      },
    });
  };

  const summary = TIERS.filter((t) => settings.time.bonusByTier[t] > 0)
    .map((t) => `${TIER_LABEL[t]}: +${settings.time.bonusByTier[t]}s`)
    .join(', ');

  return (
    <div className="border-t-2 border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm font-bold text-slate-800">
          Dodatkowy czas dla młodszych
          {settings.time.handicapEnabled && summary && (
            <span className="ml-2 text-xs font-normal text-slate-600">({summary})</span>
          )}
          {!settings.time.handicapEnabled && (
            <span className="ml-2 text-xs font-normal text-slate-600">(wyłączone)</span>
          )}
        </span>
        <span aria-hidden className="text-slate-500">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.time.handicapEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  time: { ...settings.time, handicapEnabled: e.target.checked },
                })
              }
              className="w-5 h-5 accent-brand-600"
            />
            <span className="text-sm font-semibold text-slate-800">Doliczaj bonus</span>
          </label>
          <div
            className={`space-y-2 ${
              settings.time.handicapEnabled ? '' : 'opacity-50 pointer-events-none'
            }`}
          >
            {TIERS.map((tier) => {
              const value = settings.time.bonusByTier[tier] ?? 0;
              return (
                <div key={tier} className="flex items-center gap-3">
                  <label
                    htmlFor={`bonus-${tier}`}
                    className="w-24 text-sm font-semibold text-slate-800"
                  >
                    {TIER_LABEL[tier]}
                  </label>
                  <input
                    id={`bonus-${tier}`}
                    type="range"
                    min={0}
                    max={10}
                    value={value}
                    onChange={(e) => setBonus(tier, Number(e.target.value))}
                    className="flex-1 accent-brand-600"
                    aria-valuetext={`+${value} sekund`}
                  />
                  <div className="w-14 text-right tabular-nums font-bold text-slate-900">
                    +{value} s
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
