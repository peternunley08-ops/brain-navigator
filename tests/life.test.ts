/// <reference types="node" />
// Flashcards, sealed letters, hours, weeks, and About you.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aboutFilled, calmOrder, helperChips, questionOfTheDay } from '../core/about';
import { sampleSchool, sampleTables, spreadBadgeDates } from '../core/sampleData';
import { checkAnswer, deckStats, dueCards, hoursTotal, isSealed, parseCards, weekOf } from '../core/lifeStore';

const card = (box: number, due: string, seen: number) => ({ id: `${box}${due}${seen}`, front: 'f', back: 'b', box, due, seen });
const deck = (cards: object[]) => ({ id: 'd', name: 'd', classId: null, color: '', cards, createdAt: '' }) as never;
const about = (patch: object = {}) =>
  ({ picks: {}, interests: [], favSubjects: [], hardSubjects: [], studyWays: [], calmers: [], cheer: undefined, goals: [], answers: [], askedOn: [], helped: {}, nickname: '', learnOff: false, ...patch }) as never;

describe('flashcards', () => {
  it('parseCards reads every separator, one card per line', () => {
    assert.deepEqual(parseCards('Mitochondria :: powerhouse of the cell\nH2O - water\nhola\thello\nGato — cat\nNa: sodium\nno separator here'), [
      { front: 'Mitochondria', back: 'powerhouse of the cell' },
      { front: 'H2O', back: 'water' },
      { front: 'hola', back: 'hello' },
      { front: 'Gato', back: 'cat' },
      { front: 'Na', back: 'sodium' },
    ]);
  });

  it('parseCards lets "::" win over a colon earlier in the line', () => {
    assert.deepEqual(parseCards('Q: what year did the war end? :: 1945'), [{ front: 'Q: what year did the war end?', back: '1945' }]);
    assert.deepEqual(parseCards('Self-esteem - how you see yourself'), [{ front: 'Self-esteem', back: 'how you see yourself' }]);
  });

  it('checkAnswer forgives typos and articles, not wrong numbers', () => {
    assert.equal(checkAnswer('The mitochondria', 'mitochondria'), 'match');
    assert.equal(checkAnswer('mitocondria', 'mitochondria'), 'match');
    assert.equal(checkAnswer('powerhouse', 'powerhouse of the cell'), 'close');
    assert.equal(checkAnswer('1775', '1776'), 'close');
    assert.equal(checkAnswer('1776', '1776'), 'match');
    assert.equal(checkAnswer('banana', 'photosynthesis'), 'miss');
    assert.equal(checkAnswer('   ', 'anything'), 'miss');
  });

  it('dueCards and deckStats', () => {
    const d = deck([card(1, '2026-10-01', 0), card(4, '2026-10-20', 3), card(2, '2026-10-05', 1)]);
    assert.equal(dueCards(d, '2026-10-05').length, 2);
    assert.deepEqual(deckStats(d), { fresh: 1, mastered: 1, learning: 1, total: 3 });
  });
});

describe('life', () => {
  it('a sealed letter stays sealed until its day', () => {
    assert.equal(isSealed({ sealedUntil: '2026-12-25' }, '2026-10-05'), true);
    assert.equal(isSealed({ sealedUntil: '2026-10-05' }, '2026-10-05'), false);
    assert.equal(isSealed({}, '2026-10-05'), false);
  });

  it('hoursTotal adds minutes by kind, night only on request', () => {
    const h = [
      { id: '1', kind: 'driving', minutes: 90, night: true },
      { id: '2', kind: 'driving', minutes: 30, night: false },
      { id: '3', kind: 'service', minutes: 60 },
    ] as never;
    assert.equal(hoursTotal(h, 'driving' as never), 2);
    assert.equal(hoursTotal(h, 'driving' as never, true), 1.5);
  });

  it('weekOf is the Monday of that week', () => {
    assert.equal(weekOf('2026-10-05'), '2026-10-05');
    assert.equal(weekOf('2026-10-11'), '2026-10-05');
    assert.equal(weekOf('2026-10-01'), '2026-09-28');
  });
});

