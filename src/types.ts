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
  category?: string;
}

export interface TimeSettings {
  baseSeconds: number;
  handicapEnabled: boolean;
  bonusByTier: Record<Tier, number>;
}

export interface GameSettings {
  time: TimeSettings;
  winScore: number;     // 0 = swobodny tryb
  speechRate: number;   // 0.5 - 1.5
  muted: boolean;
}

export type GameScreen = 'setup' | 'play' | 'result';

export type TurnPhase = 'ready' | 'running' | 'judging' | 'paused';

export interface GameState {
  screen: GameScreen;
  players: Player[];
  activePlayerIndex: number;
  currentPrompt: Prompt | null;
  phase: TurnPhase;
  usedPromptIds: Record<Tier, string[]>;
  winnerId: string | null;
  roundNumber: number;
}
