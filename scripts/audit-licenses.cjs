#!/usr/bin/env node
/**
 * F-23: inwentaryzacja licencji zależności. Skanuje top-level deps z
 * package.json + ich faktyczne package.json w node_modules. Flaguje
 * licencje "ryzykowne" dla projektów dystrybuowanych komercyjnie:
 *   - GPL-* (copyleft)
 *   - AGPL-* (network copyleft)
 *   - SSPL-* (server side public license)
 *
 * Użycie: `node scripts/audit-licenses.cjs`
 * Exit code 0 = OK; 1 = wykryto ryzykowną licencję.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ROOT_PKG = require(path.join(ROOT, 'package.json'));
const RISKY = /^(GPL|AGPL|SSPL)/i;

const deps = {
  ...(ROOT_PKG.dependencies || {}),
  ...(ROOT_PKG.devDependencies || {}),
};

const rows = [];
const risky = [];
const missing = [];

Object.keys(deps).sort().forEach((name) => {
  const pkgPath = path.join(ROOT, 'node_modules', name, 'package.json');
  try {
    const pkg = require(pkgPath);
    const license = pkg.license || pkg.licenses?.[0]?.type || '(brak)';
    rows.push({ name, version: pkg.version, license });
    if (typeof license === 'string' && RISKY.test(license)) {
      risky.push({ name, license });
    }
    if (license === '(brak)') {
      missing.push(name);
    }
  } catch {
    rows.push({ name, version: '(nie zainstalowane)', license: '?' });
    missing.push(name);
  }
});

console.log('=== Inwentaryzacja licencji ===\n');
console.log(
  rows
    .map(
      (r) =>
        `  ${(r.name + '@' + r.version).padEnd(40)} ${r.license}`,
    )
    .join('\n'),
);

// Statystyki licencji
const stats = {};
rows.forEach((r) => {
  const k = String(r.license);
  stats[k] = (stats[k] || 0) + 1;
});

console.log('\nRozkład licencji:');
Object.entries(stats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`  ${k.padEnd(20)} ${v}`));

if (missing.length > 0) {
  console.log(`\n⚠️  Brak deklaracji licencji w: ${missing.join(', ')}`);
}

if (risky.length > 0) {
  console.log('\n❌ Ryzykowne licencje (copyleft):');
  risky.forEach((r) => console.log(`  - ${r.name}: ${r.license}`));
  console.log('\nDla projektu dystrybuowanego pod LICENSE MIT to potencjalny');
  console.log('konflikt. Zweryfikuj zgodność albo wymień zależność.');
  process.exit(1);
}

console.log('\n✓ Brak ryzykownych licencji (GPL/AGPL/SSPL).');
process.exit(0);
