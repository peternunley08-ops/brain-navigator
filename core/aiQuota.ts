import { addDays, daysUntil } from './dates';
import { useLifeStore, weekOf } from './lifeStore';

// How much AI a student gets. Everything that runs on the phone — planning,
// flashcard quizzes, check-ins, every wellness tool, crisis lines — is free
// and unlimited. Only replies written by the AI (Ember's thinking brain and
// the helpers' AI modes) are counted, because each one costs real money.
//
//   Free — 20 AI replies a week, resets Monday.
//   Plus — 400 AI replies a month, $2.99/month or $19.99/year.
//
// The count lives on the phone. Payments aren't connected yet (that needs a
// paid Apple Developer account, an App Store Connect subscription product,
// and a StoreKit library) — see `purchasePlus` below and CLAUDE.md.

export const FREE_PER_WEEK = 20;
export const PLUS_PER_MONTH = 400;

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

/** Count one AI reply. Only called after a reply actually arrives. */
export function recordAIUse(who = 'ember') {
  const u = current();
  const log = [...(useLifeStore.getState().ai.log ?? []), { at: new Date().toISOString(), who }].slice(-60);
  useLifeStore.getState().setAI({ week: u.week, weekUsed: u.weekUsed + 1, month: u.month, monthUsed: u.monthUsed + 1, log });
}

/** This week's (or, on Plus, this month's) replies, grouped by who they went to. */
export function aiBreakdown(): { who: string; count: number }[] {
  const { plus } = useLifeStore.getState().settings;
  const since = plus ? `${monthKey()}-01` : weekOf();
  const counts: Record<string, number> = {};
  for (const e of useLifeStore.getState().ai.log ?? []) {
    const d = new Date(e.at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (key >= since) counts[e.who] = (counts[e.who] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([who, count]) => ({ who, count }))
    .sort((a, b) => b.count - a.count);
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
