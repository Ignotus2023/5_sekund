import type { Age, Tier } from '../types';

export const TIERS: Tier[] = ['5-6', '7-8', '9-10', '11-12', '13-16', 'dorosli'];

export const TIER_LABEL: Record<Tier, string> = {
  '5-6': '5–6 lat',
  '7-8': '7–8 lat',
  '9-10': '9–10 lat',
  '11-12': '11–12 lat',
  '13-16': '13–16 lat',
  'dorosli': 'Dorośli',
};

export const DEFAULT_BONUS: Record<Tier, number> = {
  '5-6': 3,
  '7-8': 2,
  '9-10': 1,
  '11-12': 0,
  '13-16': 0,
  'dorosli': 0,
};

export function tierOf(age: Age): Tier {
  if (age === 'dorosly') return 'dorosli';
  if (age <= 6) return '5-6';
  if (age <= 8) return '7-8';
  if (age <= 10) return '9-10';
  if (age <= 12) return '11-12';
  return '13-16';
}

export function describeAge(age: Age): string {
  return age === 'dorosly' ? 'Dorosły' : `${age} lat`;
}
