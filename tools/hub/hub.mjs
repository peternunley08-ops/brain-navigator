#!/usr/bin/env node
// Report to the work hub. Every agent (and Atlas) calls this at each step;
// the dashboard folds the events into live state. Append-only, one JSON
// line per event, safe to call from any worktree.
//
//   node tools/hub/hub.mjs <agent> <type> [flags] "message"
//
// types:  hello · state · claim · step · file · check · commit · done
//         blocked · dropped · note · idea · queue · integrated · verified
//         shipped · shot · bye
// flags:  --idea ID[,ID]   which idea(s) this is about
//         --pct N          progress on the current idea, 0-100
//         --state S        reading | building | checking | waiting | done | idle
//         --file PATH      a file touched (repeatable)
//         --ok / --fail    result of a check
//         --to AGENT       (queue) who the idea goes to
//         --area K --size S|M|L --impact 1-3 --title T   (idea) a new idea
//         --shot PATH      (shot) a screenshot to show in the gallery
import { fileURLToPath } from 'node:url';
import { appendFileSync, copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const LIVE = process.env.HUB_LIVE || fileURLToPath(new URL('./live', import.meta.url));
mkdirSync(join(LIVE, 'shots'), { recursive: true });

const [agent, type, ...rest] = process.argv.slice(2);
if (!agent || !type) {
  console.error('usage: hub.mjs <agent> <type> [--idea ID] [--pct N] [--state S] [--file P] [--ok|--fail] "message"');
  process.exit(2);
}
const ev = { t: new Date().toISOString(), agent: agent.toLowerCase(), type };
const words = [];
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (!a.startsWith('--')) {
    words.push(a);
    continue;
  }
  const key = a.slice(2);
  if (key === 'ok') ev.ok = true;
  else if (key === 'fail') ev.ok = false;
  else {
    const val = rest[++i];
    if (key === 'idea') ev.ideas = String(val).split(',').map((s) => s.trim()).filter(Boolean);
    else if (key === 'file') (ev.files ||= []).push(val);
    else if (key === 'pct' || key === 'impact') ev[key] = Number(val);
    else ev[key] = val;
  }
}
ev.msg = words.join(' ').trim();
// Ideas filed by the team get the next S-number.
if (type === 'idea' && !ev.id) {
  let n = 0;
  try {
    n = readFileSync(join(LIVE, 'events.jsonl'), 'utf8').split('\n').filter((l) => l.includes('"type":"idea"')).length;
  } catch {}
  ev.id = `S${String(n + 1).padStart(3, '0')}`;
}
if (ev.shot) {
  const name = `${Date.now()}-${basename(ev.shot)}`;
  try {
    copyFileSync(ev.shot, join(LIVE, 'shots', name));
    ev.shot = name;
  } catch {
    delete ev.shot;
  }
}
appendFileSync(join(LIVE, 'events.jsonl'), JSON.stringify(ev) + '\n');
console.log(`hub: ${ev.agent} ${ev.type}${ev.ideas ? ' ' + ev.ideas.join(',') : ''} ${ev.msg}`.trim());
