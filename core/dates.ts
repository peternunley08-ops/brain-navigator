// Local-calendar date helpers. Dates are YYYY-MM-DD strings in the phone's
// own time zone, so "today" means today where the student is.

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}

export function daysUntil(key: string, from = dateKey()) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = key.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000);
}

/** "Today", "Tomorrow", "Thursday", or "Oct 12". */
export function dueLabel(key: string) {
  const n = daysUntil(key);
  if (n < 0) return n === -1 ? 'Yesterday' : `${-n} days ago`;
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (n < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** 1 = Monday … 7 = Sunday. */
export function isoDay(d = new Date()) {
  return ((d.getDay() + 6) % 7) + 1;
}

export function clock(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

