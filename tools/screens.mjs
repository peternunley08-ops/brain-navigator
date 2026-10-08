#!/usr/bin/env node
// Takes the five hero pictures (docs/design/DIRECTION.md §7) from the booted
// Simulator, always as the sample student Riley, never real data.
//
//   node tools/screens.mjs          half-size JPEGs into docs/screens/
//   node tools/screens.mjs --full   full-size PNGs, for App Store upload
//
// Needs: a booted Simulator running a development build of the app on Metro
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

const sim = (...args) => execFileSync('xcrun', ['simctl', ...args], { stdio: 'pipe' });
const wait = (s) => execFileSync('sleep', [String(s)]);

mkdirSync(OUT, { recursive: true });
try {
  // Apple's clean status bar: 9:41, full battery and signal.
  sim('status_bar', 'booted', 'override', '--time', '9:41', '--batteryState', 'charged', '--batteryLevel', '100', '--wifiBars', '3', '--cellularBars', '4');
  // Step past "Hold Ember to wake it" first; the Desk only mounts after it.
  sim('openurl', 'booted', 'brainnavigator://?wake=1');
  wait(3);
  for (const [name, link, settle] of FRAMES) {
    sim('openurl', 'booted', link);
    wait(settle);
    // Docs get small JPEGs (light on git); --full keeps the PNG at App Store size.
    const shot = join(tmpdir(), `bn-${name}.png`);
    const file = join(OUT, `${name}.${full ? 'png' : 'jpg'}`);
    sim('io', 'booted', 'screenshot', '--type=png', shot);
    if (full) copyFileSync(shot, file);
    else execFileSync('sips', ['--resampleWidth', '603', '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', shot, '--out', file], { stdio: 'pipe' });
    console.log(`saved docs/screens/${name}.${full ? 'png' : 'jpg'}`);
  }
} finally {
  sim('status_bar', 'booted', 'clear');
  sim('openurl', 'booted', 'brainnavigator://?night=off&show=off');
  wait(2);
  sim('terminate', 'booted', APP);
  sim('launch', 'booted', APP);
}
