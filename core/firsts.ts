import { addDays, dateKey } from './dates';
import { useLifeStore } from './lifeStore';
import { useSchoolStore } from './schoolStore';
import { isShowing } from './showMode';
import { useWellnessStore } from './wellnessStore';

// Ember remembers firsts. Pure rules over what is already on the phone;
// nothing is sent anywhere. Each first happens once ever, remembered in
// settings.celebrated under a stable key.

export interface First {
  key: string;
  line: string;
}

/** True when any 7 days in a row each have a check-in. */
function hasFullWeek(days: Set<string>) {
  for (const d of days) {
    let n = 0;
    while (n < 7 && days.has(addDays(d, n))) n += 1;
    if (n === 7) return true;
  }
  return false;
}

/** The first thing worth remembering that has not been remembered yet, or null. */
export function nextFirst(): First | null {
  if (isShowing()) return null;
  const done = useLifeStore.getState().settings.celebrated ?? [];
  const todo = (key: string) => !done.includes(key);
  const { focus, grades, assignments, classes } = useSchoolStore.getState();

  if (todo('first-focus-hour')) {
    const perDay = new Map<string, number>();
    for (const f of focus) {
      const k = dateKey(new Date(f.at));
      perDay.set(k, (perDay.get(k) ?? 0) + f.minutes);
    }
    if (focus.some((f) => f.minutes >= 60) || [...perDay.values()].some((m) => m >= 60)) {
      return { key: 'first-focus-hour', line: 'A full hour of focus, start to finish. Worth remembering.' };
    }
  }
  if (todo('first-a') && grades.some((g) => g.outOf > 0 && g.score / g.outOf >= 0.9)) {
    return { key: 'first-a', line: 'An A is in the book. You earned that.' };
  }
  if (todo('first-checkin-week')) {
    const days = new Set(useWellnessStore.getState().checkins.map((c) => c.checkin_date));
    if (hasFullWeek(days)) {
      return { key: 'first-checkin-week', line: 'A check-in every day for a week. That’s a habit forming.' };
    }
  }
  if (todo('first-early-finish')) {
    const early = assignments.find((a) => a.done && a.doneAt && dateKey(new Date(a.doneAt)) <= addDays(a.due, -1));
    if (early) {
      const cls = classes.find((c) => c.id === early.classId)?.name;
      return {
        key: 'first-early-finish',
        line: `You finished something ahead of time${cls ? `, in ${cls}` : ''}. That’s future-you being looked after.`,
      };
    }
  }
  return null;
}

/** Remember a first so it never comes back. */
export function rememberFirst(key: string) {
  const life = useLifeStore.getState();
  const done = life.settings.celebrated ?? [];
  if (!done.includes(key)) life.setSettings({ celebrated: [...done, key].slice(-200) });
}
