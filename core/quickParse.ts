import { addDays, dateKey } from './dates';
import { kindFor, parseDue } from './scanParser';
import type { AssignmentKind, SchoolClass } from './schoolStore';

// Quick capture: one line the way a student would say it —
// "bio quiz friday", "read ch 5 for english tmrw", "chem lab report due 10/14" —
// turned into an assignment. Class is matched by name or a common short
// form; the date by anything parseDue understands; the kind by keywords.

const SHORT: Record<string, string[]> = {
  bio: ['biology'],
  chem: ['chemistry'],
  phys: ['physics'],
  calc: ['calculus'],
  alg: ['algebra'],
  geo: ['geometry'],
  lit: ['literature'],
  eng: ['english'],
  hist: ['history'],
  apush: ['us history', 'u.s. history', 'american history'],
  gov: ['government'],
  econ: ['economics'],
  psych: ['psychology'],
  stats: ['statistics'],
  span: ['spanish'],
  fr: ['french'],
  cs: ['computer science', 'comp sci', 'programming'],
};

export interface QuickItem {
  title: string;
  classId: string | null;
  className: string | null;
  kind: AssignmentKind;
  due: string;
  /** False when no date was found (defaults to tomorrow). */
  dated: boolean;
  /** "30 min", "1 hr", "45m" → the time estimate. */
  minutes: number | null;
  /** "every monday" → weekly. */
  weekly: boolean;
  /** Tests and quizzes are starred so they stand out. */
  starred: boolean;
}

const DATE_WORDS =
  /\b(due\s+)?(every\s+|next\s+)?(today|tonight|tomorrow|tmrw|tmr|mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(rs(day)?)?|fri(day)?|sat(urday)?|sun(day)?|(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}|\d{1,2}\/\d{1,2}(\/\d{2,4})?|in (\d{1,2}|a|one|two|three) (days?|weeks?)|end of (the )?(month|week)|this weekend|next week)\b/gi;
const TIME_WORDS = /\b(\d{1,3})\s*(minutes?|mins?|m|hours?|hrs?|h)\b/i;

/** The class a line mentions, and the word that named it. */
export function findClass(text: string, classes: SchoolClass[]): { cls: SchoolClass; token: string } | null {
  const t = text.toLowerCase();
  const words = t.split(/[^a-z0-9.]+/).filter(Boolean);
  // Full class name, or a distinctive word of it (not "honors"/"ap").
  for (const c of classes) {
    const name = c.name.toLowerCase();
    if (t.includes(name)) return { cls: c, token: name };
  }
  for (const c of classes) {
    const name = c.name.toLowerCase();
    const parts = name.split(/[^a-z0-9.]+/).filter((p) => p.length > 3 && !['honors', 'intro'].includes(p));
    const hit = parts.find((p) => words.includes(p));
    if (hit) return { cls: c, token: hit };
  }
  for (const w of words) {
    const long = SHORT[w.replace(/\./g, '')];
    if (!long) continue;
    const c = classes.find((k) => long.some((l) => k.name.toLowerCase().includes(l)));
    if (c) return { cls: c, token: w };
  }
  return null;
}

export function quickParse(input: string, classes: SchoolClass[], today = dateKey()): QuickItem | null {
  const raw = input.trim();
  if (!raw) return null;
  const tonight = /\btonight\b/i.test(raw);
  const weekly = /\bevery\s+(mon|tue|wed|thu|fri|sat|sun)/i.test(raw);
  const due = tonight ? today : parseDue(raw, today);
  const t = raw.match(TIME_WORDS);
  const minutes = t ? (/^h/i.test(t[2]) ? Number(t[1]) * 60 : Number(t[1])) : null;
  const found = findClass(raw, classes);
  const cls = found?.cls ?? null;

  // The title is what's left after taking out the date words and "for <class>".
  let title = raw.replace(DATE_WORDS, ' ').replace(TIME_WORDS, ' ');
  if (found) {
    // "… for english" / "… in chem": the class is captured, so drop it from the title.
    const token = found.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    title = title.replace(new RegExp(`\\b(for|in)\\s+${token}\\b`, 'i'), ' ');
  }
  title = title
    .replace(/\s+(for|in|by)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!title) title = cls ? `${cls.name} homework` : raw;
  // Capitalize the first letter, keep the rest as typed.
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title,
    classId: cls?.id ?? null,
    className: cls?.name ?? null,
    kind: kindFor(raw),
    due: due ?? addDays(today, 1),
    dated: !!due,
    minutes: minutes && minutes > 0 && minutes <= 600 ? minutes : null,
    weekly,
    starred: kindFor(raw) === 'test',
  };
}
