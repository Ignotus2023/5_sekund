import { useEffect, useRef, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 200;

export function usePersistedState<T>(
  key: string,
  initial: T,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });
  const ready = useRef(false);
  const timerRef = useRef<number | null>(null);
  const latestRef = useRef(state);
  latestRef.current = state;

  // Zapis z debounce'em — nie blokujemy wątku głównego przy każdym keystroke
  // ani ruchu suwakiem.
  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    if (timerRef.current != null) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(latestRef.current));
      } catch {
        // localStorage może być wyłączone albo quota przekroczona — ignorujemy.
      }
      timerRef.current = null;
    }, debounceMs);
  }, [key, state, debounceMs]);

  // Awaryjny synchronicznie flush przy zamykaniu karty / wejściu w background,
  // żeby nie zgubić ostatniego niezapisanego stanu.
  useEffect(() => {
    const flush = () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        localStorage.setItem(key, JSON.stringify(latestRef.current));
      } catch {
        // ignore
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [key]);

  return [state, setState];
}
