import { create } from 'zustand';

export type AmbientMood = 'clear' | 'muffled';

interface AudioStore {
  mood: AmbientMood;
  transitionMs: number;
  transitionToMood: (mood: AmbientMood, transitionMs?: number) => void;
}

// Plain data, not the players themselves — expo-audio's useAudioPlayer is a
// hook, so the actual player instances live in one mounted component
// (AmbientAudioEngine) that watches this store. Callable from anywhere,
// including non-component code like core/store.ts's saveDraft.
export const useAudioStore = create<AudioStore>((set) => ({
  mood: 'clear',
  transitionMs: 1000,
  transitionToMood: (mood, transitionMs = 1000) => set({ mood, transitionMs }),
}));
