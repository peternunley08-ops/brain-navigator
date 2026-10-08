/// <reference types="node" />
// The lit card: one thing lit on the Desk, by priority.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dueLine, LIT_ORDER, pickLit, snoozeTarget, tonightLine, urgentTonight } from '../core/litCard';

describe('the lit card', () => {
  it('lights nothing when nothing applies', () => {
    assert.equal(pickLit({}), null);
    assert.equal(pickLit({ allClear: false, due: null, exams: undefined }), null);
  });

  it('All clear is the peak and beats everything', () => {
    const all = Object.fromEntries(LIT_ORDER.map((k) => [k, true]));
    assert.equal(pickLit(all), 'allClear');
  });

  it('follows the order: class, wind-down, one thing, due, exams, brief, first homework, next class', () => {
    assert.equal(pickLit({ class: true, windDown: true, due: {} }), 'class');
    assert.equal(pickLit({ windDown: true, oneThing: true }), 'windDown');
    assert.equal(pickLit({ oneThing: true, due: { id: 'a' } }), 'oneThing');
    assert.equal(pickLit({ due: { id: 'a' }, exams: [1, 2, 3], brief: 'evening' }), 'due');
    assert.equal(pickLit({ exams: [1, 2, 3], brief: 'morning' }), 'exams');
    assert.equal(pickLit({ brief: 'evening', firstHomework: true }), 'brief');
    assert.equal(pickLit({ firstHomework: true, nextClass: true }), 'firstHomework');
    assert.equal(pickLit({ nextClass: true }), 'nextClass');
  });

  it('the most urgent thing tonight: late, then today, then tomorrow; starred breaks a tie', () => {
    const today = '2026-10-05';
    const list = [
      { id: 'later', due: '2026-10-09' },
      { id: 'tmr', due: '2026-10-06' },
      { id: 'tmr-star', due: '2026-10-06', starred: true },
      { id: 'done-late', due: '2026-10-01', done: true },
    ];
    assert.equal(urgentTonight(list, today)?.id, 'tmr-star');
    assert.equal(urgentTonight([...list, { id: 'today', due: today }], today)?.id, 'today');
    assert.equal(urgentTonight([...list, { id: 'late', due: '2026-10-03' }], today)?.id, 'late');
    assert.equal(urgentTonight([{ id: 'later', due: '2026-10-09' }], today), null);
  });

  it('a snoozed card sits out until its time, then comes back', () => {
    const today = '2026-10-05';
    const now = new Date(2026, 9, 5, 15, 0).getTime();
    const list = [
      { id: 'late', due: '2026-10-03', snoozedUntil: now + 3600_000 },
      { id: 'tmr', due: '2026-10-06' },
    ];
    assert.equal(urgentTonight(list, today, now)?.id, 'tmr');
    assert.equal(urgentTonight(list, today, now + 2 * 3600_000)?.id, 'late');
  });

  it('snoozes to tonight by day, and to tomorrow morning in the evening or after midnight', () => {
    const at = (h: number) => snoozeTarget(new Date(2026, 9, 5, h, 0));
    assert.equal(at(15).when, 'tonight');
    assert.equal(new Date(at(15).until).getHours(), 18);
    assert.equal(at(20).when, 'tomorrow');
    assert.equal(new Date(at(20).until).getDate(), 6);
    assert.equal(new Date(at(1).until).getDate(), 5);
    assert.equal(new Date(at(1).until).getHours(), 7);
  });

  it('says it plainly', () => {
    assert.equal(dueLine(null, '2026-10-06', '2026-10-05'), 'About 30 minutes. Due tomorrow.');
    assert.equal(dueLine(45, '2026-10-05', '2026-10-05'), 'About 45 minutes. Due today.');
    assert.equal(tonightLine(40, 90, 2), '40 of 90 minutes');
    assert.equal(tonightLine(120, 90, 3), '120 of 90 minutes, over your cap');
    assert.equal(tonightLine(0, 90, 0), 'Nothing due by tomorrow');
  });
});
