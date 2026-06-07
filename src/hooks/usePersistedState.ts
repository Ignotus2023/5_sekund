import { useEffect, useRef, useState } from 'react';

export function usePersistedState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
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
  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [key, state]);
  return [state, setState];
}
