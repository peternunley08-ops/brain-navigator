import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';

// The hub: notes (a small Notion), colleges (a better Common App
// checklist), plan blocks (a Structured-style day), and connection
// settings (Canvas, shortcut links). Stored on the phone in hub.json.

export type BlockType = 'text' | 'heading' | 'todo' | 'bullet' | 'numbered' | 'quote' | 'divider';

export interface NoteBlock {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
}

export interface Note {
  id: string;
  title: string;
  icon: string;
  color: string;
  classId: string | null;
  blocks: NoteBlock[];
  pinned: boolean;
  updatedAt: string;
  createdAt: string;
  /** Word goal for an essay (650 for the Common App by default). */
  wordGoal?: number | null;
}

export type CollegePlan = 'ED' | 'EA' | 'REA' | 'RD' | 'Rolling';
export type CollegeStatus = 'researching' | 'applying' | 'submitted' | 'accepted' | 'waitlisted' | 'denied';

export interface College {
  id: string;
  name: string;
  plan: CollegePlan;
  deadline: string | null;
  status: CollegeStatus;
  /** Checklist item → done. */
  steps: Record<string, boolean>;
  notes: string;
  tier?: CollegeTier;
  /** Campus visit: 1–5 and what stood out. */
  visitRating?: number;
  visitNotes?: string;
  /** Supplement essays: the prompt, its word limit, and the note it's written in. */
  supplements?: { id: string; prompt: string; limit: number; noteId?: string }[];
  /** Application fee in dollars, and whether a fee waiver covers it. */
  fee?: number | null;
  waiver?: boolean;
}

export type CollegeTier = 'reach' | 'target' | 'likely';

export interface Scholarship {
  id: string;
  name: string;
  amount: number | null;
  deadline: string | null;
  status: 'todo' | 'applied' | 'won' | 'no';
}

export interface RecLetter {
  id: string;
  teacher: string;
  /** YYYY-MM-DD you asked. */
  askedOn: string | null;
  due: string | null;
  status: 'ask' | 'asked' | 'submitted';
  thanked: boolean;
}

/** A Common App activity: 50-char position, 100-char org, 150-char description. */
export interface Activity {
  id: string;
  role: string;
  org: string;
  description: string;
  grades: number[];
  hoursPerWeek: number | null;
  weeksPerYear: number | null;
}

export interface PlanBlock {
  id: string;
  date: string;
  title: string;
  start: number;
  end: number;
  color: string;
  done: boolean;
}

export interface Links {
  aeries: string;
  canvas: string;
  parentsquare: string;
}

export interface CanvasConfig {
  baseUrl: string;
  token: string;
  lastSync: string | null;
}

export const COLLEGE_STEPS = ['Main essay', 'Supplements', 'Teacher recs', 'Counselor rec', 'Transcript', 'Test scores', 'Activities list', 'Fee or waiver'];

export const TIER_LABEL: Record<CollegeTier, string> = { reach: 'Reach', target: 'Target', likely: 'Likely' };
export const TIER_COLOR: Record<CollegeTier, string> = { reach: '#F0845A', target: '#F5B45C', likely: '#8CC0A8' };

export const AID_STEPS = [
  'Make a StudentAid.gov account (you and a parent)',
  'Gather tax returns and W-2s',
  'Submit the FAFSA',
  'CSS Profile (if a college asks for it)',
  'Your state’s aid application (e.g. Cal Grant)',
  'Check each school’s aid portal for missing items',
  'Compare aid offers side by side',
];

export const STATUS_LABEL: Record<CollegeStatus, string> = {
  researching: 'Researching',
  applying: 'Applying',
  submitted: 'Submitted',
  accepted: 'Accepted',
  waitlisted: 'Waitlisted',
  denied: 'Not this time',
};

interface HubData {
  notes: Note[];
  colleges: College[];
  plan: PlanBlock[];
  links: Links;
  canvas: CanvasConfig;
  scholarships: Scholarship[];
  recs: RecLetter[];
  activities: Activity[];
  /** FAFSA / CSS checklist item → done. */
  aid: Record<string, boolean>;
}

interface HubStore extends HubData {
  loaded: boolean;
  load: () => Promise<void>;
  /** Replace everything with a backup's hub section (connections on this phone stay). */
  restore: (d: Partial<HubData>) => void;

