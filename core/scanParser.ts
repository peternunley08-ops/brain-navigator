// Turns the text read off a screenshot (Google Classroom, Canvas, or a
// pasted list) into things the planner understands: classes, and work with
// due dates. It's heuristics, not magic — the scan screen always shows the
// results for the student to check before anything is saved.

import { addDays, dateKey } from './dates';
import type { AssignmentKind, SchoolClass } from './schoolStore';

export interface ScanLine {
  text: string;
  /** Top of the line, 0–1 from the top of the image (0 for pasted text). */
  y: number;
  x: number;
}

export interface FoundAssignment {
  key: string;
  title: string;
  due: string | null;
  kind: AssignmentKind;
  /** A class name seen next to it, if any. */
  className: string | null;
}

export interface FoundClass {
  key: string;
  name: string;
  teacher: string;
  /** How sure we are it's really a class (pre-checks the box). */
  likely: boolean;
}

export interface ScanResult {
  assignments: FoundAssignment[];
  classes: FoundClass[];
}

// Words that show up on Classroom/Canvas screens but aren't content.
const NOISE = new Set(
  [
    'google classroom', 'classroom', 'to-do', 'to do', 'todo', 'assigned', 'missing', 'done', 'turned in', 'returned',
    'stream', 'classwork', 'people', 'grades', 'calendar', 'home', 'settings', 'all classes', 'no due date', 'view all',
    'view work', 'see all', 'this week', 'next week', 'later', 'earlier', 'no work due soon', 'upcoming', 'dashboard',
    'courses', 'inbox', 'history', 'help', 'account', 'recent activity', 'coming up', 'canvas', 'today', 'tomorrow',
    'enrolled', 'teaching', 'archived classes', 'new', 'open', 'join class', 'create class',
  ].map((s) => s.toLowerCase())
);

const SUBJECTS =
  /\b(ap|honors|english|lit(erature)?|writing|composition|math|algebra|geometry|calc(ulus)?|pre-?calc|statistics|stats|trig|biology|bio|chem(istry)?|physics|science|earth|environmental|anatomy|history|world|u\.?s\.?|government|gov|civics|econ(omics)?|psych(ology)?|sociology|spanish|french|chinese|mandarin|german|latin|japanese|asl|art|ceramics|photo(graphy)?|music|band|choir|orchestra|theat(er|re)|drama|pe|p\.e\.|health|computer|comp sci|cs|programming|coding|robotics|engineering|business|marketing|journalism|yearbook|study hall|advisory|homeroom|seminar)\b/i;

const TEACHER = /^(mr|ms|mrs|mx|dr|miss|prof(essor)?|profe|coach|sra|sr|srta|señora|señor|mme|mlle|m|herr|frau)\.?\s+[a-z]/i;

