import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechOptions {
  rate: number;
  muted: boolean;
}

interface SpeakOptions {
  onEnd?: () => void;
}

export function useSpeech({ rate, muted }: SpeechOptions) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const genRef = useRef(0);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAvailable(false);
      return;
    }
    synthRef.current = window.speechSynthesis;

    const pickVoice = () => {
      const voices = synthRef.current?.getVoices() ?? [];
      const polish = voices.filter((v) => v.lang?.toLowerCase().startsWith('pl'));
      // Deterministyczna selekcja: domyślny pl, potem alfabetycznie po nazwie.
      polish.sort((a, b) => {
        if (a.default !== b.default) return a.default ? -1 : 1;
        return (a.name ?? '').localeCompare(b.name ?? '');
      });
      const pl = polish[0] ?? null;
      voiceRef.current = pl;
      setAvailable(!!pl);
    };

    pickVoice();
    synthRef.current.addEventListener?.('voiceschanged', pickVoice);
    return () => {
      synthRef.current?.removeEventListener?.('voiceschanged', pickVoice);
    };
  }, []);

  const speak = useCallback(
    (text: string, opts?: SpeakOptions) => {
      if (muted) return false;
      const synth = synthRef.current;
      if (!synth) return false;
      try {
        synth.cancel();
        const gen = ++genRef.current;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'pl-PL';
        u.rate = Math.max(0.5, Math.min(1.5, rate));
        if (voiceRef.current) u.voice = voiceRef.current;
        const fire = () => {
          if (genRef.current === gen) opts?.onEnd?.();
        };
        u.onend = fire;
        u.onerror = fire;
        synth.speak(u);
        return true;
      } catch {
        return false;
      }
    },
    [muted, rate]
  );

  const cancel = useCallback(() => {
    try {
      genRef.current++;
      synthRef.current?.cancel();
    } catch {
      // ignore
    }
  }, []);

  return { speak, cancel, available };
}
