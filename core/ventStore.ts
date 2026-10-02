import { create } from 'zustand';
import { supabase } from './supabase';

export type VentInputMode = 'voice' | 'type' | 'companion';

export interface VentEntry {
  id: string;
  content: string;
  input_mode: VentInputMode;
  created_at: string;
}

interface VentStore {
  history: VentEntry[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchHistory: () => Promise<void>;
  saveEntry: (content: string, inputMode: VentInputMode) => Promise<boolean>;
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

/** A short, stable key for an entry's text (the row has no title column, so titles are kept on the phone by this). */
export function entryKey(content: string) {
  const t = content.trim();
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return `${(h >>> 0).toString(36)}-${t.length}`;
}

/** A chat with Ember, named from the first thing you said: "Stressed about the chem test…". */
export function chatTitleFrom(content: string) {
  const lines = content.split('\n');
  // Chats saved before the AI brain were "Ember's question\nyour answer", with no names.
  const first = (/^(Ember|You): /m.test(content) ? lines.find((l) => l.startsWith('You: '))?.slice(5) : lines[1])?.trim();
  if (!first) return 'A chat with Ember';
  const words = first.replace(/\s+/g, ' ').split(' ');
  const short = words.slice(0, 6).join(' ').replace(/[.,!?;:]+$/, '');
  return `${short.charAt(0).toUpperCase()}${short.slice(1)}${words.length > 6 ? '…' : ''}`;
}
