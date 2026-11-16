/// <reference types="node" />
// Copy and voice: habits stay a count, Quizzo does not keep a scoreboard,
// and helper colors come from the theme.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { adviseFor } from '../core/ember';
import { HELPERS, quizRoundPoints } from '../core/helpers';
import { useHabitsStore } from '../core/habitsStore';
import { colors, dimensionColor } from '../core/theme';

const NOW = new Date(2026, 9, 5, 16, 0, 0);
const habit = {
  id: 'h1',
  name: 'Water',
  frequency: 'daily' as const,
  category: 'physical' as const,
  target_per_week: null,
  archived: false,
  created_at: '2026-10-01',
};

describe('habits voice', () => {
  it('the habits screen counts recent days and a missed day changes nothing', () => {
    const line = adviseFor('/habits', NOW).about.line;
    assert.doesNotMatch(line, /streak/i);
    assert.match(line, /missed day/);
    assert.match(line, /changes nothing/);
  });

  it('a finished day is not called a streak', () => {
    useHabitsStore.setState({
      habits: [habit],
      logs: [{ id: 'l1', habit_id: 'h1', log_date: '2026-10-05' }],
    });
    try {
      const advice = adviseFor('/habits', NOW);
      const done = advice.tips.find((t) => t.id === 'habits-done');
      assert.ok(done);
      assert.doesNotMatch(done.line, /streak/i);
      assert.match(done.line, /missed day/);
      for (const tip of advice.tips) assert.doesNotMatch(tip.line, /streak/i);
    } finally {
      useHabitsStore.setState({ habits: [], logs: [] });
    }
  });

  it('the science note keeps the loop and drops the lecture', () => {
    const code = readFileSync('app/habits.tsx', 'utf8')
      .split('\n')
      .filter((l) => !/^\s*\/\//.test(l))
      .join('\n');
    assert.match(code, /cue → routine → reward/);
    assert.doesNotMatch(code, /streak/i);
    assert.doesNotMatch(code, /quitting/i);
  });
});

describe('Quizzo', () => {
  it('remembers ten per right answer and never a streak bonus', () => {
    assert.equal(quizRoundPoints(0), 0);
    assert.equal(quizRoundPoints(3), 30);
    assert.equal(quizRoundPoints(10), 100);
    assert.equal(quizRoundPoints(-2), 0);
  });

  it('the round shows progress and not a scoreboard', () => {
    const quiz = readFileSync('components/helpers/QuizGame.tsx', 'utf8');
    assert.match(quiz, /\{i \+ 1\} \/ \{qs\.length\}/);
    assert.match(quiz, /quizRoundPoints\(right\)/);
    assert.doesNotMatch(quiz, /streak\s*\*\s*2/);
    assert.doesNotMatch(quiz, /#[0-9a-fA-F]{6}/);
    assert.doesNotMatch(quiz, /See my score/);
    assert.doesNotMatch(quiz, /name="flame"/);
    assert.doesNotMatch(quiz, /high score/i);
  });
});

describe('helper crew', () => {
  it('keeps five names and paints each from a theme token', () => {
    const allowed = new Set<string>([colors.shelved, dimensionColor.intellectual, dimensionColor.social, colors.secured, colors.flame]);
    assert.deepEqual(
      HELPERS.map((h) => h.name),
      ['Quizzo', 'Pip', 'Quill', 'Sage', 'Spark'],
    );
    assert.equal(new Set(HELPERS.map((h) => h.color)).size, 5);
    for (const h of HELPERS) assert.ok(allowed.has(h.color), h.id);
    const quizzo = HELPERS.find((h) => h.id === 'quizzo');
    const spark = HELPERS.find((h) => h.id === 'spark');
    assert.equal(quizzo?.tagline, 'Turns anything into a quick game.');
    assert.equal(spark?.tagline, 'Gets you started when you can’t.');
    assert.notEqual(quizzo?.role, 'Quiz master');
    assert.notEqual(spark?.role, 'Hype');
    assert.equal(quizzo?.role, 'Practice quiz');
    assert.equal(spark?.role, 'First step');
  });
});

describe('guide and tight labels', () => {
  it('the model guide does not teach streaks', () => {
    const src = readFileSync('supabase/functions/ember/index.ts', 'utf8');
    const guide = src.slice(src.indexOf('const APP_GUIDE'), src.indexOf('const SAFETY'));
    assert.doesNotMatch(guide, /streak/i);
    assert.match(guide, /missed day/);
  });

  it('settings says when a color opens, and swatch labels can shrink or wrap', () => {
    const src = readFileSync('app/settings.tsx', 'utf8');
    assert.doesNotMatch(src, /next unlock|unlocks at|everything unlocked/i);
    assert.match(src, /Opens at/);
    assert.match(src, /fontScale > 1\.5/);
    assert.match(src, /adjustsFontSizeToFit/);
  });

  it('deck names can shrink or wrap at large text', () => {
    const src = readFileSync('app/flashcards.tsx', 'utf8');
    assert.match(src, /fontScale > 1\.5/);
    assert.match(src, /adjustsFontSizeToFit/);
    assert.doesNotMatch(src, /No decks yet/);
  });
});
