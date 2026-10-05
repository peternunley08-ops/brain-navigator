// Ember's note: the Desk's day cards, one at a time. Each card knows when it
// applies (its own when…() check, next to it in components/desk); this file
// only says which comes first and words the "more" link. Pure, so it's tested.

/** Every card that can be Ember's note, by name. */
export type DeskNoteId =
  | 'Birthday'
  | 'FollowUp'
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

/** A card closed with × today (they come back tomorrow). */
export function closedToday(closed: { day: string; ids: string[] } | undefined, id: string, today: string) {
  return closed?.day === today && closed.ids.includes(id);
}
