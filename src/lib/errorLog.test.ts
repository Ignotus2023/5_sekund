import { describe, it, expect, beforeEach } from 'vitest';
import {
  ERROR_LOG_STORAGE_KEY,
  clearErrors,
  getErrors,
  logError,
} from './errorLog';

beforeEach(() => {
  localStorage.clear();
});

describe('errorLog', () => {
  it('zwraca pustą tablicę dla braku danych', () => {
    expect(getErrors()).toEqual([]);
  });

  it('zapisuje wpis z timestamp', () => {
    logError({ source: 'window', message: 'boom' });
    const all = getErrors();
    expect(all).toHaveLength(1);
    expect(all[0]?.message).toBe('boom');
    expect(all[0]?.source).toBe('window');
    expect(typeof all[0]?.timestamp).toBe('number');
  });

  it('utrzymuje co najwyżej 20 wpisów (ring buffer)', () => {
    for (let i = 0; i < 30; i++) {
      logError({ source: 'react', message: `err ${i}` });
    }
    const all = getErrors();
    expect(all).toHaveLength(20);
    // Ostatnie 20 = err 10..err 29 (zachowane są nowsze)
    expect(all[0]?.message).toBe('err 10');
    expect(all[19]?.message).toBe('err 29');
  });

  it('obcina za długi message i stack', () => {
    const longMsg = 'x'.repeat(2000);
    const longStack = 'y'.repeat(5000);
    logError({ source: 'window', message: longMsg, stack: longStack });
    const e = getErrors()[0]!;
    expect(e.message.length).toBeLessThanOrEqual(520);
    expect(e.message.endsWith('(obcięte)')).toBe(true);
    expect(e.stack?.length).toBeLessThanOrEqual(3020);
  });

  it('clearErrors usuwa wpisy', () => {
    logError({ source: 'window', message: 'a' });
    logError({ source: 'window', message: 'b' });
    expect(getErrors()).toHaveLength(2);
    clearErrors();
    expect(getErrors()).toEqual([]);
  });

  it('odporne na uszkodzony JSON w storage', () => {
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, '{not json');
    expect(getErrors()).toEqual([]);
  });

  it('odporne na nie-tablicę w storage', () => {
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify({ x: 1 }));
    expect(getErrors()).toEqual([]);
  });

  it('odfiltrowuje wpisy bez wymaganych pól', () => {
    localStorage.setItem(
      ERROR_LOG_STORAGE_KEY,
      JSON.stringify([
        { timestamp: 1, message: 'ok' },
        { message: 'brak timestamp' },
        null,
        'string',
        { timestamp: 'nie-liczba', message: 'x' },
      ]),
    );
    const all = getErrors();
    expect(all).toHaveLength(1);
    expect(all[0]?.message).toBe('ok');
  });
});
