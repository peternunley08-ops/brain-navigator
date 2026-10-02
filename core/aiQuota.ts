import { addDays, daysUntil } from './dates';
import { useLifeStore, weekOf } from './lifeStore';
import { HELPERS } from './helpers';

// How much AI a student gets. Everything that runs on the phone — planning,
// flashcard quizzes, check-ins, every wellness tool, crisis lines — is free
// and unlimited. Only replies written by the AI (Ember's thinking brain and
// the helpers' AI modes) are counted, because each one costs real money.
//
//   Free — 20 AI replies a week, resets Monday.
//   Plus — 250 AI replies a month, $2.99/month or $19.99/year.
//
// Why 250 (decided 2026-10-01 from measured costs): a reply averages about
// 0.5–0.7¢ and the heaviest (Pip's plans) about 1.1¢, so a student who uses
// every Plus reply costs roughly $1.50–$2.75 a month. $2.99 is about $2.54
// after Apple's 15% (small business), so 400 could cost more than it earns.
//
// The count lives on the phone. Payments aren't connected yet (that needs a
// paid Apple Developer account, an App Store Connect subscription product,
// and a StoreKit library) — see `purchasePlus` below and CLAUDE.md.

export const FREE_PER_WEEK = 20;
export const PLUS_PER_MONTH = 250;

export const PLANS = {
  monthly: { price: '$2.99', per: 'month', note: 'Cancel anytime' },
  yearly: { price: '$19.99', per: 'year', note: 'About $1.67 a month — save 44%' },
} as const;

export type PlanKey = keyof typeof PLANS;

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Usage with any stale week/month rolled over. */
function current() {
  const { ai } = useLifeStore.getState();
  const week = weekOf();
  const month = monthKey();
  return {
    week,
    weekUsed: ai.week === week ? ai.weekUsed : 0,
    month,
    monthUsed: ai.month === month ? ai.monthUsed : 0,
  };
}

export interface AIStatus {
  plus: boolean;
  used: number;
  limit: number;
  left: number;
  /** "Monday" or "November 1" */
  resets: string;
  /** Whole days until it resets. */
  resetsIn: number;
}

export function aiStatus(): AIStatus {
  const plus = useLifeStore.getState().settings.plus;
  const u = current();
  if (plus) {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
      plus,
      used: u.monthUsed,
      limit: PLUS_PER_MONTH,
      left: Math.max(0, PLUS_PER_MONTH - u.monthUsed),
      resets: next.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      resetsIn: Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 86400000)),
    };
  }
  const days = daysUntil(addDays(u.week, 7));
  return {
    plus,
    used: u.weekUsed,
    limit: FREE_PER_WEEK,
    left: Math.max(0, FREE_PER_WEEK - u.weekUsed),
    resets: days <= 1 ? 'tomorrow' : 'Monday',
    resetsIn: Math.max(1, days),
  };
}

export function canUseAI() {
  return aiStatus().left > 0;
}

/**
 * Count one AI reply. Only called after a reply actually arrives. `cents`
 * is what it roughly cost; `counts` is false for background jobs (titles,
 * memory summaries) that don't use up the student's replies.
 */
export function recordAIUse(who = 'ember', cents = 0, counts = true, ms = 0) {
  const u = current();
  const log = [...(useLifeStore.getState().ai.log ?? []), { at: new Date().toISOString(), who, cents, ms, ...(counts ? {} : { free: true }) }].slice(-200);
  const add = counts ? 1 : 0;
  useLifeStore.getState().setAI({ week: u.week, weekUsed: u.weekUsed + add, month: u.month, monthUsed: u.monthUsed + add, log });
}

/** Rough AI spending (cents) and reply count over the last `days` days, from the phone's own log. */
export function aiSpend(days = 7) {
  const since = Date.now() - days * 86400000;
  let cents = 0;
  let replies = 0;
  const times: number[] = [];
  for (const e of useLifeStore.getState().ai.log ?? []) {
    if (new Date(e.at).getTime() < since) continue;
    cents += e.cents ?? 0;
    if (!e.free) replies += 1;
    if (!e.free && e.ms) times.push(e.ms);
  }
  times.sort((a, b) => a - b);
  // The typical wait, not the average, so one slow reply doesn't skew it.
  const typicalMs = times.length ? times[Math.floor(times.length / 2)] : 0;
  return { cents, replies, perReply: replies ? cents / replies : 0, typicalMs };
}

// What each one-shot job is called where replies are counted. Chats are
// named by the helper (or Ember) they went to.
const JOB_LABEL: Record<string, string> = {
  steps: 'Study steps',
  plan: 'Pip’s plans',
  scan: 'Reading scans',
  cards: 'Flashcards',
  practice: 'Practice questions',
  points: 'Key points',
  pick: 'What to do first',
  reflect: 'Hear from Ember',
  memory: 'Ember’s memory',
  test: 'Brain tests',
};

/** This week's (or, on Plus, this month's) replies, grouped by what they were for. */
export function aiBreakdown(): { who: string; label: string; count: number }[] {
  const { plus } = useLifeStore.getState().settings;
  const since = plus ? `${monthKey()}-01` : weekOf();
  const rows: Record<string, { who: string; label: string; count: number }> = {};
  for (const e of useLifeStore.getState().ai.log ?? []) {
    const d = new Date(e.at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (key < since || e.free) continue;
    const label = HELPERS.find((h) => h.id === e.who)?.name ?? JOB_LABEL[e.who] ?? 'Ember';
    rows[label] = { who: e.who, label, count: (rows[label]?.count ?? 0) + 1 };
  }
  return Object.values(rows).sort((a, b) => b.count - a.count);
}

export type PurchaseResult = { ok: true } | { ok: false; reason: 'not_configured' | 'cancelled' | 'failed' };

/**
 * Buy Plus. Not connected to the App Store yet: needs the Apple Developer
 * Program (paid), a subscription product in App Store Connect, and a
 * StoreKit library (react-native-iap, expo-iap, or RevenueCat) plus a
 * native rebuild. Until then this says so honestly instead of pretending.
 */
export async function purchasePlus(_plan: PlanKey): Promise<PurchaseResult> {
  return { ok: false, reason: 'not_configured' };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  return { ok: false, reason: 'not_configured' };
}
