import { useCallback, useEffect, useRef, useState } from 'react';

interface TimerCallbacks {
  onTick?: (secondLeft: number) => void;
  onEnd?: () => void;
}

export function useTimer({ onTick, onEnd }: TimerCallbacks = {}) {
  // Czas trwania przechowujemy w refie (a nie w state) — tick() używa
  // requestAnimationFrame i czytanie wartości z domknięcia state-a powodowało
  // wyścig: setDuration(seconds) jest asynchroniczne, więc pierwsze klatki
  // pętli ruszały ze starym duration. Ref aktualizuje się synchronicznie.
  const durationRef = useRef(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastWholeSecondRef = useRef(-1);
  const onTickRef = useRef(onTick);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const tick = useCallback(() => {
    if (startedAtRef.current == null) return;
    const elapsed =
      elapsedBeforePauseRef.current + (performance.now() - startedAtRef.current) / 1000;
    const left = Math.max(0, durationRef.current - elapsed);
    setRemaining(left);

    const wholeLeft = Math.ceil(left);
    if (wholeLeft !== lastWholeSecondRef.current && wholeLeft > 0 && left > 0) {
      lastWholeSecondRef.current = wholeLeft;
      onTickRef.current?.(wholeLeft);
    }

    if (left <= 0) {
      setRunning(false);
      startedAtRef.current = null;
      elapsedBeforePauseRef.current = 0;
      onEndRef.current?.();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(
    (seconds: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      durationRef.current = seconds;
      setRemaining(seconds);
      elapsedBeforePauseRef.current = 0;
      lastWholeSecondRef.current = seconds + 1;
      startedAtRef.current = performance.now();
      setRunning(true);
      rafRef.current = requestAnimationFrame(tick);
    },
    [tick]
  );

  const pause = useCallback(() => {
    if (startedAtRef.current == null) return;
    elapsedBeforePauseRef.current += (performance.now() - startedAtRef.current) / 1000;
    startedAtRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (running) return;
    const left = durationRef.current - elapsedBeforePauseRef.current;
    if (left <= 0) return;
    // Pozwól, by onTick zagrał dla bieżącej całkowitej sekundy po wznowieniu.
    lastWholeSecondRef.current = Math.ceil(left) + 1;
    startedAtRef.current = performance.now();
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [running, tick]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startedAtRef.current = null;
    elapsedBeforePauseRef.current = 0;
    lastWholeSecondRef.current = -1;
    durationRef.current = 0;
    setRunning(false);
    setRemaining(0);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { remaining, running, start, pause, resume, stop };
}
