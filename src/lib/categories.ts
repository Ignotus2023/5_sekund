export type CategoryKey =
  | 'jedzenie'
  | 'zwierzeta'
  | 'codzienne'
  | 'kultura'
  | 'ludzie'
  | 'przyroda'
  | 'szkola'
  | 'sport'
  | 'geografia'
  | 'nauka'
  | 'historia'
  | 'polska'
  | 'bajki';

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  emoji: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'jedzenie',  label: 'Jedzenie',   emoji: '🍎' },
  { key: 'zwierzeta', label: 'Zwierzęta',  emoji: '🐾' },
  { key: 'codzienne', label: 'Codzienne',  emoji: '🏠' },
  { key: 'kultura',   label: 'Kultura',    emoji: '🎭' },
  { key: 'ludzie',    label: 'Ludzie',     emoji: '👥' },
  { key: 'przyroda',  label: 'Przyroda',   emoji: '🌳' },
  { key: 'szkola',    label: 'Szkoła',     emoji: '📚' },
  { key: 'sport',     label: 'Sport',      emoji: '⚽' },
  { key: 'geografia', label: 'Geografia',  emoji: '🗺️' },
  { key: 'nauka',     label: 'Nauka',      emoji: '🔬' },
  { key: 'historia',  label: 'Historia',   emoji: '🏛️' },
  { key: 'polska',    label: 'Polska',     emoji: '🇵🇱' },
  { key: 'bajki',     label: 'Bajki',      emoji: '🧚' },
];

export const CATEGORY_KEYS: CategoryKey[] = CATEGORIES.map((c) => c.key);

export const CATEGORY_BY_KEY: Record<CategoryKey, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, CategoryMeta>;
