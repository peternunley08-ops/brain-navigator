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
  /** From a schedule screenshot: when it meets (weekdays assumed). */
  start?: number;
  end?: number;
  room?: string;
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

  // "in 3 days", "in 2 weeks"
  const rel = s.match(/\bin (\d{1,2}|a|one|two|three) (day|days|week|weeks)\b/);
  if (rel) {
    const words: Record<string, number> = { a: 1, one: 1, two: 2, three: 3 };
    const n = words[rel[1]] ?? Number(rel[1]);
    return addDays(today, rel[2].startsWith('week') ? n * 7 : n);
  }
  // "end of month", "end of the week"
  if (/\bend of (the )?month\b/.test(s)) {
    const [y, m] = today.split('-').map(Number);
    return dateKey(new Date(y, m, 0));
  }
  if (/\bend of (the )?week\b|\bthis weekend\b/.test(s)) {
    const [y, m, d] = today.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return addDays(today, (5 - dow + 7) % 7);
  }
  // "next week" means next Monday.
  if (/\bnext week\b/.test(s)) {
    const [y, m, d] = today.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return addDays(today, ((1 - dow + 7) % 7) || 7);
  }

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
    const [ty, tm, td] = today.split('-').map(Number);
    let year = n[3] ? (n[3].length === 2 ? 2000 + Number(n[3]) : Number(n[3])) : ty;
    // Same rule as above: no year and well in the past means next year ("5/14" in September is May).
    if (!n[3] && new Date(year, Number(n[1]) - 1, Number(n[2])).getTime() < new Date(ty, tm - 1, td).getTime() - 60 * 86400000) year += 1;
    return dateKey(new Date(year, Number(n[1]) - 1, Number(n[2])));
  }

  // "Friday" → the next Friday (today if it's Friday).
  const w = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d.slice(0, 3)}(${d.slice(3)})?\\b`).test(s));
  if (w >= 0) {
    const [y, mo, d] = today.split('-').map(Number);
    const now = new Date(y, mo - 1, d);
    const diff = (w - now.getDay() + 7) % 7;
    // "next friday" skips this week's.
    const next = new RegExp(`\\bnext ${WEEKDAYS[w].slice(0, 3)}`).test(s);
    return addDays(today, next ? diff + 7 : diff);
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

const WORK_WORDS = /\b(quiz|test|exam|essay|report|homework|hw|worksheet|chapter|unit|project|reading|problem set|response|draft|review|lab|assignment|packet|notes)\b/i;

/** Short, names a subject, and doesn't sound like a piece of work. */
function looksLikeClass(text: string) {
  return text.length <= 32 && SUBJECTS.test(text) && !WORK_WORDS.test(text);
}

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
      // Classroom also writes "title / class / due": a class-looking line
      // right above the due line is the class when there's a title above it.
      const above = j - 1 >= 0 && !used.has(j - 1) ? lines[j - 1].text : '';
      if (!className && j === i - 1 && looksLikeClass(t) && above && !isNoise(above) && !isDueLine(above) && !looksLikeClass(above) && !TEACHER.test(above)) {
        className = t;
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
    // One pasted line per row, spaced wider than the same-row tolerance.
    .map((t, i) => ({ text: t, y: i / 100, x: 0 }))
    .filter((l) => l.text.trim().length > 0);
}


/**
 * Several screenshots, each parsed on its own, folded into one result.
 * Parsing separately keeps each screenshot's reading order intact (a long
 * To-do list scrolled across three screenshots still reads right), and the
 * same class or assignment showing up twice is only kept once.
 */
export function mergeScans(parts: ScanResult[]): ScanResult {
  const classes = new Map<string, FoundClass>();
  const assignments = new Map<string, FoundAssignment>();
  parts.forEach((part, p) => {
    for (const c of part.classes) {
      const id = c.name.trim().toLowerCase();
      const prev = classes.get(id);
      if (prev) {
        classes.set(id, {
          ...prev,
          teacher: prev.teacher || c.teacher,
          likely: prev.likely || c.likely,
          start: prev.start ?? c.start,
          end: prev.end ?? c.end,
          room: prev.room || c.room,
        });
      } else {
        classes.set(id, { ...c, key: `s${p}-${c.key}` });
      }
    }
    for (const a of part.assignments) {
      const id = `${a.title.trim().toLowerCase()}|${a.due ?? ''}`;
      const prev = assignments.get(id);
      if (prev) {
        assignments.set(id, { ...prev, className: prev.className ?? a.className });
      } else {
        assignments.set(id, { ...a, key: `s${p}-${a.key}` });
      }
    }
  });
  return { classes: [...classes.values()], assignments: [...assignments.values()] };
}

// ---- Grades from a screenshot -----------------------------------------------

export interface FoundGrade {
  key: string;
  title: string;
  score: number;
  outOf: number;
  category: string;
}

const FRACTION = /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/;
const PERCENT = /(\d{1,3}(?:\.\d+)?)\s*%/;

function categoryFor(title: string) {
  const k = kindFor(title);
  if (k === 'test') return /final/i.test(title) ? 'Final' : 'Tests';
  if (k === 'quiz') return 'Quizzes';
  if (/\blab\b/i.test(title)) return 'Labs';
  if (k === 'project' || k === 'essay') return 'Projects';
  return 'Homework';
}

/**
 * Grade lines from a gradebook screenshot (Aeries, Canvas, Classroom
 * grades): "Unit 1 Test 88/100", "Quiz 3  9 / 10", or a title with "92%"
 * next to it. The title is the text on the same line, or the line above.
 */
export function parseGrades(input: ScanLine[]): FoundGrade[] {
  const lines = input
    .map((l) => ({ ...l, text: clean(l.text) }))
    .filter((l) => l.text.length > 0)
    .sort((a, b) => (Math.abs(a.y - b.y) < 0.006 ? a.x - b.x : a.y - b.y));
  // Rows on the same visual line get joined, so "Unit 1 Test" and "88/100"
  // in separate columns read as one.
  const rows: string[] = [];
  let lastY = -1;
  for (const l of lines) {
    if (rows.length && Math.abs(l.y - lastY) < 0.006) rows[rows.length - 1] += ` ${l.text}`;
    else rows.push(l.text);
    lastY = l.y;
  }
  const found: FoundGrade[] = [];
  rows.forEach((row, i) => {
    let score: number | null = null;
    let outOf = 100;
    let rest = row;
    const f = row.match(FRACTION);
    if (f && Number(f[2]) > 0 && Number(f[1]) <= Number(f[2]) * 1.5) {
      score = Number(f[1]);
      outOf = Number(f[2]);
      rest = row.replace(f[0], ' ');
    } else {
      const p = row.match(PERCENT);
      if (p && Number(p[1]) <= 150) {
        score = Number(p[1]);
        rest = row.replace(p[0], ' ');
      }
    }
    if (score == null) return;
    let title = rest
      .replace(/\b(score|points?|pts|grade|mark)\b:?/gi, ' ')
      .replace(/[|•·]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (title.length < 3 || /^[\d\s.%/-]+$/.test(title)) {
      const prev = rows[i - 1];
      title = prev && !FRACTION.test(prev) && !PERCENT.test(prev) ? prev : `Grade ${found.length + 1}`;
    }
    found.push({ key: `g${i}`, title, score, outOf, category: categoryFor(title) });
  });
  return found;
}

// ---- Class times from a schedule screenshot ----------------------------------

const TIME_RANGE = /\b(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:-|–|—|to)\s*(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?/i;

function toMinutes(h: number, m: number, ap: string | undefined) {
  const a = ap?.toLowerCase().replace(/\./g, '');
  let hour = h;
  if (a === 'pm' && hour < 12) hour += 12;
  else if (a === 'am' && hour === 12) hour = 0;
  // No AM/PM: school hours — 1:00 means 1 PM, 8:00 means 8 AM.
  else if (!a && hour < 7) hour += 12;
  return hour * 60 + m;
}

export interface FoundTime {
  name: string;
  start: number;
  end: number;
  room: string;
}

/**
 * Classes with times, from a bell schedule or an Aeries/Infinite Campus
 * schedule screenshot: "Period 1  AP Chemistry  8:00 AM - 8:50 AM  Rm 214".
 * The class name is on the same line, or the line just above.
 */
export function parseSchedule(input: ScanLine[]): FoundTime[] {
  const lines = input
    .map((l) => ({ ...l, text: clean(l.text) }))
    .filter((l) => l.text.length > 0)
    .sort((a, b) => (Math.abs(a.y - b.y) < 0.006 ? a.x - b.x : a.y - b.y));
  const rows: string[] = [];
  let lastY = -1;
  for (const l of lines) {
    if (rows.length && Math.abs(l.y - lastY) < 0.006) rows[rows.length - 1] += ` ${l.text}`;
    else rows.push(l.text);
    lastY = l.y;
  }
  const out: FoundTime[] = [];
  rows.forEach((row, i) => {
    const m = row.match(TIME_RANGE);
    if (!m) return;
    const endAp = m[6];
    const start = toMinutes(Number(m[1]), Number(m[2]), m[3] ?? endAp);
    const end = toMinutes(Number(m[4]), Number(m[5]), endAp ?? m[3]);
    if (end <= start || end - start > 240) return;
    const roomMatch = row.match(/\b(?:room|rm\.?)\s*([a-z0-9-]+)/i);
    let name = row
      .replace(m[0], ' ')
      .replace(/\b(?:room|rm\.?)\s*[a-z0-9-]+/i, ' ')
      .replace(/\b(period|per\.?|p)\s*\d+\b|^\d+(st|nd|rd|th)?\s*(period)?\b/gi, ' ')
      .replace(/[|•·]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (name.length < 3) {
      const prev = rows[i - 1];
      name = prev && !TIME_RANGE.test(prev) ? prev.replace(/\b(period|per\.?)\s*\d+\b/gi, '').trim() : '';
    }
    if (name.length < 3 || /^(lunch|break|passing|nutrition|brunch)$/i.test(name)) return;
    out.push({ name, start, end, room: roomMatch?.[1] ?? '' });
  });
  return out;
}

/**
 * Fold class times from parseSchedule into a scan result: a class already
 * found gets its times; a new one is added. Class names that swallowed the
 * time text ("AP Chemistry 8:00 AM - 8:50 AM") are replaced by the clean one.
 */
export function attachTimes(r: ScanResult, times: FoundTime[], prefix = 't'): ScanResult {
  let classes = r.classes.filter((c) => !TIME_RANGE.test(c.name));
  times.forEach((t, i) => {
    const hit = classes.find((c) => c.name.toLowerCase() === t.name.toLowerCase() || t.name.toLowerCase().includes(c.name.toLowerCase()));
    if (hit) {
      classes = classes.map((c) => (c === hit ? { ...c, start: t.start, end: t.end, room: t.room || c.room, likely: true } : c));
    } else {
      classes.push({ key: `${prefix}${i}`, name: t.name, teacher: '', likely: true, start: t.start, end: t.end, room: t.room });
    }
  });
  return { ...r, classes };
}
