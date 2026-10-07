/// <reference types="node" />
// The school day and tonight's work: where you are right now, what's due,
// GPA, and the offline helpers (tonight's plan, Quizzo, breathing).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BREATH_PATTERNS, cycleLength, phaseAt } from '../core/breathPatterns';
import { buildQuiz, buildTonightPlan } from '../core/helperOffline';
import { dueOn, firstClassOn, firstLightOpen } from '../core/night';
import { finalNeeded, gpa, nowState, tonightsLoad, workloadByDay } from '../core/schoolStore';
import { compassLabel } from '../core/weatherCodes';
import { clock } from '../core/dates';
import { widgetDay, widgetTimeline } from '../core/widgetData';

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const hm = (h: number, m = 0) => h * 60 + m;
const MON = '2026-10-05';
const cls = (id: string, start: number, end: number, extra: object = {}) =>
  ({ id, name: id, teacher: '', room: '', color: '', kind: 'class', days: [1, 2, 3, 4, 5], start, end, ...extra }) as never;
const job = (id: string, due: string, extra: object = {}) =>
  ({ id, title: id, classId: null, kind: 'homework', due, minutes: 30, notes: '', done: false, doneAt: null, createdAt: '', ...extra }) as never;

describe('nowState', () => {
  const day = [cls('bio', hm(8), hm(8, 50)), cls('math', hm(9), hm(9, 50))];

  it('knows in class, between classes, and done', () => {
    const inBio = nowState(day, at(2026, 10, 5, 8, 20)) as { kind: string; minsLeft: number; next: { id: string } | null };
    assert.equal(inBio.kind, 'in');
    assert.equal(inBio.minsLeft, 30);
    assert.equal(inBio.next?.id, 'math');
    assert.deepEqual(nowState(day, at(2026, 10, 5, 8, 55)), { kind: 'next', cls: day[1], minsUntil: 5 });
    assert.deepEqual(nowState(day, at(2026, 10, 5, 15)), { kind: 'done' });
  });

  it('knows weekends, unscheduled and empty', () => {
    assert.deepEqual(nowState(day, at(2026, 10, 4, 10)), { kind: 'free' });
    assert.deepEqual(nowState([cls('art', 0, 0, { days: [] })]), { kind: 'unscheduled' });
    assert.deepEqual(nowState([]), { kind: 'none' });
  });

  it('the bell at the end of a class means it is over', () => {
    assert.equal(nowState(day, at(2026, 10, 5, 8, 50)).kind, 'next');
  });
});

describe('due and load', () => {
  const work = [job('a', MON), job('b', '2026-10-06', { minutes: null }), job('c', '2026-10-01'), job('d', MON, { done: true }), job('e', '2026-10-07', { starred: true })];

  it('tonightsLoad counts open work due today and tomorrow', () => {
    const r = tonightsLoad(work, MON);
    assert.deepEqual(r.items.map((x: { id: string }) => x.id), ['a', 'b']);
    assert.equal(r.minutes, 60);
  });

  it('workloadByDay folds overdue into today', () => {
    const w = workloadByDay(work, 3, MON);
    assert.deepEqual(w.map((d) => [d.key, d.count, d.minutes]), [
      [MON, 2, 60],
      ['2026-10-06', 1, 30],
      ['2026-10-07', 1, 30],
    ]);
  });

  it('dueOn puts starred first and skips done', () => {
    const list = [job('x', MON), job('y', MON, { starred: true }), job('z', MON, { done: true })];
    assert.deepEqual(dueOn(list, MON).map((x: { id: string }) => x.id), ['y', 'x']);
  });

  it('firstClassOn finds that weekday\'s earliest class, not activities', () => {
    const list = [cls('late', hm(10), hm(11)), cls('early', hm(8), hm(9)), cls('club', hm(7), hm(8), { kind: 'activity' })];
    assert.equal((firstClassOn(list, MON) as { id: string } | null)?.id, 'early');
    assert.equal(firstClassOn(list, '2026-10-04'), null);
  });

  it('first light opens once a morning, from wake time until noon', () => {
    assert.equal(firstLightOpen(at(2026, 10, 5, 7, 30), hm(7), undefined), true);
    assert.equal(firstLightOpen(at(2026, 10, 5, 6, 30), hm(7), undefined), false);
    assert.equal(firstLightOpen(at(2026, 10, 5, 12, 0), hm(7), undefined), false);
    assert.equal(firstLightOpen(at(2026, 10, 5, 7, 30), hm(7), MON), false);
  });
});

