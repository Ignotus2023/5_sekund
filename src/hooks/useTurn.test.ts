import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { GameSettings, Player } from '../types';
import { DEFAULT_BONUS } from '../lib/tier';
import { useTurn } from './useTurn';

const SETTINGS: GameSettings = {
  time: { baseSeconds: 5, handicapEnabled: true, bonusByTier: { ...DEFAULT_BONUS } },
  winScore: 10,
  speechRate: 0.95,
  muted: true, // wyciszamy TTS / audio — żaden side-effect z przeglądarki
  selectedCategories: [],
};

function players(): Player[] {
  return [
    { id: 'a', name: 'Ola', age: 8, score: 0, color: '#7c3aed', emoji: '🦊' },
    { id: 'b', name: 'Jan', age: 'dorosly', score: 0, color: '#0ea5e9', emoji: '🐼' },
    { id: 'c', name: 'Ela', age: 11, score: 0, color: '#10b981', emoji: '🦁' },
  ];
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTurn — maszyna stanów', () => {
  it('startuje od fazy "handoff" dla pierwszego gracza', () => {
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore: vi.fn() }),
    );
    expect(result.current.phase).toBe('handoff');
    expect(result.current.activePlayer?.id).toBe('a');
  });

  it('acceptTurn przechodzi do "ready" i losuje hasło', () => {
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore: vi.fn() }),
    );
    act(() => {
      result.current.acceptTurn();
    });
    expect(result.current.phase).toBe('ready');
    expect(result.current.currentPrompt).not.toBeNull();
  });

  it('startTimer przechodzi do "running"', () => {
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore: vi.fn() }),
    );
    act(() => {
      result.current.acceptTurn();
    });
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.phase).toBe('running');
  });

  it('pauseTimer i resumeTimer przełączają running ↔ paused', () => {
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore: vi.fn() }),
    );
    act(() => {
      result.current.acceptTurn();
    });
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.pauseTimer();
    });
    expect(result.current.phase).toBe('paused');
    act(() => {
      result.current.resumeTimer();
    });
    expect(result.current.phase).toBe('running');
  });

  it('skipPrompt działa tylko w fazie "ready"', () => {
    const onScore = vi.fn();
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore }),
    );
    act(() => {
      result.current.acceptTurn();
    });
    const firstPrompt = result.current.currentPrompt;
    act(() => {
      result.current.skipPrompt();
    });
    expect(result.current.currentPrompt?.id).not.toBe(firstPrompt?.id);

    // W "running" skip powinien być no-op (faza się nie zmienia)
    act(() => {
      result.current.startTimer();
    });
    const promptInRunning = result.current.currentPrompt;
    act(() => {
      result.current.skipPrompt();
    });
    expect(result.current.currentPrompt?.id).toBe(promptInRunning?.id);
    expect(result.current.phase).toBe('running');
  });

  it('judge(true) zwiększa wynik i przechodzi do następnego gracza', () => {
    const onScore = vi.fn();
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore }),
    );
    act(() => {
      result.current.acceptTurn();
    });
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.judge(true);
    });
    expect(onScore).toHaveBeenCalledWith('a', 1);
    expect(result.current.activePlayer?.id).toBe('b');
    expect(result.current.phase).toBe('handoff');
  });

  it('judge(false) nie zwiększa wyniku, ale przekazuje turę', () => {
    const onScore = vi.fn();
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore }),
    );
    act(() => {
      result.current.acceptTurn();
    });
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.judge(false);
    });
    expect(onScore).not.toHaveBeenCalled();
    expect(result.current.activePlayer?.id).toBe('b');
  });

  it('podwójny judge w tej samej turze NIE liczy się dwa razy', () => {
    const onScore = vi.fn();
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore }),
    );
    act(() => {
      result.current.acceptTurn();
    });
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.judge(true);
      result.current.judge(true);
      result.current.judge(true);
    });
    expect(onScore).toHaveBeenCalledTimes(1);
  });

  it('advance cyklicznie kręci aktywnym graczem', () => {
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore: vi.fn() }),
    );
    expect(result.current.activePlayer?.id).toBe('a');
    act(() => {
      result.current.advance();
    });
    expect(result.current.activePlayer?.id).toBe('b');
    act(() => {
      result.current.advance();
    });
    expect(result.current.activePlayer?.id).toBe('c');
    act(() => {
      result.current.advance();
    });
    expect(result.current.activePlayer?.id).toBe('a');
  });

  it('turnSeconds uwzględnia bonus tieru aktywnego gracza', () => {
    const ps = players();
    // baseSeconds=5, bonus dla 7-8 = 2 → Ola (8) powinna mieć 7 s
    const { result } = renderHook(() =>
      useTurn({ players: ps, settings: SETTINGS, onScore: vi.fn() }),
    );
    expect(result.current.turnSeconds).toBe(5 + DEFAULT_BONUS['7-8']);
  });

  it('drawPrompt nie powtarza hasła w obrębie tej samej puli', () => {
    const { result } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore: vi.fn() }),
    );
    const seen = new Set<string>();
    // 20 losowań pod rząd dla tego samego gracza
    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.acceptTurn();
      });
      const p = result.current.currentPrompt;
      if (p) seen.add(p.text.toLowerCase());
      act(() => {
        result.current.skipPrompt();
      });
    }
    // Wszystkie 20 powinny być unikalne (pula jest większa niż 20)
    expect(seen.size).toBe(20);
  });

  it('historia haseł persystuje w localStorage', () => {
    const { result, unmount } = renderHook(() =>
      useTurn({ players: players(), settings: SETTINGS, onScore: vi.fn() }),
    );
    act(() => {
      result.current.acceptTurn();
    });
    const firstText = result.current.currentPrompt?.text;
    act(() => {
      vi.advanceTimersByTime(500); // debounce flush
    });
    unmount();

    const stored = localStorage.getItem('used-prompt-texts');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as string[];
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed.some((t) => t === firstText?.toLowerCase().trim())).toBe(true);
  });
});
