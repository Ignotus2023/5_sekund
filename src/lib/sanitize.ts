import type { GameSettings, Player, Tier } from '../types';
import { TIERS, DEFAULT_BONUS } from './tier';
import { CATEGORY_KEYS, type CategoryKey } from './categories';
import { PLAYER_COLORS } from './utils';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const FALLBACK_COLOR = '#7c3aed';

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function sanitizeColor(value: unknown): string {
  if (typeof value === 'string' && HEX_COLOR.test(value)) return value;
  return FALLBACK_COLOR;
}

function sanitizeAge(value: unknown): number | 'dorosly' {
  if (value === 'dorosly') return 'dorosly';
  if (isFiniteNumber(value)) return clamp(Math.round(value), 5, 16);
  return 8;
}

// Znaki niewidoczne / niebezpieczne usuwane z imion:
//  - U+0000..U+001F  (C0 controls — NUL, BEL, BS itd.)
//  - U+007F..U+009F  (DEL + C1 controls)
//  - U+200B..U+200F  (zero-width space/joiner/non-joiner + bidi marks)
//  - U+202A..U+202E  (bidi override — atak typu Trojan Source)
//  - U+2060..U+2064  (word joiner + invisible operators)
//  - U+FEFF          (BOM / zero-width no-break space)
// Polskie litery, RTL (np. arabski), emoji i znaki interpunkcyjne przechodzą.
const FORBIDDEN_CHARS = new RegExp(
  '[' +
    '\u0000-\u001F' +
    '\u007F-\u009F' +
    '\u200B-\u200F' +
    '\u202A-\u202E' +
    '\u2060-\u2064' +
    '\uFEFF' +
    ']',
  'g',
);

function sanitizeString(value: unknown, fallback: string, maxLen = 24): string {
  if (typeof value !== 'string') return fallback;
  // 1. Usuń znaki kontrolne i zero-width (mogą wpłynąć na layout / czytniki).
  // 2. Zwiń ciągi białych znaków do pojedynczej spacji.
  // 3. Przytnij białe na brzegach.
  const cleaned = value.replace(FORBIDDEN_CHARS, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  // Iteracja po code-pointach (zamiast .slice na code-units), żeby nie
  // rozjechać emoji/surogatów w połowie znaku.
  const codepoints = [...cleaned];
  if (codepoints.length <= maxLen) return cleaned;
  return codepoints.slice(0, maxLen).join('');
}

function sanitizeBonusByTier(value: unknown): Record<Tier, number> {
  const out: Record<Tier, number> = { ...DEFAULT_BONUS };
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    for (const tier of TIERS) {
      const n = v[tier];
      if (isFiniteNumber(n)) out[tier] = clamp(Math.round(n), 0, 10);
    }
  }
  return out;
}

function sanitizeCategories(value: unknown): CategoryKey[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set<string>(CATEGORY_KEYS);
  const seen = new Set<string>();
  const out: CategoryKey[] = [];
  for (const item of value) {
    if (typeof item === 'string' && valid.has(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item as CategoryKey);
    }
  }
  return out;
}

export function sanitizeSettings(
  value: unknown,
  defaults: GameSettings,
): GameSettings {
  const raw = (value ?? {}) as Partial<GameSettings>;
  const time = (raw.time ?? {}) as Partial<GameSettings['time']>;
  return {
    time: {
      baseSeconds: isFiniteNumber(time.baseSeconds)
        ? clamp(Math.round(time.baseSeconds), 1, 60)
        : defaults.time.baseSeconds,
      handicapEnabled:
        typeof time.handicapEnabled === 'boolean'
          ? time.handicapEnabled
          : defaults.time.handicapEnabled,
      bonusByTier: sanitizeBonusByTier(time.bonusByTier),
    },
    winScore: isFiniteNumber(raw.winScore)
      ? clamp(Math.round(raw.winScore), 0, 999)
      : defaults.winScore,
    speechRate: isFiniteNumber(raw.speechRate)
      ? clamp(raw.speechRate, 0.5, 1.5)
      : defaults.speechRate,
    muted: typeof raw.muted === 'boolean' ? raw.muted : defaults.muted,
    selectedCategories: sanitizeCategories(raw.selectedCategories),
  };
}

export function sanitizePlayers(value: unknown): Player[] {
  if (!Array.isArray(value)) return [];
  const usedColors = new Set<string>();
  const usedEmojis = new Set<string>();
  const usedIds = new Set<string>();
  const out: Player[] = [];
  let i = 0;
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const p = raw as Partial<Player>;

    // ID musi być unikalne; jeśli się powtarza lub jest złe — generujemy nowe.
    let id = typeof p.id === 'string' && p.id ? p.id : `p-${Date.now()}-${i}`;
    while (usedIds.has(id)) id = `${id}-${i}`;
    usedIds.add(id);

    const color = sanitizeColor(p.color);
    // Jeśli kolor jest duplikatem, podmieniamy na najbliższy wolny z palety.
    const finalColor = usedColors.has(color)
      ? (PLAYER_COLORS.find((c) => !usedColors.has(c)) ?? color)
      : color;
    usedColors.add(finalColor);

    const emoji =
      typeof p.emoji === 'string' && [...p.emoji].length > 0 ? p.emoji : '🦊';
    const finalEmoji = usedEmojis.has(emoji) ? '🦊' : emoji;
    usedEmojis.add(finalEmoji);

    out.push({
      id,
      name: sanitizeString(p.name, `Gracz ${i + 1}`, 24),
      age: sanitizeAge(p.age),
      score: isFiniteNumber(p.score) ? clamp(Math.round(p.score), 0, 999) : 0,
      color: finalColor,
      emoji: finalEmoji,
    });
    i++;
  }
  return out;
}