describe('grades', () => {
  const g = (classId: string, score: number) => ({ id: `${classId}${score}`, classId, score, outOf: 100, category: 'Tests', date: '', title: '' });

  it('gpa weights honors and AP for a C or better', () => {
    const classes = [cls('ap', 0, 0, { level: 'ap' }), cls('reg', 0, 0), cls('none', 0, 0)];
    const r = gpa(classes, [g('ap', 95), g('reg', 85)] as never);
    assert.deepEqual(r, { unweighted: 3.5, weighted: 4, classes: 2 });
    assert.equal(gpa(classes, []), null);
  });

  it('finalNeeded solves for the final exam score', () => {
    assert.ok(Math.abs((finalNeeded(88, 90, 0.2) ?? 0) - 98) < 1e-9);
    assert.equal(finalNeeded(88, 90, 0), null);
  });
});

describe('tonight\'s plan', () => {
  it('starts after school, overdue first, in chunks with breaks, never ending on a break', () => {
    const plan = buildTonightPlan([job('later', '2026-10-07', { minutes: 25 }), job('overdue', '2026-10-02', { minutes: 50 })], {
      cap: 120,
      windDown: hm(22),
      now: at(2026, 10, 5, 10),
    });
    assert.equal(plan.steps[0]?.start, hm(15, 30));
    assert.equal(plan.steps[0]?.title, 'overdue');
    assert.notEqual(plan.steps.at(-1)?.kind, 'break');
    assert.equal(plan.workMinutes, 75);
    assert.deepEqual(plan.leftOut, []);
  });

  it('respects the nightly cap and leaves the rest out', () => {
    const plan = buildTonightPlan([job('a', MON, { minutes: 60 }), job('b', MON, { minutes: 60 })], { cap: 60, windDown: hm(22), now: at(2026, 10, 5, 18) });
    assert.equal(plan.workMinutes, 60);
    assert.deepEqual(plan.leftOut.map((x: { id: string }) => x.id), ['b']);
  });

  it('a small leftover rides along instead of becoming its own chunk', () => {
    const plan = buildTonightPlan([job('a', MON, { minutes: 33 })], { cap: 120, windDown: hm(22), now: at(2026, 10, 5, 18) });
    assert.deepEqual(plan.steps.map((s) => s.end - s.start), [33]);
  });

  it('"do this one first" goes to the front', () => {
    const plan = buildTonightPlan([job('a', MON), job('b', '2026-10-06')], { cap: 120, windDown: hm(22), now: at(2026, 10, 5, 18), first: 'b' });
    assert.equal(plan.steps[0]?.title, 'b');
  });
});

describe('Quizzo', () => {
  const card = (i: number, back = `back ${i}`) => ({ id: `c${i}`, front: `front ${i}`, back, box: 1, due: '2000-01-01', seen: 0 });
  const deck = (cards: object[]) => ({ id: 'd', name: 'd', classId: null, color: '', cards, createdAt: '' }) as never;

  it('multiple choice holds the right answer once, among four', () => {
    const qs = buildQuiz([deck([1, 2, 3, 4, 5].map((i) => card(i)))]);
    assert.equal(qs.length, 5);
    for (const q of qs) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.equal(q.options[q.answer], q.card.back);
    }
  });

  it('true or false when there are too few answers, and nothing from one card', () => {
    const qs = buildQuiz([deck([card(1), card(2)])]);
    assert.ok(qs.every((q) => q.trueFalse && q.options.join() === 'True,False'));
    assert.deepEqual(buildQuiz([deck([card(1)])]), []);
  });
});

