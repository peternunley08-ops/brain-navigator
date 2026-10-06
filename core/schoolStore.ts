import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { saveAside } from './saveAside';
import { isShowing } from './showMode';
import { addSpark } from './sparks';

// School life: classes, what's due, focus sessions, and a small profile.
// Kept on the phone (a JSON file in the app's documents folder) rather
// than in Supabase — it works with no setup, and a student's schedule and
// homework never leave their device. Everything here is plain data; the
// screens and Ember derive the rest ("what's next", "tonight's load").

export type AssignmentKind = 'homework' | 'test' | 'quiz' | 'project' | 'essay' | 'reading';

export interface SchoolClass {
  id: string;
  name: string;
  teacher: string;
  room: string;
  color: string;
  kind: 'class' | 'activity';
  /** 1 = Monday … 7 = Sunday. */
  days: number[];
  /** Minutes after midnight. */
  start: number;
  end: number;
  /** For weighted GPA: Honors and AP count a point higher. */
  level?: ClassLevel;
  credits?: number;
  /** Grade category → percent of the grade, e.g. { Tests: 50, Homework: 30 }. Empty = points-based. */
  weights?: Record<string, number>;
  /** The grade the student is aiming for, in percent. */
  goal?: number;
}

export type ClassLevel = 'regular' | 'honors' | 'ap';

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
  /** Optional day to do this step (from "plan it backward"). */
  on?: string;
}

export interface Grade {
  id: string;
  classId: string;
  title: string;
  category: string;
  score: number;
  outOf: number;
  /** YYYY-MM-DD */
  date: string;
}

export interface Assignment {
  id: string;
  title: string;
  classId: string | null;
  kind: AssignmentKind;
  /** YYYY-MM-DD, local. */
  due: string;
  /** Rough minutes it'll take. */
  minutes: number | null;
  notes: string;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
  /** Where it came from, e.g. "canvas:1234" — lets a re-sync update instead of duplicating. */
  sourceId?: string;
  starred?: boolean;
  subtasks?: Subtask[];
  /** Weekly: finishing it makes next week's copy. */
  repeat?: 'weekly' | null;
  /** Done is "I finished it"; this is "the teacher has it". */
  turnedIn?: boolean;
  /** Swiped off the Desk's lit card until this time (ms). Due date unchanged. */
  snoozedUntil?: number;
}

export interface FocusSession {
  id: string;
  assignmentId: string | null;
  minutes: number;
  /** ISO timestamp when it ended. */
  at: string;
  rating?: 'great' | 'ok' | 'rough';
}

export interface Profile {
  name: string;
  grade: number | null;
  /** Hours; teens need 8–10. */
  sleepGoal: number;
  /** Minutes of homework that fit in a school night. */
  nightlyCap: number;
  onboarded: boolean;
}

export interface SchoolData {
  classes: SchoolClass[];
  assignments: Assignment[];
  focus: FocusSession[];
  profile: Profile;
  /** Stress sources picked on a check-in, by YYYY-MM-DD. */
  stressTags: Record<string, string[]>;
  grades: Grade[];
}

interface SchoolStore extends SchoolData {
  loaded: boolean;
  load: () => Promise<void>;
  /** Undo: put a part of the data back exactly as it was. */
  putBack: (patch: Partial<SchoolData>) => void;
  /** Replace everything with a backup's school section. */
  restore: (d: Partial<SchoolData>) => void;

  saveClass: (c: Omit<SchoolClass, 'id'> & { id?: string }) => void;
  deleteClass: (id: string) => void;

  addAssignment: (a: Omit<Assignment, 'id' | 'done' | 'doneAt' | 'createdAt'>) => Assignment;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  toggleAssignment: (id: string) => void;
  deleteAssignment: (id: string) => void;
  /** Puts back an assignment exactly as it was (undo). */
  restoreAssignment: (a: Assignment) => void;
  duplicateAssignment: (id: string) => Assignment | null;

  addGrade: (g: Omit<Grade, 'id'>) => void;
  deleteGrade: (id: string) => void;
  rateFocus: (id: string, rating: FocusSession['rating']) => void;

  logFocus: (minutes: number, assignmentId: string | null) => FocusSession;
  setProfile: (patch: Partial<Profile>) => void;
  setStressTags: (date: string, tags: string[]) => void;
}

export const CLASS_COLORS = ['#F0845A', '#F5B45C', '#9FD08A', '#8CC0A8', '#8FB4E8', '#AFA2DE', '#E89AB8', '#D99A6C'];

