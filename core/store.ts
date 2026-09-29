import { create } from 'zustand';
import { createNotionPage, NOTION_DB, notionProp, updateNotionPage } from './notion';
import { supabase } from './supabase';

export type CognitiveStateLabel = 'secured' | 'shelved' | 'unlocked';

// What each state is called on screen. The stored names predate the
// candle metaphor; people should only ever see these.
export const STATE_LABEL: Record<CognitiveStateLabel, string> = {
  unlocked: 'Open',
  secured: 'Resolved',
  shelved: 'Let go',
};

export interface CognitiveStateEntry {
  id: string;
  state: CognitiveStateLabel;
  mood: string | null;
  intensity: number | null;
  notes: string | null;
  created_at: string;
  in_trove: boolean;
  notion_page_id: string | null;
  image_url: string | null;
}

export interface DraftCatalyst {
  description: string;
  entityName: string;
}

interface BrainNavigatorStore {
  draftState: CognitiveStateLabel;
  draftMood: string;
  draftIntensity: number | null;
  draftNotes: string;

  history: CognitiveStateEntry[];
  // Every open entry, uncapped — unlike `history`, which is only the 50 most
  // recent. The Desk, Loops, and the nav badge all read this one list.
  openLoops: CognitiveStateEntry[];
  isLoadingHistory: boolean;
  isSaving: boolean;
  error: string | null;

  setDraftState: (state: CognitiveStateLabel) => void;
  setDraftMood: (mood: string) => void;
  setDraftIntensity: (intensity: number | null) => void;
  setDraftNotes: (notes: string) => void;
  resetDraft: () => void;

  saveDraft: (catalysts?: DraftCatalyst[]) => Promise<string | null>;
  fetchHistory: () => Promise<void>;
  fetchOpenLoops: () => Promise<void>;
  // Both report whether the change was actually saved, so the screen never
  // plays a closing it can't back up.
  closeEntry: (id: string, resolutionNote: string) => Promise<boolean>;
  shelveEntry: (id: string) => Promise<boolean>;
  setTrove: (id: string, inTrove: boolean) => Promise<void>;
}

const initialDraft = {
  draftState: 'unlocked' as CognitiveStateLabel,
  draftMood: '',
  draftIntensity: null as number | null,
  draftNotes: '',
};

