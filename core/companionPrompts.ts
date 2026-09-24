// A small, fixed set of caring prompts for the companion flow — no AI, no
// dynamic responses. Ember asks one opening question, then one gentle
// follow-up, both drawn at random from these pools each visit.

export const OPENING_PROMPTS: string[] = [
  "What's weighing on you today?",
  'Want to tell me what happened?',
  'How are you, really?',
  "What's been sitting with you today?",
  'What would you say if no one was grading the answer?',
];

export const FOLLOW_UP_PROMPTS: string[] = [
  'Is there anything else you want to get off your chest?',
  'What would help right now?',
  'Anything else on your mind?',
  'Is there a part of that you haven’t said out loud yet?',
  "What's the part you'd skip over if you were telling someone else?",
];

export const CLOSING_LINES: string[] = [
  "Thank you for telling me. That's a lot to carry.",
  "I'm glad you said that out loud.",
  'That took something. Thank you.',
  "Noted, and kept safe. You don't have to carry that alone right now.",
];

export function randomFrom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}
