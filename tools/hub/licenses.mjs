#!/usr/bin/env node
// Builds assets/licenses.json: every package the app ships with (production
// dependencies), its license, and the license text from the package, so the
// app can show the notices MIT, BSD, Apache and OFL require. Identical texts
// are stored once. Re-run after adding or updating packages:
//   node tools/hub/licenses.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
// npm ls exits non-zero over peer-dependency warnings; the list is still complete.
const dirs = (spawnSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stdout ?? '')
  .split('\n')
  .slice(1)
  .filter(Boolean);

const licenseOf = (p) =>
  typeof p.license === 'string' ? p.license : p.license?.type ?? (Array.isArray(p.licenses) ? p.licenses.map((l) => l.type).join(' OR ') : 'See package');

const texts = [];
const index = new Map();
const seen = new Set();
const packages = [];
for (const dir of dirs) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  } catch {
    continue;
  }
  const id = `${pkg.name}@${pkg.version}`;
  if (!pkg.name || seen.has(id)) continue;
  seen.add(id);
  const file = existsSync(dir) ? readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.|$)/i.test(f)) : null;
  let t = null;
  if (file) {
    const body = readFileSync(join(dir, file), 'utf8').replace(/\r\n/g, '\n').trim();
    if (!index.has(body)) {
      index.set(body, texts.length);
      texts.push(body);
    }
    t = index.get(body);
  }
  packages.push({ n: pkg.name, v: pkg.version, l: licenseOf(pkg), t });
}
packages.sort((a, b) => a.n.localeCompare(b.n));
writeFileSync(join(ROOT, 'assets/licenses.json'), JSON.stringify({ packages, texts }));
console.log(`assets/licenses.json: ${packages.length} packages, ${texts.length} license texts`);
