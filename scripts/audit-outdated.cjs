#!/usr/bin/env node
/**
 * F-24: podgląd przeterminowanych zależności. Strategia:
 *   - Dependabot (.github/dependabot.yml) podbija minor+patch tygodniowo.
 *   - Major bumps zostają świadomą decyzją — ten skrypt je pokazuje.
 *
 * Wywołuje `npm outdated --json` i grupuje po typie skoku wersji.
 *
 * Użycie: `node scripts/audit-outdated.cjs`
 * Exit code 0 = zawsze (informacyjny).
 */

const { execSync } = require('child_process');

let out = '';
try {
  out = execSync('npm outdated --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
} catch (e) {
  // npm outdated zwraca exit 1 gdy są outdated paczki — wynik jest w stdout
  out = e.stdout?.toString() || '';
}

if (!out.trim()) {
  console.log('✓ Wszystkie zależności aktualne.');
  process.exit(0);
}

let data;
try {
  data = JSON.parse(out);
} catch {
  console.error('Nie udało się sparsować wyjścia `npm outdated --json`.');
  process.exit(0);
}

function majorOf(v) {
  const m = /^(\d+)\./.exec(String(v));
  return m ? Number(m[1]) : 0;
}

const major = [];
const minor = [];
const patch = [];

for (const [name, info] of Object.entries(data)) {
  const current = String(info.current || info.wanted || '0.0.0');
  const latest = String(info.latest || '0.0.0');
  const curMajor = majorOf(current);
  const latMajor = majorOf(latest);
  if (latMajor > curMajor) {
    major.push({ name, current, latest });
  } else if (current !== latest) {
    // Pozostałe: minor lub patch — nie różnicujemy bardziej, dependabot je
    // i tak grupuje jako "minor-and-patch".
    minor.push({ name, current, latest });
  }
}

void patch; // zastrzeżone do ewentualnej rozbudowy

console.log('=== Status zależności ===\n');

if (minor.length > 0) {
  console.log(`Minor / patch (auto-bump przez Dependabot tygodniowo) — ${minor.length}:`);
  minor.forEach((r) => console.log(`  ${r.name.padEnd(35)} ${r.current} → ${r.latest}`));
  console.log('');
}

if (major.length > 0) {
  console.log(`Major bumps (świadoma decyzja) — ${major.length}:`);
  major.forEach((r) => console.log(`  ${r.name.padEnd(35)} ${r.current} → ${r.latest}`));
  console.log('\nMajor bumps są w Dependabot na ignore (zob. .github/dependabot.yml).');
  console.log('Sprawdź changelog przed aktualizacją.');
} else {
  console.log('✓ Brak oczekujących major bumps.');
}

process.exit(0);
