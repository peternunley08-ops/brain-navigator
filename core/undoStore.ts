import { create } from 'zustand';

// One pending "Undo" at a time: a short label and how to put things back.
// The bar shows for a few seconds after something is deleted.

interface UndoItem {
  id: number;
  label: string;
  undo: () => void;
}

interface UndoStore {
  item: UndoItem | null;
  offer: (label: string, undo: () => void) => void;
  clear: (id?: number) => void;
}

let seq = 0;

export const useUndoStore = create<UndoStore>((set, get) => ({
  item: null,
  offer: (label, undo) => {
    seq += 1;
    set({ item: { id: seq, label, undo } });
  },
  clear: (id) => {
    if (id == null || get().item?.id === id) set({ item: null });
  },
}));

export function offerUndo(label: string, undo: () => void) {
  useUndoStore.getState().offer(label, undo);
}