  createNote: (partial?: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (n: Note) => void;

  saveCollege: (c: Omit<College, 'id'> & { id?: string }) => void;
  deleteCollege: (id: string) => void;
  toggleStep: (id: string, step: string) => void;

  addBlock: (b: Omit<PlanBlock, 'id' | 'done'>) => void;
  toggleBlock: (id: string) => void;
  deleteBlock: (id: string) => void;

  setLinks: (patch: Partial<Links>) => void;
  setCanvas: (patch: Partial<CanvasConfig>) => void;

  saveScholarship: (x: Omit<Scholarship, 'id'> & { id?: string }) => void;
  deleteScholarship: (id: string) => void;
  saveRec: (x: Omit<RecLetter, 'id'> & { id?: string }) => void;
  deleteRec: (id: string) => void;
  saveActivity: (x: Omit<Activity, 'id'> & { id?: string }) => void;
  deleteActivity: (id: string) => void;
  moveActivity: (id: string, dir: -1 | 1) => void;
  toggleAid: (item: string) => void;
}

const EMPTY: HubData = {
  notes: [],
  colleges: [],
  plan: [],
  links: { aeries: '', canvas: '', parentsquare: 'https://www.parentsquare.com/signin' },
  canvas: { baseUrl: '', token: '', lastSync: null },
  scholarships: [],
  recs: [],
  activities: [],
  aid: {},
};

const FILE = 'hub.json';

let timer: ReturnType<typeof setTimeout> | null = null;
function persist(data: HubData) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      const f = new File(Paths.document, FILE);
      if (!f.exists) f.create();
      f.write(JSON.stringify(data));
    } catch {
      // Retried on the next change.
    }
  }, 300);
}

function upsert<T extends { id: string }>(list: T[], x: Omit<T, 'id'> & { id?: string }): T[] {
  if (x.id && list.some((y) => y.id === x.id)) return list.map((y) => (y.id === x.id ? ({ ...y, ...x } as T) : y));
  return [...list, { ...x, id: uid() } as T];
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const useHubStore = create<HubStore>((set, get) => {
  const commit = (patch: Partial<HubData>) => {
    set(patch);
    const { notes, colleges, plan, links, canvas, scholarships, recs, activities, aid } = get();
    persist({ notes, colleges, plan, links, canvas, scholarships, recs, activities, aid });
  };

  return {
    ...EMPTY,
    loaded: false,

    restore: (d) =>
      commit({
        notes: d.notes ?? [],
        colleges: d.colleges ?? [],
        plan: d.plan ?? [],
        scholarships: d.scholarships ?? [],
        recs: d.recs ?? [],
        activities: d.activities ?? [],
        aid: d.aid ?? {},
      }),

    load: async () => {
      if (get().loaded) return;
      try {
        const f = new File(Paths.document, FILE);
        if (f.exists) {
          const d = JSON.parse(await f.text()) as Partial<HubData>;
          set({
            notes: d.notes ?? [],
            colleges: d.colleges ?? [],
            plan: d.plan ?? [],
            links: { ...EMPTY.links, ...(d.links ?? {}) },
            canvas: { ...EMPTY.canvas, ...(d.canvas ?? {}) },
            scholarships: d.scholarships ?? [],
            recs: d.recs ?? [],
            activities: d.activities ?? [],
            aid: d.aid ?? {},
          });
        }
      } catch {
        // Start fresh.
      }
      set({ loaded: true });
    },

    createNote: (partial) => {
      const now = new Date().toISOString();
      const note: Note = {
        id: uid(),
        title: '',
        icon: 'pen',
        color: '#F5B45C',
        classId: null,
        blocks: [{ id: uid(), type: 'text', text: '' }],
        pinned: false,
        createdAt: now,
        updatedAt: now,
        ...partial,
      };
      commit({ notes: [note, ...get().notes] });
      return note;
    },

    updateNote: (id, patch) => {
      commit({ notes: get().notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)) });
    },

    deleteNote: (id) => commit({ notes: get().notes.filter((n) => n.id !== id) }),
    restoreNote: (n) => {
      if (!get().notes.some((x) => x.id === n.id)) commit({ notes: [n, ...get().notes] });
    },

    saveCollege: (c) => {
      const list = get().colleges;
      if (c.id && list.some((x) => x.id === c.id)) {
        commit({ colleges: list.map((x) => (x.id === c.id ? ({ ...x, ...c } as College) : x)) });
      } else {
        commit({ colleges: [...list, { ...c, id: uid() } as College] });
      }
    },

    deleteCollege: (id) => commit({ colleges: get().colleges.filter((c) => c.id !== id) }),

    toggleStep: (id, step) => {
      commit({
        colleges: get().colleges.map((c) => (c.id === id ? { ...c, steps: { ...c.steps, [step]: !c.steps[step] } } : c)),
      });
    },

    addBlock: (b) => commit({ plan: [...get().plan, { ...b, id: uid(), done: false }] }),
    toggleBlock: (id) => commit({ plan: get().plan.map((b) => (b.id === id ? { ...b, done: !b.done } : b)) }),
    deleteBlock: (id) => commit({ plan: get().plan.filter((b) => b.id !== id) }),

    setLinks: (patch) => commit({ links: { ...get().links, ...patch } }),
    setCanvas: (patch) => commit({ canvas: { ...get().canvas, ...patch } }),

    saveScholarship: (x) => commit({ scholarships: upsert(get().scholarships, x) }),
    deleteScholarship: (id) => commit({ scholarships: get().scholarships.filter((x) => x.id !== id) }),
    saveRec: (x) => commit({ recs: upsert(get().recs, x) }),
    deleteRec: (id) => commit({ recs: get().recs.filter((x) => x.id !== id) }),
    saveActivity: (x) => commit({ activities: upsert(get().activities, x) }),
    deleteActivity: (id) => commit({ activities: get().activities.filter((x) => x.id !== id) }),
    moveActivity: (id, dir) => {
      const list = [...get().activities];
      const i = list.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      commit({ activities: list });
    },
    toggleAid: (item) => commit({ aid: { ...get().aid, [item]: !get().aid[item] } }),
  };
});

