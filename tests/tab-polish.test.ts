/// <reference types="node" />
// One gold action on the primary tabs. These read the screens the polish
// pass owns, because the components themselves import React Native.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { helperById } from '../core/helpers';

function src(rel: string) {
  return readFileSync(rel, 'utf8');
}

function block(file: string, start: string, end: string) {
  const text = src(file);
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${file} is missing ${start} … ${end}`);
  return text.slice(from, to);
}

describe('per-tab polish', () => {
  it('the two-week line stays, and it does not pulse', () => {
    const line = src('components/desk/StreakOfLight.tsx');
    assert.match(line, /You showed up on \$\{count\} of the last \$\{plural\(DAYS, 'day'\)\}/);
    assert.doesNotMatch(line, /withRepeat|useSharedValue|useAnimatedStyle|useReducedMotion/);
  });

  it('Ember’s “N more” pill is parchment, so Light the candle stays the gold control', () => {
    const note = src('components/desk/EmberNote.tsx');
    assert.doesNotMatch(note, /colors\.flame/);
    assert.match(block('components/desk/EmberNote.tsx', 'more:', 'fill:'), /alpha\(colors\.text/);
    assert.match(block('components/desk/EmberNote.tsx', 'link:', 'fill:'), /color: colors\.text/);
  });

  it('Add homework is a secondary button, and Do this now stays', () => {
    const school = src('app/school.tsx');
    const add = school.split('\n').find((l) => l.includes('Add homework or a test'));
    assert.ok(add);
    assert.match(add, /variant="secondary"/);
    assert.doesNotMatch(add, /tint=/);
    assert.match(school, /Do this now/);
  });

  it('the idle Ember pick is quiet text, and Start focus stays the gold button', () => {
    const pick = src('components/school/EmberPick.tsx');
    assert.match(block('components/school/EmberPick.tsx', 'linkText:', 'error:'), /color: colors\.text/);
    assert.doesNotMatch(block('components/school/EmberPick.tsx', 'linkText:', 'error:'), /colors\.flame/);
    assert.match(pick, /color=\{colors\.text\}/);
    const start = pick.split('\n').find((l) => l.includes('label="Start focus"'));
    assert.ok(start);
    assert.doesNotMatch(start, /variant=/);
  });

  it('the quota sparkle is quiet, and the study session uses Pip’s named color', () => {
    const helpers = src('app/helpers.tsx');
    assert.equal(helperById('pip')?.id, 'pip');
    assert.ok(helperById('pip')?.color);
    assert.match(helpers, /helperById\('pip'\)/);
    assert.doesNotMatch(helpers, /#7CC4F2/);
    const sparkle = helpers.split('\n').find((l) => l.includes('name="sparkle"'));
    assert.ok(sparkle);
    assert.match(sparkle, /colors\.textMuted/);
    assert.doesNotMatch(sparkle, /colors\.flame/);
  });

  it('an empty hour is an EmptyState with one next step', () => {
    const today = src('app/today.tsx');
    assert.match(today, /<EmptyState/);
    assert.match(today, /The hour is open\./);
    assert.match(today, /Plan a block below and it shows up here\./);
    assert.doesNotMatch(today, /Nothing scheduled yet today|Nothing scheduled this day/);
  });
});