export const useBrainNavigatorStore = create<BrainNavigatorStore>((set, get) => ({
  ...initialDraft,
  history: [],
  openLoops: [],
  isLoadingHistory: false,
  isSaving: false,
  error: null,

  setDraftState: (state) => set({ draftState: state }),
  setDraftMood: (mood) => set({ draftMood: mood }),
  setDraftIntensity: (intensity) => set({ draftIntensity: intensity }),
  setDraftNotes: (notes) => set({ draftNotes: notes }),
  resetDraft: () => set({ ...initialDraft }),

  saveDraft: async (catalysts = []) => {
    const { draftState, draftMood, draftIntensity, draftNotes } = get();
    set({ isSaving: true, error: null });

    const { data: inserted, error } = await supabase
      .from('cognitive_state')
      .insert({
        state: draftState,
        mood: draftMood || null,
        intensity: draftIntensity,
        notes: draftNotes || null,
      })
      .select('id')
      .single();

    if (error || !inserted) {
      set({ isSaving: false, error: error?.message ?? 'Failed to save entry' });
      return null;
    }

    const entryId = inserted.id as string;

    for (const catalyst of catalysts) {
      const description = catalyst.description.trim();
      if (!description) continue;

      let entityId: string | null = null;
      const entityName = catalyst.entityName.trim();

      if (entityName) {
        const { data: existingEntity } = await supabase
          .from('entities')
          .select('id')
          .ilike('name', entityName)
          .limit(1)
          .maybeSingle();

        if (existingEntity) {
          entityId = existingEntity.id as string;
        } else {
          const { data: createdEntity, error: entityError } = await supabase
            .from('entities')
            .insert({ name: entityName })
            .select('id')
            .single();

          if (entityError) {
            set({ isSaving: false, error: entityError.message });
            return null;
          }
          entityId = createdEntity?.id as string;
        }
      }

      const { error: catalystError } = await supabase.from('catalysts').insert({
        cognitive_state_id: entryId,
        entity_id: entityId,
        description,
      });

      if (catalystError) {
        set({ isSaving: false, error: catalystError.message });
        return null;
      }
    }

    set({ isSaving: false, ...initialDraft });
    await Promise.all([get().fetchHistory(), get().fetchOpenLoops()]);

    const pageId = await createNotionPage(NOTION_DB.entries, {
      Name: notionProp.title(draftMood || 'Untitled'),
      State: notionProp.select(draftState),
      Intensity: notionProp.number(draftIntensity),
      Notes: notionProp.richText(draftNotes),
      'Created At': notionProp.date(new Date().toISOString()),
    });
    if (pageId) {
      await supabase.from('cognitive_state').update({ notion_page_id: pageId }).eq('id', entryId);
      await Promise.all([get().fetchHistory(), get().fetchOpenLoops()]);
    }

    return entryId;
  },

  fetchOpenLoops: async () => {
    const { data, error } = await supabase
      .from('cognitive_state')
      .select('*')
      .eq('state', 'unlocked')
      .order('created_at', { ascending: false });
    if (!error && data) set({ openLoops: data as CognitiveStateEntry[] });
  },

  fetchHistory: async () => {
    set({ isLoadingHistory: true, error: null });

    const { data, error } = await supabase
      .from('cognitive_state')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      set({ isLoadingHistory: false, error: error.message });
      return;
    }

    set({ isLoadingHistory: false, history: (data as CognitiveStateEntry[]) ?? [] });
  },

  closeEntry: async (id, resolutionNote) => {
    set({ isSaving: true, error: null });

    // The note goes in first: if it fails, nothing has changed yet. The
    // other order could resolve the entry and then lose the note.
    const trimmedNote = resolutionNote.trim();
    if (trimmedNote) {
      const { error: resolutionError } = await supabase.from('resolutions').insert({
        cognitive_state_id: id,
        description: trimmedNote,
        resolved_at: new Date().toISOString(),
      });

      if (resolutionError) {
        set({ isSaving: false, error: resolutionError.message });
        return false;
      }
    }

    const { error: updateError } = await supabase
      .from('cognitive_state')
      .update({ state: 'secured' })
      .eq('id', id);

    if (updateError) {
      set({ isSaving: false, error: updateError.message });
      return false;
    }

    set({ isSaving: false });
    await Promise.all([get().fetchHistory(), get().fetchOpenLoops()]);

    const notionPageId = get().history.find((e) => e.id === id)?.notion_page_id;
    if (notionPageId) {
      await updateNotionPage(notionPageId, { State: notionProp.select('secured') });
    }
    return true;
  },

  shelveEntry: async (id) => {
    set({ isSaving: true, error: null });

    const { error } = await supabase
      .from('cognitive_state')
      .update({ state: 'shelved' })
      .eq('id', id);

    if (error) {
      set({ isSaving: false, error: error.message });
      return false;
    }

    set({ isSaving: false });
    await Promise.all([get().fetchHistory(), get().fetchOpenLoops()]);

    const notionPageId = get().history.find((e) => e.id === id)?.notion_page_id;
    if (notionPageId) {
      await updateNotionPage(notionPageId, { State: notionProp.select('shelved') });
    }
    return true;
  },

  setTrove: async (id, inTrove) => {
    set({ error: null });

    const { error } = await supabase
      .from('cognitive_state')
      .update({ in_trove: inTrove })
      .eq('id', id);

    if (error) {
      set({ error: error.message });
      return;
    }

    await Promise.all([get().fetchHistory(), get().fetchOpenLoops()]);
  },
}));
