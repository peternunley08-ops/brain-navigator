/// <reference types="node" />
// Screenshot scans: gradebooks, bell schedules, and Classroom/Canvas to-do
// lists, as the lines Live Text reads off them.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { attachTimes, linesFromText, mergeScans, parseGrades, parseScan, parseSchedule } from '../core/scanParser';

const TODAY = '2026-10-05'; // a Monday
const rows = (text: string) => linesFromText(text);

describe('parseGrades', () => {
  it('reads fractions and percents with their titles', () => {
    const g = parseGrades(rows('Unit 1 Test 88/100\nQuiz 3  9 / 10\nPersuasive essay 92%\nLab 2: Density 18/20'));
    assert.deepEqual(
      g.map((x) => [x.title, x.score, x.outOf, x.category]),
      [
        ['Unit 1 Test', 88, 100, 'Tests'],
        ['Quiz 3', 9, 10, 'Quizzes'],
        ['Persuasive essay', 92, 100, 'Projects'],
        ['Lab 2: Density', 18, 20, 'Labs'],
      ],
    );
  });

  it('takes the title from the line above when the score stands alone', () => {
    const g = parseGrades(rows('Chapter 4 worksheet\n15/15'));
    assert.equal(g[0]?.title, 'Chapter 4 worksheet');
    assert.equal(g[0]?.score, 15);
  });

  it('ignores a date in the row (Aeries prints one beside the score)', () => {
    const g = parseGrades(rows('Lab 1 10/03/2026 18/20\nHomework 5 9/28 10/10'));
    assert.deepEqual(
      g.map((x) => [x.title, x.score, x.outOf]),
      [
        ['Lab 1', 18, 20],
        ['Homework 5', 10, 10],
      ],
    );
  });
});

describe('parseSchedule', () => {
  it('reads a full schedule row', () => {
    const [c] = parseSchedule(rows('Period 1  AP Chemistry  8:00 AM - 8:50 AM  Rm 214'));
    assert.deepEqual(c, { name: 'AP Chemistry', start: 8 * 60, end: 8 * 60 + 50, room: '214' });
  });

  it('guesses school hours without AM/PM', () => {
    const [c] = parseSchedule(rows('English 11 12:30 - 1:15'));
    assert.equal(c?.start, 12 * 60 + 30);
    assert.equal(c?.end, 13 * 60 + 15);
  });

  it('handles a class that crosses noon with PM only on the end', () => {
    const [c] = parseSchedule(rows('Spanish 2 11:50 - 12:40 PM'));
    assert.equal(c?.start, 11 * 60 + 50);
    assert.equal(c?.end, 12 * 60 + 40);
  });

  it('skips lunch and takes a lone time row\'s name from above', () => {
    const t = parseSchedule(rows('Lunch 11:00 - 11:30\nWorld History\n1:20 - 2:10'));
    assert.deepEqual(t.map((x) => x.name), ['World History']);
  });
});

describe('parseScan', () => {
  it('reads a Classroom to-do list: title, class, due', () => {
    const r = parseScan(rows('Cell energy worksheet\nAP Biology\nDue Friday\nVocab quiz 4\nSpanish 2\nDue tomorrow'), [], TODAY);
    assert.deepEqual(
      r.assignments.map((a) => [a.title, a.className, a.due, a.kind]),
      [
        ['Cell energy worksheet', 'AP Biology', '2026-10-09', 'homework'],
        ['Vocab quiz 4', 'Spanish 2', '2026-10-06', 'quiz'],
      ],
    );
  });

  it('reads Canvas: title and due on one line', () => {
    const r = parseScan(rows('Essay draft Due Oct 12\nEnglish 11'), [], TODAY);
    assert.equal(r.assignments[0]?.title, 'Essay draft');
    assert.equal(r.assignments[0]?.due, '2026-10-12');
    assert.equal(r.assignments[0]?.className, 'English 11');
  });

  it('finds class cards with their teacher', () => {
    const r = parseScan(rows('Honors Chemistry\nMs. Rivera\nGeometry\nMr. Okafor'), [], TODAY);
    assert.deepEqual(
      r.classes.map((c) => [c.name, c.teacher]),
      [
        ['Honors Chemistry', 'Ms. Rivera'],
        ['Geometry', 'Mr. Okafor'],
      ],
    );
  });

  it('merges screenshots without doubles, and attaches times', () => {
    const a = parseScan(rows('Geometry\nMr. Okafor'), [], TODAY);
    const b = parseScan(rows('Geometry\nMr. Okafor\nProof set 3\nDue Wednesday'), [], TODAY);
    const merged = mergeScans([a, b]);
    assert.equal(merged.classes.filter((c) => c.name === 'Geometry').length, 1);
    const timed = attachTimes(merged, parseSchedule(rows('Geometry 9:00 - 9:50')));
    assert.equal(timed.classes.find((c) => c.name === 'Geometry')?.start, 9 * 60);
  });
});
