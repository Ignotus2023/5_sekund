import { useCallback, useEffect, useRef } from 'react';

type SoundName = 'tick' | 'end' | 'point' | 'fail';

export function useAudio(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const ensure = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        ctxRef.current = new AC();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (mutedRef.current) return;
      const ctx = ensure();
      if (!ctx) return;
      const now = ctx.currentTime;

      const beep = (
        freq: number,
        dur: number,
        opts: { type?: OscillatorType; gain?: number; sweep?: number } = {}
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = opts.type ?? 'sine';
        osc.frequency.setValueAtTime(freq, now);
        if (opts.sweep) {
          osc.frequency.exponentialRampToValueAtTime(opts.sweep, now + dur);
        }
        const peak = opts.gain ?? 0.2;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.05);
      };

      switch (name) {
        case 'tick':
          beep(880, 0.06, { type: 'square', gain: 0.12 });
          break;
        case 'end':
          beep(220, 0.6, { type: 'sawtooth', gain: 0.28, sweep: 110 });
          if ('vibrate' in navigator) navigator.vibrate?.([200, 80, 200]);
          break;
        case 'point':
          beep(880, 0.1, { type: 'triangle', gain: 0.2 });
          setTimeout(() => beep(1320, 0.18, { type: 'triangle', gain: 0.2 }), 90);
          break;
        case 'fail':
          beep(300, 0.18, { type: 'square', gain: 0.18, sweep: 180 });
          break;
      }
    },
    [ensure]
  );

  // Prime audio context on first user interaction (needed for mobile autoplay policies).
  useEffect(() => {
    const prime = () => {
      ensure();
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
    window.addEventListener('pointerdown', prime, { once: true });
    window.addEventListener('keydown', prime, { once: true });
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
  }, [ensure]);

  return { play };
}
