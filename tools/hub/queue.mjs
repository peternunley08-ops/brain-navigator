#!/usr/bin/env node
// Merge-queue checker. Read-only: it never pushes, merges, or moves a branch.
//
//   node tools/hub/queue.mjs
//
// Lists the open PRs (oldest number first), pretends to squash-merge them in
// that order onto origin/main, and reports which would merge cleanly, which
// would clash (and in which files), and which are stacked on another open PR.
// Writes $HUB_LIVE/queue.json for the dashboard and prints a short summary
// plus one line Peter can paste to merge the leading run of clean PRs.
//
// How the simulation works: `git merge-tree --write-tree` merges two commits
// in memory (loose objects only, no refs, no working tree). When a PR merges
// cleanly we make a throwaway commit on top of the simulated main with
// `git commit-tree`, which is what a squash-merge would leave behind.
//
// Needs: git 2.38+, the gh CLI signed in, Node. No packages.
import { execFileSync } from 'node:child_process';
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIVE = process.env.HUB_LIVE || join(HERE, 'live');
const SLUG = process.env.BN_REPO || 'peternunley08-ops/brain-navigator';
const BASE = 'main';
// Throwaway commits need an identity even when the machine has none set.
const ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'queue',
  GIT_AUTHOR_EMAIL: 'queue@localhost',
  GIT_COMMITTER_NAME: 'queue',
  GIT_COMMITTER_EMAIL: 'queue@localhost',
};

// Run a command; never throws. Returns { code, out, err }.
function sh(cmd, args) {
  try {
    const out = execFileSync(cmd, args, { encoding: 'utf8', env: ENV, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out, err: '' };
  } catch (e) {
    return { code: typeof e.status === 'number' ? e.status : 127, out: String(e.stdout || ''), err: String(e.stderr || e.message || '') };
  }
}
const git = (...args) => sh('git', args);

// ---------- 1. the open PRs ----------
git('fetch', '-q');
const listed = sh('gh', ['pr', 'list', '-R', SLUG, '--state', 'open', '--limit', '100', '--json', 'number,title,headRefName,baseRefName']);
if (listed.code !== 0) {
  console.error(`queue: could not list PRs with gh (${(listed.err || '').trim().split('\n')[0] || 'is gh signed in?'})`);
  process.exit(1);
}
const open = JSON.parse(listed.out || '[]').sort((a, b) => a.number - b.number);

// ---------- 2. stacked: one PR's branch contains another open PR's branch ----------
const sha = (ref) => {
  const r = git('rev-parse', '--verify', '-q', ref + '^{commit}');
  return r.code === 0 ? r.out.trim() : null;
};
for (const p of open) p.sha = sha('origin/' + p.headRefName);
const baseSha = sha('origin/' + BASE);

for (const p of open) {
  p.stackedOn = [];
  for (const q of open) {
    if (q === p) continue;
    // PR retargeted at another PR's branch.
    if (p.baseRefName !== BASE && p.baseRefName === q.headRefName) p.stackedOn.push(q.number);
    // p's branch already contains all of q's branch (and q isn't already in main).
    else if (
      p.sha &&
      q.sha &&
      p.sha !== q.sha &&
      git('merge-base', '--is-ancestor', q.sha, p.sha).code === 0 &&
      git('merge-base', '--is-ancestor', q.sha, baseSha || 'origin/' + BASE).code !== 0
    ) {
      p.stackedOn.push(q.number);
    }
  }
}

// ---------- 3. simulate the merges in order ----------
let sim = baseSha;
const prs = [];
for (const p of open) {
  const row = { number: p.number, title: p.title, branch: p.headRefName, clean: false, conflicts: [], stackedOn: p.stackedOn };
  prs.push(row);
  if (!sim || !p.sha) {
    row.conflicts = [!sim ? `origin/${BASE} not found` : `branch ${p.headRefName} not found on origin`];
    continue;
  }
  const m = git('merge-tree', '--write-tree', '--name-only', sim, p.sha);
  const lines = m.out.split('\n');
  if (m.code === 0) {
    const tree = lines[0].trim();
    const c = git('commit-tree', tree, '-p', sim, '-m', 'sim');
    if (c.code === 0) {
      sim = c.out.trim();
      row.clean = true;
    } else {
      row.conflicts = ['could not simulate the merge'];
    }
  } else if (m.code === 1) {
    // After the tree id come the conflicted file names, then a blank line,
    // then the CONFLICT messages.
    const blank = lines.indexOf('');
    const files = lines.slice(1, blank < 0 ? lines.length : blank).map((s) => s.trim()).filter(Boolean);
    const fromMessages = lines
      .filter((l) => l.includes('CONFLICT'))
      .map((l) => (l.match(/Merge conflict in (.+)$/) || l.match(/CONFLICT \([^)]*\): (.+?)(?: deleted| added| renamed| modified|$)/) || [])[1])
      .filter(Boolean);
    row.conflicts = [...new Set(files.length ? files : fromMessages)];
    if (!row.conflicts.length) row.conflicts = ['conflict'];
  } else {
    row.conflicts = ['git could not merge-tree: ' + (m.err || '').trim().split('\n')[0]];
  }
}

