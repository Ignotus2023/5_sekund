import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameSettings, Phase, Player, Prompt, Tier } from '../types';
import { tierOf } from '../lib/tier';
import { pickRandom } from '../lib/utils';
import { PROMPTS } from '../data/prompts';
import { useTimer } from './useTimer';
import { useAudio } from './useAudio';
import { useSpeech } from './useSpeech';
import { usePersistedState } from './usePersistedState';

const SPEAK_DELAY_MS = 250;
const AUTO_START_AFTER_TTS_MS = 300;

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

export interface TurnApi {
  activePlayer: Player | undefined;
  activeTier: Tier;
  turnSeconds: number;
  phase: Phase;
  currentPrompt: Prompt | null;
  timerRemaining: number;
  ttsAvailable: boolean;
  acceptTurn: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  judge: (success: boolean) => void;
  advance: () => void;
  skipPrompt: () => void;
  readAgain: () => void;
  adjustScore: (delta: number) => void;
  cancelAll: () => void;
}

interface Options {
  players: Player[];
  settings: GameSettings;
  onScore: (playerId: string, delta: number) => void;
}

/**
 * Maszyna stanów tury i orkiestracja TTS/Audio/Timer wyciągnięte z GameScreen.
 *
 * Faza:  'handoff' → 'ready' → 'running' → 'judged' | 'paused'
 *
 * Inwarianty:
 *  - usedTextsRef żyje globalnie (cross-poziom, cross-partia) → persystowany
 *  - judgingRef chroni przed double-tap "Zaliczone"
 *  - pendingSpeakTimeoutRef → cancelSpeech anuluje też pre-speak setTimeout
 *  - phaseRef i currentPromptIdRef synchronizują dane dla async callbacków
 *    (onEnd TTS) — bo domknięcia mają stary stan
 */
