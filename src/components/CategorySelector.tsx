import { useMemo } from 'react';
import { CATEGORIES, type CategoryKey } from '../lib/categories';
import { countByCategoryAndTier } from '../data/prompts';

interface Props {
  selected: CategoryKey[];
  onChange: (next: CategoryKey[]) => void;
}

export function CategorySelector({ selected, onChange }: Props) {
  const counts = useMemo(() => countByCategoryAndTier(), []);
  const allSelected = selected.length === 0 || selected.length === CATEGORIES.length;

  const toggle = (key: CategoryKey) => {
    // Traktujemy pustą listę jak "wszystkie" - przy pierwszym kliknięciu zaczynamy konkretny wybór
    const effective: CategoryKey[] =
      selected.length === 0 ? CATEGORIES.map((c) => c.key) : selected;
    const next = effective.includes(key)
      ? effective.filter((c) => c !== key)
      : [...effective, key];
    onChange(next);
  };

  const selectAll = () => onChange([]);
  const selectNone = () => onChange(['codzienne']); // minimalne, żeby gra była grywalna

  const isOn = (key: CategoryKey) =>
    selected.length === 0 ? true : selected.includes(key);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-bold text-slate-700">
          Kategorie haseł
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={selectAll}
            className={`text-xs px-2 py-1 rounded-lg font-bold ${
              allSelected ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            Wszystkie
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="text-xs px-2 py-1 rounded-lg font-bold bg-slate-200 text-slate-700"
          >
            Tylko codzienne
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => {
          const total = Object.values(counts[cat.key] ?? {}).reduce((a, b) => a + b, 0);
          const on = isOn(cat.key);
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => toggle(cat.key)}
              className={`rounded-2xl px-3 py-2 border-2 text-left transition active:scale-95
                ${on
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-500'}`}
              aria-pressed={on}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.emoji}</span>
                <span className="font-bold flex-1">{cat.label}</span>
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs
                    ${on ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}
                  aria-hidden
                >
                  {on ? '✓' : ''}
                </span>
              </div>
              <div className="text-[11px] mt-0.5 opacity-70">{total} haseł</div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Jeśli żadna kategoria nie pasuje do wieku gracza, wylosuje hasło spoza zaznaczonych.
      </p>
    </div>
  );
}
