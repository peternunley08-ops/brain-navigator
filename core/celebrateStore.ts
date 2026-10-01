import { create } from 'zustand';
import { dateKey } from './dates';
import { useEmberStore } from './emberStore';
import { useLifeStore } from './lifeStore';

// The big moments get more than a toast: a whole-screen burst and a line
// that stays a beat. Kept for real milestones so it never turns into noise.

export interface Moment {
  id: number;
  title: string;
  body?: string;
  color?: string;
}

interface CelebrateStore {
  moment: Moment | null;
  show: (m: Omit<Moment, 'id'>) => void;
  clear: (id?: number) => void;
}

let seq = 0;

export const useCelebrateStore = create<CelebrateStore>((set, get) => ({
  moment: null,
  show: (m) => {
    seq += 1;
    set({ moment: { ...m, id: seq } });
  },
  clear: (id) => {
    if (id == null || get().moment?.id === id) set({ moment: null });
  },
}));

/**
 * A big moment. `key` makes it happen once (the weekly goal, a college's
 * yes); `win` also drops a line in the wins jar.
 */
export function celebrate(title: string, body?: string, color?: string, opts: { key?: string; win?: string } = {}) {
  const life = useLifeStore.getState();
  const done = life.settings.celebrated ?? [];
  if (opts.key) {
    if (done.includes(opts.key)) return;
    life.setSettings({ celebrated: [...done, opts.key].slice(-200) });
  }
  if (opts.win) {
    const today = dateKey();
    if (!life.wins.some((w) => w.text === opts.win && dateKey(new Date(w.at)) === today)) life.addWin(opts.win);
  }
  if (life.settings.quietCelebrations) {
    useEmberStore.getState().say(body ? `${title}. ${body}` : title, 'cheer');
    return;
  }
  useCelebrateStore.getState().show({ title, body, color });
}
