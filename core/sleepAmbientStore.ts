import { create } from 'zustand';
import { supabase } from './supabase';

export interface SleepAmbientCheck {
  id: string;
  sleep_score: number | null;
  peak_level: number;
  average_level: number;
  duration_seconds: number;
  created_at: string;
}

interface SleepAmbientStore {
  history: SleepAmbientCheck[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchHistory: () => Promise<void>;
  saveCheck: (params: {
    sleepScore: number | null;
    peakLevel: number;
    averageLevel: number;
    durationSeconds: number;
  }) => Promise<void>;
}

export const useSleepAmbientStore = create<SleepAmbientStore>((set, get) => ({
  history: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchHistory: async () => {
    set({ isLoading: true, error: null });

    const { data, error } = await supabase
      .from('sleep_ambient_checks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }

    set({ isLoading: false, history: (data as SleepAmbientCheck[]) ?? [] });
  },

  saveCheck: async ({ sleepScore, peakLevel, averageLevel, durationSeconds }) => {
    set({ isSaving: true, error: null });

    const { error } = await supabase.from('sleep_ambient_checks').insert({
      sleep_score: sleepScore,
      peak_level: peakLevel,
      average_level: averageLevel,
      duration_seconds: durationSeconds,
    });

    if (error) {
      set({ isSaving: false, error: error.message });
      return;
    }

    set({ isSaving: false });
    await get().fetchHistory();
  },
}));
