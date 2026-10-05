// Ember's note: the Desk's day cards, one at a time. Each card knows when it
// applies (its own when…() check, next to it in components/desk); this file
// only says which comes first and words the "more" link. Pure, so it's tested.

/** Every card that can be Ember's note, by name. */
export type DeskNoteId =
  | 'Birthday'
  | 'FollowUp'
  | 'Crew'
  | 'PickUp'
  | 'HelperNudge'
  | 'PlanTest'
  | 'TagTool'
  | 'WorryTime'
  | 'WelcomeBack'
  | 'TryThisWeek'
  | 'OneKindThing'
  | 'AboutCards'
  | 'WhatsNew'
  | 'Resurface'
  | 'NextBadge';

/**
 * First that applies is the one on the Desk. A birthday is the day's news;
 * then what Ember promised to ask about (continuity); then what's timely
 * (a draft left open, a test soon, today's check-in, worry time); then the
 * quieter ones. Cards that are always around (a past gratitude, the next
 * badge) come last so they never crowd out something timely.
 */
export const NOTE_ORDER: readonly DeskNoteId[] = [
  'Birthday',
  'FollowUp',
  'Crew',
  'PickUp',
  'HelperNudge',
  'PlanTest',
  'TagTool',
  'WorryTime',
  'WelcomeBack',
  'TryThisWeek',
  'OneKindThing',
  'AboutCards',
  'WhatsNew',
  'Resurface',
  'NextBadge',
];

/** The note to show and the rest, in order. Unknown ids go last, in the order given. */
export function pickNotes<T extends string>(eligible: readonly T[], order: readonly string[] = NOTE_ORDER): { shown: T | null; rest: T[] } {
  const rank = (id: T) => {
    const i = order.indexOf(id);
    return i < 0 ? order.length : i;
  };
  const sorted = [...new Set(eligible)].map((id, i) => ({ id, i })).sort((a, b) => rank(a.id) - rank(b.id) || a.i - b.i).map((x) => x.id);
  return { shown: sorted[0] ?? null, rest: sorted.slice(1) };
}

/** The link under Ember's note. */
export function moreLine(n: number) {
  return n > 0 ? `Ember has ${n} more` : 'That’s everything.';
}

/** A new student's first week: when the welcome finished, and the first-week notes already seen or skipped. */
export type FirstWeek = { started: string; done: string[] };

const DAY_MS = 86400000;

/** Days since the welcome (0 on the day itself), counting calendar days. */
export function firstWeekDay(fw: FirstWeek, today: string) {
  const at = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((at(today) - at(fw.started)) / DAY_MS);
}

/**
 * What the first week brings today. Day 2 (the day after the welcome): the
 * helper crew, until it's skipped or opened. The five This-or-that cards wait
 * until Day 3. Students who finished the welcome before this existed have no
 * firstWeek, so they get neither. After two weeks the crew note stops asking.
 */
export function firstWeekNotes(fw: FirstWeek | undefined, today: string) {
  if (!fw) return { crew: false, holdIntro: false };
  const day = firstWeekDay(fw, today);
  return {
    crew: day >= 1 && day < 14 && !fw.done.includes('crew'),
    holdIntro: day < 2,
  };
}

/** A card closed with × today (they come back tomorrow). */
export function closedToday(closed: { day: string; ids: string[] } | undefined, id: string, today: string) {
  return closed?.day === today && closed.ids.includes(id);
}
