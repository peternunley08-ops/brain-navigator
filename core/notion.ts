// Push-only sync to Notion. Best-effort: a Notion failure never blocks or
// throws into the caller — Supabase stays the source of truth, Notion is a
// one-way archive/dashboard.

import { isShowing } from './showMode';

const NOTION_VERSION = '2022-06-28';
const NOTION_API = 'https://api.notion.com/v1';

export const NOTION_DB = {
  tasks: process.env.EXPO_PUBLIC_NOTION_TASKS_DB_ID,
  checkins: process.env.EXPO_PUBLIC_NOTION_CHECKINS_DB_ID,
  entries: process.env.EXPO_PUBLIC_NOTION_ENTRIES_DB_ID,
};

function headers() {
  return {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

export async function createNotionPage(
  databaseId: string | undefined,
  properties: Record<string, unknown>
): Promise<string | null> {
  if (isShowing() || !process.env.EXPO_PUBLIC_NOTION_API_KEY || !databaseId) return null;

  try {
    const res = await fetch(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

export async function updateNotionPage(
  pageId: string | null | undefined,
  properties: Record<string, unknown>
): Promise<boolean> {
  if (isShowing() || !process.env.EXPO_PUBLIC_NOTION_API_KEY || !pageId) return false;

  try {
    const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ properties }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function archiveNotionPage(pageId: string | null | undefined): Promise<boolean> {
  if (isShowing() || !process.env.EXPO_PUBLIC_NOTION_API_KEY || !pageId) return false;

  try {
    const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ archived: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
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