describe('breathing', () => {
  it('every pattern has a positive cycle', () => {
    for (const p of BREATH_PATTERNS) assert.ok(cycleLength(p.durations) > 0, p.key);
  });

  it('moves through in, hold, out, with the breath filling and emptying', () => {
    const box = [4000, 4000, 4000, 4000];
    assert.equal(phaseAt(0, box).idx, 0);
    assert.equal(phaseAt(0, box).breath, 0);
    assert.equal(phaseAt(5000, box).idx, 1);
    assert.equal(phaseAt(5000, box).breath, 1);
    assert.equal(phaseAt(9000, box).idx, 2);
    assert.equal(phaseAt(16000, box).cycleIndex, 1);
    assert.equal(phaseAt(1000, box).secondsLeft, 3);
  });

  it('skips a zero-length hold', () => {
    assert.equal(phaseAt(4500, [4000, 0, 4000, 0]).idx, 2);
  });
});

describe('weather', () => {
  it('compass labels wrap all the way round', () => {
    assert.equal(compassLabel(0), 'N');
    assert.equal(compassLabel(359), 'N');
    assert.equal(compassLabel(90), 'E');
    assert.equal(compassLabel(-90), 'W');
  });
});

describe('home screen widget', () => {
  const cls = (id: string, name: string, days: number[], start: number) =>
    ({ id, name, teacher: '', room: '', color: '#fff', kind: 'class', days, start, end: start + 50 }) as never;
  const hw = (id: string, title: string, due: string, extra = {}) =>
    ({ id, title, classId: 'chem', kind: 'homework', due, minutes: null, notes: '', done: false, doneAt: null, createdAt: '', ...extra }) as never;
  const classes = [cls('chem', 'AP Chemistry', [2], 8 * 60), cls('eng', 'English', [2, 3], 9 * 60)];
  const work = [hw('a', 'Lab report', '2026-10-06'), hw('b', 'Essay', '2026-10-06', { starred: true }), hw('c', 'Old', '2026-10-06', { done: true })];

  it('shows tomorrow: first class and what is due, starred first', () => {
    // Monday evening, Oct 5 2026: tomorrow is Tuesday.
    const d = widgetDay(classes, work, at(2026, 10, 5, 20));
    assert.deepEqual(d.first, { name: 'AP Chemistry', time: clock(480), color: '#fff' });
    assert.deepEqual(d.due.map((x) => x.title), ['Essay', 'Lab report']);
    assert.equal(d.due[0].className, 'AP Chemistry');
    assert.equal(d.dueCount, 2);
    assert.equal(d.hasClasses, true);
  });

  it('after midnight it is still tonight until 5 AM', () => {
    assert.equal(widgetDay(classes, work, at(2026, 10, 6, 1)).first?.name, 'AP Chemistry');
    // Past 5 AM on Tuesday, tomorrow is Wednesday: English only, nothing due.
    const wed = widgetDay(classes, work, at(2026, 10, 6, 6));
    assert.equal(wed.first?.name, 'English');
    assert.equal(wed.dueCount, 0);
  });

  it('rolls over at each 5 AM', () => {
    const t = widgetTimeline(classes, work, at(2026, 10, 5, 20));
    assert.deepEqual(t.map((e) => [e.date.getDate(), e.date.getHours()]), [[5, 20], [6, 5], [7, 5]]);
    assert.deepEqual(widgetTimeline(classes, work, at(2026, 10, 6, 2)).map((e) => [e.date.getDate(), e.date.getHours()]), [[6, 2], [6, 5], [7, 5]]);
    assert.equal(widgetDay([], [], at(2026, 10, 5, 20)).hasClasses, false);
  });
});
