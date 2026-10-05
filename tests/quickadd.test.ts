/// <reference types="node" />
// The + sheet follows the moment (docs/design/DIRECTION.md, phase 6).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addOrder } from '../core/quickAddOrder';

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m); // Oct 4 2026 is a Sunday
const WIND = 22 * 60;

describe('+ sheet order', () => {
  it('after school on a weekday: homework first', () => {
    assert.equal(addOrder(at(5, 16), WIND, false).main[0], '/add-assignment');
    assert.equal(addOrder(at(5, 16), WIND, false).main[1], '/focus');
  });

  it('after wind-down: something on my mind first, focus last', () => {
    const { main } = addOrder(at(5, 23, 30), WIND, false);
    assert.equal(main[0], '/new-entry');
    assert.equal(main.at(-1), '/focus');
  });

  it('a night owl gets an extra hour before night order', () => {
    assert.equal(addOrder(at(5, 22, 30), WIND, true).main[0], '/add-assignment');
  });

  it('Sunday moves a win up; every option is always there', () => {
    const r = addOrder(at(4, 15), WIND, false);
    assert.equal(r.more[0], '/wins');
    assert.equal(new Set(r.main).size, 4);
    assert.equal(new Set(r.more).size, 5);
  });
});
