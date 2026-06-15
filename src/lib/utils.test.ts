import { describe, it, expect } from 'vitest';
import {
  uid,
  nextColor,
  nextEmoji,
  pickRandom,
  PLAYER_COLORS,
  PLAYER_EMOJIS,
} from './utils';

describe('uid', () => {
  it('zwraca niepusty string', () => {
    const u = uid();
    expect(typeof u).toBe('string');
    expect(u.length).toBeGreaterThan(8);
  });

  it('generuje różne wartości', () => {
    const set = new Set(Array.from({ length: 1000 }, () => uid()));
    expect(set.size).toBe(1000);
  });
});

describe('nextColor', () => {
  it('zwraca pierwszy wolny kolor', () => {
    expect(nextColor([])).toBe(PLAYER_COLORS[0]);
    expect(nextColor([PLAYER_COLORS[0]])).toBe(PLAYER_COLORS[1]);
  });

  it('rotuje po wyczerpaniu palety', () => {
    const allUsed = [...PLAYER_COLORS];
    const next = nextColor(allUsed);
    expect(PLAYER_COLORS).toContain(next);
  });
});

describe('nextEmoji', () => {
  it('zwraca pierwsze wolne emoji', () => {
    expect(nextEmoji([])).toBe(PLAYER_EMOJIS[0]);
    expect(nextEmoji([PLAYER_EMOJIS[0]])).toBe(PLAYER_EMOJIS[1]);
  });

  it('rotuje po wyczerpaniu palety', () => {
    const allUsed = [...PLAYER_EMOJIS];
    const next = nextEmoji(allUsed);
    expect(PLAYER_EMOJIS).toContain(next);
  });
});

describe('pickRandom', () => {
  it('zwraca null dla pustej tablicy', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('zwraca element z tablicy', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      const picked = pickRandom(arr);
      expect(arr).toContain(picked);
    }
  });

  it('eksploruje wszystkie elementy przez wiele losowań', () => {
    const arr = ['a', 'b', 'c'];
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const p = pickRandom(arr);
      if (p) seen.add(p);
    }
    expect(seen.size).toBe(3);
  });
});
