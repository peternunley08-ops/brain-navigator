// The work hub's server. Serves the dashboard (index.html), and one live
// JSON endpoint that folds together: the team, the idea bank, the event
// log every agent writes to, the git state of every agent's worktree, and
// a fresh Simulator screenshot. No dependencies; run with
//   node tools/hub/server.mjs   (port 4410)
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = normalize(join(HERE, '..', '..'));
const LIVE = process.env.HUB_LIVE || join(HERE, 'live');
const PORT = Number(process.env.PORT || 4410);
mkdirSync(join(LIVE, 'shots'), { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

// ---------- idea bank (data/ideas.txt) ----------
// "## Label | key | #color" starts an area; each idea is
// "ID | size | impact | owner | title | detail | tags".
let bankCache = { mtime: 0, value: null };
function readBank() {
  const file = join(HERE, 'data', 'ideas.txt');
  const mtime = statSync(file).mtimeMs;
  if (bankCache.value && bankCache.mtime === mtime) return bankCache.value;
  const areas = [];
  const ideas = [];
  let area = null;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#!')) continue;
    if (line.startsWith('## ')) {
      const [label, key, color] = line.slice(3).split('|').map((s) => s.trim());
      area = { key, label, color };
      areas.push(area);
      continue;
    }
    const parts = line.split('|').map((s) => s.trim());
    if (parts.length < 6 || !area) continue;
    const [id, size, impact, owner, title, detail, tags = ''] = parts;
    const tagList = tags.split(/\s+/).filter(Boolean);
    const status = tagList.find((t) => t.startsWith('='))?.slice(1) || null;
    ideas.push({
      id,
      area: area.key,
      size,
      impact: Number(impact) || 1,
      owner: owner === '-' ? null : owner,
      title,
      detail,
      tags: tagList.filter((t) => !t.startsWith('=')),
      status,
    });
  }
  bankCache = { mtime, value: { areas, ideas } };
  return bankCache.value;
}

// ---------- events (live/events.jsonl) ----------
async function readEvents() {
  const file = join(LIVE, 'events.jsonl');
  if (!existsSync(file)) return [];
  const out = [];
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {}
  }
  return out;
}

// ---------- git: main + every worktree ----------
let gitCache = { at: 0, value: null };
async function git(args, cwd = REPO) {
  try {
    const { stdout } = await run('git', args, { cwd, maxBuffer: 4 << 20 });
    return stdout;
  } catch {
    return '';
  }
}
async function readGit() {
  if (gitCache.value && Date.now() - gitCache.at < 4000) return gitCache.value;
  const porcelain = await git(['worktree', 'list', '--porcelain']);
  const trees = [];
  let cur = null;
  for (const line of porcelain.split('\n')) {
    if (line.startsWith('worktree ')) cur = { path: line.slice(9) }, trees.push(cur);
    else if (line.startsWith('branch ') && cur) cur.branch = line.slice(7).replace('refs/heads/', '');
    else if (line.startsWith('HEAD ') && cur) cur.head = line.slice(5, 12);
  }
  await Promise.all(
    trees.map(async (t) => {
      const status = await git(['status', '--porcelain'], t.path);
      t.dirty = status.split('\n').filter(Boolean).map((l) => l.slice(3));
      const isMain = t.path === REPO;
      t.main = isMain;
      if (!isMain) {
        const ahead = await git(['log', '--format=%h\t%s\t%cr', 'main..HEAD'], t.path);
        t.commits = ahead.split('\n').filter(Boolean).map((l) => {
          const [hash, subject, when] = l.split('\t');
          return { hash, subject, when };
        });
        const stat = await git(['diff', '--shortstat', 'main'], t.path);
        const m = stat.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
        t.files = m ? Number(m[1]) : 0;
        t.plus = m ? Number(m[2] || 0) : 0;
        t.minus = m ? Number(m[3] || 0) : 0;
        const names = await git(['diff', '--name-only', 'main'], t.path);
        t.changed = [...new Set([...names.split('\n').filter(Boolean), ...t.dirty])].slice(0, 40);
      }
    }),
  );
  const log = await git(['log', '--format=%h\t%s\t%cr', '-8', 'main']);
  const commits = log.split('\n').filter(Boolean).map((l) => {
    const [hash, subject, when] = l.split('\t');
    return { hash, subject, when };
  });
  const branches = await git(['branch', '--format=%(refname:short)\t%(committerdate:relative)']);
  gitCache = {
    at: Date.now(),
    value: { trees, commits, branches: branches.split('\n').filter(Boolean).map((l) => l.split('\t')) },
  };
  return gitCache.value;
}

// ---------- live Simulator screenshot ----------
let sim = { at: 0, buf: null, busy: null };
async function simShot() {
  if (sim.buf && Date.now() - sim.at < 5000) return sim.buf;
  if (sim.busy) return sim.busy;
  sim.busy = (async () => {
    const out = join(LIVE, 'sim.png');
    try {
      await run('xcrun', ['simctl', 'io', 'booted', 'screenshot', '--type=png', out], { timeout: 8000 });
      // Shrink it: the dashboard shows it small.
      await run('sips', ['-Z', '900', out], { timeout: 8000 }).catch(() => {});
      sim = { at: Date.now(), buf: await readFile(out), busy: null };
    } catch {
      sim.busy = null;
    }
    return sim.buf;
  })();
  return sim.busy;
}

// ---------- http ----------
const team = () => JSON.parse(readFileSync(join(HERE, 'data', 'team.json'), 'utf8'));

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/api/state') {
      const [events, gitState] = await Promise.all([readEvents(), readGit()]);
      const body = JSON.stringify({ now: new Date().toISOString(), team: team(), ...readBank(), events, git: gitState });
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      return res.end(body);
    }
    if (url.pathname === '/api/sim.png') {
      const buf = await simShot();
      if (!buf) return res.writeHead(404).end();
      res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store', 'x-shot-at': String(sim.at) });
      return res.end(buf);
    }
    let file;
    if (url.pathname.startsWith('/live/shots/')) file = join(LIVE, 'shots', decodeURIComponent(url.pathname.slice(12)).replace(/\.\./g, ''));
    else file = join(HERE, url.pathname === '/' ? 'index.html' : url.pathname.replace(/\.\./g, ''));
    if (!file.startsWith(HERE) && !file.startsWith(LIVE)) return res.writeHead(403).end();
    const buf = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(buf);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(PORT, () => console.log(`work hub on http://localhost:${PORT}`));
