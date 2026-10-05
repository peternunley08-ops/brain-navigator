import type { IconName } from '../components/ui/Icon';
import { CALMERS } from './about';
import { useLifeStore } from './lifeStore';
import { useSchoolStore } from './schoolStore';
import { useWellnessStore } from './wellnessStore';

// What the app notices from how a student uses it, worked out on the phone.
// Each note says what it's based on, needs at least five examples, and can
// be dismissed ("Not right") or turned off entirely in About you. Off means
// off everywhere: every function here returns nothing while learnOff is set,
// so Focus, the wins radar and Ember stop using it too.

export interface LearnedNote {
  id: string;
  icon: IconName;
  text: string;
  /** What it's based on, in plain words. */
  basis: string;
}

const MIN = 5;

const learning = () => !useLifeStore.getState().about.learnOff;

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
  if (!learning()) return null;
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
  if (!learning()) return null;
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

/** The hour most check-ins happen, from when they were saved. */
export function usualCheckinHour() {
  if (!learning()) return null;
  const list = useWellnessStore.getState().checkins;
  if (list.length < MIN) return null;
  const counts = new Array(24).fill(0);
  for (const c of list) counts[new Date(c.created_at).getHours()] += 1;
  const hour = counts.indexOf(Math.max(...counts));
  return counts[hour] >= 3 ? { hour, count: counts[hour], total: list.length } : null;
}

/** Mood on nights near the sleep goal vs. short nights, from their own check-ins. */
export function sleepAndMood() {
  if (!learning()) return null;
  const goal = useSchoolStore.getState().profile.sleepGoal;
  const both = useWellnessStore.getState().checkins.filter((c) => c.mood != null && c.sleep_hours != null);
  const rested = both.filter((c) => (c.sleep_hours ?? 0) >= goal - 0.5);
  const short = both.filter((c) => (c.sleep_hours ?? 0) < goal - 0.5);
  if (both.length < MIN || rested.length < 2 || short.length < 2) return null;
  const avg = (xs: typeof both) => xs.reduce((n, c) => n + (c.mood ?? 0), 0) / xs.length;
  const diff = avg(rested) - avg(short);
  return Math.abs(diff) >= 0.5 ? { goal, rested: avg(rested), short: avg(short), total: both.length } : null;
}

/**
 * The calming tool to offer first on a hard day: the one they've said
 * helped most (twice or more, mostly yes), else their first pick in
 * About you. Null when there's nothing to go on.
 */
export function bestCalmer() {
  const about = useLifeStore.getState().about;
  let best: { id: string; yes: number } | null = null;
  if (!about.learnOff) {
    for (const [id, [yes, no]] of Object.entries(about.helped)) {
      if (yes >= 2 && yes / (yes + no) >= 0.6 && (!best || yes > best.yes)) best = { id, yes };
    }
  }
  const id = best?.id ?? about.calmers[0];
  const tool = CALMERS.find((c) => c.id === id);
  if (!tool) return null;
  return { ...tool, why: best ? `It helped you ${best.yes} times.` : 'You said it calms you.' };
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

  const sm = sleepAndMood();
  if (sm)
    notes.push({
      id: `sleep-mood-${sm.rested > sm.short ? 'up' : 'down'}`,
      icon: 'bed',
      text:
        sm.rested > sm.short
          ? `Your mood runs higher after nights near ${sm.goal} hours of sleep (${sm.rested.toFixed(1)} vs ${sm.short.toFixed(1)} out of 5).`
          : `Oddly, short nights haven't dragged your mood down so far (${sm.short.toFixed(1)} vs ${sm.rested.toFixed(1)} out of 5).`,
      basis: `From ${sm.total} check-ins with sleep.`,
    });

  const ch = usualCheckinHour();
  if (ch) notes.push({ id: `checkin-hour-${ch.hour}`, icon: 'sun', text: `You usually check in around ${hourLabel(ch.hour)}, so Ember waits until then to ask.`, basis: `From ${ch.count} of your ${ch.total} check-ins.` });

  return notes.filter((n) => !about.dismissed.includes(n.id));
}
