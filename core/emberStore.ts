import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { useLifeStore } from './lifeStore';
import { nowState, useSchoolStore } from './schoolStore';
import { useUndoStore } from './undoStore';

/** True while a class is in session and Ember has been asked to stay quiet then. */
export function inClassQuiet() {
  if (useLifeStore.getState().settings.quietInClass === false) return false;
  const now = nowState(useSchoolStore.getState().classes);
  return now.kind === 'in' && now.cls.kind === 'class';
}

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
  /** `asked`: the student reached for Ember (a hold, a breath), so quiet modes let it through. */
  say: (text: string, mood?: EmberMood, asked?: boolean) => void;
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
/** The latest line held back while the Undo bar is up. */
let waiting: { text: string; mood: EmberMood; asked?: boolean } | null = null;

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

  say: (text, mood = 'happy', asked = false) => {
    // Quiet mode keeps only the big moments; class time keeps nothing (unless they asked).
    if (!asked && inClassQuiet()) return;
    if (!asked && useLifeStore.getState().settings.emberQuiet && mood !== 'cheer') return;
    // The Undo bar and Ember's line share the bottom of the screen: one at a time.
    if (useUndoStore.getState().item) {
      waiting = { text, mood, asked };
      return;
    }
    toastSeq += 1;
    set({ toast: { id: toastSeq, text, mood } });
  },

  clearToast: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },
}));

// One queue for the bottom of the screen. When Undo appears, a line Ember is
// saying steps aside and comes back after; when Undo goes, the held line plays.
useUndoStore.subscribe((state, prev) => {
  const ember = useEmberStore.getState();
  if (state.item && !prev.item && ember.toast) {
    waiting = { text: ember.toast.text, mood: ember.toast.mood, asked: true };
    useEmberStore.setState({ toast: null });
  } else if (!state.item && prev.item && waiting) {
    const next = waiting;
    waiting = null;
    setTimeout(() => {
      if (!useUndoStore.getState().item) useEmberStore.getState().say(next.text, next.mood, next.asked);
      else waiting = next;
    }, 350);
  }
});