export const KIND_LABEL: Record<AssignmentKind, string> = {
  homework: 'Homework',
  test: 'Test',
  quiz: 'Quiz',
  project: 'Project',
  essay: 'Essay',
  reading: 'Reading',
};

export const STRESS_SOURCES = ['Tests', 'Homework', 'Friends', 'Family', 'Sports', 'Job', 'College', 'Sleep', 'Money', 'Social media'];

const DEFAULT_PROFILE: Profile = { name: '', grade: null, sleepGoal: 9, nightlyCap: 120, onboarded: false };
export const EMPTY_SCHOOL: SchoolData = { classes: [], assignments: [], focus: [], profile: DEFAULT_PROFILE, stressTags: {}, grades: [] };

const FILE = 'school.json';

function file() {
  return new File(Paths.document, FILE);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist(data: SchoolData) {
  // Nothing saves while showing someone the app (sample data in memory).
  if (isShowing()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const f = file();
      if (!f.exists) f.create();
      f.write(JSON.stringify(data));
    } catch {
      // A failed save is retried on the next change.
    }
  }, 250);
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const useSchoolStore = create<SchoolStore>((set, get) => {
  const commit = (patch: Partial<SchoolData>) => {
    set(patch);
    // Never save before the file has been read: a store that isn't loaded yet
    // (first moments of launch, or re-created by a dev hot reload) is empty,
    // and saving it would overwrite everything on disk.
    if (!get().loaded) return;
    const { classes, assignments, focus, profile, stressTags, grades } = get();
    persist({ classes, assignments, focus, profile, stressTags, grades });
  };

  return {
    ...EMPTY_SCHOOL,
    loaded: false,

    putBack: (patch) => commit(patch),
    load: async () => {
      if (get().loaded) return;
      let raw = '';
      try {
        const f = file();
        if (f.exists) {
          raw = await f.text();
          const d = JSON.parse(raw) as Partial<SchoolData>;
          set({
            classes: d.classes ?? [],
            assignments: d.assignments ?? [],
            focus: d.focus ?? [],
            profile: { ...DEFAULT_PROFILE, ...(d.profile ?? {}) },
            stressTags: d.stressTags ?? {},
            grades: d.grades ?? [],
          });
        }
      } catch {
        // Start fresh rather than crash on a bad file, but keep the file.
        if (raw) saveAside('school.json', raw);
      }
      set({ loaded: true });
    },

    restore: (d) =>
      commit({
        classes: d.classes ?? [],
        assignments: d.assignments ?? [],
        focus: d.focus ?? [],
        profile: { ...DEFAULT_PROFILE, ...(d.profile ?? {}), onboarded: true },
        stressTags: d.stressTags ?? {},
        grades: d.grades ?? [],
      }),

    saveClass: (c) => {
      const classes = get().classes;
      if (c.id && classes.some((x) => x.id === c.id)) {
        commit({ classes: classes.map((x) => (x.id === c.id ? ({ ...x, ...c } as SchoolClass) : x)) });
      } else {
        commit({ classes: [...classes, { ...c, id: uid() } as SchoolClass] });
      }
    },

    deleteClass: (id) => {
      commit({
        classes: get().classes.filter((c) => c.id !== id),
        assignments: get().assignments.map((a) => (a.classId === id ? { ...a, classId: null } : a)),
      });
    },

    addAssignment: (a) => {
      const item: Assignment = { ...a, id: uid(), done: false, doneAt: null, createdAt: new Date().toISOString() };
      commit({ assignments: [...get().assignments, item] });
      return item;
    },

    updateAssignment: (id, patch) => {
      commit({ assignments: get().assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
    },

    toggleAssignment: (id) => {
      const list = get().assignments;
      const target = list.find((a) => a.id === id);
      // Finishing something sends a spark to the Desk's candles.
      if (target && !target.done) addSpark();
      let next = list.map((a) =>
        a.id === id ? { ...a, done: !a.done, doneAt: a.done ? null : new Date().toISOString() } : a
      );
      // Finishing a weekly one sets up next week's, once.
      if (target && !target.done && target.repeat === 'weekly') {
        const due = addDays(target.due, 7);
        const exists = list.some((a) => a.title === target.title && a.classId === target.classId && a.due === due);
        if (!exists) {
          next = [
            ...next,
            {
              ...target,
              id: uid(),
              due,
              done: false,
              doneAt: null,
              createdAt: new Date().toISOString(),
              sourceId: undefined,
              subtasks: target.subtasks?.map((t) => ({ ...t, id: uid(), done: false, on: undefined })),
            },
          ];
        }
      }
      commit({ assignments: next });
    },

    deleteAssignment: (id) => {
      commit({ assignments: get().assignments.filter((a) => a.id !== id) });
    },

    restoreAssignment: (a) => {
      if (get().assignments.some((x) => x.id === a.id)) return;
      commit({ assignments: [...get().assignments, a] });
    },

    duplicateAssignment: (id) => {
      const src = get().assignments.find((a) => a.id === id);
      if (!src) return null;
      const copy: Assignment = {
        ...src,
        id: uid(),
        title: `${src.title} (copy)`,
        done: false,
        doneAt: null,
        createdAt: new Date().toISOString(),
        sourceId: undefined,
        subtasks: src.subtasks?.map((t) => ({ ...t, id: uid(), done: false })),
      };
      commit({ assignments: [...get().assignments, copy] });
      return copy;
    },

    addGrade: (g) => commit({ grades: [...get().grades, { ...g, id: uid() }] }),
    deleteGrade: (id) => commit({ grades: get().grades.filter((g) => g.id !== id) }),
    rateFocus: (id, rating) => commit({ focus: get().focus.map((f) => (f.id === id ? { ...f, rating } : f)) }),

    logFocus: (minutes, assignmentId) => {
      const session: FocusSession = { id: uid(), assignmentId, minutes, at: new Date().toISOString() };
      commit({ focus: [...get().focus, session] });
      return session;
    },

    setProfile: (patch) => commit({ profile: { ...get().profile, ...patch } }),

    setStressTags: (date, tags) => commit({ stressTags: { ...get().stressTags, [date]: tags } }),
  };
});

// Date helpers live in ./dates (no native imports, so they can be tested
// on their own); re-exported here for convenience.
export { addDays, clock, dateKey, daysUntil, dueLabel, dueWords, isoDay } from './dates';
import { addDays, dateKey, isoDay } from './dates';

// ---- Derived ------------------------------------------------------------------

export type NowState =
  | { kind: 'in'; cls: SchoolClass; minsLeft: number; next: SchoolClass | null }
  | { kind: 'next'; cls: SchoolClass; minsUntil: number }
  | { kind: 'done' }
  | { kind: 'free' }
  | { kind: 'unscheduled' }
  | { kind: 'none' };

// Where you are in the school day right now.
export function nowState(classes: SchoolClass[], d = new Date()): NowState {
  if (classes.length === 0) return { kind: 'none' };
  // Classes from a screenshot have no days or times until they're added.
  if (classes.every((c) => c.days.length === 0)) return { kind: 'unscheduled' };
  const day = isoDay(d);
  const mins = d.getHours() * 60 + d.getMinutes();
  const today = classes.filter((c) => c.days.includes(day)).sort((a, b) => a.start - b.start);
  if (today.length === 0) return { kind: 'free' };
  const current = today.find((c) => c.start <= mins && mins < c.end);
  if (current) {
    const next = today.find((c) => c.start >= current.end) ?? null;
    return { kind: 'in', cls: current, minsLeft: current.end - mins, next };
  }
  const upcoming = today.find((c) => c.start > mins);
  if (upcoming) return { kind: 'next', cls: upcoming, minsUntil: upcoming.start - mins };
  return { kind: 'done' };
}

/** Open work due today or tomorrow, and the minutes it adds up to. */
export function tonightsLoad(assignments: Assignment[], today = dateKey()) {
  const tomorrow = addDays(today, 1);
  const items = assignments.filter((a) => !a.done && (a.due === today || a.due === tomorrow));
  const minutes = items.reduce((sum, a) => sum + (a.minutes ?? 30), 0);
  return { items, minutes };
}

export function focusMinutesOn(focus: FocusSession[], key = dateKey()) {
  return focus.filter((f) => dateKey(new Date(f.at)) === key).reduce((s, f) => s + f.minutes, 0);
}

/** Every focus minute spent on one assignment. */
export function minutesOn(focus: FocusSession[], assignmentId: string) {
  return focus.filter((f) => f.assignmentId === assignmentId).reduce((s, f) => s + f.minutes, 0);
}

/** Minutes of open work due on each of the next `days` days (overdue folds into today). */
export function workloadByDay(assignments: Assignment[], days = 14, today = dateKey()) {
  return Array.from({ length: days }, (_, i) => {
    const key = addDays(today, i);
    const items = assignments.filter((a) => !a.done && (a.due === key || (i === 0 && a.due < today)));
    return { key, minutes: items.reduce((s, a) => s + (a.minutes ?? 30), 0), count: items.length };
  });
}

/** Spreads study steps across the days before something's due. */
export function planBackward(a: Assignment, today = dateKey()): Subtask[] {
  const span = spanTo(a.due, today);
  const steps: string[] =
    a.kind === 'test' || a.kind === 'quiz'
      ? ['Gather notes and the study guide', 'Make flashcards for what you keep forgetting', 'Practice test, no notes', 'Redo what you missed', 'Quick review and early night']
      : a.kind === 'essay'
        ? ['Read the prompt and brainstorm', 'Outline your argument', 'Write the messy first draft', 'Revise for ideas', 'Proofread out loud']
        : a.kind === 'reading'
          ? ['Skim headings and questions', 'Read the first half', 'Read the second half', 'Write a 3-line summary']
          : ['Figure out exactly what’s being asked', 'Gather what you need', 'Do the biggest part', 'Finish and check it', 'Turn it in'];
  const n = Math.min(steps.length, span);
  const chosen = n === steps.length ? steps : [...steps.slice(0, n - 1), steps[steps.length - 1]];
  return spreadSteps(chosen, a.due, today);
}

/** Days between today and a due date, at least 1. */
function spanTo(due: string, today: string): number {
  const [y, m, d] = due.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return Math.max(1, Math.round((new Date(y, m - 1, d).getTime() - new Date(ty, tm - 1, td).getTime()) / 86400000));
}

/** Gives each step a day: evenly from today, the last one the day before it's due. Steps can share a day. */
export function spreadSteps(texts: string[], due: string, today = dateKey()): Subtask[] {
  const span = spanTo(due, today);
  return texts.map((text, i) => {
    const offset = i === texts.length - 1 ? span - 1 : Math.floor((i * span) / texts.length);
    return { id: uid(), text, done: false, on: addDays(today, offset) };
  });
}

// ---- Grades -------------------------------------------------------------------

export const GRADE_CATEGORIES = ['Tests', 'Quizzes', 'Homework', 'Projects', 'Labs', 'Participation', 'Final'];

/** Percent 0–100 for a class, or null with no grades. Uses category weights when set. */
export function classAverage(grades: Grade[], cls: Pick<SchoolClass, 'id' | 'weights'>): number | null {
  const mine = grades.filter((g) => g.classId === cls.id && g.outOf > 0);
  if (!mine.length) return null;
  const weights = Object.entries(cls.weights ?? {}).filter(([, w]) => w > 0);
  if (weights.length) {
    let total = 0;
    let used = 0;
    for (const [cat, w] of weights) {
      const inCat = mine.filter((g) => g.category === cat);
      if (!inCat.length) continue;
      const pts = inCat.reduce((s, g) => s + g.score, 0);
      const out = inCat.reduce((s, g) => s + g.outOf, 0);
      total += (pts / out) * w;
      used += w;
    }
    // Grades in categories without a weight still count if nothing else does.
    if (used > 0) return (total / used) * 100;
  }
  const pts = mine.reduce((s, g) => s + g.score, 0);
  const out = mine.reduce((s, g) => s + g.outOf, 0);
  return (pts / out) * 100;
}

export function letterFor(pct: number) {
  const bands: [number, string][] = [
    [97, 'A+'], [93, 'A'], [90, 'A-'], [87, 'B+'], [83, 'B'], [80, 'B-'],
    [77, 'C+'], [73, 'C'], [70, 'C-'], [67, 'D+'], [63, 'D'], [60, 'D-'],
  ];
  return bands.find(([min]) => pct >= min)?.[1] ?? 'F';
}

const POINTS: Record<string, number> = {
  'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0,
};

/** Unweighted and weighted (Honors/AP +1 for a C or better) GPA over classes with grades. */
export function gpa(classes: SchoolClass[], grades: Grade[]) {
  let credits = 0;
  let unweighted = 0;
  let weighted = 0;
  for (const c of classes) {
    if (c.kind !== 'class') continue;
    const avg = classAverage(grades, c);
    if (avg == null) continue;
    const pts = POINTS[letterFor(avg)];
    const cr = c.credits ?? 1;
    credits += cr;
    unweighted += pts * cr;
    weighted += (pts + (c.level && c.level !== 'regular' && pts >= 2 ? 1 : 0)) * cr;
  }
  if (!credits) return null;
  return { unweighted: unweighted / credits, weighted: weighted / credits, classes: credits };
}

/** Score needed on a final worth `weight` (0–1) to end at `target` percent. */
export function finalNeeded(current: number, target: number, weight: number) {
  if (weight <= 0 || weight >= 1) return null;
  return (target - current * (1 - weight)) / weight;
}
