/// <reference types="node" />
// Quick capture and screenshot scans: the text students type or photograph,
// turned into assignments. Monday 2026-10-05 is "today" throughout.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { quickParse } from '../core/quickParse';
import { kindFor, parseDue } from '../core/scanParser';

const TODAY = '2026-10-05'; // a Monday
const CLASSES = [
  { id: 'bio', name: 'AP Biology' },
  { id: 'eng', name: 'English 11' },
  { id: 'chem', name: 'Honors Chemistry' },
] as never;

describe('parseDue', () => {
  const due = (s: string) => parseDue(s, TODAY);

  it('reads relative words', () => {
    assert.equal(due('today'), TODAY);
    assert.equal(due('due tomorrow'), '2026-10-06');
    assert.equal(due('tmrw'), '2026-10-06');
    assert.equal(due('in 3 days'), '2026-10-08');
    assert.equal(due('in two weeks'), '2026-10-19');
    assert.equal(due('next week'), '2026-10-12');
    assert.equal(due('end of the week'), '2026-10-09');
    assert.equal(due('end of month'), '2026-10-31');
  });

  it('reads weekdays, full and short', () => {
    assert.equal(due('monday'), TODAY);
    assert.equal(due('friday'), '2026-10-09');
    assert.equal(due('fri'), '2026-10-09');
    assert.equal(due('next friday'), '2026-10-16');
    assert.equal(due('tues'), '2026-10-06');
    assert.equal(due('thurs'), '2026-10-08');
    assert.equal(due('wed'), '2026-10-07');
  });

  it('reads dates, rolling a long-past one into next year', () => {
    assert.equal(due('Oct 12'), '2026-10-12');
    assert.equal(due('October 12, 2026'), '2026-10-12');
    assert.equal(due('10/14'), '2026-10-14');
    assert.equal(due('10/14/26'), '2026-10-14');
    assert.equal(due('5/14'), '2027-05-14');
    assert.equal(due('Sep 30'), '2026-09-30');
  });

  it('finds nothing in plain words', () => {
    assert.equal(due('worksheet'), null);
    assert.equal(due('monitor the plants'), null);
  });
});

describe('kindFor', () => {
  it('names the kind of work', () => {
    assert.equal(kindFor('Unit 3 test'), 'test');
    assert.equal(kindFor('Vocab quiz'), 'quiz');
    assert.equal(kindFor('Persuasive essay draft'), 'essay');
    assert.equal(kindFor('Lab report'), 'project');
    assert.equal(kindFor('Read chapter 5'), 'reading');
    assert.equal(kindFor('Worksheet 4.2'), 'homework');
  });
});

describe('quickParse', () => {
  const q = (s: string) => quickParse(s, CLASSES, TODAY);

  it('turns a spoken line into an assignment', () => {
    const r = q('bio quiz friday');
    assert.equal(r?.classId, 'bio');
    assert.equal(r?.kind, 'quiz');
    assert.equal(r?.due, '2026-10-09');
    assert.equal(r?.dated, true);
  });

  it('drops the date and "for <class>" from the title', () => {
    const r = q('read ch 5 for english tmrw');
    assert.equal(r?.classId, 'eng');
    assert.equal(r?.title, 'Read ch 5');
    assert.equal(r?.due, '2026-10-06');
    assert.equal(r?.kind, 'reading');
  });

  it('keeps short weekday forms as the date, not lost from the title', () => {
    const r = q('chem worksheet thurs');
    assert.equal(r?.classId, 'chem');
    assert.equal(r?.due, '2026-10-08');
    assert.equal(r?.dated, true);
  });

  it('reads times, weekly repeats, tonight, and stars tests', () => {
    assert.equal(q('essay outline 45 min')?.minutes, 45);
    assert.equal(q('practice 2 hours')?.minutes, 120);
    assert.equal(q('vocab every monday')?.weekly, true);
    assert.equal(q('bio test tonight')?.due, TODAY);
    assert.equal(q('bio test tonight')?.starred, true);
  });

  it('defaults to tomorrow without a date, and ignores empty input', () => {
    const r = q('worksheet');
    assert.equal(r?.due, '2026-10-06');
    assert.equal(r?.dated, false);
    assert.equal(q('   '), null);
  });
});

describe('quickParse titles', () => {
  it('takes every weekday form out of the title', () => {
    assert.equal(quickParse('vocab weds', CLASSES, TODAY)?.title, 'Vocab');
    assert.equal(quickParse('vocab weds', CLASSES, TODAY)?.due, '2026-10-07');
    assert.equal(quickParse('vocab thur', CLASSES, TODAY)?.title, 'Vocab');
    assert.equal(quickParse('vocab thur', CLASSES, TODAY)?.due, '2026-10-08');
  });
});
