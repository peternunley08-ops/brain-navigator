import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { isShowing } from './showMode';

export type AmbientMood = 'clear' | 'muffled';

interface AudioStore {
  mood: AmbientMood;
  transitionMs: number;
  transitionToMood: (mood: AmbientMood, transitionMs?: number) => void;
  /** Opt-in soft fire crackle during Focus (off by default; this is also its mute). */
  crackle?: boolean;
  /** True while a focus session is running; the crackle only plays then. */
  crackleLive?: boolean;
  setCrackle: (on: boolean) => void;
  setCrackleLive: (live: boolean) => void;
}

const FILE = 'audio.json';

function persist(crackle: boolean) {
  // Nothing saves while showing someone the app.
  if (isShowing()) return;
  try {
    const f = new File(Paths.document, FILE);
    if (!f.exists) f.create();
    f.write(JSON.stringify({ crackle }));
  } catch {
    // Losing the setting is harmless.
  }
}

// Plain data, not the players themselves — expo-audio's useAudioPlayer is a
// hook, so the actual player instances live in one mounted component
// (AmbientAudioEngine) that watches this store. Callable from anywhere,
// including non-component code like core/store.ts's saveDraft.
export const useAudioStore = create<AudioStore>((set) => ({
  mood: 'clear',
  transitionMs: 1000,
  transitionToMood: (mood, transitionMs = 1000) => set({ mood, transitionMs }),
  crackle: false,
  crackleLive: false,
  setCrackle: (on) => {
    set({ crackle: on });
    persist(on);
  },
  setCrackleLive: (live) => set({ crackleLive: live }),
}));

/** Reads the saved crackle choice (at launch, and again after showing someone the app). */
export async function loadCrackle() {
  let crackle = false;
  try {
    const f = new File(Paths.document, FILE);
    if (f.exists) {
      const p = JSON.parse(await f.text()) as { crackle?: boolean };
      crackle = !!p.crackle;
    }
  } catch {
    // Default: off.
  }
  useAudioStore.setState({ crackle });
}

loadCrackle();
