import type { IconName } from '../components/ui/Icon';
import { dateKey } from './dates';
import { useHubStore } from './hubStore';
import { hoursTotal, useLifeStore } from './lifeStore';
import { useSchoolStore } from './schoolStore';

// Quiet badges for things worth noticing — never streaks, never anything
// you can lose. Each one is a pure check over what's already stored, so a
// badge can't be earned twice or out of order.

export interface Achievement {
  key: string;
  title: string;
  body: string;
  icon: IconName;
  color: string;
}

interface Facts {
  added: number;
  done: number;
  sessions: number;
  focusMinutes: number;
  grades: number;
  decks: number;
  cardReviews: number;
  wins: number;
  gratitudeDays: number;
  serviceHours: number;
  drivingHours: number;
  colleges: number;
  reviews: number;
  worriesResolved: number;
  people: number;
  showedUp: number;
  countdowns: number;
  plannedBackward: number;
}

const LIST: (Achievement & { test: (f: Facts) => boolean })[] = [
  { key: 'first_add', title: 'On the list', body: 'Added your first assignment.', icon: 'book', color: '#8FB4E8', test: (f) => f.added >= 1 },
  { key: 'first_done', title: 'First one down', body: 'Finished an assignment.', icon: 'check', color: '#8CC0A8', test: (f) => f.done >= 1 },
  { key: 'done_10', title: 'Ten down', body: 'Ten assignments finished.', icon: 'check', color: '#8CC0A8', test: (f) => f.done >= 10 },
  { key: 'done_50', title: 'Fifty down', body: 'Fifty assignments finished.', icon: 'trophy', color: '#F5B45C', test: (f) => f.done >= 50 },
  { key: 'first_focus', title: 'Lit a candle', body: 'Your first focus session.', icon: 'timer', color: '#F5B45C', test: (f) => f.sessions >= 1 },
  { key: 'focus_10', title: 'Ten candles', body: 'Ten focus sessions.', icon: 'flame', color: '#F5B45C', test: (f) => f.sessions >= 10 },
  { key: 'focus_600', title: 'Ten hours deep', body: 'Ten hours of focused work.', icon: 'hourglass', color: '#DE8238', test: (f) => f.focusMinutes >= 600 },
  { key: 'plan_back', title: 'Planned it backward', body: 'Broke something big into days.', icon: 'layers', color: '#AFA2DE', test: (f) => f.plannedBackward >= 1 },
  { key: 'first_grade', title: 'Keeping score', body: 'Logged your first grade.', icon: 'grade', color: '#8FB4E8', test: (f) => f.grades >= 1 },
  { key: 'first_deck', title: 'Card maker', body: 'Made a flashcard deck.', icon: 'cards', color: '#E89AB8', test: (f) => f.decks >= 1 },
  { key: 'cards_100', title: 'A hundred flips', body: 'Reviewed 100 flashcards.', icon: 'cards', color: '#E89AB8', test: (f) => f.cardReviews >= 100 },
  { key: 'wins_10', title: 'Jar’s filling', body: 'Ten wins in the jar.', icon: 'jar', color: '#E6C46A', test: (f) => f.wins >= 10 },
  { key: 'grateful_7', title: 'Good things', body: 'Seven days of gratitude.', icon: 'heart', color: '#F08A8A', test: (f) => f.gratitudeDays >= 7 },
  { key: 'service_10', title: 'Showing up for others', body: 'Ten hours of service.', icon: 'hands', color: '#9FD08A', test: (f) => f.serviceHours >= 10 },
  { key: 'driving_10', title: 'Behind the wheel', body: 'Ten hours of driving practice.', icon: 'car', color: '#8FB4E8', test: (f) => f.drivingHours >= 10 },
  { key: 'first_college', title: 'Looking ahead', body: 'Added a college.', icon: 'cap', color: '#8FB4E8', test: (f) => f.colleges >= 1 },
  { key: 'first_review', title: 'Looked back', body: 'Did a weekly review.', icon: 'star', color: '#F5B45C', test: (f) => f.reviews >= 1 },
  { key: 'worry_done', title: 'Set it down for good', body: 'Handled something from the worry box.', icon: 'feather', color: '#AFA2DE', test: (f) => f.worriesResolved >= 1 },
  { key: 'people', title: 'Your people', body: 'Added someone to reach out to.', icon: 'people', color: '#E89AB8', test: (f) => f.people >= 1 },
  { key: 'showed_7', title: 'Seven days', body: 'Showed up on seven different days.', icon: 'sun', color: '#F5B45C', test: (f) => f.showedUp >= 7 },
  { key: 'showed_30', title: 'Thirty days', body: 'Showed up on thirty different days.', icon: 'sparkle', color: '#F5B45C', test: (f) => f.showedUp >= 30 },
  { key: 'countdown', title: 'Something to look forward to', body: 'Set a countdown.', icon: 'gift', color: '#E89AB8', test: (f) => f.countdowns >= 1 },
];

