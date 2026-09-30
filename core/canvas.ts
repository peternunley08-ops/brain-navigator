// Canvas: pulls upcoming assignments and quizzes from the student's own
// Canvas account using a personal access token they generate in Canvas
// (Account → Settings → New access token). Talks to Canvas directly from
// the phone; the token is kept on the phone in hub.json.

import { dateKey } from './dates';
import { useHubStore } from './hubStore';
import { kindFor } from './scanParser';
import { CLASS_COLORS, useSchoolStore } from './schoolStore';

interface PlannerItem {
  plannable_id: number;
  plannable_type: string;
  course_id?: number;
  context_name?: string;
  plannable?: { title?: string; due_at?: string | null; todo_date?: string | null };
  plannable_date?: string;
  submissions?: { submitted?: boolean } | false;
}

export type CanvasResult = { ok: true; added: number; updated: number; classes: number } | { ok: false; message: string };

export function normalizeCanvasUrl(raw: string) {
  let u = raw.trim().replace(/\/+$/, '');
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

export async function syncCanvas(): Promise<CanvasResult> {
  const { baseUrl, token } = useHubStore.getState().canvas;
  const base = normalizeCanvasUrl(baseUrl);
  if (!base || !token.trim()) return { ok: false, message: 'Add your Canvas address and access token first.' };

  const today = dateKey();
  let items: PlannerItem[];
  try {
    const res = await fetch(`${base}/api/v1/planner/items?start_date=${today}&per_page=100`, {
      headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' },
    });
    if (res.status === 401) return { ok: false, message: 'Canvas didn’t accept that token. Make a new one and paste it again.' };
    if (!res.ok) return { ok: false, message: `Canvas answered with an error (${res.status}). Check the address.` };
    items = (await res.json()) as PlannerItem[];
  } catch {
    return { ok: false, message: 'Couldn’t reach Canvas. Check the address and your connection.' };
  }

  const school = useSchoolStore.getState();
  let classesAdded = 0;
  const classFor = (name?: string) => {
    if (!name) return null;
    const existing = useSchoolStore.getState().classes.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    const n = useSchoolStore.getState().classes.length;
    school.saveClass({ name, teacher: '', room: '', color: CLASS_COLORS[n % CLASS_COLORS.length], kind: 'class', days: [], start: 0, end: 0 });
    classesAdded++;
    return useSchoolStore.getState().classes.find((c) => c.name === name)?.id ?? null;
  };

  let added = 0;
  let updated = 0;
  for (const it of items) {
    if (!['assignment', 'quiz', 'discussion_topic'].includes(it.plannable_type)) continue;
    const title = it.plannable?.title?.trim();
    const when = it.plannable?.due_at ?? it.plannable?.todo_date ?? it.plannable_date;
    if (!title || !when) continue;
    const due = dateKey(new Date(when));
    const sourceId = `canvas:${it.plannable_type}:${it.plannable_id}`;
    const submitted = !!(it.submissions && it.submissions.submitted);
    const existing = useSchoolStore.getState().assignments.find((a) => a.sourceId === sourceId);
    if (existing) {
      if (existing.due !== due || existing.title !== title || (submitted && !existing.done)) {
        school.updateAssignment(existing.id, { due, title, ...(submitted ? { done: true, doneAt: new Date().toISOString() } : {}) });
        updated++;
      }
      continue;
    }
    if (submitted) continue;
    const created = school.addAssignment({
      title,
      kind: it.plannable_type === 'quiz' ? 'quiz' : kindFor(title),
      classId: classFor(it.context_name),
      due,
      minutes: null,
      notes: '',
    });
    school.updateAssignment(created.id, { sourceId });
    added++;
  }

  useHubStore.getState().setCanvas({ lastSync: new Date().toISOString() });
  return { ok: true, added, updated, classes: classesAdded };
}
