import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePersistedState } from './usePersistedState';

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('usePersistedState', () => {
  it('zwraca wartość z localStorage przy mountcie', () => {
    localStorage.setItem('k', JSON.stringify({ x: 1 }));
    const { result } = renderHook(() => usePersistedState('k', { x: 0 }));
    expect(result.current[0]).toEqual({ x: 1 });
  });

  it('używa wartości initial, gdy brak w storage', () => {
    const { result } = renderHook(() =>
      usePersistedState<number>('missing', 42),
    );
    expect(result.current[0]).toBe(42);
  });

  it('padający JSON.parse → fallback do initial', () => {
    localStorage.setItem('bad', '{ this is not JSON');
    const { result } = renderHook(() => usePersistedState('bad', 'ok'));
    expect(result.current[0]).toBe('ok');
  });

  it('zapisuje do localStorage z debouncem', () => {
    const { result } = renderHook(() =>
      usePersistedState<number>('counter', 0, 100),
    );
    act(() => {
      result.current[1](7);
    });
    // Przed upływem debounce'u — w storage NIC nowego.
    expect(localStorage.getItem('counter')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(localStorage.getItem('counter')).toBe('7');
  });

  it('debounce zachowuje tylko ostatnią wartość przy szybkich update-ach', () => {
    const { result } = renderHook(() =>
      usePersistedState<number>('counter', 0, 200),
    );
    act(() => {
      result.current[1](1);
      result.current[1](2);
      result.current[1](3);
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(localStorage.getItem('counter')).toBe('3');
  });

  it('flush na pagehide zapisuje bieżący stan', () => {
    const { result } = renderHook(() =>
      usePersistedState<string>('k', 'initial', 500),
    );
    act(() => {
      result.current[1]('pending');
    });
    expect(localStorage.getItem('k')).toBeNull();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(localStorage.getItem('k')).toBe('"pending"');
  });

  it('akceptuje funkcyjny update', () => {
    const { result } = renderHook(() =>
      usePersistedState<number>('counter', 5, 50),
    );
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(result.current[0]).toBe(6);
    expect(localStorage.getItem('counter')).toBe('6');
  });
});