// ---------- 4. the paste-able merge command ----------
// Only the leading run of clean PRs (stop at the first clash). A PR that is
// stacked, or that another PR sits on, is merged with --merge: squashing a
// stack rewrites the lower PR and clashes the upper one.
const inStack = new Set();
for (const r of prs) {
  if (r.stackedOn.length) {
    inStack.add(r.number);
    r.stackedOn.forEach((n) => inStack.add(n));
  }
}
const run = [];
for (const r of prs) {
  if (!r.clean) break;
  run.push(r);
}
let command = '';
if (run.length) {
  const view = `[ "$(gh pr view $n -R ${SLUG} --json state -q .state)" = MERGED ] && continue`;
  if (run.some((r) => inStack.has(r.number))) {
    const items = run.map((r) => `${r.number}:${inStack.has(r.number) ? '--merge' : '--squash'}`).join(' ');
    command = `for p in ${items}; do n=\${p%%:*}; f=\${p#*:}; ${view}; gh pr merge $n -R ${SLUG} $f || break; done`;
  } else {
    command = `for n in ${run.map((r) => r.number).join(' ')}; do ${view}; gh pr merge $n -R ${SLUG} --squash || break; done`;
  }
}

// ---------- 5. write + print ----------
const result = { checkedAt: new Date().toISOString(), base: baseSha ? baseSha.slice(0, 7) : null, prs, command };
mkdirSync(LIVE, { recursive: true });
const file = join(LIVE, 'queue.json');
writeFileSync(file + '.tmp', JSON.stringify(result, null, 2) + '\n');
renameSync(file + '.tmp', file);

if (!prs.length) {
  console.log('Merge queue: no open PRs. Nothing to merge.');
} else {
  console.log(`Merge queue on origin/${BASE}${result.base ? ' (' + result.base + ')' : ''}: ${prs.length} open ${prs.length === 1 ? 'PR' : 'PRs'}`);
  for (const r of prs) {
    const status = r.clean ? 'clean' : `CLASHES in ${r.conflicts.slice(0, 3).join(', ')}${r.conflicts.length > 3 ? ` (+${r.conflicts.length - 3} more)` : ''}`;
    const stack = r.stackedOn.length ? `  [stacked on ${r.stackedOn.map((n) => '#' + n).join(', ')}]` : '';
    console.log(`  #${r.number} ${status}${stack}  ${r.title.slice(0, 60)}`);
  }
  console.log(command ? `\nPaste to merge ${run.length} clean ${run.length === 1 ? 'PR' : 'PRs'}:\n${command}` : '\nNothing is safe to merge yet (the first PR clashes).');
}
