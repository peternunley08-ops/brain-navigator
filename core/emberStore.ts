import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';

// Ember's own state: where it's perched, whether it's napping, and the
// short things it says when something happens elsewhere in the app.

export type EmberMood =
  | 'idle'
  | 'happy'
  | 'cheer'
  | 'curious'
  | 'sleepy'
  | 'concerned'
  | 'listening'
  | 'dizzy';

export interface EmberToast {
  id: number;
  text: string;
  mood: EmberMood;
}

interface EmberPrefs {
  side: 'left' | 'right';
  /** Vertical position as a fraction of the space Ember can roam. */
  y: number;
  napping: boolean;
}

interface EmberStore extends EmberPrefs {
  loaded: boolean;
  toast: EmberToast | null;
  bubbleOpen: boolean;
  /** Help tips already opened this session, so their dot doesn't come back. */
  seen: string[];

  load: () => Promise<void>;
  setPerch: (side: 'left' | 'right', y: number) => void;
  setNapping: (napping: boolean) => void;
  setBubbleOpen: (open: boolean) => void;
  markSeen: (id: string) => void;
  /** Ember says something short, then it fades. */
  say: (text: string, mood?: EmberMood) => void;
  clearToast: (id: number) => void;
}

const PREFS_FILE = 'ember.json';
const DEFAULTS: EmberPrefs = { side: 'right', y: 1, napping: false };

function prefsFile() {
  return new File(Paths.document, PREFS_FILE);
}

function persist(p: EmberPrefs) {
  try {
    const f = prefsFile();
    if (!f.exists) f.create();
    f.write(JSON.stringify(p));
  } catch {
    // Losing Ember's perch is harmless; never let it break the app.
  }
}

let toastSeq = 0;

export const useEmberStore = create<EmberStore>((set, get) => ({
  ...DEFAULTS,
  loaded: false,
  toast: null,
  bubbleOpen: false,
  seen: [],

  load: async () => {
    try {
      const f = prefsFile();
      if (f.exists) {
        const p = JSON.parse(await f.text()) as Partial<EmberPrefs>;
        set({
          side: p.side === 'left' ? 'left' : 'right',
          y: typeof p.y === 'number' ? Math.min(1, Math.max(0, p.y)) : DEFAULTS.y,
          napping: !!p.napping,
        });
      }
    } catch {
      // Fall back to the defaults.
    }
    set({ loaded: true });
  },

  setPerch: (side, y) => {
    set({ side, y });
    const { napping } = get();
    persist({ side, y, napping });
  },

  setNapping: (napping) => {
    set({ napping, bubbleOpen: napping ? false : get().bubbleOpen });
    const { side, y } = get();
    persist({ side, y, napping });
  },

  setBubbleOpen: (open) => set({ bubbleOpen: open }),

  markSeen: (id) => {
    if (!get().seen.includes(id)) set({ seen: [...get().seen, id] });
  },

  say: (text, mood = 'happy') => {
    toastSeq += 1;
    set({ toast: { id: toastSeq, text, mood } });
  },

  clearToast: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },
}));
