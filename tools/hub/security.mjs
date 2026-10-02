#!/usr/bin/env node
// Shield's scanner: finds security flags without spending any AI tokens.
//   node /Users/peternunley/Desktop/brain-navigator/tools/hub/security.mjs [--agent shield] [--json] [--quiet]
// Run from a worktree or the main checkout. It never prints a secret's value,
// only where it is and which rule caught it. Exits 1 when a high flag is open.
// Accepted risks (decided by Peter, see SECURITY.md) are listed but not counted.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const MAIN = '/Users/peternunley/Desktop/brain-navigator';
const HUB = join(MAIN, 'tools/hub/hub.mjs');
const args = process.argv.slice(2);
const has = (k) => args.includes(`--${k}`);
const flag = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const agent = flag('agent') || 'shield';
const cwd = process.cwd();
const git = (a) => {
  try {
    return execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 32 << 20 });
  } catch (e) {
    return e.stdout || '';
  }
};

const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|html|sh|toml|ya?ml|plist|sql|txt|env.*)$|^\.env/;
const SKIP = /(^|\/)(node_modules|ios\/Pods|\.claude|tools\/hub\/live)\/|package-lock\.json$/;
const files = git(['ls-files']).split('\n').filter((f) => f && TEXT.test(f) && !SKIP.test(f) && existsSync(join(cwd, f)));

// Public by design: the Supabase anon key, Google OAuth client ids, Notion db ids.
const PUBLIC_ENV = /^EXPO_PUBLIC_(SUPABASE_URL|SUPABASE_ANON_KEY|GOOGLE_\w*CLIENT_ID|NOTION_\w*_DB_ID)$/;

