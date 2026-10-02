import type { IconName } from '../components/ui/Icon';
import { dateKey } from './dates';
import { type AboutMe, useLifeStore } from './lifeStore';

// What the app can learn about a student by asking, gently and playfully.
// Everything here stays on the phone; see About you (app/about.tsx).

/** "This or that": two sides, each with an icon and the trait it means. */
export interface ThisOrThat {
  id: string;
  a: { label: string; icon: IconName };
  b: { label: string; icon: IconName };
}

export const THIS_OR_THAT: ThisOrThat[] = [
  { id: 'time', a: { label: 'Morning person', icon: 'sun' }, b: { label: 'Night owl', icon: 'moon' } },
  { id: 'sound', a: { label: 'Music on', icon: 'music' }, b: { label: 'Total quiet', icon: 'feather' } },
  { id: 'company', a: { label: 'Study with friends', icon: 'people' }, b: { label: 'Study alone', icon: 'book' } },
  { id: 'plan', a: { label: 'Plan it all out', icon: 'list' }, b: { label: 'Figure it out as I go', icon: 'arrow' } },
  { id: 'feel', a: { label: 'Talk it out', icon: 'chat' }, b: { label: 'Write it down', icon: 'pen' } },
  { id: 'start', a: { label: 'Hardest thing first', icon: 'flag' }, b: { label: 'Easy warm-up first', icon: 'sparkle' } },
  { id: 'break', a: { label: 'Short breaks often', icon: 'timer' }, b: { label: 'Long stretch, one break', icon: 'candle' } },
  { id: 'recharge', a: { label: 'Recharge with people', icon: 'heart' }, b: { label: 'Recharge alone', icon: 'bed' } },
  { id: 'deadline', a: { label: 'Done early', icon: 'check' }, b: { label: 'Last-minute energy', icon: 'flame' } },
  { id: 'learn', a: { label: 'Show me', icon: 'image' }, b: { label: 'Tell me', icon: 'chat' } },
  { id: 'praise', a: { label: 'Cheer me on loud', icon: 'sparkle' }, b: { label: 'Keep it low-key', icon: 'feather' } },
  { id: 'weekend', a: { label: 'Busy weekend', icon: 'calendar' }, b: { label: 'Do-nothing weekend', icon: 'moon' } },
];

/** What a pick means, in a few words, for About you and the AI line. */
export function pickLabel(card: ThisOrThat, side: string) {
  return side === 'a' ? card.a.label : side === 'b' ? card.b.label : null;
}

export const INTERESTS = [
  'Music', 'Sports', 'Gaming', 'Art', 'Reading', 'Writing', 'Movies', 'Anime', 'Cooking', 'Fashion',
  'Science', 'Coding', 'Theater', 'Dance', 'Photography', 'Animals', 'Outdoors', 'Cars', 'Volunteering', 'Faith',
];

export const SUBJECTS = ['Math', 'English', 'History', 'Science', 'Chemistry', 'Biology', 'Physics', 'Languages', 'Art', 'Computer science', 'Economics', 'Music'];

export const STUDY_WAYS: { id: string; label: string; icon: IconName }[] = [
  { id: 'cards', label: 'Flashcards', icon: 'cards' },
  { id: 'practice', label: 'Practice problems', icon: 'pen' },
  { id: 'explain', label: 'Explaining it out loud', icon: 'chat' },
  { id: 'draw', label: 'Drawing it out', icon: 'image' },
  { id: 'reread', label: 'Rereading notes', icon: 'book' },
  { id: 'group', label: 'Studying with someone', icon: 'people' },
];

/** Calming tools a student can pick; ids match where they live. */
export const CALMERS: { id: string; label: string; icon: IconName; path: string }[] = [
  { id: 'breathe', label: 'Breathing', icon: 'wind', path: '/breathe' },
  { id: 'vent', label: 'Letting it out', icon: 'mic', path: '/vent' },
  { id: 'ember', label: 'Talking to Ember', icon: 'chat', path: '/companion' },
  { id: 'ground', label: '5-4-3-2-1 grounding', icon: 'steady', path: '/steady' },
  { id: 'people', label: 'Texting someone', icon: 'people', path: '/people' },
  { id: 'worry', label: 'The worry box', icon: 'feather', path: '/worry' },
  { id: 'toolkit', label: 'The toolkit', icon: 'sparkle', path: '/toolkit' },
  { id: 'sleep', label: 'Sleep', icon: 'bed', path: '/sleep' },
];

export const CHEER: { id: AboutMe['cheer'] & string; label: string; sample: string }[] = [
  { id: 'hype', label: 'Hype me up', sample: 'YES. Look at you go!' },
  { id: 'calm', label: 'Calm and warm', sample: 'Nice. One thing done, and you did it.' },
  { id: 'straight', label: 'Straight talk', sample: 'Done. Next one.' },
];

/** Small questions for the Desk, one a day. Short answers, always skippable. */
export const QUESTIONS = [
  'What’s one song you’ve had on repeat lately?',
  'What’s something small that made you smile this week?',
  'Which class do you actually look forward to?',
  'What would a perfect Saturday look like?',
  'Who’s someone you can always talk to?',
  'What’s a skill you’d love to get good at?',
  'What do you do when you need a break?',
  'What’s something you’re proud of from this year?',
  'What’s your go-to comfort food?',
  'If you could learn anything, no grades, what would it be?',
  'What helps you fall asleep?',
  'What’s one thing you wish your teachers knew about you?',
  'What’s the best advice anyone’s given you?',
  'Where do you get your best thinking done?',
  'What’s a show or book you’d recommend to a friend?',
  'What’s something you’re looking forward to?',
];