describe('About you', () => {
  it('question of the day: steady all day, none once asked', () => {
    const q = questionOfTheDay(about(), '2026-10-05');
    assert.ok(q);
    assert.equal(questionOfTheDay(about(), '2026-10-05'), q);
    assert.equal(questionOfTheDay(about({ askedOn: ['2026-10-05'] }), '2026-10-05'), null);
  });

  it('calmOrder puts their calmers first, then what helped', () => {
    assert.deepEqual(calmOrder(about({ calmers: ['ground'] }), ['breathe', 'vent', 'ember', 'ground']), ['ground', 'breathe', 'vent', 'ember']);
    assert.deepEqual(calmOrder(about({ helped: { vent: [3, 0] } }), ['breathe', 'vent']), ['vent', 'breathe']);
    assert.deepEqual(calmOrder(about({ helped: { vent: [3, 0] }, learnOff: true }), ['breathe', 'vent']), ['breathe', 'vent']);
  });

  it('helper chips lead with at most two personal ones, keeping the usual', () => {
    const chips = helperChips('quizzo', ['Quiz me', 'Mix it up'], about({ hardSubjects: ['Chemistry'], studyWays: ['practice'] }));
    assert.deepEqual(chips, ['Quiz me on Chemistry', 'Give me practice problems', 'Quiz me', 'Mix it up']);
  });

  it('aboutFilled counts what is filled in', () => {
    assert.equal(aboutFilled(about()), 0);
    assert.equal(aboutFilled(about({ interests: ['music'], cheer: 'calm' })), 0.25);
  });
});

describe('AI companion rules', () => {
  it('reminds every three hours of continuing use', async () => {
    const { reminderDue, REMINDER_EVERY_MS } = await import('../core/companionRules');
    const t0 = 1_000_000;
    assert.equal(reminderDue(t0, t0 + REMINDER_EVERY_MS - 1), false);
    assert.equal(reminderDue(t0, t0 + REMINDER_EVERY_MS), true);
  });
});

describe("Riley's sample data", () => {
  const withClock = (h: number, fn: (now: number) => void) => {
    const realNow = Date.now;
    const d = new Date();
    d.setHours(h, 0, 0, 0);
    const now = d.getTime();
    Date.now = () => now;
    try {
      fn(now);
    } finally {
      Date.now = realNow;
    }
  };

  it('has nothing dated after the clock, even at 2 PM', () => {
    withClock(14, (now) => {
      const school = sampleSchool();
      for (const f of school.focus) assert.ok(Date.parse(f.at) <= now, `focus ${f.at}`);
      for (const a of school.assignments) if (a.doneAt) assert.ok(Date.parse(a.doneAt) <= now, `done ${a.title}`);
      for (const [table, rows] of Object.entries(sampleTables())) {
        for (const row of rows) {
          for (const k of ['created_at', 'completed_at', 'updated_at']) {
            const v = row[k];
            if (typeof v === 'string') assert.ok(Date.parse(v) <= now, `${table}.${k} ${v}`);
          }
        }
      }
    });
  });

  it('spreads badge dates over the past weeks, oldest first, none today', () => {
    withClock(14, (now) => {
      const keys = ['a', 'b', 'c', 'd', 'e', 'f'];
      const dates = spreadBadgeDates(keys);
      const times = keys.map((k) => Date.parse(dates[k]));
      assert.ok(times.every((t) => t < now - 86400000 / 2));
      assert.deepEqual([...times].sort((x, y) => x - y), times);
      assert.ok(now - times[0] > 14 * 86400000);
      assert.equal(new Set(keys.map((k) => dates[k].slice(0, 10))).size, keys.length);
      assert.deepEqual(spreadBadgeDates([]), {});
      assert.equal(Object.keys(spreadBadgeDates(['only'])).length, 1);
    });
  });
});
