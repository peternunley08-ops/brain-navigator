import { addDays, dateKey, daysUntil } from './dates';
import { usualFocusLength } from './learned';
import { useSchoolStore } from './schoolStore';
import { isShowing } from './showMode';
import { useWellnessStore } from './wellnessStore';
import { plural } from './words';

// The tiny wins radar: one small, true, specific good thing from the data.
// Null when nothing is genuinely notable.

export function tinyWin(now: Date = new Date()): { id: string; line: string } | null {
  if (isShowing()) return null;
  const today = dateKey(now);
  const { assignments, classes, focus } = useSchoolStore.getState();

  // Something finished a day or more early today.
  const tomorrow = addDays(today, 1);
  const early = assignments.find((a) => a.done && a.doneAt && dateKey(new Date(a.doneAt)) === today && a.due >= tomorrow);
  if (early) {
    const name = classes.find((c) => c.id === early.classId)?.name;
    const ahead = Math.max(1, daysUntil(early.due, today));
    const what = name ? `${early.title} for ${name}` : early.title;
    return { id: `win-early-${early.id}`, line: `${what} is done, ${ahead === 1 ? 'a day' : plural(ahead, 'day')} early.` };
  }

  // Check-ins on consecutive days, ending today.
  const days = new Set(useWellnessStore.getState().checkins.map((c) => c.checkin_date));
  if (days.has(today)) {
    let n = 0;
    while (days.has(addDays(today, -n))) n += 1;
    if (n >= 3) return { id: `win-checkins-${today}`, line: `You’ve checked in each of the last ${plural(n, 'day')}. Nice rhythm.` };
  }

  // A longer focus than usual today.
  const usual = usualFocusLength();
  if (usual) {
    const longest = Math.max(0, ...focus.filter((f) => dateKey(new Date(f.at)) === today).map((f) => f.minutes));
    if (longest >= usual.minutes + 10) {
      return { id: `win-focus-${today}`, line: `You focused ${plural(longest, 'minute')} today, longer than your usual.` };
    }
  }
  return null;
}