/** Today's question, or null if it was answered or skipped today. */
export function questionOfTheDay(about: AboutMe, today = dateKey()) {
  if (about.askedOn.includes(today)) return null;
  const asked = new Set(about.answers.map((a) => a.q));
  const fresh = QUESTIONS.filter((q) => !asked.has(q));
  if (!fresh.length) return null;
  // The same question all day; a different one tomorrow.
  const seed = Number(today.replace(/-/g, '')) % fresh.length;
  return fresh[seed];
}

/**
 * A celebration line in the student's chosen style: "Hype me up" gets an
 * excited opener, "Straight talk" keeps just the first sentence, "Calm and
 * warm" (and no choice) stays as written. Their nickname shows up now and
 * then, not every time. Only for "you finished something" moments.
 */
export function cheerLine(text: string) {
  const about = useLifeStore.getState().about;
  const name = about.nickname.trim();
  const withName = !!name && Math.random() < 0.4;
  if (about.cheer === 'hype') {
    const opener = ['YES', 'Let’s go', 'Look at you'][Math.floor(Math.random() * 3)];
    return `${opener}${withName ? `, ${name}` : ''}! ${text.replace(/\.$/, '!')}`;
  }
  if (about.cheer === 'straight') return text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  return withName ? `${text} Nice work, ${name}.` : text;
}

/** What Ember calls them: their nickname, else their first name. */
export function callName() {
  const about = useLifeStore.getState().about;
  return about.nickname.trim() || null;
}

/**
 * One short line about the student for the AI note, only if they turned
 * sharing on. Never answers to the daily questions or the weekly sentence:
 * those are theirs.
 */
export function aboutForAI(about: AboutMe): string | null {
  if (!about.shareWithAI) return null;
  const picks = THIS_OR_THAT.map((c) => pickLabel(c, about.picks[c.id] ?? '')).filter(Boolean);
  const parts = [
    about.nickname ? `goes by ${about.nickname}` : '',
    picks.length ? picks.slice(0, 6).join(', ').toLowerCase() : '',
    about.interests.length ? `into ${about.interests.slice(0, 5).join(', ').toLowerCase()}` : '',
    about.favSubjects.length ? `favorite ${about.favSubjects.length > 1 ? 'subjects' : 'subject'}: ${about.favSubjects.join(', ')}` : '',
    about.hardSubjects.length ? `finds ${about.hardSubjects.join(', ')} hard` : '',
    about.studyWays.length ? `studies best with ${STUDY_WAYS.filter((w) => about.studyWays.includes(w.id)).map((w) => w.label.toLowerCase()).join(', ')}` : '',
    about.cheer ? `wants ${CHEER.find((c) => c.id === about.cheer)?.label.toLowerCase()} encouragement` : '',
    about.goals.filter((g) => !g.done).length ? `goals: ${about.goals.filter((g) => !g.done).map((g) => g.text).join('; ')}` : '',
  ].filter(Boolean);
  return parts.length ? parts.join('; ') : null;
}

/**
 * Steady's tools in the order that suits this student: what they said calms
 * them first, then "talk it out" or "write it down", then what they've said
 * helped (learned, so it follows the learning switch). Ties keep the
 * default order.
 */
export function calmOrder(about: AboutMe, ids: string[]) {
  const score = (id: string) => {
    let s = 0;
    const i = about.calmers.indexOf(id);
    if (i >= 0) s += 100 - i;
    if (about.picks.feel === 'b' && id === 'vent') s += 10;
    if (about.picks.feel === 'a' && id === 'ember') s += 10;
    const [yes, no] = about.helped[id] ?? [0, 0];
    if (!about.learnOff && yes + no >= 3) s += 20 * (yes / (yes + no));
    return s;
  };
  return [...ids].sort((a, b) => score(b) - score(a));
}

/**
 * A helper's opening suggestions, leaning on About you: Quizzo offers your
 * hardest subject (and a fun round on something you're into), Sage and
 * Quizzo lean toward how you like to study. At most two personal ones go
 * in front of the helper's usual chips. These stay on the phone; tapping
 * one just sends that line, like typing it.
 */
export function helperChips(helperId: string, base: string[], about: AboutMe) {
  const mine: string[] = [];
  const hard = about.hardSubjects[0];
  const ways = about.studyWays;
  if (helperId === 'quizzo') {
    if (hard) mine.push(`Quiz me on ${hard}`);
    if (ways.includes('practice')) mine.push('Give me practice problems');
    else if (about.interests[0]) mine.push(`A fun round about ${about.interests[0].toLowerCase()}`);
  }
  if (helperId === 'sage') {
    if (ways.includes('draw')) mine.push('Draw it out in words');
    if (ways.includes('explain')) mine.push('Let me explain it back');
    if (hard && mine.length < 2) mine.push(`Help me with ${hard}`);
  }
  if (helperId === 'pip' && about.picks.time === 'b') mine.push('Plan my night, night-owl style');
  const out = [...mine.slice(0, 2), ...base.filter((c) => !mine.includes(c))];
  return out.slice(0, Math.max(base.length, 4));
}

/** How much of About you is filled in, 0–1, for the ring on its card. */
export function aboutFilled(about: AboutMe) {
  const bits = [
    Object.keys(about.picks).length >= 4,
    about.interests.length > 0,
    about.favSubjects.length + about.hardSubjects.length > 0,
    about.studyWays.length > 0,
    about.calmers.length > 0,
    !!about.cheer,
    about.goals.length > 0,
    about.answers.length > 0,
  ];
  return bits.filter(Boolean).length / bits.length;
}