// [severity, id, test(line, file), why, fix]
const RULES = [
  ['high', 'secret-anthropic', (l) => /sk-ant-[A-Za-z0-9_-]{20,}/.test(l), 'Anthropic API key in a tracked file', 'Delete it, rotate it in the Anthropic console, keep it only as a Supabase function secret'],
  ['high', 'secret-notion', (l) => /\b(ntn_|secret_)[A-Za-z0-9]{30,}/.test(l), 'Notion integration secret in a tracked file', 'Delete it and rotate it in Notion'],
  ['high', 'secret-jwt', (l) => /eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(l) && /service_role/.test(Buffer.from((l.match(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)/) || [])[1] || '', 'base64').toString()), 'Supabase service_role key in a tracked file', 'Delete it and roll the JWT secret in Supabase'],
  ['high', 'secret-aws', (l) => /\bAKIA[0-9A-Z]{16}\b/.test(l), 'AWS access key in a tracked file', 'Delete and rotate'],
  ['high', 'secret-private-key', (l) => /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(l), 'Private key in a tracked file', 'Delete and reissue'],
  ['high', 'secret-generic', (l, f) => !/\.md$/.test(f) && /\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*['"][A-Za-z0-9_\-]{24,}['"]/i.test(l), 'Hard-coded credential', 'Move to a Supabase function secret or .env (gitignored)'],
  ['high', 'public-secret-env', (l, f) => /\.(ts|tsx)$/.test(f) && !f.startsWith('supabase/') && (l.match(/EXPO_PUBLIC_\w+/g) || []).some((v) => !PUBLIC_ENV.test(v) && /KEY|SECRET|TOKEN|PASSWORD/.test(v)), 'A secret read through EXPO_PUBLIC_ is baked into the app bundle, so anyone with the app can pull it out', 'Move the call into a Supabase function that holds the secret; the app calls the function'],
  ['med', 'eval', (l, f) => /\.(ts|tsx|js)$/.test(f) && /\beval\(|new Function\(/.test(l), 'eval or new Function runs strings as code', 'Remove; parse data instead'],
  ['med', 'webview-open', (l) => /originWhitelist=\{\[['"]\*['"]\]\}|injectedJavaScript=/.test(l), 'WebView open to any origin or running injected script', 'Limit origins; avoid injected script'],
  ['med', 'cleartext-http', (l, f) => /\.(ts|tsx)$/.test(f) && /['"`]http:\/\/(?!localhost|127\.0\.0\.1)/.test(l), 'Cleartext http:// request', 'Use https://'],
  ['med', 'open-url-unchecked', (l, f) => /\.(ts|tsx)$/.test(f) && /Linking\.openURL\((?!['"`])/.test(l) && !/^(app\/help\.tsx|components\/ember\/HelpCard\.tsx)$/.test(f) && !/https?:|tel:|mailto:|sms:/.test(l), 'Opens a URL built from data; check the scheme first', 'Allow only https:, tel:, sms:, mailto:'],
  ['med', 'fn-cors-wildcard', (l, f) => f.startsWith('supabase/functions/') && /Access-Control-Allow-Origin['"]?\s*:\s*['"]\*['"]/.test(l), 'Edge function answers any website (CORS *)', 'Accepted while the app is native-only: a browser origin is not a gate for a native app; revisit if a web build ships'],
  ['med', 'fn-log-body', (l, f) => f.startsWith('supabase/functions/') && /console\.(log|info)\(.*\b(body|messages|text|prompt|content)\b/.test(l), 'Edge function may log what the person wrote', 'Log counts and timings only'],
  ['low', 'tls-off', (l) => /NSAllowsArbitraryLoads<\/key>\s*<true|rejectUnauthorized:\s*false/.test(l), 'Transport security turned off', 'Remove the exception'],
];

// Peter's standing decisions: listed so nobody "fixes" them, never counted as open.
const ACCEPTED = [
  { id: 'fn-cors-wildcard', why: 'Native app only; CORS does not protect a native client.' },
  { id: 'anon-rls', why: 'Single-user MVP: wide-open anon RLS by design. No Supabase Auth or per-user RLS without Peter.' },
];

const findings = [];
for (const f of files) {
  let text;
  try {
    text = readFileSync(join(cwd, f), 'utf8');
  } catch {
    continue;
  }
  if (text.length > 2_000_000) continue;
  text.split('\n').forEach((line, i) => {
    for (const [sev, id, test, why, fix] of RULES) {
      if (test(line, f)) findings.push({ sev, id, file: f, line: i + 1, why, fix });
    }
  });
}

// Files that should never be tracked.
for (const f of git(['ls-files']).split('\n')) {
  if (/(^|\/)\.env(\.|$)(?!example)/.test(f) || /\.(p12|pem|key|mobileprovision)$/.test(f) || /GoogleService-Info\.plist$/.test(f))
    findings.push({ sev: 'high', id: 'tracked-secret-file', file: f, line: 0, why: 'A secrets file is in git', fix: 'git rm --cached, add to .gitignore, rotate what was in it' });
}
const ignore = existsSync(join(cwd, '.gitignore')) ? readFileSync(join(cwd, '.gitignore'), 'utf8') : '';
if (!/^\.env$/m.test(ignore)) findings.push({ sev: 'high', id: 'env-not-ignored', file: '.gitignore', line: 0, why: '.env is not ignored', fix: 'Add .env to .gitignore' });

// Known-vulnerable packages (needs the network; skipped quietly offline).
const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], { cwd: existsSync(join(cwd, 'package-lock.json')) ? cwd : MAIN, encoding: 'utf8', timeout: 60_000 });
try {
  const vulns = JSON.parse(audit.stdout || '{}').vulnerabilities || {};
  for (const [name, v] of Object.entries(vulns)) {
    if (v.severity === 'high' || v.severity === 'critical')
      findings.push({ sev: v.severity === 'critical' ? 'high' : 'med', id: 'dep-vuln', file: 'package.json', line: 0, why: `${name} has a known ${v.severity} vulnerability${v.isDirect ? '' : ' (pulled in by another package)'}`, fix: v.fixAvailable ? 'npx expo install --fix, or bump within the SDK 57 range' : 'No fix yet; note it' });
  }
} catch {
  /* offline: no audit */
}

const acceptedIds = new Set(ACCEPTED.map((a) => a.id));
const open = findings.filter((x) => !acceptedIds.has(x.id));
const accepted = findings.filter((x) => acceptedIds.has(x.id));
const count = (s) => open.filter((x) => x.sev === s).length;
const summary = `${count('high')} high, ${count('med')} medium, ${count('low')} low open; ${accepted.length} accepted`;

if (has('json')) console.log(JSON.stringify({ open, accepted, ACCEPTED }, null, 1));
else {
  const order = { high: 0, med: 1, low: 2 };
  for (const x of open.sort((a, b) => order[a.sev] - order[b.sev]))
    console.log(`${x.sev.toUpperCase().padEnd(4)} [${x.id}] ${x.file}${x.line ? ':' + x.line : ''}\n      ${x.why}\n      → ${x.fix}`);
  if (!has('quiet')) for (const a of ACCEPTED) console.log(`ok   [${a.id}] accepted: ${a.why}`);
  console.log(`\nShield scan: ${summary}`);
}

// A report the hub can show, then one hub event.
try {
  mkdirSync(join(MAIN, 'tools/hub/live'), { recursive: true });
  writeFileSync(join(MAIN, 'tools/hub/live/security.json'), JSON.stringify({ at: new Date().toISOString(), summary, open, accepted: ACCEPTED }, null, 1));
} catch {
  /* read-only checkout */
}
spawnSync('node', [HUB, agent, 'check', count('high') ? '--fail' : '--ok', `Security scan: ${summary}`], { stdio: 'ignore' });
process.exit(count('high') ? 1 : 0);
