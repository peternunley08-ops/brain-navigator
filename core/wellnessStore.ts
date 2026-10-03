import { create } from 'zustand';
import { archiveNotionPage, createNotionPage, NOTION_DB, notionProp, updateNotionPage } from './notion';
import { supabase } from './supabase';

export interface DailyCheckin {
  id: string;
  checkin_date: string;
  mood: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  notes: string | null;
  created_at: string;
  notion_page_id: string | null;
}

export interface CheckinInput {
  mood: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  stressLevel: number | null;
  notes: string;
}

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface WellnessStore {
  checkins: DailyCheckin[];
  isLoadingCheckins: boolean;
  isSaving: boolean;
  error: string | null;

  todaysCheckin: () => DailyCheckin | null;
  fetchCheckins: () => Promise<void>;
  saveTodayCheckin: (input: CheckinInput) => Promise<boolean>;
  /** One-tap mood from the Desk: logs today's mood and keeps any other answers. Returns an undo, or null if it did not save. */
  quickMood: (mood: number) => Promise<(() => Promise<void>) | null>;
}

export const useWellnessStore = create<WellnessStore>((set, get) => ({
  checkins: [],
  isLoadingCheckins: false,
  isSaving: false,
  error: null,

  todaysCheckin: () => {
    const today = todayDateString();
    return get().checkins.find((c) => c.checkin_date === today) ?? null;
  },

  fetchCheckins: async () => {
    set({ isLoadingCheckins: true, error: null });

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .order('checkin_date', { ascending: false })
      .limit(60);

    if (error) {
      set({ isLoadingCheckins: false, error: error.message });
      return;
    }

    set({ isLoadingCheckins: false, checkins: (data as DailyCheckin[]) ?? [] });
  },

  saveTodayCheckin: async (input) => {
    set({ isSaving: true, error: null });

    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert(
        {
          checkin_date: todayDateString(),
          mood: input.mood,
          sleep_hours: input.sleepHours,
          sleep_quality: input.sleepQuality,
          stress_level: input.stressLevel,
          notes: input.notes.trim() || null,
        },
        { onConflict: 'checkin_date' }
      )
      .select()
      .single();

    if (error) {
      set({ isSaving: false, error: error.message });
      return false;
    }

    set({ isSaving: false });
    await get().fetchCheckins();

    const notionProps = {
      Name: notionProp.title(data.checkin_date),
      Date: notionProp.date(data.checkin_date),
      Mood: notionProp.number(data.mood),
      'Sleep Hours': notionProp.number(data.sleep_hours),
      'Sleep Quality': notionProp.number(data.sleep_quality),
      Stress: notionProp.number(data.stress_level),
      Notes: notionProp.richText(data.notes ?? ''),
    };

    if (data.notion_page_id) {
      await updateNotionPage(data.notion_page_id, notionProps);
    } else {
      const pageId = await createNotionPage(NOTION_DB.checkins, notionProps);
      if (pageId) {
        await supabase.from('daily_checkins').update({ notion_page_id: pageId }).eq('id', data.id);
        await get().fetchCheckins();
      }
    }

    return true;
  },

  quickMood: async (mood) => {
    const prev = get().todaysCheckin();
    const ok = await get().saveTodayCheckin({
      mood,
      sleepHours: prev?.sleep_hours ?? null,
      sleepQuality: prev?.sleep_quality ?? null,
      stressLevel: prev?.stress_level ?? null,
      notes: prev?.notes ?? '',
    });
    if (!ok) return null;
    return async () => {
      if (prev) {
        await get().saveTodayCheckin({
          mood: prev.mood,
          sleepHours: prev.sleep_hours,
          sleepQuality: prev.sleep_quality,
          stressLevel: prev.stress_level,
          notes: prev.notes ?? '',
        });
        return;
      }
      const row = get().todaysCheckin();
      await supabase.from('daily_checkins').delete().eq('checkin_date', todayDateString());
      await archiveNotionPage(row?.notion_page_id);
      await get().fetchCheckins();
    };
  },
}));
