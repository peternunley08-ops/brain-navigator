import { create } from 'zustand';
import { supabase } from './supabase';

export interface VentEntry {
  id: string;
  content: string;
  input_mode: 'voice' | 'type';
  created_at: string;
}

interface VentStore {
  history: VentEntry[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchHistory: () => Promise<void>;
  saveEntry: (content: string, inputMode: 'voice' | 'type') => Promise<boolean>;
}

export const useVentStore = create<VentStore>((set, get) => ({
  history: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('vent_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ isLoading: false, history: (data as VentEntry[]) ?? [] });
  },

  saveEntry: async (content, inputMode) => {
    const trimmed = content.trim();
    if (!trimmed) return false;

    set({ isSaving: true, error: null });
    const { error } = await supabase
      .from('vent_entries')
      .insert({ content: trimmed, input_mode: inputMode });

    if (error) {
      set({ isSaving: false, error: error.message });
      return false;
    }
    set({ isSaving: false });
    await get().fetchHistory();
    return true;
  },
}));
