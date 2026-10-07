import { clock } from './dates';
import { dueOn, firstClassOn, morningKey } from './night';
import type { Assignment, SchoolClass } from './schoolStore';

/** What the Home Screen widget shows: the Night Desk's "Tomorrow" card. */
export interface WidgetDay {
  /** Tomorrow's first class, if it has one. */
  first: { name: string; time: string; color: string } | null;
  /** The first few things due tomorrow, starred first. */
  due: { title: string; className: string | null }[];
  dueCount: number;
  /** False until the student adds a class: the widget points them to School. */
  hasClasses: boolean;
}

export const WIDGET_DUE_MAX = 3;

export function widgetDay(classes: SchoolClass[], assignments: Assignment[], at: Date): WidgetDay {
  const key = morningKey(at);
  const first = firstClassOn(classes, key);
  const due = dueOn(assignments, key);
  return {
    first: first ? { name: first.name, time: clock(first.start), color: first.color } : null,
    due: due.slice(0, WIDGET_DUE_MAX).map((a) => ({ title: a.title, className: classes.find((c) => c.id === a.classId)?.name ?? null })),
    dueCount: due.length,
    hasClasses: classes.some((c) => c.kind === 'class'),
  };
}

/**
 * Now, then each 5 AM rollover for the next two days, so the widget moves on
 * to the next morning even when the app stays closed.
 */
export function widgetTimeline(classes: SchoolClass[], assignments: Assignment[], now: Date) {
  const roll = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5);
  if (now.getHours() >= 5) roll.setDate(roll.getDate() + 1);
  const after = new Date(roll.getFullYear(), roll.getMonth(), roll.getDate() + 1, 5);
  return [now, roll, after].map((date) => ({ date, props: widgetDay(classes, assignments, date) }));
}
