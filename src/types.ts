import type { CategoryKey } from './lib/categories';

export type Tier = '5-6' | '7-8' | '9-10' | '11-12' | '13-16' | 'dorosli';

export type Age = number | 'dorosly';

export interface Player {
  id: string;
  name: string;
  age: Age;
  score: number;
  color: string;
  emoji: string;
}

export interface Prompt {
  id: string;
  text: string;
  tier: Tier;
  category: CategoryKey;
}

export interface TimeSettings {
  baseSeconds: number;
  handicapEnabled: boolean;
  bonusByTier: Record<Tier, number>;
}

export interface GameSettings {
  time: TimeSettings;
  winScore: number;     // 0 = tryb swobodny
  speechRate: number;   // 0.5 - 1.5
  muted: boolean;
  selectedCategories: CategoryKey[]; // pusta lista = wszystkie
}

export type GameScreen = 'setup' | 'play' | 'result';

export type Phase = 'handoff' | 'ready' | 'running' | 'judged' | 'paused';
