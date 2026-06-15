import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_KEYS,
  CATEGORY_BY_KEY,
  type CategoryKey,
} from './categories';

const EXPECTED_KEYS: CategoryKey[] = [
  'jedzenie',
  'zwierzeta',
  'codzienne',
  'kultura',
  'muzyka',
  'filmy',
  'ludzie',
  'przyroda',
  'szkola',
  'sport',
  'geografia',
  'nauka',
  'historia',
  'polska',
  'bajki',
  'swieta',
];

describe('CATEGORIES', () => {
  it('zawiera dokładnie 16 kategorii', () => {
    expect(CATEGORIES).toHaveLength(16);
  });

  it('każda kategoria ma key, label, emoji', () => {
    for (const c of CATEGORIES) {
      expect(c.key).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.emoji).toBeTruthy();
    }
  });

  it('klucze są unikalne', () => {
    const keys = CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('CATEGORY_KEYS zawiera wszystkie spodziewane klucze', () => {
    for (const k of EXPECTED_KEYS) expect(CATEGORY_KEYS).toContain(k);
  });
});

describe('CATEGORY_BY_KEY', () => {
  it('mapuje każdy klucz na metadane', () => {
    for (const k of CATEGORY_KEYS) {
      expect(CATEGORY_BY_KEY[k]).toBeDefined();
      expect(CATEGORY_BY_KEY[k].key).toBe(k);
    }
  });
});