export function useTurn({ players, settings, onScore }: Options): TurnApi {
  const [activeIndex, setActiveIndex] = useState(0);
  const [persistedUsedTexts, setPersistedUsedTexts] = usePersistedState<string[]>(
    'used-prompt-texts',
    [],
  );
  const usedTextsRef = useRef<Set<string>>(new Set(persistedUsedTexts));
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [phase, setPhase] = useState<Phase>('handoff');

  const phaseRef = useRef<Phase>('handoff');
  const currentPromptIdRef = useRef<string | null>(null);
  const judgingRef = useRef(false);
  const pendingSpeakTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    currentPromptIdRef.current = currentPrompt?.id ?? null;
  }, [currentPrompt]);

  const { play } = useAudio(settings.muted);
  const { speak, cancel: rawCancelSpeech, available: ttsAvailable } = useSpeech({
    rate: settings.speechRate,
    muted: settings.muted,
  });

  const {
    remaining: timerRemaining,
    start: timerStart,
    pause: timerPause,
    resume: timerResume,
    stop: timerStop,
  } = useTimer({
    onTick: (left) => {
      if (left > 1) play('tick');
    },
    onEnd: () => {
      play('end');
      setPhase('judged');
    },
  });

  const cancelSpeech = useCallback(() => {
    if (pendingSpeakTimeoutRef.current != null) {
      clearTimeout(pendingSpeakTimeoutRef.current);
      pendingSpeakTimeoutRef.current = null;
    }
    rawCancelSpeech();
  }, [rawCancelSpeech]);

  const safeIndex = players.length > 0 ? activeIndex % players.length : 0;
  const activePlayer = players[safeIndex];

  const activeTier: Tier = useMemo(
    () => (activePlayer ? tierOf(activePlayer.age) : '11-12'),
    [activePlayer],
  );
  const turnSeconds = useMemo(
    () =>
      settings.time.baseSeconds +
      (settings.time.handicapEnabled ? settings.time.bonusByTier[activeTier] : 0),
    [
      settings.time.baseSeconds,
      settings.time.handicapEnabled,
      settings.time.bonusByTier,
      activeTier,
    ],
  );

  const drawPrompt = useCallback(
    (tier: Tier): Prompt | null => {
      const fullPool = PROMPTS[tier];
      const cats = settings.selectedCategories;
      const inCategory =
        cats.length === 0
          ? fullPool
          : fullPool.filter((p) => cats.includes(p.category));
      const pool = inCategory.length > 0 ? inCategory : fullPool;

      const used = usedTextsRef.current;
      let available = pool.filter((p) => !used.has(normalizeText(p.text)));
      if (available.length === 0) {
        pool.forEach((p) => used.delete(normalizeText(p.text)));
        available = pool;
      }
      const picked = pickRandom(available);
      if (!picked) return null;
      used.add(normalizeText(picked.text));
      setPersistedUsedTexts(Array.from(used));
      return picked;
    },
    [settings.selectedCategories, setPersistedUsedTexts],
  );

  const startTimer = useCallback(() => {
    if (!currentPromptIdRef.current) return;
    cancelSpeech();
    setPhase('running');
    timerStart(turnSeconds);
  }, [cancelSpeech, timerStart, turnSeconds]);

  const newPrompt = useCallback(() => {
    const prompt = drawPrompt(activeTier);
    setCurrentPrompt(prompt);
    setPhase('ready');
    timerStop();
    cancelSpeech();
    judgingRef.current = false;
    if (!prompt) return;
    const promptId = prompt.id;

    pendingSpeakTimeoutRef.current = window.setTimeout(() => {
      pendingSpeakTimeoutRef.current = null;
      speak(prompt.text, {
        onEnd: () => {
          if (!ttsAvailable) return;
          if (currentPromptIdRef.current !== promptId) return;
          if (phaseRef.current !== 'ready') return;
          window.setTimeout(() => {
            if (
              currentPromptIdRef.current === promptId &&
              phaseRef.current === 'ready'
            ) {
              startTimer();
            }
          }, AUTO_START_AFTER_TTS_MS);
        },
      });
    }, SPEAK_DELAY_MS);
  }, [activeTier, cancelSpeech, drawPrompt, speak, startTimer, timerStop, ttsAvailable]);

  useEffect(() => {
    setPhase('handoff');
    setCurrentPrompt(null);
    judgingRef.current = false;
    timerStop();
    cancelSpeech();
    return () => {
      cancelSpeech();
      timerStop();
    };
  }, [activeIndex, cancelSpeech, timerStop]);

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const acceptTurn = useCallback(() => {
    if (phaseRef.current !== 'handoff') return;
    newPrompt();
  }, [newPrompt]);

  const pauseTimer = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    timerPause();
    setPhase('paused');
  }, [timerPause]);

  const resumeTimer = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    timerResume();
    setPhase('running');
  }, [timerResume]);

  const advance = useCallback(() => {
    if (players.length === 0) return;
    setActiveIndex((i) => (i + 1) % players.length);
  }, [players.length]);

  const judge = useCallback(
    (success: boolean) => {
      if (judgingRef.current) return;
      const p = phaseRef.current;
      if (p !== 'running' && p !== 'paused' && p !== 'judged') return;
      if (!activePlayer) return;
      judgingRef.current = true;
      timerStop();
      if (success) {
        play('point');
        onScore(activePlayer.id, +1);
      } else {
        play('fail');
      }
      advance();
    },
    [activePlayer, advance, onScore, play, timerStop],
  );

  const skipPrompt = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    newPrompt();
  }, [newPrompt]);

  const readAgain = useCallback(() => {
    if (currentPrompt) speak(currentPrompt.text);
  }, [currentPrompt, speak]);

  const adjustScore = useCallback(
    (delta: number) => {
      if (!activePlayer) return;
      onScore(activePlayer.id, delta);
    },
    [activePlayer, onScore],
  );

  const cancelAll = useCallback(() => {
    cancelSpeech();
    timerStop();
  }, [cancelSpeech, timerStop]);

  return {
    activePlayer,
    activeTier,
    turnSeconds,
    phase,
    currentPrompt,
    timerRemaining,
    ttsAvailable,
    acceptTurn,
    startTimer,
    pauseTimer,
    resumeTimer,
    judge,
    advance,
    skipPrompt,
    readAgain,
    adjustScore,
    cancelAll,
  };
}
