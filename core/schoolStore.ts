import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';

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
}

export interface FocusSession {
  id: string;
  assignmentId: string | null;
  minutes: number;
  /** ISO timestamp when it ended. */
  at: string;
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

interface SchoolData {
  classes: SchoolClass[];
  assignments: Assignment[];
  focus: FocusSession[];
  profile: Profile;
  /** Stress sources picked on a check-in, by YYYY-MM-DD. */
  stressTags: Record<string, string[]>;
}

interface SchoolStore extends SchoolData {
  loaded: boolean;
  load: () => Promise<void>;

  saveClass: (c: Omit<SchoolClass, 'id'> & { id?: string }) => void;
  deleteClass: (id: string) => void;

  addAssignment: (a: Omit<Assignment, 'id' | 'done' | 'doneAt' | 'createdAt'>) => Assignment;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  toggleAssignment: (id: string) => void;
  deleteAssignment: (id: string) => void;

  logFocus: (minutes: number, assignmentId: string | null) => void;
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
const EMPTY: SchoolData = { classes: [], assignments: [], focus: [], profile: DEFAULT_PROFILE, stressTags: {} };

const FILE = 'school.json';

function file() {
  return new File(Paths.document, FILE);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist(data: SchoolData) {
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

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const useSchoolStore = create<SchoolStore>((set, get) => {
  const commit = (patch: Partial<SchoolData>) => {
    set(patch);
    const { classes, assignments, focus, profile, stressTags } = get();
    persist({ classes, assignments, focus, profile, stressTags });
  };

  return {
    ...EMPTY,
    loaded: false,

    load: async () => {
      if (get().loaded) return;
      try {
        const f = file();
        if (f.exists) {
          const d = JSON.parse(await f.text()) as Partial<SchoolData>;
          set({
            classes: d.classes ?? [],
            assignments: d.assignments ?? [],
            focus: d.focus ?? [],
            profile: { ...DEFAULT_PROFILE, ...(d.profile ?? {}) },
            stressTags: d.stressTags ?? {},
          });
        }
      } catch {
        // Start fresh rather than crash on a bad file.
      }
      set({ loaded: true });
    },

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
      commit({
        assignments: get().assignments.map((a) =>
          a.id === id ? { ...a, done: !a.done, doneAt: a.done ? null : new Date().toISOString() } : a
        ),
      });
    },

    deleteAssignment: (id) => {
      commit({ assignments: get().assignments.filter((a) => a.id !== id) });
    },

    logFocus: (minutes, assignmentId) => {
      commit({ focus: [...get().focus, { id: uid(), assignmentId, minutes, at: new Date().toISOString() }] });
    },

    setProfile: (patch) => commit({ profile: { ...get().profile, ...patch } }),

    setStressTags: (date, tags) => commit({ stressTags: { ...get().stressTags, [date]: tags } }),
  };
});

// Date helpers live in ./dates (no native imports, so they can be tested
// on their own); re-exported here for convenience.
export { addDays, clock, dateKey, daysUntil, dueLabel, isoDay } from './dates';
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
