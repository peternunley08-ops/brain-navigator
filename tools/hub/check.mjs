#!/usr/bin/env node
// The quality gate. Run it from a worktree (or the main checkout) before
// handing work off:
//   node tools/hub/check.mjs --agent <name> [--idea ID]
// 1. House rules on every added line of every changed .ts/.tsx file
//    (the rules this app has learned the hard way; see CLAUDE.md).
// 2. The TypeScript check (npx tsc --noEmit).
// Reports to the hub, prints findings, exits 1 on any error.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Main checkout: two levels up from this script (works on the Mac and in cloud sessions).
const MAIN = process.env.BN_MAIN ?? fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const HUB = join(MAIN, 'tools/hub/hub.mjs');
const args = process.argv.slice(2);
const flag = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const agent = flag('agent') || 'atlas';
const idea = flag('idea');
const cwd = process.cwd();
const sh = (cmd, a) => {
  try {
    return execFileSync(cmd, a, { cwd, encoding: 'utf8', maxBuffer: 16 << 20 });
  } catch (e) {
    return e.stdout || '';
  }
};

// A worktree has no node_modules of its own; borrow the main checkout's.
if (!existsSync(join(cwd, 'node_modules'))) symlinkSync(join(MAIN, 'node_modules'), join(cwd, 'node_modules'));

const base = sh('git', ['merge-base', 'HEAD', 'main']).trim() || 'HEAD';
const changed = new Set([
  ...sh('git', ['diff', '--name-only', base]).split('\n'),
  ...sh('git', ['ls-files', '--others', '--exclude-standard']).split('\n'),
]);
const files = [...changed].filter((f) => /\.(ts|tsx)$/.test(f) && existsSync(join(cwd, f)) && !f.startsWith('tools/') && !f.startsWith('supabase/'));