// ---- Note templates ------------------------------------------------------

const b = (type: BlockType, text = ''): NoteBlock => ({ id: uid(), type, text, ...(type === 'todo' ? { checked: false } : {}) });

export const NOTE_TEMPLATES: { key: string; title: string; icon: string; color: string; blocks: () => NoteBlock[] }[] = [
  {
    key: 'blank',
    title: 'Blank page',
    icon: 'pen',
    color: '#F5B45C',
    blocks: () => [b('text')],
  },
  {
    key: 'class',
    title: 'Class notes',
    icon: 'book',
    color: '#8FB4E8',
    blocks: () => [b('heading', 'Main ideas'), b('bullet'), b('heading', 'Questions to ask'), b('bullet'), b('heading', 'Homework'), b('todo')],
  },
  {
    key: 'study',
    title: 'Study guide',
    icon: 'flag',
    color: '#F0845A',
    blocks: () => [
      b('heading', 'What’s on the test'),
      b('bullet'),
      b('heading', 'Things I keep forgetting'),
      b('bullet'),
      b('heading', 'Practice'),
      b('todo', 'Do a practice test'),
      b('todo', 'Explain it out loud to someone'),
    ],
  },
  {
    key: 'week',
    title: 'Week plan',
    icon: 'calendar',
    color: '#9FD08A',
    blocks: () => [b('heading', 'Must do'), b('todo'), b('heading', 'Want to do'), b('todo'), b('heading', 'One thing for me'), b('text')],
  },
  {
    key: 'cornell',
    title: 'Cornell notes',
    icon: 'list',
    color: '#8FB4E8',
    blocks: () => [
      b('heading', 'Cues and questions'),
      b('bullet'),
      b('heading', 'Notes'),
      b('bullet'),
      b('heading', 'Summary in 2–3 sentences'),
      b('text'),
    ],
  },
  {
    key: 'lab',
    title: 'Lab report',
    icon: 'flask',
    color: '#9FD08A',
    blocks: () => [
      b('heading', 'Question'),
      b('text'),
      b('heading', 'Hypothesis'),
      b('text', 'If … then … because …'),
      b('heading', 'Materials'),
      b('bullet'),
      b('heading', 'Procedure'),
      b('numbered'),
      b('heading', 'Data and results'),
      b('text'),
      b('heading', 'Conclusion'),
      b('text'),
    ],
  },
  {
    key: 'reading',
    title: 'Reading notes',
    icon: 'book',
    color: '#D99A6C',
    blocks: () => [
      b('heading', 'Chapter or pages'),
      b('text'),
      b('heading', 'What happened / main points'),
      b('bullet'),
      b('heading', 'Quotes worth keeping'),
      b('quote'),
      b('heading', 'What I think'),
      b('text'),
    ],
  },
  {
    key: 'club',
    title: 'Club or team meeting',
    icon: 'people',
    color: '#E89AB8',
    blocks: () => [b('heading', 'Decided'), b('bullet'), b('heading', 'My action items'), b('todo'), b('heading', 'Next meeting'), b('text')],
  },
  {
    key: 'essay',
    title: 'Essay brainstorm',
    icon: 'feather',
    color: '#AFA2DE',
    blocks: () => [
      b('heading', 'The prompt'),
      b('text'),
      b('heading', 'Stories only I could tell'),
      b('bullet'),
      b('heading', 'What I want them to know about me'),
      b('text'),
    ],
  },
];
