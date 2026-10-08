import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { useLifeStore } from './lifeStore';
import { isNight, minutesOf, nightNow, nightStart, tonightKey } from './night';
import { nowState, useSchoolStore } from './schoolStore';
import { isShowing } from './showMode';
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
  /** When it started (ms), so a newer line knows to wait its turn. */
  at: number;
}

/** How long a line stays up: long enough to read it, 3.6 s at the least. */
export function lineMs(text: string) {
  return Math.min(8000, Math.max(3600, 2600 + 45 * text.length));
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
  /** Transient (never saved): what Ember is holding right now. */
  prop: 'book' | 'hat' | null;
  /** A seasonal hat (birthday party hat, Halloween pumpkin), worn whenever nothing else is held. */
  hat: false | 'party' | 'pumpkin';
  /** Bumps once to make Ember glance up from its book. */
  peeks: number;

  load: () => Promise<void>;
  setPerch: (side: 'left' | 'right', y: number) => void;
  setNapping: (napping: boolean) => void;
  setBubbleOpen: (open: boolean) => void;
  setProp: (prop: 'book' | 'hat' | null) => void;
  setHat: (hat: false | 'party' | 'pumpkin') => void;
  peek: () => void;
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
  // Nothing saves while showing someone the app (a goodnight as Riley used to put the real Ember to sleep).
  if (isShowing()) return;
  try {
    const f = prefsFile();
    if (!f.exists) f.create();
    f.write(JSON.stringify(p));
  } catch {
    // Losing Ember's perch is harmless; never let it break the app.
  }
}

let toastSeq = 0;

// The quieter floating Ember: on its own it speaks at most once per screen
// visit, and not at all where its line is already on the page (the Desk,
// Steady) or after Goodnight. Lines the student asked for always come.
const QUIET_HERE = new Set(['/', '/steady']);
let here = '';
let spokeHere = false;

/** Ember's screen changed: a new visit, so it may speak once again. */
export function emberOnScreen(path: string) {
  if (path === here) return;
  here = path;
  spokeHere = false;
}
/** Lines waiting for the one being read (two at most; asked lines never wait). */
let queue: { text: string; mood: EmberMood }[] = [];
/** The latest line held back while the Undo bar is up. */
let waiting: { text: string; mood: EmberMood; asked?: boolean } | null = null;

export const useEmberStore = create<EmberStore>((set, get) => ({
  ...DEFAULTS,
  loaded: false,
  toast: null,
  bubbleOpen: false,
  seen: [],
  prop: null,
  hat: false,
  peeks: 0,

  load: async () => {
    // Read again after showing someone the app, so it also drops anything unsaved.
    let prefs = DEFAULTS;
    try {
      const f = prefsFile();
      if (f.exists) {
        const p = JSON.parse(await f.text()) as Partial<EmberPrefs>;
        prefs = {
          side: p.side === 'left' ? 'left' : 'right',
          y: typeof p.y === 'number' ? Math.min(1, Math.max(0, p.y)) : DEFAULTS.y,
          napping: !!p.napping,
        };
      }
    } catch {
      // Fall back to the defaults.
    }
    set({ ...prefs, loaded: true });
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

  setProp: (prop) => set({ prop }),
  setHat: (hat) => set({ hat }),
  peek: () => set({ peeks: get().peeks + 1 }),

  markSeen: (id) => {
    if (!get().seen.includes(id)) set({ seen: [...get().seen, id] });
  },

  say: (text, mood = 'happy', asked = false) => {
    // Quiet mode keeps only the big moments; class time keeps nothing (unless they asked).
    if (!asked && inClassQuiet()) return;
    if (!asked && useLifeStore.getState().settings.emberQuiet && mood !== 'cheer') return;
    if (!asked && (spokeHere || QUIET_HERE.has(here) || useLifeStore.getState().settings.putDown === tonightKey())) return;
    // The Undo bar and Ember's line share the bottom of the screen: one at a time.
    if (useUndoStore.getState().item) {
      waiting = { text, mood, asked };
      return;
    }
    // One line at a time: a new line waits for the one being read, instead of
    // cutting it off mid-sentence (a first A right after a badge).
    const current = get().toast;
    if (!asked && current && Date.now() - current.at < lineMs(current.text)) {
      queue = [...queue, { text, mood }].slice(-2);
      return;
    }
    // At night Ember speaks softer: just the first sentence (asked lines stay whole).
    if (!asked) {
      const life = useLifeStore.getState();
      if (isNight(minutesOf(nightNow()), nightStart(life.settings.windDown, life.about.picks.time === 'b'))) {
        const i = text.indexOf('. ');
        if (i > 0) text = text.slice(0, i + 1);
      }
    }
    if (!asked) spokeHere = true;
    toastSeq += 1;
    set({ toast: { id: toastSeq, text, mood, at: Date.now() } });
  },

  clearToast: (id) => {
    if (get().toast?.id !== id) return;
    set({ toast: null });
    const next = queue.shift();
    if (next) setTimeout(() => get().say(next.text, next.mood), 350);
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
