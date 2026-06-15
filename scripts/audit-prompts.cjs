#!/usr/bin/env node
/**
 * F-22: inwentaryzacja banku haseł. Liczy hasła per poziom + per kategoria,
 * wykrywa duplikaty (textowe) i raportuje sumę.
 *
 * Użycie: `node scripts/audit-prompts.cjs`
 * Exit code 0 = OK; 1 = wykryto duplikaty (które omijają runtime dedup).
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_PATH = path.join(__dirname, '..', 'src', 'data', 'prompts.ts');
const TIERS = ['5-6', '7-8', '9-10', '11-12', '13-16', 'dorosli'];

function readPrompts() {
  const src = fs.readFileSync(PROMPTS_PATH, 'utf8');
  const sections = src.split(/'(?:5-6|7-8|9-10|11-12|13-16|dorosli)':\s*\[/);
  const out = [];
  sections.slice(1).forEach((s, i) => {
    const block = s.split(/\],\s*'(?:[^']+)':\s*\[|\],\s*\};/)[0];
    const lines = [...block.matchAll(/\['([^']+)',\s*'([a-z]+)'\]/g)];
    lines.forEach((m) => {
      out.push({ tier: TIERS[i], text: m[1], category: m[2] });
    });
  });
  return out;
}

function normalize(s) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

const prompts = readPrompts();

// Per-tier i per-category counts
const perTier = {};
const perCategory = {};
TIERS.forEach((t) => (perTier[t] = 0));

prompts.forEach((p) => {
  perTier[p.tier] = (perTier[p.tier] || 0) + 1;
  perCategory[p.category] = (perCategory[p.category] || 0) + 1;
});

// Duplikaty po normalized text
const textIndex = new Map();
prompts.forEach((p) => {
  const n = normalize(p.text);
  if (!textIndex.has(n)) textIndex.set(n, []);
  textIndex.get(n).push(p);
});
const dups = [...textIndex.entries()].filter(([_, v]) => v.length > 1);

// Raport
console.log('=== Inwentaryzacja banku haseł ===\n');
console.log('Hasła per poziom:');
TIERS.forEach((t) =>
  console.log(`  ${t.padEnd(8)} → ${String(perTier[t] || 0).padStart(4)}`),
);
console.log(`  SUMA      → ${String(prompts.length).padStart(4)}\n`);

console.log('Hasła per kategoria (malejąco):');
Object.entries(perCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`  ${k.padEnd(12)} → ${String(v).padStart(4)}`));

console.log(`\nUnikalne teksty (po normalizacji): ${textIndex.size}`);
console.log(`Duplikaty tekstowe między poziomami: ${dups.length}`);

if (dups.length > 0) {
  console.log('\n⚠️  Duplikaty (każdy występuje >1×):');
  dups.forEach(([text, list]) => {
    const refs = list.map((p) => `${p.tier}:${p.category}`).join(', ');
    console.log(`  ${list.length}× "${text}"  [${refs}]`);
  });
  console.log(
    '\nUwaga: runtime drawPrompt i tak filtruje powtórzenia po tekście globalnie.',
  );
  console.log('Duplikaty w pliku zajmują niepotrzebne miejsce w bundlu.');
  process.exit(1);
}

console.log('\n✓ Brak duplikatów tekstowych.');
process.exit(0);
