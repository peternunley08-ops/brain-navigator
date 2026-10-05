/// <reference types="node" />
// What the app notices from use, and that "don't learn from me" means off everywhere.
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { bestCalmer, bestFocusHour, learnedNotes, sleepAndMood, usualCheckinHour, usualFocusLength } from '../core/learned';
import { useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { useWellnessStore } from '../core/wellnessStore';

// Five sessions of 25 min ending at 4:25 PM, one 50-minute one.
const session = (i: number, minutes = 25, endH = 16, endM = 25) => ({ id: `f${i}`, assignmentId: null, minutes, at: new Date(2026, 9, i + 1, endH, endM).toISOString() });
const checkin = (i: number, mood: number, sleep: number, h = 20) => ({ id: `c${i}`, checkin_date: `2026-10-${String(i + 1).padStart(2, '0')}`, mood, sleep_hours: sleep, sleep_quality: null, stress_level: null, notes: null, created_at: new Date(2026, 9, i + 1, h).toISOString(), notion_page_id: null });
const setAbout = (patch: object) => useLifeStore.setState({ about: { ...useLifeStore.getState().about, ...patch } });

describe('learned', () => {
  beforeEach(() => {
    setAbout({ learnOff: false, helped: {}, calmers: [], dismissed: [] });
    useSchoolStore.setState({ focus: [0, 1, 2, 3, 4].map((i) => session(i)).concat([session(5, 50, 21, 0)]), profile: { ...useSchoolStore.getState().profile, sleepGoal: 9 } });
    useWellnessStore.setState({ checkins: [checkin(0, 4, 9), checkin(1, 5, 9), checkin(2, 2, 6), checkin(3, 2, 6.5), checkin(4, 4, 8.5)] });
  });

  it('finds the usual focus hour (by start time) and length', () => {
    assert.deepEqual(bestFocusHour(), { hour: 16, count: 5, total: 6 });
    assert.deepEqual(usualFocusLength(), { minutes: 25, count: 5, total: 6 });
  });

  it('needs five examples before saying anything', () => {
    useSchoolStore.setState({ focus: [session(0), session(1)] });
    assert.equal(bestFocusHour(), null);
    assert.equal(usualFocusLength(), null);
  });

  it('compares mood on rested and short nights', () => {
    const sm = sleepAndMood();
    assert.ok(sm && sm.rested > sm.short);
    assert.equal(usualCheckinHour()?.hour, 20);
  });

  it('notes come with their basis and can be dismissed', () => {
    const ids = learnedNotes().map((n) => n.id);
    assert.ok(ids.includes('focus-hour-16'));
    setAbout({ dismissed: ['focus-hour-16'] });
    assert.ok(!learnedNotes().some((n) => n.id === 'focus-hour-16'));
  });

  it('"learn from how I use the app" off means nothing is used anywhere', () => {
    setAbout({ learnOff: true, helped: { breathe: [5, 0] } });
    assert.equal(bestFocusHour(), null);
    assert.equal(usualFocusLength(), null);
    assert.equal(usualCheckinHour(), null);
    assert.equal(sleepAndMood(), null);
    assert.deepEqual(learnedNotes(), []);
    assert.equal(bestCalmer(), null);
  });

  it('best calmer: what helped most, else their first pick', () => {
    setAbout({ helped: { breathe: [4, 1], vent: [2, 0] }, calmers: ['ground'] });
    assert.equal(bestCalmer()?.id, 'breathe');
    setAbout({ helped: {}, calmers: ['ground'] });
    assert.equal(bestCalmer()?.id, 'ground');
  });
});
