// Push-only sync to Notion. Best-effort: a Notion failure never blocks or
// throws into the caller — Supabase stays the source of truth, Notion is a
// one-way archive/dashboard. The Notion key lives only in the `notion` Supabase
// function; the app never holds it.

import { IS_RELEASE } from './build';
import { isShowing } from './showMode';
import { supabase } from './supabase';

// These are the developer's own Notion databases. A release build never
// syncs: other students' data must not reach this workspace (until each
// student can connect their own Notion).
export const NOTION_DB = IS_RELEASE
  ? { tasks: undefined, checkins: undefined, entries: undefined }
  : {
      tasks: process.env.EXPO_PUBLIC_NOTION_TASKS_DB_ID,
      checkins: process.env.EXPO_PUBLIC_NOTION_CHECKINS_DB_ID,
      entries: process.env.EXPO_PUBLIC_NOTION_ENTRIES_DB_ID,
    };

async function call(body: Record<string, unknown>): Promise<{ id?: string | null } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('notion', { body });
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createNotionPage(
  databaseId: string | undefined,
  properties: Record<string, unknown>
): Promise<string | null> {
  if (IS_RELEASE || isShowing() || !databaseId) return null;
  const data = await call({ action: 'create', databaseId, properties });
  return data?.id ?? null;
}

export async function updateNotionPage(
  pageId: string | null | undefined,
  properties: Record<string, unknown>
): Promise<boolean> {
  if (IS_RELEASE || isShowing() || !pageId) return false;
  return (await call({ action: 'update', pageId, properties })) !== null;
}

export async function archiveNotionPage(pageId: string | null | undefined): Promise<boolean> {
  if (IS_RELEASE || isShowing() || !pageId) return false;
  return (await call({ action: 'archive', pageId })) !== null;
}

export const notionProp = {
  title: (text: string) => ({ title: [{ text: { content: text.slice(0, 2000) } }] }),
  select: (name: string) => ({ select: { name } }),
  checkbox: (checked: boolean) => ({ checkbox: checked }),
  date: (iso: string) => ({ date: { start: iso } }),
  number: (n: number | null) => ({ number: n }),
  richText: (text: string) => ({
    rich_text: text ? [{ text: { content: text.slice(0, 2000) } }] : [],
  }),
};
