/// <reference types="node" />
// Unit tests for the pure helpers the whole app leans on: dates, counts and
// the night clock. Run with `npm test` (tools/hub/test.mjs compiles and runs them).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDays, dateKey, daysUntil, dueLabel, dueWords, isoDay } from '../core/dates';
import { beforeNight, isNight, lightsOutMinutes, minutesToNight, morningKey, nightStart, pastLightsOut, tonightKey, tonightWeekday, wrap } from '../core/night';
import { classAverage, letterFor, planBackward } from '../core/schoolStore';
import { plural } from '../core/words';

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const hm = (h: number, m = 0) => h * 60 + m;

describe('dates', () => {
  it('dateKey is the local calendar day, zero-padded', () => {
    assert.equal(dateKey(at(2026, 10, 5)), '2026-10-05');
    assert.equal(dateKey(at(2026, 1, 9, 0, 0)), '2026-01-09');
  });

  it('addDays crosses months, years and leap days', () => {
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
    assert.equal(addDays('2028-02-28', 1), '2028-02-29');
    assert.equal(addDays('2026-10-05', 0), '2026-10-05');
  });

  it('daysUntil counts whole days, even across a clock change', () => {
    assert.equal(daysUntil('2026-10-10', '2026-10-05'), 5);
    assert.equal(daysUntil('2026-10-01', '2026-10-05'), -4);
    assert.equal(daysUntil('2026-11-03', '2026-10-31'), 3);
    assert.equal(daysUntil('2027-03-16', '2027-03-13'), 3);
  });

  it('dueLabel and dueWords read naturally', () => {
    const today = dateKey();
    assert.equal(dueLabel(today), 'Today');
    assert.equal(dueLabel(addDays(today, 1)), 'Tomorrow');
    assert.equal(dueLabel(addDays(today, -1)), 'Yesterday');
    assert.equal(dueLabel(addDays(today, -3)), '3 days ago');
    assert.equal(dueWords(today), 'today');
    assert.equal(dueWords(addDays(today, 1)), 'tomorrow');
    assert.match(dueLabel(addDays(today, 3)), /^[A-Z][a-z]+day$/);
    assert.match(dueLabel(addDays(today, 30)), /^[A-Z][a-z]{2} \d{1,2}$/);
  });

  it('isoDay runs Monday 1 to Sunday 7', () => {
    assert.equal(isoDay(at(2026, 10, 5)), 1);
    assert.equal(isoDay(at(2026, 10, 4)), 7);
  });
});

describe('plural', () => {
  it('uses the singular only for one', () => {
    assert.equal(plural(1, 'card'), '1 card');
    assert.equal(plural(0, 'card'), '0 cards');
    assert.equal(plural(3, 'class', 'classes'), '3 classes');
  });
});

describe('night clock', () => {
  it('wrap keeps minutes inside one day', () => {
    assert.equal(wrap(-15), hm(23, 45));
    assert.equal(wrap(hm(25)), hm(1));
  });

  it('tonight rolls over at 5 AM, so 1 AM is still last night', () => {
    assert.equal(tonightKey(at(2026, 10, 5, 1)), '2026-10-04');
    assert.equal(tonightKey(at(2026, 10, 5, 4, 59)), '2026-10-04');
    assert.equal(tonightKey(at(2026, 10, 5, 5)), '2026-10-05');
    assert.equal(tonightKey(at(2026, 10, 5, 23)), '2026-10-05');
    assert.equal(tonightWeekday(at(2026, 10, 5, 1)), 0);
    assert.equal(morningKey(at(2026, 10, 5, 23)), '2026-10-06');
    assert.equal(morningKey(at(2026, 10, 6, 1)), '2026-10-06');
  });

  it('lights out is wake minus sleep goal minus time to fall asleep', () => {
    assert.equal(lightsOutMinutes(hm(7), 8), hm(22, 45));
    assert.equal(lightsOutMinutes(hm(6, 30), 9), hm(21, 15));
  });

  it('night runs from wind-down across midnight to 4:30 AM', () => {
    const start = nightStart(hm(22), false);
    assert.equal(start, hm(22));
    assert.equal(nightStart(hm(22), true), hm(23));
    assert.equal(isNight(hm(23), start), true);
    assert.equal(isNight(hm(3), start), true);
    assert.equal(isNight(hm(5), start), false);
    assert.equal(isNight(hm(12), start), false);
    assert.equal(minutesToNight(hm(21), start), 60);
    assert.equal(minutesToNight(hm(23), start), 0);
    assert.equal(beforeNight(hm(21, 30), start), true);
    assert.equal(beforeNight(hm(20), start), false);
  });

  it('past lights out holds for six hours after it', () => {
    assert.equal(pastLightsOut(hm(23), hm(22, 45)), true);
    assert.equal(pastLightsOut(hm(2), hm(22, 45)), true);
    assert.equal(pastLightsOut(hm(22), hm(22, 45)), false);
  });
});

describe('school', () => {
  const g = (score: number, outOf: number, category = 'Tests', classId = 'bio') => ({ id: `${score}-${outOf}-${category}`, classId, score, outOf, category, date: '2026-10-01', title: '' });

  it('classAverage is plain points without weights', () => {
    assert.equal(classAverage([g(9, 10), g(7, 10)] as never, { id: 'bio' }), 80);
    assert.equal(classAverage([] as never, { id: 'bio' }), null);
    assert.equal(classAverage([g(9, 10, 'Tests', 'chem')] as never, { id: 'bio' }), null);
  });

  it('classAverage weights categories and skips empty ones', () => {
    const grades = [g(18, 20, 'Tests'), g(5, 10, 'Homework')] as never;
    assert.equal(classAverage(grades, { id: 'bio', weights: { Tests: 60, Homework: 40 } }), 74);
    assert.equal(classAverage(grades, { id: 'bio', weights: { Tests: 60, Labs: 40 } }), 90);
  });

  it('letterFor uses the usual bands', () => {
    assert.equal(letterFor(97), 'A+');
    assert.equal(letterFor(89.9), 'B+');
    assert.equal(letterFor(59), 'F');
  });

  it('planBackward spreads steps before the due date, the last one the day before', () => {
    const steps = planBackward({ id: 'a', title: 'Bio test', due: '2026-10-10', kind: 'test' } as never, '2026-10-05');
    assert.equal(steps.length, 5);
    assert.equal(steps[0].on, '2026-10-05');
    assert.equal(steps[steps.length - 1].on, '2026-10-09');
    assert.ok(steps.every((s, i) => i === 0 || (s.on ?? '') >= (steps[i - 1].on ?? '')));
  });

  it('planBackward squeezes into a short runway', () => {
    const steps = planBackward({ id: 'b', title: 'Essay', due: '2026-10-07', kind: 'essay' } as never, '2026-10-05');
    assert.equal(steps.length, 2);
    assert.equal(steps[1].text, 'Proofread out loud');
    assert.ok(steps.every((s) => (s.on ?? '') >= '2026-10-05' && (s.on ?? '') < '2026-10-07'));
  });
});
