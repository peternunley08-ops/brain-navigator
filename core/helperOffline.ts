import { addDays, dateKey, daysUntil } from './dates';
import type { Deck, Flashcard } from './lifeStore';
import { nightNow } from './night';
import type { Assignment, SchoolClass } from './schoolStore';

// What each helper can do with no AI at all. Pure functions over the
// student's own data, so they're instant, free, and work offline.

// ---- Pip: tonight's plan ------------------------------------------------------

export interface PlanStep {
  kind: 'work' | 'break';
  title: string;
  start: number;
  end: number;
  assignmentId?: string;
  classId?: string | null;
}

const CHUNK = 25;
const BREAK = 5;

/**
 * A realistic plan for the rest of today: overdue first, then what's due
 * soonest (starred first), in 25-minute chunks with 5-minute breaks,
 * stopping at the nightly homework cap or the wind-down time.
 */
export function buildTonightPlan(
  assignments: Assignment[],
  opts: { cap: number; windDown: number; now?: Date; startAt?: number; first?: string | null }
): { steps: PlanStep[]; workMinutes: number; leftOut: Assignment[] } {
  const now = opts.now ?? nightNow();
  const today = dateKey(now);
  let t = now.getHours() * 60 + now.getMinutes();
  // Before school's out, plan from 3:30.
  if (t < 15 * 60 + 30 && now.getDay() !== 0 && now.getDay() !== 6) t = 15 * 60 + 30;
  // "I'm busy until…": start later tonight.
  if (opts.startAt != null && opts.startAt > t) t = opts.startAt;
  t = Math.ceil(t / 5) * 5;
  const stop = opts.windDown > t ? opts.windDown : 24 * 60 - 30;

  const open = assignments
    .filter((a) => !a.done && daysUntil(a.due, today) <= 2)
    .sort((a, b) => a.due.localeCompare(b.due) || Number(!!b.starred) - Number(!!a.starred))
    // "Do this one first" moves it to the front.
    .sort((a, b) => Number(b.id === opts.first) - Number(a.id === opts.first));

  const steps: PlanStep[] = [];
  const leftOut: Assignment[] = [];
  let work = 0;
  for (const a of open) {
    let need = a.minutes ?? 30;
    if (work >= opts.cap || t + 10 > stop) {
      leftOut.push(a);
      continue;
    }
    while (need > 0 && work < opts.cap && t + 10 <= stop) {
      // A leftover under 10 minutes rides along with this chunk instead of becoming its own.
      const want = need - CHUNK < 10 ? need : CHUNK;
      const len = Math.min(want, opts.cap - work, stop - t);
      steps.push({ kind: 'work', title: a.title, start: t, end: t + len, assignmentId: a.id, classId: a.classId });
      t += len;
      need -= len;
      work += len;
      if ((need > 0 || open.indexOf(a) < open.length - 1) && t + BREAK < stop && work < opts.cap) {
        steps.push({ kind: 'break', title: 'Break: stand up, drink water, no phone', start: t, end: t + BREAK });
        t += BREAK;
      }
    }
    if (need > 0) leftOut.push(a);
  }
  while (steps.length && steps[steps.length - 1].kind === 'break') steps.pop();
  return { steps, workMinutes: work, leftOut };
}

// ---- Quizzo: a game from your flashcards ------------------------------------

export interface QuizQuestion {
  deckId: string;
  card: Flashcard;
  prompt: string;
  options: string[];
  answer: number;
  /** "Front: back" shown as a statement to judge. */
  trueFalse?: boolean;
}

function shuffle<T>(xs: T[]) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Multiple choice from flashcards: the right back plus three other backs as
 * decoys. Cards that are due come first. Needs at least two cards.
 */
export function buildQuiz(decks: Deck[], max = 10): QuizQuestion[] {
  const all = decks.flatMap((d) => d.cards.map((c) => ({ deck: d, card: c })));
  if (all.length < 2) return [];
  const today = dateKey();
  const pool = [...shuffle(all.filter((x) => x.card.due <= today)), ...shuffle(all.filter((x) => x.card.due > today))].slice(0, max);
  const backs = [...new Set(all.map((x) => x.card.back))];
  // Too few answers for four choices: ask true or false instead.
  if (backs.length < 4) {
    return pool.map(({ deck, card }) => {
      const others = backs.filter((b) => b !== card.back);
      const honest = !others.length || Math.random() < 0.5;
      const shown = honest ? card.back : shuffle(others)[0];
      return { deckId: deck.id, card, prompt: `${card.front}: ${shown}`, options: ['True', 'False'], answer: honest ? 0 : 1, trueFalse: true };
    });
  }
  return pool.map(({ deck, card }) => {
    const decoys = shuffle(backs.filter((b) => b !== card.back)).slice(0, 3);
    const options = shuffle([card.back, ...decoys]);
    return { deckId: deck.id, card, prompt: card.front, options, answer: options.indexOf(card.back) };
  });
}

// ---- Quill: brainstorm questions --------------------------------------------

export const BRAINSTORM = [
  { q: 'What’s the assignment or prompt, in your own words?', hint: 'If you can’t say it simply, re-read the prompt first.' },
  { q: 'What’s a moment, example, or piece of evidence that jumps to mind?', hint: 'Specific beats general. A scene, a quote, a number.' },
  { q: 'Why does that moment matter — what does it show?', hint: 'This is usually where your real point is hiding.' },
  { q: 'What would someone who disagrees with you say?', hint: 'Answering them makes your argument stronger.' },
  { q: 'What do you want the reader to think or feel at the end?', hint: 'Your conclusion, before you’ve written anything.' },
  { q: 'Try your main point in one sentence. It can be rough.', hint: 'That’s a thesis. You’ll fix it later.' },
];

// ---- Sage: explain it back --------------------------------------------------

export const EXPLAIN_CHECKS = [
  'Would a 12-year-old know every word you used?',
  'Did you give one example or comparison?',
  'Where did you get vague or skip a step? That’s what to study.',
  'Could you draw it as a picture or a simple diagram?',
];

// ---- Spark: getting started -------------------------------------------------

export const HYPE = [
  'You don’t need motivation. You need five minutes. Motivation shows up around minute three.',
  'Tiny step: open the doc. That’s it. That counts.',
  'Future you is watching. Future you is SO proud right now.',
  'Messy start > perfect never.',
  'Phone face down. Timer on. You’ve got this.',
  'The hardest part is the first sentence. So write a bad one on purpose.',
  'Every expert was once a beginner who didn’t quit.',
  'Five minutes. If you hate it, you can stop. (You won’t.)',
];

/** The easiest good first step: overdue, else due soonest and shortest. */
export function smallestStart(assignments: Assignment[]) {
  const open = assignments.filter((a) => !a.done);
  if (!open.length) return null;
  return [...open].sort((a, b) => {
    const da = Math.max(-1, daysUntil(a.due));
    const db = Math.max(-1, daysUntil(b.due));
    return da - db || (a.minutes ?? 30) - (b.minutes ?? 30);
  })[0];
}

/** One line about what they were spawned for, for the AI's context. */
export function aboutLine(a: Assignment | undefined, classes: SchoolClass[]) {
  if (!a) return '';
  const cls = classes.find((c) => c.id === a.classId)?.name;
  const days = daysUntil(a.due);
  return `They called you about: "${a.title}"${cls ? ` for ${cls}` : ''}, a ${a.kind}, due ${days <= 0 ? 'today or overdue' : days === 1 ? 'tomorrow' : `in ${days} days (${addDays(dateKey(), days)})`}.`;
}
