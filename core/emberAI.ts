// Ember's AI voice, and every other AI job in the app. Talks to the
// `ember` Edge Function (Claude, with the key kept server-side — see
// supabase/functions/ember), which picks the model and prompt for each job.
// If it can't answer (no network, no credit, out of replies, AI turned
// off), callers get a reason back and fall back to the on-phone version.
//
// Privacy: what's typed (with phone numbers, emails, and addresses blanked
// by `redact`), plus the short note from `buildNote()`, is sent to
// Anthropic to write the reply. Nothing else.

import { FunctionsHttpError } from '@supabase/supabase-js';
import { router } from 'expo-router';
import type { IconName } from '../components/ui/Icon';
import { aboutForAI } from './about';
import { canUseAI, recordAIUse } from './aiQuota';
import { type Helper, type HelperId, helperById } from './helpers';
import { useLifeStore } from './lifeStore';
import { useHabitsStore } from './habitsStore';
import { clock, daysUntil, dueLabel, KIND_LABEL, nowState, useSchoolStore } from './schoolStore';
import { useBrainNavigatorStore } from './store';
import { supabase } from './supabase';
import { useTasksStore } from './tasksStore';
import { useWellnessStore } from './wellnessStore';

export interface EmberTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type EmberActionKey = 'breathe' | 'vent' | 'ground' | 'checkin' | 'setdown' | 'loops' | 'tasks' | 'habits' | 'map' | 'trends' | 'school' | 'focus' | 'help';

export const EMBER_ACTIONS: Record<EmberActionKey, { label: string; href: string; icon: IconName }> = {
  breathe: { label: 'Breathe with me', href: '/breathe', icon: 'wind' },
  vent: { label: 'Let it out', href: '/vent', icon: 'mic' },
  ground: { label: 'Ground yourself', href: '/steady', icon: 'steady' },
  checkin: { label: 'Check in', href: '/checkin', icon: 'sun' },
  setdown: { label: 'Set it down', href: '/new-entry', icon: 'plus' },
  loops: { label: 'See what’s open', href: '/open-loops', icon: 'loops' },
  tasks: { label: 'To-dos', href: '/tasks', icon: 'plate' },
  habits: { label: 'Habits', href: '/habits', icon: 'repeat' },
  map: { label: 'The Map', href: '/topography', icon: 'map' },
  trends: { label: 'Trends', href: '/trends', icon: 'trend' },
  school: { label: 'School', href: '/school', icon: 'book' },
  focus: { label: 'Focus with me', href: '/focus', icon: 'timer' },
  help: { label: 'Need help now', href: '/help', icon: 'phone' },
};

/** Something listed in the app note that a reply can offer to open. */
export interface NoteRef {
  kind: 'assignment' | 'desk';
  id: string;
  label: string;
}

export interface EmberReply {
  ok: true;
  reply: string;
  /** The first suggested action (older code reads only this). */
  action: EmberActionKey | null;
  actions: EmberActionKey[];
  /** Short things the student might say next. */
  chips: string[];
  todo: string | null;
  setdown: { title: string; weight: number } | null;
  focus: { minutes: number; what: string } | null;
  helper: HelperId | null;
  open: NoteRef | null;
  /** Something Ember would like to remember; the app asks first. */
  remember: string | null;
  score: { right: number; wrong: number } | null;
  /** Pip gave a plan that could go on tonight. */
  plan: boolean;
  /** Every model declined, and this is the gentle stand-in reply. */
  refused: boolean;
  /** Rough cost of this reply in cents. */
  cents: number;
  ms: number;
  /** Exactly what was sent along about the app, for "What did Ember see?" */
  note: string;
  /** The server's prompt version, kept with any rating of this reply. */
  v: string;
}

export type EmberAIResult = EmberReply | { ok: false; reason: AIFailure };

/**
 * Why the AI didn't answer.
 * `limit` = this week's free AI replies are used up; `off` = the student
 * turned AI off; `spend_limit` = the Anthropic account hit its monthly cap.
 */
export type AIFailure = 'no_credit' | 'spend_limit' | 'offline' | 'unavailable' | 'limit' | 'busy' | 'timeout' | 'off' | 'consent';

