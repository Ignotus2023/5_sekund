import { describe, it, expect } from 'vitest';
import { tierOf, TIERS, DEFAULT_BONUS, TIER_LABEL, describeAge } from './tier';

describe('tierOf', () => {
  it('mapuje wieki na poprawny tier (granice)', () => {
    expect(tierOf(5)).toBe('5-6');
    expect(tierOf(6)).toBe('5-6');
    expect(tierOf(7)).toBe('7-8');
    expect(tierOf(8)).toBe('7-8');
    expect(tierOf(9)).toBe('9-10');
    expect(tierOf(10)).toBe('9-10');
    expect(tierOf(11)).toBe('11-12');
    expect(tierOf(12)).toBe('11-12');
    expect(tierOf(13)).toBe('13-16');
    expect(tierOf(16)).toBe('13-16');
  });

  it('zwraca dorosli dla wartości "dorosly"', () => {
    expect(tierOf('dorosly')).toBe('dorosli');
  });
});

describe('TIERS', () => {
  it('zawiera dokładnie 6 poziomów', () => {
    expect(TIERS).toHaveLength(6);
  });

  it('każdy tier ma label', () => {
    for (const t of TIERS) expect(TIER_LABEL[t]).toBeTruthy();
  });

  it('każdy tier ma DEFAULT_BONUS', () => {
    for (const t of TIERS) expect(typeof DEFAULT_BONUS[t]).toBe('number');
  });
});

describe('describeAge', () => {
  it('formatuje wiek liczbowy', () => {
    expect(describeAge(8)).toBe('8 lat');
    expect(describeAge(16)).toBe('16 lat');
  });

  it('formatuje wiek "dorosly"', () => {
    expect(describeAge('dorosly')).toBe('Dorosły');
  });
});
