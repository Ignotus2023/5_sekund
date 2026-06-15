import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTimer } from './useTimer';

// Vitest fake timers domyślnie patchują requestAnimationFrame /
// cancelAnimationFrame / performance.now — nie trzeba własnych stubów.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTimer', () => {
  it('start ustawia running=true i remaining≈duration', () => {
    const { result } = renderHook(() => useTimer());
    act(() => {
      result.current.start(5);
    });
    expect(result.current.running).toBe(true);
    expect(result.current.remaining).toBe(5);
  });

  it('odlicza i wywołuje onEnd po upływie czasu', () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTimer({ onEnd }));
    act(() => {
      result.current.start(1);
    });
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(onEnd).toHaveBeenCalledOnce();
    expect(result.current.running).toBe(false);
  });

  it('onTick wywoływany dla pełnych sekund (bez 0 i bez powtórek)', () => {
    const onTick = vi.fn();
    const { result } = renderHook(() => useTimer({ onTick }));
    act(() => {
      result.current.start(3);
    });
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    // Dla 3-sekundowej tury onTick powinien wystrzelić dla 3, 2, 1
    // (każda wartość dokładnie raz).
    const calls = onTick.mock.calls.map((c) => c[0] as number);
    expect(calls).toEqual(expect.arrayContaining([3, 2, 1]));
    const set = new Set(calls);
    expect(set.size).toBe(calls.length);
  });

  it('pause zatrzymuje odliczanie', () => {
    const { result } = renderHook(() => useTimer());
    act(() => {
      result.current.start(5);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      result.current.pause();
    });
    const afterPause = result.current.remaining;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // Po pauzie czas się nie zmienia.
    expect(result.current.remaining).toBeCloseTo(afterPause, 1);
    expect(result.current.running).toBe(false);
  });

  it('resume kontynuuje od momentu pauzy', () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTimer({ onEnd }));
    act(() => {
      result.current.start(2);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onEnd).not.toHaveBeenCalled();
    act(() => {
      result.current.resume();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('stop zeruje stan', () => {
    const { result } = renderHook(() => useTimer());
    act(() => {
      result.current.start(5);
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.running).toBe(false);
    expect(result.current.remaining).toBe(0);
  });
});
