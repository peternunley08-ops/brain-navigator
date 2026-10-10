#!/usr/bin/env node
// Takes the five hero pictures (docs/design/DIRECTION.md §7) from the booted
// Simulator, always as the sample student Riley, never real data.
//
//   node tools/screens.mjs          half-size JPEGs into docs/screens/
//   node tools/screens.mjs --full   full-size PNGs, for App Store upload
//   node tools/screens.mjs --device <udid>   a particular Simulator
//
// Needs: a booted Simulator (the first one with the app, if several are on) running a development build of the app on Metro
// (the ?show and ?night links only work in development). At the end the app
// is relaunched, which ends show mode and drops anything started while showing.
// Run it in the afternoon: School's "Next class" reads the real clock.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP = 'com.peternunley.brainnavigator';
const OUT = join(import.meta.dirname, '..', 'docs', 'screens');
const full = process.argv.includes('--full');

// [file, link, seconds to settle]
const FRAMES = [
  ['1-desk', 'brainnavigator://?show=riley&night=15:00', 7], // Know what's next.
  ['2-school', 'brainnavigator://school', 3], // Tonight, at a glance.
  ['3-focus', 'brainnavigator://focus?quick=5', 5], // One candle. One thing.
  ['4-mind', 'brainnavigator://open-loops', 3], // Set it down.
  ['5-steady', 'brainnavigator://steady', 3], // Need help now, always in reach.
];

// "booted" picks any running Simulator, which may not have the app; find one that does.
const hasApp = (udid) => {
  try {
    execFileSync('xcrun', ['simctl', 'get_app_container', udid, APP], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};
const flag = process.argv.indexOf('--device');
const booted = Object.values(JSON.parse(execFileSync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'])).devices)
  .flat()
  .map((d) => d.udid);
const DEVICE = flag > -1 ? process.argv[flag + 1] : booted.find(hasApp);
if (!DEVICE) {
  console.error('No booted Simulator has Brain Navigator. Boot one with a development build (or pass --device <udid>).');
  process.exit(1);
}
console.log(`Simulator ${DEVICE}`);
const sim = (cmd, ...args) => execFileSync('xcrun', ['simctl', cmd, DEVICE, ...args], { stdio: 'pipe' });
// Cleanup that fails shouldn't hide what went wrong before it.
const tidy = (fn) => {
  try {
    fn();
  } catch (e) {
    console.error(`cleanup: ${String(e.message).split('\n')[0]}`);
  }
};
const wait = (s) => execFileSync('sleep', [String(s)]);

mkdirSync(OUT, { recursive: true });
try {
  // Apple's clean status bar: 9:41, full battery and signal.
  sim('status_bar', 'override', '--time', '9:41', '--batteryState', 'charged', '--batteryLevel', '100', '--wifiBars', '3', '--cellularBars', '4');
  // Step past "Hold Ember to wake it" first; the Desk only mounts after it.
  sim('openurl', 'brainnavigator://?wake=1');
  wait(3);
  for (const [name, link, settle] of FRAMES) {
    sim('openurl', link);
    wait(settle);
    // Docs get small JPEGs (light on git); --full keeps the PNG at App Store size.
    const shot = join(tmpdir(), `bn-${name}.png`);
    const file = join(OUT, `${name}.${full ? 'png' : 'jpg'}`);
    sim('io', 'screenshot', '--type=png', shot);
    if (full) copyFileSync(shot, file);
    else execFileSync('sips', ['--resampleWidth', '603', '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', shot, '--out', file], { stdio: 'pipe' });
    console.log(`saved docs/screens/${name}.${full ? 'png' : 'jpg'}`);
  }
} finally {
  tidy(() => sim('status_bar', 'clear'));
  tidy(() => sim('openurl', 'brainnavigator://?night=off&show=off'));
  wait(2);
  tidy(() => sim('terminate', APP));
  tidy(() => sim('launch', APP));
}
