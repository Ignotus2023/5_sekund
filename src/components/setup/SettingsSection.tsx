import { useId } from 'react';
import type { GameSettings } from '../../types';
import { DEFAULT_BONUS } from '../../lib/tier';
import { HandicapSection } from './HandicapSection';

const WIN_SCORES = [5, 10, 15, 0] as const;
const BASE_SECONDS = [3, 5, 7, 10] as const;

interface Props {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
}

export function SettingsSection({ settings, setSettings }: Props) {
  const winScoreId = useId();
  const baseSecondsId = useId();
  const speechRateId = useId();

  const resetSettings = () => {
    if (!confirm('Przywrócić domyślne ustawienia partii?')) return;
    setSettings({
      time: {
        baseSeconds: 5,
        handicapEnabled: true,
        bonusByTier: { ...DEFAULT_BONUS },
      },
      winScore: 10,
      speechRate: 0.95,
      muted: false,
      selectedCategories: [],
    });
  };

  return (
    <section className="card space-y-5" aria-labelledby="settings-heading">
      <div className="flex items-center justify-between">
        <h2 id="settings-heading" className="text-xl font-extrabold text-slate-900">
          Ustawienia partii
        </h2>
        <button
          type="button"
          onClick={resetSettings}
          className="text-xs underline text-slate-600 hover:text-slate-900"
        >
          Przywróć domyślne
        </button>
      </div>

      <fieldset>
        <legend
          id={winScoreId}
          className="block text-sm font-bold text-slate-800 mb-1"
        >
          Próg zwycięstwa
        </legend>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-labelledby={winScoreId}
        >
          {WIN_SCORES.map((v) => {
            const active = settings.winScore === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSettings({ ...settings, winScore: v })}
                className={`btn ${active ? 'btn-primary' : 'btn-soft'}`}
              >
                {v === 0 ? 'Swobodny' : `${v} pkt`}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Tryb swobodny = gra trwa do ręcznego zakończenia 🏁.
        </p>
      </fieldset>

      <fieldset>
        <legend
          id={baseSecondsId}
          className="block text-sm font-bold text-slate-800 mb-1"
        >
          Czas bazowy
        </legend>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-labelledby={baseSecondsId}
        >
          {BASE_SECONDS.map((v) => {
            const active = settings.time.baseSeconds === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  setSettings({
                    ...settings,
                    time: { ...settings.time, baseSeconds: v },
                  })
                }
                className={`btn ${active ? 'btn-primary' : 'btn-soft'}`}
              >
                {v} s
              </button>
            );
          })}
        </div>
      </fieldset>

      <HandicapSection settings={settings} setSettings={setSettings} />

      <div>
        <label
          htmlFor={speechRateId}
          className="block text-sm font-bold text-slate-800 mb-1"
        >
          Tempo lektora:{' '}
          <span className="tabular-nums">{settings.speechRate.toFixed(2)}×</span>
        </label>
        <input
          id={speechRateId}
          type="range"
          min={0.6}
          max={1.3}
          step={0.05}
          value={settings.speechRate}
          onChange={(e) =>
            setSettings({ ...settings, speechRate: Number(e.target.value) })
          }
          className="w-full accent-brand-600"
        />
      </div>

      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.muted}
          onChange={(e) => setSettings({ ...settings, muted: e.target.checked })}
          className="w-5 h-5 accent-brand-600"
        />
        <span className="font-semibold text-slate-800">🔇 Wycisz dźwięki i lektora</span>
      </label>
    </section>
  );
}
