// Ember's AI voice. Talks to the `ember` Edge Function (Claude, with the
// key kept server-side — see supabase/functions/ember). If that function
// isn't deployed yet, falls back to the older `chat` function with Ember's
// persona folded into the message. If neither can answer (no network, or
// the Anthropic account has no credit), callers get a reason back and
// Ember falls back to its built-in, no-AI questions.
//
// Privacy: what's typed to Ember, plus the short summary from
// `emberContext()`, is sent to Anthropic to write the reply.

import { FunctionsHttpError } from '@supabase/supabase-js';
import type { IconName } from '../components/ui/Icon';
import { useHabitsStore } from './habitsStore';
import { useBrainNavigatorStore } from './store';
import { supabase } from './supabase';
import { useTasksStore } from './tasksStore';
import { useWellnessStore } from './wellnessStore';

export interface EmberTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type EmberActionKey = 'breathe' | 'vent' | 'ground' | 'checkin' | 'setdown' | 'loops' | 'tasks' | 'habits' | 'map' | 'trends';

export const EMBER_ACTIONS: Record<EmberActionKey, { label: string; href: string; icon: IconName }> = {
  breathe: { label: 'Breathe with me', href: '/breathe', icon: 'wind' },
  vent: { label: 'Let it out', href: '/vent', icon: 'mic' },
  ground: { label: 'Ground yourself', href: '/steady', icon: 'steady' },
  checkin: { label: 'Check in', href: '/checkin', icon: 'sun' },
  setdown: { label: 'Set it down', href: '/new-entry', icon: 'plus' },
  loops: { label: 'See what’s open', href: '/open-loops', icon: 'loops' },
  tasks: { label: 'Your plate', href: '/tasks', icon: 'plate' },
  habits: { label: 'Habits', href: '/habits', icon: 'repeat' },
  map: { label: 'The Map', href: '/topography', icon: 'map' },
  trends: { label: 'Trends', href: '/trends', icon: 'trend' },
};

export type EmberAIResult =
  | { ok: true; reply: string; action: EmberActionKey | null }
  | { ok: false; reason: 'no_credit' | 'offline' | 'unavailable' };

const DAY = 24 * 60 * 60 * 1000;

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// A short, factual note about right now, so Ember's answers can be about
// this person's actual day. Only what the app already shows on screen.
export function emberContext(screen: string, now = new Date()) {
  const lines: string[] = [];
  lines.push(
    `Local time: ${now.toLocaleDateString('en-US', { weekday: 'long' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
  );
  lines.push(`They opened this conversation from: ${screen}.`);

  const open = [...useBrainNavigatorStore.getState().openLoops].sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (open.length === 0) {
    lines.push('Nothing is open on their Desk right now.');
  } else {
    lines.push(`Open on their Desk (${open.length}):`);
    for (const e of open.slice(0, 6)) {
      const days = Math.floor((now.getTime() - new Date(e.created_at).getTime()) / DAY);
      lines.push(`- "${(e.mood ?? 'Untitled').slice(0, 60)}", weight ${e.intensity ?? '?'}/10, open ${days <= 0 ? 'since today' : `${days} days`}`);
    }
  }

  const c = useWellnessStore.getState().todaysCheckin();
  if (c) {
    const parts = [
      c.mood != null ? `mood ${c.mood}/5` : null,
      c.stress_level != null ? `stress ${c.stress_level}/10` : null,
      c.sleep_hours != null ? `slept ${c.sleep_hours}h` : null,
      c.sleep_quality != null ? `sleep quality ${c.sleep_quality}/5` : null,
    ].filter(Boolean);
    lines.push(`Today's check-in: ${parts.join(', ') || 'saved, no numbers'}.`);
  } else {
    lines.push('No check-in yet today.');
  }

  const { tasks, dailyCap } = useTasksStore.getState();
  if (tasks.length) {
    const done = tasks.filter((t) => t.completed).length;
    lines.push(`Plate: ${done} of ${tasks.length} tasks done, daily cap ${dailyCap}.`);
  }

  const { habits, logs } = useHabitsStore.getState();
  const active = habits.filter((h) => !h.archived && h.frequency === 'daily');
  if (active.length) {
    const today = todayKey(now);
    const done = active.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === today)).length;
    lines.push(`Daily habits: ${done} of ${active.length} done today.`);
  }

  return lines.join('\n');
}

async function readError(error: unknown): Promise<{ status: number; body: Record<string, unknown> | null } | null> {
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    let body: Record<string, unknown> | null = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, body };
  }
  return null;
}

function reasonFrom(body: Record<string, unknown> | null): 'no_credit' | 'unavailable' {
  const text = JSON.stringify(body ?? {});
  return body?.code === 'no_credit' || /credit balance/i.test(text) ? 'no_credit' : 'unavailable';
}

const PERSONA =
  'You are Ember, the small warm flame mascot in this app. Reply in one to three short sentences, one question at a time. If one of these would genuinely help, end with exactly one tag like [[action:breathe]] using: breathe, vent, ground, checkin, setdown, loops, tasks, habits, map, trends.';

// Once we know the `ember` function isn't deployed, go straight to `chat`.
let emberMissing = false;

export async function askEmber(turns: EmberTurn[], screen: string): Promise<EmberAIResult> {
  const context = emberContext(screen);

  if (!emberMissing) {
    const { data, error } = await supabase.functions.invoke('ember', { body: { messages: turns, context } });
    if (!error && data?.reply) {
      const action = data.action && data.action in EMBER_ACTIONS ? (data.action as EmberActionKey) : null;
      return { ok: true, reply: String(data.reply), action };
    }
    const info = await readError(error);
    if (!info) return { ok: false, reason: 'offline' };
    if (info.status !== 404) return { ok: false, reason: reasonFrom(info.body) };
    emberMissing = true;
  }

  // Fallback: the older general `chat` function. Fold Ember's persona and
  // the context into the first message, since that function has its own
  // fixed system prompt.
  const first = turns.findIndex((t) => t.role === 'user');
  const messages = turns.slice(first).map((t, i) =>
    i === 0 ? { role: t.role, content: `(${PERSONA}\n\nWhat the app knows right now:\n${context})\n\n${t.content}` } : t
  );
  const { data, error } = await supabase.functions.invoke('chat', { body: { messages } });
  if (!error && data?.reply) {
    let reply = String(data.reply);
    let action: EmberActionKey | null = null;
    const tag = reply.match(/\[\[action:([a-z]+)\]\]\s*$/i);
    if (tag) {
      const key = tag[1].toLowerCase();
      if (key in EMBER_ACTIONS) action = key as EmberActionKey;
      reply = reply.slice(0, tag.index).trim();
    }
    return { ok: true, reply, action };
  }
  const info = await readError(error);
  if (!info) return { ok: false, reason: 'offline' };
  return { ok: false, reason: reasonFrom(info.body) };
}

export function whyOffline(reason: 'no_credit' | 'offline' | 'unavailable') {
  if (reason === 'no_credit') return 'My thinking brain is resting — the Anthropic account behind it is out of credit — so I’ll use my own questions for now.';
  if (reason === 'offline') return 'I can’t reach my thinking brain right now (no connection?), so I’ll use my own questions for now.';
  return 'My thinking brain isn’t answering right now, so I’ll use my own questions for now.';
}
