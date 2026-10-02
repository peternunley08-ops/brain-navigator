#!/usr/bin/env node
// Freeze the live hub into one self-contained page (state, Simulator view,
// and proof screenshots inlined) so it can be published and opened from a
// phone. Needs the hub server running on :4410.
//   node tools/hub/export.mjs   → tools/hub/live/snapshot/work-hub.html
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIVE = join(HERE, 'live');
const OUT = join(LIVE, 'snapshot');
mkdirSync(OUT, { recursive: true });

const state = await (await fetch('http://localhost:4410/api/state')).json();

// Small JPEGs keep the page light.
function jpeg(src, size) {
  const tmp = join(OUT, `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  try {
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-Z', String(size), src, '--out', tmp], { stdio: 'ignore' });
    const b64 = readFileSync(tmp).toString('base64');
    execFileSync('rm', ['-f', tmp]);
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return null;
  }
}

let sim = null;
try {
  const png = join(OUT, 'sim.png');
  execFileSync('xcrun', ['simctl', 'io', 'booted', 'screenshot', '--type=png', png], { stdio: 'ignore', timeout: 10000 });
  sim = jpeg(png, 900);
} catch {}

const shots = {};
for (const e of state.events) {
  if (e.shot && !shots[e.shot] && existsSync(join(LIVE, 'shots', e.shot))) shots[e.shot] = jpeg(join(LIVE, 'shots', e.shot), 560);
}

let html = readFileSync(join(HERE, 'index.html'), 'utf8');
// The publisher adds its own document skeleton.
html = html
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<html[^>]*>\s*/i, '')
  .replace(/<\/?head>\s*/gi, '')
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<body>\s*/i, '')
  .replace(/<\/body>\s*/i, '')
  .replace(/<\/html>\s*/i, '');
const snap = { at: new Date().toISOString(), state, sim, shots };
const json = JSON.stringify(snap).replace(/</g, '\\u003c');
html = html.replace('<script>\nconst $ =', `<script>window.__SNAPSHOT__ = ${json};</script>\n<script>\nconst $ =`);
const file = join(OUT, 'work-hub.html');
writeFileSync(file, html);
console.log(`${file} (${Math.round(html.length / 1024)} KB, ${state.events.length} events, ${Object.keys(shots).length} shots)`);