const DAY = 24 * 60 * 60 * 1000;
const TIMEOUT = 45_000;

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function clockOf(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

// Phone numbers, emails, and street addresses never leave the phone: they're
// blanked in anything the student typed before it's sent.
export function redact(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[phone]')
    .replace(/\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Ln|Lane|Dr|Drive|Ct|Court|Way|Pl|Place|Cir|Circle)\b\.?/g, '[address]');
}

// Words that mean the help lines should be on screen right now, before any
// AI is asked, and even when there's no connection or no replies left.
const CRISIS =
  /\b(suicid\w*|kill (my ?self|me)|end (it all|my life)|want(ed)? to die|wanna die|don'?t want to (live|be here|exist)|no reason to live|better off (dead|without me)|self[- ]?harm\w*|hurt(ing)? my ?self|cut(ting)? my ?self|overdos\w*|(he|she|they|my (?:dad|mom|father|mother|step ?(?:dad|mom)|parents?|brother|sister|boyfriend|girlfriend)) (hits?|hurts?|hit|hurt) me|being abused|not safe at home)\b/i;

export function soundsLikeCrisis(text: string) {
  return CRISIS.test(text);
}

export interface NoteOptions {
  /** Ember only reflects and asks; no advice. */
  justListen?: boolean;
  /** Leave the Desk and today's check-in out of what's sent. */
  private?: boolean;
  /** One-line memories from earlier conversations. */
  memories?: string[];
}

// A short, factual note about right now, so answers can be about this
// person's actual day. Only what the app already shows on screen. Things it
// lists get short references (a1, d1) a reply can use to offer opening them.
export function buildNote(screen: string, opts: NoteOptions = {}, now = new Date()): { text: string; refs: Record<string, NoteRef> } {
  const lines: string[] = [];
  const refs: Record<string, NoteRef> = {};
  // The time to the quarter hour: precise enough for "it's late", and the
  // note stays the same from one message to the next.
  const quarter = new Date(now);
  quarter.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);
  lines.push(
    `Today: ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} (${todayKey(now)}), about ${quarter.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
  );
  lines.push(`They opened this from: ${screen}.`);
  if (opts.justListen) lines.push('Just listen is on: reflect and ask, no advice.');

  const school = useSchoolStore.getState();
  const first = school.profile.name.trim().split(/\s+/)[0];
  if (first) lines.push(`Their first name: ${first.slice(0, 30)}.`);
  if (school.profile.grade) lines.push(`They're in grade ${school.profile.grade}.`);
  // About you goes along only if they turned sharing on: one line, never
  // their answers to the daily questions.
  const about = aboutForAI(useLifeStore.getState().about);
  if (about) lines.push(`About them, in their own words (use lightly, don't recite it): ${redact(about)}.`);
  const settings = useLifeStore.getState().settings;
  lines.push(`Wind-down starts at ${clockOf(settings.windDown)}. Nightly homework cap: ${school.profile.nightlyCap} min. Sleep goal: ${school.profile.sleepGoal} h.`);
  const ns = nowState(school.classes, now);
  if (ns.kind === 'in') lines.push(`Right now: in ${ns.cls.name} until ${clock(ns.cls.end)}.`);
  else if (ns.kind === 'next') lines.push(`Next class: ${ns.cls.name} at ${clock(ns.cls.start)}.`);
  const due = school.assignments
    .filter((a) => !a.done && daysUntil(a.due) <= 7)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 8);
  if (due.length) {
    lines.push('Due in the next week:');
    due.forEach((a, i) => {
      const ref = `a${i + 1}`;
      refs[ref] = { kind: 'assignment', id: a.id, label: a.title.slice(0, 40) };
      const cls = school.classes.find((c) => c.id === a.classId)?.name;
      const steps = a.subtasks?.length ? `, ${a.subtasks.filter((t) => t.done).length}/${a.subtasks.length} steps done` : '';
      lines.push(`- [${ref}] ${KIND_LABEL[a.kind]}: "${a.title.slice(0, 60)}"${cls ? ` (${cls})` : ''}, due ${dueLabel(a.due)} (${a.due})${a.minutes ? `, ~${a.minutes} min` : ''}${steps}`);
    });
  } else if (school.classes.length) {
    lines.push('Nothing due in the next week.');
  }

  if (!opts.private) {
    const open = [...useBrainNavigatorStore.getState().openLoops].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (open.length === 0) {
      lines.push('Nothing is open on their Desk right now.');
    } else {
      lines.push(`Open on their Desk (${open.length}):`);
      open.slice(0, 6).forEach((e, i) => {
        const ref = `d${i + 1}`;
        refs[ref] = { kind: 'desk', id: e.id, label: (e.mood ?? 'Untitled').slice(0, 40) };
        const days = Math.floor((now.getTime() - new Date(e.created_at).getTime()) / DAY);
        lines.push(`- [${ref}] "${(e.mood ?? 'Untitled').slice(0, 60)}", weight ${e.intensity ?? '?'}/10, open ${days <= 0 ? 'since today' : `${days} days`}`);
      });
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
  } else {
    lines.push('They asked not to share their Desk or check-in this time.');
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

  if (opts.memories?.length) {
    lines.push('Ember remembers from before (use lightly):');
    for (const m of opts.memories.slice(0, 5)) lines.push(`- ${m.slice(0, 160)}`);
  }

  return { text: lines.join('\n'), refs };
}

/**
 * What Ember remembers, for the note: the last three chat summaries and up
 * to five facts the student agreed to. Nothing when memory is off.
 */
export function memoriesForNote() {
  const { emberMemory, settings } = useLifeStore.getState();
  if (settings.memoryOff) return [];
  const chats = emberMemory.filter((m) => m.kind === 'chat').slice(-3);
  const facts = emberMemory.filter((m) => m.kind === 'fact').slice(-5);
  return [
    ...facts.map((m) => m.text),
    ...chats.map((m) => `${new Date(m.at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${m.text}`),
  ];
}

/** A follow-up that's due: something they mentioned that has now happened (within the last 3 days). */
export function dueFollowUp(today = todayKey()) {
  const { emberMemory, settings } = useLifeStore.getState();
  if (settings.memoryOff) return null;
  const threeAgo = todayKey(new Date(Date.now() - 3 * DAY));
  return [...emberMemory].reverse().find((m) => m.followUp && m.followUpDate && !m.followedUp && m.followUpDate <= today && m.followUpDate >= threeAgo) ?? null;
}

/** A follow-up Ember will ask about on that date (memory on, not asked yet), for the goodnight line. */
export function followUpOn(date: string) {
  const { emberMemory, settings } = useLifeStore.getState();
  if (settings.memoryOff) return null;
  return [...emberMemory].reverse().find((m) => m.followUp && m.followUpDate === date && !m.followedUp) ?? null;
}

/** The event a follow-up is about, as a few words: "Check in about how the chem test went" → "the chem test". */
export function followUpTopic(followUp: string) {
  const t = followUp
    .trim()
    .replace(/[.!?]+$/, '')
    .replace(/^(?:check in|ask|follow up|see)(?:\s+(?:about|on|with them about))?\s+/i, '')
    .replace(/^(?:how|whether)\s+/i, '')
    .replace(/\s+(?:went|goes|is going|turned out)$/i, '');
  return t || followUp;
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

function reasonFrom(info: { status: number; body: Record<string, unknown> | null }): AIFailure {
  const code = info.body?.code;
  if (code === 'no_credit' || /credit balance/i.test(JSON.stringify(info.body ?? {}))) return 'no_credit';
  if (code === 'spend_limit') return 'spend_limit';
  if (code === 'busy' || info.status === 429) return 'busy';
  return 'unavailable';
}

// What a reply costs, from the token counts the function sends back.
// Dollars per million tokens (Sonnet 5.5: $2 in / $10 out; Haiku 4.5: $1 / $5).
// Cache writes cost 1.25× input, cache reads 0.1×.
export function centsFor(usage: { model?: string; input?: number; output?: number; cacheRead?: number; cacheWrite?: number } | undefined) {
  if (!usage) return 0;
  const p = /haiku/.test(usage.model ?? '') ? { i: 1, o: 5 } : { i: 2, o: 10 };
  const dollars = ((usage.input ?? 0) * p.i + (usage.cacheWrite ?? 0) * p.i * 1.25 + (usage.cacheRead ?? 0) * p.i * 0.1 + (usage.output ?? 0) * p.o) / 1e6;
  return Math.round(dollars * 100 * 1000) / 1000;
}

type Kind = 'talk' | 'helper' | 'summary' | 'title' | 'steps' | 'plan' | 'scan' | 'cards' | 'points' | 'practice' | 'pick' | 'reflect' | 'ping';

/** Background jobs that don't use up the student's weekly AI replies. */
const FREE_KINDS = new Set<Kind>(['summary', 'title', 'ping']);

/** True until the student has agreed to send things to the AI (App Store 5.1.2(i), health-data consent laws). */
export function needsAIConsent() {
  return !useLifeStore.getState().settings.aiConsentAt;
}

async function callEmber(body: Record<string, unknown>): Promise<{ ok: true; data: Record<string, any> } | { ok: false; reason: AIFailure }> {
  if (useLifeStore.getState().settings.aiOff) return { ok: false, reason: 'off' };
  // Nothing leaves for the AI without a yes. A request the student made opens
  // the consent sheet; background jobs just stop.
  if (needsAIConsent()) {
    if (!FREE_KINDS.has(body.kind as Kind)) router.push('/ai-consent');
    return { ok: false, reason: 'consent' };
  }
  const started = Date.now();
  const { data, error } = await supabase.functions.invoke('ember', { body, timeout: TIMEOUT });
  if (!error && data) return { ok: true, data };
  const info = await readError(error);
  if (!info) return { ok: false, reason: Date.now() - started >= TIMEOUT - 250 ? 'timeout' : 'offline' };
  return { ok: false, reason: reasonFrom(info) };
}

function cleanTurns(turns: EmberTurn[]) {
  return turns.map((t) => (t.role === 'user' ? { ...t, content: redact(t.content) } : t));
}

const asAction = (a: unknown) => (typeof a === 'string' && a in EMBER_ACTIONS ? (a as EmberActionKey) : null);

function toReply(data: Record<string, any>, refs: Record<string, NoteRef>, note: string): EmberReply {
  const actions = (Array.isArray(data.actions) ? data.actions : [data.action]).map(asAction).filter((a: EmberActionKey | null): a is EmberActionKey => !!a);
  return {
    ok: true,
    reply: String(data.reply),
    action: actions[0] ?? null,
    actions,
    chips: Array.isArray(data.chips) ? data.chips.map(String).slice(0, 3) : [],
    todo: typeof data.todo === 'string' ? data.todo : null,
    setdown: data.setdown ?? null,
    focus: data.focus ?? null,
    helper: helperById(data.helper)?.id ?? null,
    open: typeof data.open === 'string' ? (refs[data.open] ?? null) : null,
    remember: typeof data.remember === 'string' ? data.remember : null,
    score: data.score ?? null,
    plan: !!data.plan,
    refused: !!data.refused,
    cents: centsFor(data.usage),
    ms: Number(data.ms) || 0,
    note,
    v: typeof data.v === 'string' ? data.v : '',
  };
}

/** Ember's conversation. */
export async function askEmber(turns: EmberTurn[], screen: string, opts: NoteOptions = {}): Promise<EmberAIResult> {
  if (!canUseAI()) return { ok: false, reason: 'limit' };
  const { text, refs } = buildNote(screen, { ...opts, memories: opts.memories ?? memoriesForNote() });
  const res = await callEmber({ kind: 'talk', messages: cleanTurns(turns), context: text });
  if (!res.ok) return res;
  if (!res.data.reply) return { ok: false, reason: 'unavailable' };
  const reply = toReply(res.data, refs, text);
  recordAIUse('ember', reply.cents, true, reply.ms);
  return reply;
}

/**
 * One of the helper crew answers, in its own persona. Counts against the
 * same AI allowance as Ember. `extra` is anything the helper was spawned
 * with (an assignment, a deck).
 */
export async function askHelper(helper: Helper, turns: EmberTurn[], extra?: string): Promise<EmberAIResult> {
  if (!canUseAI()) return { ok: false, reason: 'limit' };
  const { text, refs } = buildNote(`Talking with ${helper.name} (${helper.role})`);
  const note = [text, extra].filter(Boolean).join('\n');
  const res = await callEmber({ kind: 'helper', agent: helper.id, messages: cleanTurns(turns), context: note });
  if (!res.ok) return res;
  if (!res.data.reply) return { ok: false, reason: 'unavailable' };
  const reply = toReply(res.data, refs, note);
  recordAIUse(helper.id, reply.cents, true, reply.ms);
  return reply;
}

export type JobResult<T> = { ok: true; data: T; cents: number; ms: number; model: string; refs: Record<string, NoteRef> } | { ok: false; reason: AIFailure };

/**
 * A one-off job: structured ones (steps, plan, scan, cards, points,
 * practice, pick, summary) come back as data; text ones (title, reflect,
 * ping) as `{ reply }`. `input` is what to work on; `screen` adds the app
 * note when the job needs to know about the day.
 */
const NO_NOTE = new Set<string>(['cards', 'practice', 'points', 'title', 'ping']);

export async function askJob<T = { reply: string }>(kind: Kind, input: string, opts: { screen?: string; who?: string; note?: NoteOptions } = {}): Promise<JobResult<T>> {
  const free = FREE_KINDS.has(kind);
  if (!free && !canUseAI()) return { ok: false, reason: 'limit' };
  // Jobs that work only from their input never carry the app note.
  const built = opts.screen && !NO_NOTE.has(kind) ? buildNote(opts.screen, opts.note) : null;
  const res = await callEmber({ kind, messages: [{ role: 'user', content: redact(input) }], context: built?.text });
  if (!res.ok) return res;
  const payload = res.data.data ?? (typeof res.data.reply === 'string' ? { reply: res.data.reply } : null);
  if (!payload) return { ok: false, reason: 'unavailable' };
  const cents = centsFor(res.data.usage);
  const ms = Number(res.data.ms) || 0;
  recordAIUse(opts.who ?? kind, cents, !free, ms);
  return { ok: true, data: payload as T, cents, ms, model: String(res.data.usage?.model ?? ''), refs: built?.refs ?? {} };
}

/** Why a one-tap AI button couldn't help, in a line (not in Ember's voice). */
export function aiFailLine(reason: AIFailure) {
  switch (reason) {
    case 'off':
      return 'AI is turned off. You can turn it back on from How AI works here.';
    case 'consent':
      return 'AI needs your OK first. Nothing was sent.';
    case 'limit':
      return 'That’s all your free AI replies for this week.';
    case 'no_credit':
      return 'The AI account behind this is out of credit right now.';
    case 'spend_limit':
      return 'The AI hit this month’s spending limit.';
    case 'offline':
      return 'No connection right now. Try again in a bit.';
    case 'busy':
      return 'The AI is swamped for a moment. Try again in a minute.';
    case 'timeout':
      return 'That took too long. Try again.';
    default:
      return 'The AI isn’t answering right now. Try again later.';
  }
}

export function whyOffline(reason: AIFailure) {
  if (reason === 'off') return 'AI is turned off in Settings, so I’ll use my own questions. Everything else still works.';
  if (reason === 'consent') return 'My thinking brain needs your OK before anything is sent, so I’ll use my own questions for now. Nothing left your phone.';
  if (reason === 'busy') return 'My thinking brain is swamped for a moment. Try again in a minute, or I’ll use my own questions for now.';
  if (reason === 'timeout') return 'That took too long to think through, so I stopped waiting. Try again, or I’ll use my own questions for now.';
  if (reason === 'spend_limit') return 'My thinking brain hit this month’s spending limit, so I’ll use my own questions for now.';
  if (reason === 'limit') return 'That’s all your free AI replies for this week. Plus gives you way more — or I’ll keep going with my own questions for free.';
  if (reason === 'no_credit') return 'My thinking brain is resting — the Anthropic account behind it is out of credit — so I’ll use my own questions for now.';
  if (reason === 'offline') return 'I can’t reach my thinking brain right now (no connection?), so I’ll use my own questions for now.';
  return 'My thinking brain isn’t answering right now, so I’ll use my own questions for now.';
}
