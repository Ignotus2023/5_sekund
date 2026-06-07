export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const PLAYER_COLORS = [
  '#7c3aed', // violet
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#8b5cf6', // purple
];

export const PLAYER_EMOJIS = ['🦊', '🐼', '🦁', '🐻', '🐯', '🐸', '🐵', '🐧', '🦄', '🐶', '🐱', '🐰'];

export function nextColor(usedColors: string[]): string {
  const free = PLAYER_COLORS.find((c) => !usedColors.includes(c));
  return free || PLAYER_COLORS[usedColors.length % PLAYER_COLORS.length];
}

export function nextEmoji(usedEmojis: string[]): string {
  const free = PLAYER_EMOJIS.find((e) => !usedEmojis.includes(e));
  return free || PLAYER_EMOJIS[usedEmojis.length % PLAYER_EMOJIS.length];
}

export function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
