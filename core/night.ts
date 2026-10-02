import { addDays, dateKey, isoDay } from './dates';
import type { Assignment, SchoolClass } from './schoolStore';

// The night side of the day, as plain functions (no React): when night
// starts, how far into it we are, when to be asleep, and what tomorrow
// holds. The Desk, the room's backdrop, and Put the day down all read the
// clock through nightNow(), so a developer can set it (see setNightClock).

/** Minutes to fall asleep once the lights are out. */
export const FALL_ASLEEP = 15;
/** Night runs from the wind-down until 4:30 AM. */
export const NIGHT_END = 4 * 60 + 30;

export function wrap(m: number) {
  return ((m % 1440) + 1440) % 1440;
}

// ---- The clock -----------------------------------------------------------

let override: number | null = null;
let version = 0;
const listeners = new Set<() => void>();

/** Developer only: pretend it is this many minutes after midnight today (null = the real time). */
export function setNightClock(minutes: number | null) {
  const next = minutes == null ? null : wrap(Math.round(minutes));
  if (next === override) return;
  override = next;
  version += 1;
  listeners.forEach((l) => l());
}

/** Now, or today at the developer's pretend time. */
export function nightNow(): Date {
  if (override == null) return new Date();
  const d = new Date();
  d.setHours(Math.floor(override / 60), override % 60, 0, 0);
  return d;
}

/** For useSyncExternalStore: lets a screen redraw when the pretend time changes. */
export function subscribeNightClock(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function nightClockVersion() {
  return version;
}

/** "23:30" is that time, "off" is the real clock, anything else is ignored (undefined). */
export function parseNightParam(value: string | string[] | undefined): number | null | undefined {
  const s = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  if (!s) return undefined;
  if (s === 'off') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : undefined;
}

/** Minutes after midnight. */
export function minutesOf(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

/** The night a moment belongs to: rolls over at 5 AM, so 1 AM still counts as last night. */
export function tonightKey(d: Date = nightNow()) {
  return d.getHours() < 5 ? addDays(dateKey(d), -1) : dateKey(d);
}

// ---- Night and sleep -----------------------------------------------------

/** When to be asleep: wake time, minus the hours wanted, minus falling asleep. */
export function lightsOutMinutes(wake: number, sleepGoalHours: number) {
  return wrap(Math.round(wake - sleepGoalHours * 60 - FALL_ASLEEP));
}

/** The wind-down time (minutes after midnight), an hour later for a night owl. */
export function nightStart(windDown: number, nightOwl: boolean) {
  return wrap(windDown + (nightOwl ? 60 : 0));
}

/** True from `start` until 4:30 AM, across midnight. */
export function isNight(now: number, start: number) {
  return start >= NIGHT_END ? now >= start || now < NIGHT_END : now >= start && now < NIGHT_END;
}

/** Hours since night began (0 in the daytime). */
export function hoursIntoNight(now: number, start: number) {
  return isNight(now, start) ? wrap(now - start) / 60 : 0;
}

/** Minutes until night starts (0 once it has). */
export function minutesToNight(now: number, start: number) {
  return isNight(now, start) ? 0 : wrap(start - now);
}

/** The hour before night starts. */
export function beforeNight(now: number, start: number) {
  const m = minutesToNight(now, start);
  return m > 0 && m <= 60;
}

/** Lights-out time has come and gone tonight. */
export function pastLightsOut(now: number, lightsOut: number) {
  return wrap(now - lightsOut) < 6 * 60;
}

// ---- Tomorrow ------------------------------------------------------------

/** The next morning's date: tomorrow, or today once it's past midnight. */
export function morningKey(d: Date = nightNow()) {
  return addDays(tonightKey(d), 1);
}

/** The earliest class on that date's weekday, if any. */
export function firstClassOn(classes: SchoolClass[], key: string): SchoolClass | null {
  const [y, m, d] = key.split('-').map(Number);
  const day = isoDay(new Date(y, m - 1, d));
  return classes.filter((c) => c.kind === 'class' && c.days.includes(day)).sort((a, b) => a.start - b.start)[0] ?? null;
}

/** What is still open and due on that date, starred first. */
export function dueOn(assignments: Assignment[], key: string) {
  return assignments.filter((a) => !a.done && a.due === key).sort((a, b) => Number(!!b.starred) - Number(!!a.starred));
}
