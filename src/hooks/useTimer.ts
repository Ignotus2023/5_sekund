import { useCallback, useEffect, useRef, useState } from 'react';

interface TimerCallbacks {
  onTick?: (secondLeft: number) => void;
  onEnd?: () => void;
}

export function useTimer({ onTick, onEnd }: TimerCallbacks = {}) {
  const [duration, setDuration] = useState(0);
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
    const elapsed = elapsedBeforePauseRef.current + (performance.now() - startedAtRef.current) / 1000;
    const left = Math.max(0, duration - elapsed);
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
  }, [duration]);

  const start = useCallback(
    (seconds: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setDuration(seconds);
      setRemaining(seconds);
      elapsedBeforePauseRef.current = 0;
      lastWholeSecondRef.current = seconds + 1;
      startedAtRef.current = performance.now();
      setRunning(true);
    },
    []
  );

  const pause = useCallback(() => {
    if (!running || startedAtRef.current == null) return;
    elapsedBeforePauseRef.current += (performance.now() - startedAtRef.current) / 1000;
    startedAtRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);
  }, [running]);

  const resume = useCallback(() => {
    if (running || remaining <= 0) return;
    startedAtRef.current = performance.now();
    setRunning(true);
  }, [running, remaining]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startedAtRef.current = null;
    elapsedBeforePauseRef.current = 0;
    lastWholeSecondRef.current = -1;
    setRunning(false);
    setRemaining(0);
    setDuration(0);
  }, []);

  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, tick]);

  return { remaining, duration, running, start, pause, resume, stop };
}
