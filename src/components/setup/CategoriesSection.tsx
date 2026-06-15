import { Suspense, lazy, useState } from 'react';
import type { CategoryKey } from '../../lib/categories';

const CategorySelector = lazy(() =>
  import('../CategorySelector').then((m) => ({ default: m.CategorySelector })),
);

interface Props {
  selected: CategoryKey[];
  onChange: (cats: CategoryKey[]) => void;
}

export function CategoriesSection({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card" aria-labelledby="categories-heading">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 id="categories-heading" className="text-xl font-extrabold text-slate-900">
          Kategorie haseł
          <span className="ml-2 text-xs font-normal text-slate-600">
            ({selected.length === 0
              ? 'wszystkie'
              : `wybrane: ${selected.length}`})
          </span>
        </h2>
        <span aria-hidden className="text-slate-500">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div className="mt-3">
          <Suspense
            fallback={<p className="text-sm text-slate-600">Ładuję kategorie…</p>}
          >
            <CategorySelector selected={selected} onChange={onChange} />
          </Suspense>
        </div>
      )}
    </section>
  );
}
