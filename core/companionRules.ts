// What AI-companion laws ask of Ember's chat (California SB 243, New York
// GBL Art. 47): say plainly that Ember is an AI at the start of every
// conversation, and again with a nudge to take a break at least every three
// hours of continuing use. The crisis side (help lines on screen the moment
// something sounds like danger) lives in soundsLikeCrisis and HelpCard.

export const AI_DISCLOSURE = 'Ember is a computer program, not a person, and can’t feel emotions. It isn’t a therapist.';

export const AI_REMINDER =
  'A reminder: I’m a computer program, not a person. You’ve been talking with me for a while, so this could be a good moment for a break: stretch, get some water, or text someone you like.';

export const REMINDER_EVERY_MS = 3 * 60 * 60 * 1000;

/** True when the last disclosure or reminder was three or more hours ago. */
export function reminderDue(lastShownAt: number, now = Date.now()) {
  return now - lastShownAt >= REMINDER_EVERY_MS;
}
