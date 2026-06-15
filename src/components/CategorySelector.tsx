import { useMemo } from 'react';
import { CATEGORIES, type CategoryKey } from '../lib/categories';
import { countByCategoryAndTier } from '../data/prompts';

interface Props {
  selected: CategoryKey[];
  onChange: (next: CategoryKey[]) => void;
}

/**
 * Konwencja: `selected.length === 0` ⇒ brak filtracji = wszystkie kategorie
 * używane do losowania. `[X, Y]` ⇒ filtr na konkretne X i Y.
 *
 * UX: użytkownik nie może odznaczyć ostatniej zaznaczonej kategorii innym
 * sposobem niż kliknięcie „Wszystkie" (które wraca do trybu „bez filtra").
 * Dzięki temu stan „1 kategoria wybrana" nie zostawia użytkownika w sytuacji,
 * gdy klikając pojedynczy chip wraca skrycie do trybu wszystko.
 */
export function CategorySelector({ selected, onChange }: Props) {
  const counts = useMemo(() => countByCategoryAndTier(), []);
  const allMode = selected.length === 0;

  const toggle = (key: CategoryKey) => {
    // W trybie „wszystkie" pierwszy klik wybiera tylko TĘ jedną kategorię.
    if (allMode) {
      onChange([key]);
      return;
    }
    if (selected.includes(key)) {
      // Nie pozwalamy zostawić listy pustej manualnym odznaczaniem — to
      // wcześniej powodowało skryte przejście w tryb „wszystkie". Użytkownik
      // świadomie klika „Wszystkie", jeśli tego chce.
      if (selected.length === 1) return;
      onChange(selected.filter((c) => c !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const selectAll = () => onChange([]);

  const isOn = (key: CategoryKey) => allMode || selected.includes(key);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <label className="block text-sm font-bold text-slate-700">
          Kategorie haseł
          <span className="ml-2 text-xs font-normal text-slate-600">
            ({allMode ? 'wszystkie' : `wybrane: ${selected.length}`})
          </span>
        </label>
        <button
          type="button"
          onClick={selectAll}
          aria-pressed={allMode}
          className={`text-xs px-3 py-1 rounded-lg font-bold transition ${
            allMode
              ? 'bg-brand-700 text-white'
              : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
          }`}
        >
          Wszystkie
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Lista kategorii">
        {CATEGORIES.map((cat) => {
          const total = Object.values(counts[cat.key] ?? {}).reduce((a, b) => a + b, 0);
          const on = isOn(cat.key);
          const isLast = !allMode && selected.length === 1 && selected[0] === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => toggle(cat.key)}
              className={`rounded-2xl px-3 py-2 border-2 text-left transition active:scale-95
                ${on
                  ? 'border-brand-600 bg-brand-50 text-brand-900'
                  : 'border-slate-200 bg-white text-slate-600'}`}
              aria-pressed={on}
              title={isLast ? 'Aby wyłączyć filtr, kliknij „Wszystkie"' : undefined}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>{cat.emoji}</span>
                <span className="font-bold flex-1">{cat.label}</span>
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs
                    ${on ? 'bg-brand-700 border-brand-700 text-white' : 'border-slate-300'}`}
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
      <p className="text-xs text-slate-600 mt-2">
        {allMode
          ? 'Bez wybranych kategorii losujemy ze wszystkich. Kliknij dowolną, by zacząć filtrować.'
          : 'Aby wrócić do losowania ze wszystkich kategorii, kliknij „Wszystkie".'}
      </p>
    </div>
  );
}