// [level, id, test(line, file), advice]
const RULES = [
  ['error', 'router-back', (l) => /router\.back\(\)/.test(l), 'use goBack() from core/chrome (a page opened from a link has nothing behind it)'],
  ['error', 'raw-haptics', (l, f) => /from 'expo-haptics'/.test(l) && !f.endsWith('core/haptics.ts'), "import haptics from core/haptics (the Full/Light/Off setting goes through it)"],
  ['error', 'uppercase', (l) => /textTransform:\s*'uppercase'/.test(l), 'no uppercase or tracked eyebrow labels; sentence case'],
  ['error', 'middle-dot', (l) => /['"`>][^'"`<]*\s·\s[^'"`<]*['"`<]/.test(l) && !/^\s*(\/\/|\*)/.test(l), 'no "A · B · C" joins in copy; write a sentence'],
  ['error', 'new-array-selector', (l) => /use\w+Store\(\(\w+\)\s*=>\s*\w+(\.\w+)+\.(filter|map|slice|concat|sort)\(/.test(l), 'zustand 5 loops forever on a new array per call: select the array, filter in render (or useMemo)'],
  ['error', 'auth', (l) => /supabase\.auth\.|auth\.users/.test(l), 'no Supabase Auth or auth.users without the user saying so'],
  ['error', 'jsx-dollar', (l, f) => f.endsWith('.tsx') && /\$\{/.test(l) && !l.includes('`'), 'template syntax outside backticks: in JSX text `${x}` renders a literal "$"; write {x}'],
  ['error', 'secret', (l) => /sk-ant-[A-Za-z0-9_-]{20,}|\b(ntn_|secret_)[A-Za-z0-9]{30,}|\bAKIA[0-9A-Z]{16}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(l), 'a real key in code: remove it (the owner rotates it); secrets live in Supabase function secrets, never EXPO_PUBLIC_'],
  ['error', 'console-log', (l) => /console\.log\(/.test(l), 'remove console.log before handing off'],
  ['warn', 'raw-pressable', (l) => /<(Pressable|TouchableOpacity|TouchableHighlight)\b/.test(l), 'tappable things use Pressy (spring press + haptic) or a kit component'],
  ['warn', 'hex-color', (l, f) => /['"]#[0-9a-fA-F]{6}['"]/.test(l) && !f.endsWith('core/theme.ts') && !f.endsWith('core/emberLook.ts'), 'colors come from core/theme (colors/alpha)'],
  ['warn', 'font-literal', (l) => /fontFamily:\s*['"]/.test(l), 'fonts come from fonts.* in core/theme'],
  ['warn', 'plural', (l) => /\$\{[^}]+\}\s+(things|minutes|cards|days|items|hours|weeks|times)\b/.test(l), 'counts go through plural() in core/words ("1 thing", "2 things")'],
  ['warn', 'any', (l) => /:\s*any\b|as any\b/.test(l), 'avoid any'],
  ['warn', 'deps-array', (l) => /use(AnimatedStyle|DerivedValue|AnimatedProps|AnimatedReaction)\(.*\],?\s*\)\s*;?\s*$/.test(l), 'no dependency arrays on Reanimated hooks (native warns)'],
  ['warn', 'network', (l) => /\bfetch\(/.test(l), 'new network call: say what is sent, and keep AI opt-in'],
  ['warn', 'exclaim', (l) => /['"`>][A-Z][^'"`<]{3,}!['"`<]/.test(l), 'the app speaks calmly; avoid exclamation marks in copy'],
];

const findings = [];
for (const f of files) {
  const tracked = sh('git', ['ls-files', '--error-unmatch', f]).trim();
  let added;
  if (tracked) {
    added = sh('git', ['diff', '-U0', base, '--', f])
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
      .map((l) => l.slice(1));
  } else added = readFileSync(join(cwd, f), 'utf8').split('\n');
  for (const line of added) {
    for (const [level, id, test, advice] of RULES) {
      if (test(line, f)) findings.push({ level, id, file: f, line: line.trim().slice(0, 140), advice });
    }
  }
}

const errors = findings.filter((x) => x.level === 'error');
const warns = findings.filter((x) => x.level === 'warn');
for (const x of findings) console.log(`${x.level === 'error' ? 'ERROR' : 'warn '} [${x.id}] ${x.file}: ${x.line}\n        → ${x.advice}`);

console.log(`\nType-checking (${files.length} changed .ts/.tsx files)…`);
const tsc = spawnSync('npx', ['tsc', '--noEmit'], { cwd, encoding: 'utf8' });
const tscOut = (tsc.stdout || '') + (tsc.stderr || '');
const tscErrors = tscOut.split('\n').filter((l) => /error TS\d+/.test(l));
if (tscErrors.length) console.log(tscErrors.slice(0, 30).join('\n'));

// The hub's own scripts (live checks, licenses, tests) must still parse.
const scriptErrors = existsSync(join(cwd, 'tools/hub'))
  ? readdirSync(join(cwd, 'tools/hub'))
      .filter((f) => f.endsWith('.mjs'))
      .filter((f) => spawnSync('node', ['--check', join(cwd, 'tools/hub', f)]).status !== 0)
  : [];
if (scriptErrors.length) console.log(`Scripts that don't parse: ${scriptErrors.join(', ')}`);

console.log('\nUnit tests (npm test)…');
const testScript = join(cwd, 'tools/hub/test.mjs');
const test = existsSync(testScript) ? spawnSync('node', [testScript], { cwd, encoding: 'utf8' }) : { status: 0, stdout: '# fail 0' };
const testOut = (test.stdout || '') + (test.stderr || '');
const failing = Number(/^# fail (\d+)/m.exec(testOut)?.[1] ?? (test.status === 0 ? 0 : 1));
if (failing) console.log(testOut.split('\n').filter((l) => /not ok|Error|expected|actual/.test(l)).slice(0, 30).join('\n'));

const ok = errors.length === 0 && tscErrors.length === 0 && failing === 0 && scriptErrors.length === 0;
const summary = `${ok ? 'passed' : 'failed'}: ${files.length} files, ${errors.length} rule errors, ${warns.length} warnings, ${tscErrors.length} type errors, ${failing} failing test${failing === 1 ? "" : "s"}`;
console.log(`\nGate ${summary}`);
spawnSync('node', [HUB, agent, 'check', ok ? '--ok' : '--fail', ...(idea ? ['--idea', idea] : []), `Gate ${summary}`], { stdio: 'ignore' });
process.exit(ok ? 0 : 1);
