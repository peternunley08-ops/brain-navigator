/// <reference types="node" />
// Ember's note: which day card leads the Desk, and the link under it.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { closedToday, moreLine, NOTE_ORDER, pickNotes } from '../core/deskNotes';

describe('Ember’s note queue', () => {
  it('shows nothing when no card applies', () => {
    assert.deepEqual(pickNotes([]), { shown: null, rest: [] });
  });

  it('picks by priority, not by the order cards were found', () => {
    assert.deepEqual(pickNotes(['NextBadge', 'AboutCards', 'FollowUp', 'HelperNudge']), {
      shown: 'FollowUp',
      rest: ['HelperNudge', 'AboutCards', 'NextBadge'],
    });
  });

  it('a birthday leads, and always-around cards come last', () => {
    const all = [...NOTE_ORDER].reverse();
    const { shown, rest } = pickNotes(all);
    assert.equal(shown, 'Birthday');
    assert.deepEqual(rest.slice(-2), ['Resurface', 'NextBadge']);
    assert.equal(rest.length, NOTE_ORDER.length - 1);
  });

  it('closing the shown card lets the next one take its place', () => {
    const first = pickNotes(['PickUp', 'TagTool', 'WhatsNew']);
    assert.equal(first.shown, 'PickUp');
    const after = pickNotes(['TagTool', 'WhatsNew']);
    assert.equal(after.shown, first.rest[0]);
  });

  it('ignores duplicates and keeps unknown ids last, in the order given', () => {
    assert.deepEqual(pickNotes(['zeta', 'WhatsNew', 'alpha', 'WhatsNew']), { shown: 'WhatsNew', rest: ['zeta', 'alpha'] });
  });

  it('words the more link plainly', () => {
    assert.equal(moreLine(2), 'Ember has 2 more');
    assert.equal(moreLine(1), 'Ember has 1 more');
    assert.equal(moreLine(0), 'That’s everything.');
  });

  it('a card closed today stays closed only today', () => {
    const closed = { day: '2026-10-05', ids: ['PlanTest'] };
    assert.equal(closedToday(closed, 'PlanTest', '2026-10-05'), true);
    assert.equal(closedToday(closed, 'PlanTest', '2026-10-06'), false);
    assert.equal(closedToday(closed, 'HelperNudge', '2026-10-05'), false);
    assert.equal(closedToday(undefined, 'PlanTest', '2026-10-05'), false);
  });
});
