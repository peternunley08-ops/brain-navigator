#!/usr/bin/env node
// Unit tests without a test framework: compile tests/*.test.ts (and the core
// helpers they import) to plain JS with the project's TypeScript, then run
// them with Node's built-in test runner. Tests import only pure modules,
// never anything that loads Expo or React Native.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
// Inside node_modules so the compiled files still find the project's packages.
const out = join(ROOT, 'node_modules/.cache/bn-tests');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const tests = readdirSync(join(ROOT, 'tests')).filter((f) => f.endsWith('.test.ts')).map((f) => join('tests', f));
if (!tests.length) {
  console.log('No tests found in tests/.');
  process.exit(0);
}

let code = 0;
try {
  execFileSync(
    join(ROOT, 'node_modules/.bin/tsc'),
    ['--ignoreConfig', '--outDir', out, '--rootDir', '.', '--module', 'commonjs', '--moduleResolution', 'node10', '--target', 'es2022', '--types', 'node', '--skipLibCheck', '--esModuleInterop', '--noCheck', '--ignoreDeprecations', '6.0', ...tests],
    { cwd: ROOT, stdio: 'inherit' },
  );
  writeFileSync(join(out, 'package.json'), '{"type":"commonjs"}');
  execFileSync(process.execPath, ['--require', join(ROOT, 'tests/stub-native.cjs'), '--test', ...tests.map((t) => join(out, t.replace(/\.ts$/, '.js')))], { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  code = typeof e.status === 'number' ? e.status : 1;
} finally {
  rmSync(out, { recursive: true, force: true });
}
process.exit(code);
