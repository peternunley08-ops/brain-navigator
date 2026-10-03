import { addDays, dateKey } from './dates';
import { weekOf } from './lifeStore';
import { useSchoolStore } from './schoolStore';
import { useWellnessStore } from './wellnessStore';
import { plural } from './words';

// Ember's journal: one warm sentence per past week, written from what is on
// the phone. Rules only, nothing leaves the device.

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayName(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return DAYS[new Date(y, m - 1, d).getDay()];
}

export function weekLine(weekStart: string): string | null {
  const { assignments, focus } = useSchoolStore.getState();
  const end = addDays(weekStart, 6);
  const inWeek = (k: string) => k >= weekStart && k <= end;
  const finished = assignments.filter((a) => a.doneAt && inWeek(dateKey(new Date(a.doneAt))));
  const tests = assignments.filter((a) => (a.kind === 'test' || a.kind === 'quiz') && inWeek(a.due));
  const sessions = focus.filter((f) => inWeek(dateKey(new Date(f.at))));
  const checkIns = useWellnessStore.getState().checkins.filter((c) => inWeek(c.checkin_date)).length;
  if (!finished.length && !tests.length && !sessions.length && !checkIns) return null;

  const mins = sessions.reduce((t, f) => t + f.minutes, 0);
  const perDay: Record<string, number> = {};
  for (const a of finished) {
    const k = dateKey(new Date(a.doneAt as string));
    perDay[k] = (perDay[k] ?? 0) + 1;
  }
  const top = Object.entries(perDay).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  const facts: string[] = [];
  if (finished.length) facts.push(`You finished ${plural(finished.length, 'thing')}`);
  if (top && finished.length >= 3 && top[1] >= 2) facts.push(`focused most on ${dayName(top[0])}`);
  else if (mins >= 60) facts.push(`gave ${plural(Math.round(mins / 60), 'hour')} to focus`);
  if (checkIns && facts.length < 2) facts.push(`checked in ${plural(checkIns, 'time')}`);
  if (!facts.length && sessions.length) facts.push(`sat down to focus ${plural(sessions.length, 'time')}`);

  const heavy = tests.length >= 2;
  const opener = heavy
    ? `A heavy week with ${tests.length === 2 ? 'two' : tests.length === 3 ? 'three' : String(tests.length)} tests.`
    : finished.length >= 6 || mins >= 300
      ? 'A full week.'
      : finished.length + sessions.length <= 2
        ? 'A quiet week.'
        : 'A steady week.';
  if (!facts.length) return opener;
  const body = facts.length === 1 ? facts[0] : `${facts[0]} and ${facts[1]}`;
  return `${opener} ${heavy ? `You still ${body.replace(/^You /, '')}` : body}.`;
}

export function journalWeeks(n = 8): { weekStart: string; line: string }[] {
  const thisMonday = weekOf(dateKey());
  const out: { weekStart: string; line: string }[] = [];
  for (let i = 1; i <= n; i++) {
    const weekStart = addDays(thisMonday, -7 * i);
    const line = weekLine(weekStart);
    if (line) out.push({ weekStart, line });
  }
  return out;
}
