import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';

// The hub: notes (a small Notion), colleges (a better Common App
// checklist), plan blocks (a Structured-style day), and connection
// settings (Canvas, shortcut links). Stored on the phone in hub.json.

export type BlockType = 'text' | 'heading' | 'todo' | 'bullet';

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
}

interface HubStore extends HubData {
  loaded: boolean;
  load: () => Promise<void>;

  createNote: (partial?: Partial<Note>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  saveCollege: (c: Omit<College, 'id'> & { id?: string }) => void;
  deleteCollege: (id: string) => void;
  toggleStep: (id: string, step: string) => void;

  addBlock: (b: Omit<PlanBlock, 'id' | 'done'>) => void;
  toggleBlock: (id: string) => void;
  deleteBlock: (id: string) => void;

  setLinks: (patch: Partial<Links>) => void;
  setCanvas: (patch: Partial<CanvasConfig>) => void;
}

const EMPTY: HubData = {
  notes: [],
  colleges: [],
  plan: [],
  links: { aeries: '', canvas: '', parentsquare: 'https://www.parentsquare.com/signin' },
  canvas: { baseUrl: '', token: '', lastSync: null },
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

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const useHubStore = create<HubStore>((set, get) => {
  const commit = (patch: Partial<HubData>) => {
    set(patch);
    const { notes, colleges, plan, links, canvas } = get();
    persist({ notes, colleges, plan, links, canvas });
  };

  return {
    ...EMPTY,
    loaded: false,

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