// "Period 3", "2nd Period", "Block B", "Section 4" — a class card's
// subtitle, not a class.
const SECTION = /^(period|pd|per|block|section|sec|hour|hr)\.?\s*[\w-]{1,3}$|^\d+(st|nd|rd|th)\s+(period|block|hour)$/i;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** A due date in any of the ways Classroom and Canvas write them. */
export function parseDue(raw: string, today = dateKey()): string | null {
  const s = raw.toLowerCase().replace(/[,.]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\btoday\b/.test(s)) return today;
  if (/\btomorrow\b|\btmrw\b/.test(s)) return addDays(today, 1);
  if (/\byesterday\b/.test(s)) return addDays(today, -1);

  // "Oct 12", "October 12", "Oct 12 2026"
  const m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:\s+(\d{4}))?/);
  if (m) {
    const month = MONTHS.indexOf(m[1].slice(0, 3));
    const day = Number(m[2]);
    const [ty, tm, td] = today.split('-').map(Number);
    let year = m[3] ? Number(m[3]) : ty;
    const candidate = new Date(year, month, day);
    // No year given and it's well in the past: it means next year.
    if (!m[3] && candidate.getTime() < new Date(ty, tm - 1, td).getTime() - 60 * 86400000) year += 1;
    return dateKey(new Date(year, month, day));
  }

  // "10/12" or "10/12/2026"
  const n = s.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (n) {
    const [ty] = today.split('-').map(Number);
    const year = n[3] ? (n[3].length === 2 ? 2000 + Number(n[3]) : Number(n[3])) : ty;
    return dateKey(new Date(year, Number(n[1]) - 1, Number(n[2])));
  }

  // "Friday" → the next Friday (today if it's Friday).
  const w = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d.slice(0, 3)}(${d.slice(3)})?\\b`).test(s));
  if (w >= 0) {
    const [y, mo, d] = today.split('-').map(Number);
    const now = new Date(y, mo - 1, d);
    const diff = (w - now.getDay() + 7) % 7;
    return addDays(today, diff);
  }
  return null;
}

export function kindFor(title: string): AssignmentKind {
  const t = title.toLowerCase();
  if (/\b(test|exam|midterm|final)\b/.test(t)) return 'test';
  if (/\bquiz\b/.test(t)) return 'quiz';
  if (/\b(essay|paper|draft|write-?up)\b/.test(t)) return 'essay';
  if (/\bproject|presentation|lab report\b/.test(t)) return 'project';
  if (/\b(read|reading|chapter \d+ notes)\b/.test(t)) return 'reading';
  return 'homework';
}

function clean(text: string) {
  return text.replace(/\s+/g, ' ').replace(/^[•·\-–—*]+\s*/, '').trim();
}

function isNoise(text: string) {
  const t = text.toLowerCase().trim();
  if (t.length < 3) return true;
  if (NOISE.has(t)) return true;
  if (/^\d+\s*(points?|pts|comments?|class comments?)$/i.test(t)) return true;
  if (/^(posted|edited|assigned|updated)\b/i.test(t)) return true;
  if (/^\d{1,2}:\d{2}\s*(am|pm)?$/i.test(t)) return true;
  if (/^[\d\s/.:-]+$/.test(t)) return true;
  return false;
}

const isDueLine = (t: string) => /^(due|due date|due:)\b/i.test(t) || /\bdue (today|tomorrow|mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)/i.test(t);

/** Matches a line to a known class name, forgivingly. */
function matchClass(text: string, known: string[]) {
  const t = text.toLowerCase();
  return known.find((k) => {
    const kk = k.toLowerCase();
    return t === kk || t.includes(kk) || (kk.length > 5 && kk.includes(t) && t.length > 4);
  });
}

export function parseScan(input: ScanLine[], knownClasses: SchoolClass[], today = dateKey()): ScanResult {
  // Reading order: top to bottom, then left to right on the same row.
  const lines = input
    .map((l) => ({ ...l, text: clean(l.text) }))
    .filter((l) => l.text.length > 0)
    .sort((a, b) => (Math.abs(a.y - b.y) < 0.006 ? a.x - b.x : a.y - b.y));

  const knownNames = knownClasses.map((c) => c.name);
  const used = new Set<number>();
  const assignments: FoundAssignment[] = [];

  // Work items: every "Due …" line, with the title just above it and a
  // class name nearby.
  lines.forEach((l, i) => {
    if (!isDueLine(l.text)) return;
    const due = parseDue(l.text, today);
    // Canvas puts the due date on the same line: "Essay draft Due Oct 12".
    const inline = l.text.match(/^(.+?)\s+due\b/i);
    let title = inline && !/^due$/i.test(inline[1]) ? inline[1] : '';
    let className: string | null = null;
    used.add(i);
    for (let j = i - 1; j >= Math.max(0, i - 3) && !title; j--) {
      if (used.has(j)) continue;
      const t = lines[j].text;
      if (isNoise(t) || isDueLine(t) || TEACHER.test(t)) continue;
      const cls = matchClass(t, knownNames);
      if (cls && !className) {
        className = cls;
        used.add(j);
        continue;
      }
      title = t;
      used.add(j);
    }
    if (!title) return;
    // The class is often the line just above the title, or just below the due line.
    // (Canvas writes the title and due date on one line and the class
    // under it; Classroom puts the class above the title.)
    for (const j of [i - 2, i - 3, i + 1]) {
      if (className || j < 0 || j >= lines.length || used.has(j)) continue;
      const cls = matchClass(lines[j].text, knownNames);
      if (cls) {
        className = cls;
        used.add(j);
      } else if ((j < i || inline) && SUBJECTS.test(lines[j].text) && lines[j].text.length <= 40 && !isNoise(lines[j].text) && !isDueLine(lines[j].text)) {
        className = lines[j].text;
        used.add(j);
      }
    }
    assignments.push({ key: `a${i}`, title, due, kind: kindFor(title), className });
  });

  // Classes: the leftovers that look like class names — especially ones
  // followed by a teacher's name, the way Classroom's class cards read.
  const classes: FoundClass[] = [];
  const seen = new Set(knownNames.map((n) => n.toLowerCase()));
  lines.forEach((l, i) => {
    if (used.has(i)) return;
    const t = l.text;
    if (isNoise(t) || isDueLine(t) || TEACHER.test(t) || SECTION.test(t) || t.length > 48 || !/[a-z]/i.test(t)) return;
    if (seen.has(t.toLowerCase())) return;
    // The teacher's name sits under the class, sometimes after a section line.
    const after = lines.slice(i + 1, i + 4);
    const stop = after.findIndex((x) => !TEACHER.test(x.text) && !SECTION.test(x.text));
    const nextTeacher = (stop === -1 ? after : after.slice(0, stop)).find((x) => TEACHER.test(x.text));
    const subject = SUBJECTS.test(t);
    if (!nextTeacher && !subject) return;
    seen.add(t.toLowerCase());
    classes.push({ key: `c${i}`, name: t, teacher: nextTeacher?.text ?? '', likely: !!nextTeacher || subject });
  });

  // Class names mentioned next to work also count as classes to add.
  for (const a of assignments) {
    if (a.className && !seen.has(a.className.toLowerCase())) {
      seen.add(a.className.toLowerCase());
      classes.push({ key: `n${a.key}`, name: a.className, teacher: '', likely: true });
    }
  }

  return { assignments, classes };
}

/** Pasted text (e.g. copied with Live Text) → lines in order. */
export function linesFromText(text: string): ScanLine[] {
  return text
    .split(/\n+/)
    .map((t, i) => ({ text: t, y: i / 1000, x: 0 }))
    .filter((l) => l.text.trim().length > 0);
}

