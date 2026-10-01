import { create } from 'zustand';
import type { IconName } from '../components/ui/Icon';

// One pending "Undo" at a time: a short label and how to put things back.
// The bar shows for a few seconds after something is deleted.

interface UndoItem {
  id: number;
  label: string;
  undo: () => void;
  /** What kind of thing comes back: a deletion (trash) or a move (arrow). */
  icon: IconName;
}

interface UndoStore {
  item: UndoItem | null;
  offer: (label: string, undo: () => void, icon?: IconName) => void;
  clear: (id?: number) => void;
}

let seq = 0;

export const useUndoStore = create<UndoStore>((set, get) => ({
  item: null,
  offer: (label, undo, icon = 'trash') => {
    seq += 1;
    set({ item: { id: seq, label, undo, icon } });
  },
  clear: (id) => {
    if (id == null || get().item?.id === id) set({ item: null });
  },
}));

export function offerUndo(label: string, undo: () => void, icon?: IconName) {
  useUndoStore.getState().offer(label, undo, icon);
}
