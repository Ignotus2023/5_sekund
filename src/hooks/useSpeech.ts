import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechOptions {
  rate: number;
  muted: boolean;
}

export function useSpeech({ rate, muted }: SpeechOptions) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAvailable(false);
      return;
    }
    synthRef.current = window.speechSynthesis;

    const pickVoice = () => {
      const voices = synthRef.current?.getVoices() ?? [];
      const pl = voices.find((v) => v.lang?.toLowerCase().startsWith('pl'));
      voiceRef.current = pl ?? null;
      setAvailable(!!pl);
    };

    pickVoice();
    synthRef.current.addEventListener?.('voiceschanged', pickVoice);
    return () => {
      synthRef.current?.removeEventListener?.('voiceschanged', pickVoice);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (muted) return;
      const synth = synthRef.current;
      if (!synth) return;
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'pl-PL';
        u.rate = Math.max(0.5, Math.min(1.5, rate));
        if (voiceRef.current) u.voice = voiceRef.current;
        synth.speak(u);
      } catch {
        // ignore
      }
    },
    [muted, rate]
  );

  const cancel = useCallback(() => {
    try {
      synthRef.current?.cancel();
    } catch {
      // ignore
    }
  }, []);

  return { speak, cancel, available };
}