// Earned by doing a thing once, not by what's stored.
export const EVENT_ACHIEVEMENTS: Achievement[] = [
  { key: 'first_scan', title: 'Scanned it in', body: 'Imported from a screenshot.', icon: 'image', color: '#D99A6C' },
  { key: 'all_clear', title: 'All clear', body: 'Nothing due by tomorrow.', icon: 'sparkle', color: '#8CC0A8' },
  { key: 'sleep_plan', title: 'Bedtime math', body: 'Used the sleep calculator.', icon: 'bed', color: '#8FB4E8' },
];

export const ALL_ACHIEVEMENTS: Achievement[] = [...LIST, ...EVENT_ACHIEVEMENTS];

/** Distinct days with anything done: work finished, focus, wins, gratitude. */
export function daysShowedUp() {
  const { assignments, focus } = useSchoolStore.getState();
  const { wins, gratitude } = useLifeStore.getState();
  const days = new Set<string>();
  for (const a of assignments) if (a.doneAt) days.add(dateKey(new Date(a.doneAt)));
  for (const f of focus) days.add(dateKey(new Date(f.at)));
  for (const w of wins) days.add(dateKey(new Date(w.at)));
  for (const [k, v] of Object.entries(gratitude)) if (v.some((x) => x.trim())) days.add(k);
  return days.size;
}

function facts(): Facts {
  const school = useSchoolStore.getState();
  const life = useLifeStore.getState();
  const hub = useHubStore.getState();
  return {
    added: school.assignments.length,
    done: school.assignments.filter((a) => a.done).length,
    sessions: school.focus.length,
    focusMinutes: school.focus.reduce((s, f) => s + f.minutes, 0),
    grades: school.grades.length,
    decks: life.decks.length,
    cardReviews: life.decks.reduce((s, d) => s + d.cards.reduce((t, c) => t + c.seen, 0), 0),
    wins: life.wins.length,
    gratitudeDays: Object.values(life.gratitude).filter((v) => v.some((x) => x.trim())).length,
    serviceHours: hoursTotal(life.hours, 'service'),
    drivingHours: hoursTotal(life.hours, 'driving'),
    colleges: hub.colleges.length,
    reviews: life.reviews.length,
    worriesResolved: life.worries.filter((w) => w.resolved).length,
    people: life.people.length,
    showedUp: daysShowedUp(),
    countdowns: life.countdowns.length,
    plannedBackward: school.assignments.filter((a) => a.subtasks?.some((t) => t.on)).length,
  };
}

/** Awards anything newly true; returns what was just earned. */
export function checkAchievements(): Achievement[] {
  const f = facts();
  const life = useLifeStore.getState();
  const earned: Achievement[] = [];
  for (const a of LIST) {
    if (!life.achievements[a.key] && a.test(f) && life.earn(a.key)) earned.push(a);
  }
  return earned;
}

/**
 * Warmth: what looking after yourself and your work adds up to. It only
 * ever goes up, and it unlocks Ember's colors and accessories.
 */
export function warmth() {
  const f = facts();
  return Math.round(
    f.done * 2 +
      f.sessions * 2 +
      f.wins +
      f.gratitudeDays * 2 +
      f.reviews * 5 +
      f.cardReviews / 10 +
      f.serviceHours +
      f.worriesResolved * 2 +
      Object.keys(useLifeStore.getState().achievements).length * 3
  );
}
