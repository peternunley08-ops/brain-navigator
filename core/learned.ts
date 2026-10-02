import type { IconName } from '../components/ui/Icon';
import { CALMERS } from './about';
import { useLifeStore } from './lifeStore';
import { useSchoolStore } from './schoolStore';

// What the app notices from how a student uses it, worked out on the phone.
// Each note says what it's based on, needs at least five examples, and can
// be dismissed ("Not right") or turned off entirely in About you.

export interface LearnedNote {
  id: string;
  icon: IconName;
  text: string;
  /** What it's based on, in plain words. */
  basis: string;
}

const MIN = 5;

function calmerName(id: string) {
  const label = CALMERS.find((c) => c.id === id)?.label ?? id;
  return label[0].toUpperCase() + label.slice(1);
}

function hourLabel(h: number) {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${h < 12 ? 'AM' : 'PM'}`;
}

/** The hour (0–23) most focus sessions started in, and how many did. */
export function bestFocusHour() {
  const focus = useSchoolStore.getState().focus;
  if (focus.length < MIN) return null;
  const counts = new Array(24).fill(0);
  for (const f of focus) {
    const end = new Date(f.at);
    const start = new Date(end.getTime() - f.minutes * 60000);
    counts[start.getHours()] += 1;
  }
  const hour = counts.indexOf(Math.max(...counts));
  return counts[hour] >= 3 ? { hour, count: counts[hour], total: focus.length } : null;
}

/** The focus length used most, if one stands out. */
export function usualFocusLength() {
  const focus = useSchoolStore.getState().focus;
  if (focus.length < MIN) return null;
  const counts = new Map<number, number>();
  for (const f of focus) {
    const m = Math.round(f.minutes / 5) * 5;
    if (m >= 5) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 3 ? { minutes: top[0], count: top[1], total: focus.length } : null;
}

/** Everything noticed right now, minus what the student said wasn't right. */
export function learnedNotes(): LearnedNote[] {
  const { about } = useLifeStore.getState();
  if (about.learnOff) return [];
  const notes: LearnedNote[] = [];

  const best = bestFocusHour();
  if (best) notes.push({ id: `focus-hour-${best.hour}`, icon: 'timer', text: `You do most of your focusing around ${hourLabel(best.hour)}.`, basis: `From ${best.count} of your ${best.total} focus sessions.` });

  const len = usualFocusLength();
  if (len) notes.push({ id: `focus-len-${len.minutes}`, icon: 'candle', text: `Your usual focus session is about ${len.minutes} minutes.`, basis: `From ${len.count} of your ${len.total} sessions.` });

  for (const [tool, [yes, no]] of Object.entries(about.helped)) {
    if (yes + no >= MIN && yes / (yes + no) >= 0.7) notes.push({ id: `helped-${tool}`, icon: 'heart', text: `${calmerName(tool)} usually helps you.`, basis: `You said it helped ${yes} of ${yes + no} times.` });
  }

  return notes.filter((n) => !about.dismissed.includes(n.id));
}
