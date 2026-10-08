// The lit card: the one thing the Desk lights by day. Plain functions so the
// priority is tested; components/desk/LitCard.tsx gathers the facts.
import { addDays, daysUntil } from './dates';
import { nightNow } from './night';
import { plural } from './words';

export type LitKind = 'allClear' | 'class' | 'windDown' | 'oneThing' | 'due' | 'exams' | 'brief' | 'firstHomework' | 'nextClass';

/**
 * First that applies is lit; one card, never two. All clear is the peak; a
 * class in session and the wind-down hour are about right now; then what the
 * student chose (the one thing), what's due tonight, exam season and the
 * brief. A new student with no homework yet gets "Add your first homework",
 * and otherwise the next class. Nothing applies: nothing is lit.
 */
export const LIT_ORDER: readonly LitKind[] = ['allClear', 'class', 'windDown', 'oneThing', 'due', 'exams', 'brief', 'firstHomework', 'nextClass'];

export function pickLit(facts: Partial<Record<LitKind, unknown>>): LitKind | null {
  return LIT_ORDER.find((k) => !!facts[k]) ?? null;
}

type Due = { id: string; due: string; done?: boolean; starred?: boolean; snoozedUntil?: number };

/** The most urgent unfinished thing due by tomorrow: late first, then today, then tomorrow; starred breaks a tie. One snoozed off the Desk sits out until its time. */
export function urgentTonight<T extends Due>(assignments: T[], today: string, now = nightNow().getTime()): T | null {
  const tomorrow = addDays(today, 1);
  return (
    assignments
      .filter((a) => !a.done && a.due <= tomorrow && !(a.snoozedUntil && a.snoozedUntil > now))
      .sort((a, b) => a.due.localeCompare(b.due) || Number(!!b.starred) - Number(!!a.starred))[0] ?? null
  );
}

/** Where a card swiped off the Desk goes: tonight (6 PM) while it's still day, otherwise tomorrow morning (7 AM). */
export function snoozeTarget(now: Date): { until: number; when: 'tonight' | 'tomorrow' } {
  const d = new Date(now);
  const h = d.getHours();
  if (h >= 5 && h < 17) {
    d.setHours(18, 0, 0, 0);
    return { until: d.getTime(), when: 'tonight' };
  }
  if (h >= 17) d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  return { until: d.getTime(), when: 'tomorrow' };
}

/** "About 30 minutes. Due tomorrow." for the lit card. */
export function dueLine(minutes: number | null | undefined, due: string, today: string) {
  const d = daysUntil(due, today);
  const when = d < 0 ? 'It slipped past its date; that’s okay.' : d === 0 ? 'Due today.' : 'Due tomorrow.';
  return `About ${plural(minutes ?? 30, 'minute')}. ${when}`;
}

/** The Tonight row: what's planned against the cap. */
export function tonightLine(minutes: number, cap: number, items: number) {
  if (!items) return 'Nothing due by tomorrow';
  const line = `${minutes} of ${plural(cap, 'minute')}`;
  return minutes > cap ? `${line}, over your cap` : line;
}
