import { File, Paths } from 'expo-file-system';
import type { IconName } from '../components/ui/Icon';
import { create } from 'zustand';
import { addDays, dateKey } from './dates';
import { saveAside } from './saveAside';
import { isShowing } from './showMode';

// Everything around school that makes a student's life easier: wins,
// gratitude, service and driving hours, countdowns, trusted people, the
// bedtime routine and tomorrow's bag, a worry box, flashcards, weekly
// reviews, and how Ember looks. Kept on the phone in life.json, like
// school.json and hub.json — nothing here leaves the device.

export interface Win {
  id: string;
  text: string;
  at: string;
  /** A note to yourself, sealed until this day (YYYY-MM-DD). */
  sealedUntil?: string;
  /** When a sealed note was first opened (ISO). */
  openedAt?: string;
}

/** A sealed note stays closed (text hidden everywhere) until its day. */
export function isSealed(w: { sealedUntil?: string }, today = dateKey()) {
  return !!w.sealedUntil && w.sealedUntil > today;
}

export interface HoursEntry {
  id: string;
  kind: 'service' | 'driving' | 'work';
  date: string;
  minutes: number;
  note: string;
  /** Driving only: after dark. */
  night?: boolean;
  /** Minutes after midnight it started, when known. */
  at?: number;
  /** Driving: conditions practiced (highway, rain, parking…). */
  tags?: string[];
}

export type CountdownKind = 'event' | 'break' | 'finals' | 'birthday';

export interface Countdown {
  id: string;
  title: string;
  date: string;
  kind: CountdownKind;
  color: string;
  /** When it was set, so a break can show how much of the wait is behind you. */
  createdAt?: string;
  /** Picked by the student; falls back to one for the kind. */
  icon?: IconName;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  note: string;
  /** Last time you tapped text or call for them (ISO). */
  reachedAt?: string;
}

/** The private safety plan: four short lists, kept only on this phone. */
export type SafetyKey = 'signs' | 'coping' | 'reach' | 'places';
export type SafetyPlan = Record<SafetyKey, ListItem[]>;
export const EMPTY_SAFETY: SafetyPlan = { signs: [], coping: [], reach: [], places: [] };

export interface ListItem {
  id: string;
  text: string;
}

export interface Worry {
  id: string;
  text: string;
  createdAt: string;
  resolved: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  /** Leitner box 1–5; higher boxes come back less often. */
  box: number;
  /** YYYY-MM-DD it's next due. */
  due: string;
  seen: number;
}

export interface Deck {
  id: string;
  name: string;
  classId: string | null;
  color: string;
  cards: Flashcard[];
  createdAt: string;
  /** The note it was made from, so it can pick up new lines later. */
  noteId?: string;
  /** How you last studied it. */
  study?: { type?: boolean; reverse?: boolean; hardest?: boolean };
}

export interface Review {
  /** Monday of the week, YYYY-MM-DD. */
  weekOf: string;
  well: string;
  hard: string;
  next: string;
  at: string;
}

export interface Distraction {
  id: string;
  text: string;
  at: string;
  done: boolean;
}

export type EmberTheme = 'gold' | 'rose' | 'ocean' | 'forest' | 'violet';
export type EmberAccessory = 'auto' | 'none' | 'glasses' | 'cap' | 'headphones' | 'scarf';

export interface LifeSettings {
  /** MM-DD, for Ember's birthday wish. */
  birthday: string | null;
  /** Minutes after midnight when the wind-down starts. */
  windDown: number;
  /** Wake-up time for the sleep calculator. */
  wake: number;
  serviceGoal: number;
  drivingGoal: number;
  drivingNightGoal: number;
  /** Minutes of focus a week. */
  focusGoal: number;
  emberTheme: EmberTheme;
  emberAccessory: EmberAccessory;
  /** Last "what's new" the student dismissed. */
  whatsNewSeen: number;
  /** Brain Navigator Plus — more AI. Set by a store purchase (not wired yet). */
  plus: boolean;
  plusPlan: 'monthly' | 'yearly' | null;
  /** Desk sections the student turned off. */
  deskHidden: string[];
  /** Desk sections folded with a tap on their heading. */
  deskFolded?: string[];
  /** Desk cards closed today (they come back tomorrow). */
  deskClosed?: { day: string; ids: string[] };
  /** Hourly pay at a job, for the earnings estimate. */
  wage?: number | null;
  /** Quiet: Ember only speaks up for big moments and important tips. */
  emberQuiet?: boolean;
  /** Ember stays silent while a class is in session (default on). */
  quietInClass?: boolean;
  /** The last few things searched for, newest first. */
  recentSearches?: string[];
  /** Big moments show as an Ember line instead of a whole-screen celebration. */
  quietCelebrations?: boolean;
  /** Milestones already celebrated, so each one happens once. */
  celebrated?: string[];
  /** Minutes of focus to aim for today (null for no daily goal). */
  dailyFocusGoal?: number | null;
  /** The last few quick-capture lines, for one-tap repeats. */
  recentCaptures?: string[];
  /** The last day the Desk was opened (YYYY-MM-DD). */
  lastSeen?: string;
  /** Order of the lower Desk sections. */
  deskOrder?: string[];
  /** Where today's study session (Pip, Quizzo, Spark) got to. */
  combo?: { day: string; step: number } | null;
  /** Sage's explanation level. */
  sageLevel?: string;
  /** AI turned off everywhere: every tool runs on the phone only. */
  aiOff?: boolean;
  /** Ember's memory: off means nothing from past chats is kept or sent. */
  memoryOff?: boolean;
  /** Opt out of the calm veil over the app in the app switcher (default on). */
  veilOff?: boolean;
  /** Shake the phone to drop a worry in the box from anywhere. On unless turned off. */
  shakeWorryOff?: boolean;
  /** The person (from Your people) shown as a one-tap text on Steady. */
  trustedAdultId?: string;
  /** A class name as it appears in screenshots (lowercase) → your class's id. */
  classAliases?: Record<string, string>;
  /** Days (YYYY-MM-DD) a breathing tool was finished; the last 90 are kept. */
  breathDays?: string[];
  /** How much the phone vibrates: off, light taps only, or full (default). */
  haptics?: 'off' | 'light' | 'full';
  /** The night (tonightKey) the student put the day down; the Desk stays quiet until morning. */
  putDown?: string;
  /** The day First light last showed (YYYY-MM-DD). */
  firstLightSeen?: string;
  /** The week (Monday, YYYY-MM-DD) the student acted on the kind-thing card. */
  kindWeek?: string;
  /** Drawer entries marked new that the student has opened (hrefs). */
  seenNew?: string[];
  /** Today's date when a check-in was started and left unsaved. */
  checkinDraft?: string;
  /** The last note editor left: its id and when (ISO). */
  lastNote?: { id: string; at: string };
}

/**
 * Something Ember keeps between conversations, only with the student's OK:
 * a one-line summary of a chat, or a fact they agreed to. Lives on the
 * phone; sent along with later Ember chats so Ember can pick up the thread.
 */
export interface EmberMemory {
  id: string;
  kind: 'chat' | 'fact';
  text: string;
  at: string;
  /** Something coming up worth asking about ("the chem test"), and its date. */
  followUp?: string;
  followUpDate?: string;
  /** The follow-up was asked about or dismissed. */
  followedUp?: boolean;
}

/** The last Ember conversation, so it can be picked back up. */
/**
 * What the student has told the app about themselves. Kept on this phone;
 * shown, changed, and erased in About you. Goes to the AI only if
 * `shareWithAI` is on, and then only as one short line.
 */
export interface AboutMe {
  /** "This or that" answers, by card id → the side they picked. */
  picks: Record<string, string>;
  interests: string[];
  favSubjects: string[];
  hardSubjects: string[];
  studyWays: string[];
  /** Steady tools that calm them, by id. */
  calmers: string[];
  /** How Ember cheers them on. */
  cheer: 'hype' | 'calm' | 'straight' | null;
  nickname: string;
  /** This semester's goals, up to three. */
  goals: { id: string; text: string; at: string; done?: boolean }[];
  /** Question of the day answers, newest last. */
  answers: { id: string; q: string; a: string; at: string }[];
  /** Sunday "your week in a sentence", newest last. */
  weeks: { week: string; text: string }[];
  /** When each part was last set, for "added …" lines. */
  setAt: Record<string, string>;
  /** Off by default: About you joins the AI note as one line. */
  shareWithAI: boolean;
  /** Off turns off everything learned from use. */
  learnOff: boolean;
  /** Learned notes the student said weren't right. */
  dismissed: string[];
  /** "Did that help?" after a calming tool: tool id → [helped, didn't]. */
  helped: Record<string, [number, number]>;
  /** Days the question of the day was answered or skipped. */
  askedOn: string[];
  /** The get-to-know-you cards were seen. */
  introDone: boolean;
  /** Drawer tools opened, path → times (learned from use). */
  opened: Record<string, number>;
  /** Drawer tools opened lately, newest first. */
  recent: string[];
  /** The day the Desk's "Something I noticed" card was last put away. */
  noticedOn: string;
}

export const EMPTY_ABOUT: AboutMe = {
  picks: {},
  interests: [],
  favSubjects: [],
  hardSubjects: [],
  studyWays: [],
  calmers: [],
  cheer: null,
  nickname: '',
  goals: [],
  answers: [],
  weeks: [],
  setAt: {},
  shareWithAI: false,
  learnOff: false,
  dismissed: [],
  helped: {},
  askedOn: [],
  introDone: false,
  opened: {},
  recent: [],
  noticedOn: '',
};

/** A thumbs up or down on an AI reply. Kept on this phone; never sent anywhere. */
export interface ReplyFeedback {
  id: string;
  at: string;
  verdict: 'good' | 'off';
  /** ember, or a helper's id. */
  who: string;
  reply: string;
  /** For "this reply was off": the chat up to that reply, to look over later. */
  lines?: { from: 'ember' | 'you'; text: string }[];
  /** The prompt version that wrote it. */
  v: string;
}

export interface EmberChat {
  at: string;
  lines: { from: 'ember' | 'you'; text: string }[];
}

export interface HelperTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** AI replies used, counted per week (free) and per month (Plus). */
export interface AIUsage {
  week: string;
  weekUsed: number;
  month: string;
  monthUsed: number;
  /** Who each recent reply went to ('ember' or a helper id), newest last. */
  log?: { at: string; who: string; cents?: number; ms?: number; free?: boolean }[];
}

export interface LifeData {
  wins: Win[];
  gratitude: Record<string, string[]>;
  hours: HoursEntry[];
  countdowns: Countdown[];
  people: Person[];
  pack: ListItem[];
  packDone: Record<string, string[]>;
  windDownItems: ListItem[];
  windDownDone: Record<string, string[]>;
  worries: Worry[];
  decks: Deck[];
  reviews: Review[];
  distractions: Distraction[];
  /** "One thing" for a day. */
  oneThing: Record<string, string>;
  oneThingDone: Record<string, boolean>;
  /** Achievement key → ISO time earned. */
  achievements: Record<string, string>;
  settings: LifeSettings;
  ai: AIUsage;
  /** Each helper's conversation, most recent last. */
  helperChats: Record<string, HelperTurn[]>;
  /** Quiz games: rounds played and the best score. */
  quiz: { played: number; best: number; correct: number; lightningBest?: number };
  /** Assignment id → the helper last called about it. */
  helperUse: Record<string, string>;
  /** Helper id → what you did together last time. */
  helperLast: Record<string, { at: string; line: string }>;
  /** Helper id → when its chat last changed (chats over 30 days old are cleared). */
  helperChatAt: Record<string, string>;
  /** What Ember remembers, newest last. */
  emberMemory: EmberMemory[];
  lastEmberChat: EmberChat | null;
  /** Titles for saved Ember chats, by entryKey of the chat's text (the journal row has no title). */
  chatTitles: Record<string, string>;
  replyFeedback: ReplyFeedback[];
  about: AboutMe;
  /** Private safety plan. Never sent to AI or a server. */
  safetyPlan?: SafetyPlan;
}

interface LifeStore extends LifeData {
  loaded: boolean;
  load: () => Promise<void>;
  /** Undo: put a part of the data back exactly as it was. */
  putBack: (patch: Partial<LifeData>) => void;

  addWin: (text: string, sealedUntil?: string) => void;
  openWin: (id: string) => void;
  deleteWin: (id: string) => void;
  restoreWin: (w: Win) => void;
  setGratitude: (date: string, items: string[]) => void;

  saveHours: (h: Omit<HoursEntry, 'id'> & { id?: string }) => void;
  deleteHours: (id: string) => void;

  saveCountdown: (c: Omit<Countdown, 'id'> & { id?: string }) => void;
  deleteCountdown: (id: string) => void;

  savePerson: (p: Omit<Person, 'id'> & { id?: string }) => void;
  deletePerson: (id: string) => void;
  addSafetyItem: (key: SafetyKey, text: string) => void;
  removeSafetyItem: (key: SafetyKey, id: string) => void;

  setList: (which: 'pack' | 'windDownItems', items: ListItem[]) => void;
  toggleListItem: (which: 'packDone' | 'windDownDone', date: string, id: string) => void;

  /** Returns the new worry's id (for Undo), or undefined if the text was empty. */
  addWorry: (text: string) => string | undefined;
  resolveWorry: (id: string) => void;
  deleteWorry: (id: string) => void;

  saveDeck: (d: Omit<Deck, 'id' | 'cards' | 'createdAt'> & { id?: string }) => Deck;
  deleteDeck: (id: string) => void;
  restoreDeck: (d: Deck) => void;
  addCards: (deckId: string, cards: { front: string; back: string }[]) => void;
  updateCard: (deckId: string, cardId: string, patch: Partial<Flashcard>) => void;
  deleteCard: (deckId: string, cardId: string) => void;
  /** Leitner: right moves the card up a box, wrong sends it back to box 1. */
  gradeCard: (deckId: string, cardId: string, right: boolean) => void;

  saveReview: (r: Omit<Review, 'at'>) => void;

  addDistraction: (text: string) => void;
  toggleDistraction: (id: string) => void;
  clearDistractions: () => void;

  setOneThing: (date: string, text: string) => void;
  setOneThingDone: (date: string, done: boolean) => void;
  /** Returns true the first time a key is earned. */
  earn: (key: string) => boolean;
  setSettings: (patch: Partial<LifeSettings>) => void;
  setAI: (ai: AIUsage) => void;
  setHelperChat: (id: string, turns: HelperTurn[]) => void;
  remember: (m: Omit<EmberMemory, 'id' | 'at'>) => EmberMemory;
  updateMemory: (id: string, patch: Partial<EmberMemory>) => void;
  forget: (id: string) => void;
  forgetAll: () => void;
  setLastEmberChat: (chat: EmberChat | null) => void;
  nameChat: (key: string, title: string) => void;
  rateReply: (f: Omit<ReplyFeedback, 'id' | 'at'>) => ReplyFeedback;
  unrateReply: (id: string) => void;
  clearFeedback: () => void;
  /** Change part of About you; stamps when each part was set. */
  setAbout: (patch: Partial<AboutMe>) => void;
  /** Erase everything About you (keeps the two switches). */
  forgetAbout: () => void;
  /** A Drawer tool was opened (skipped when learning is off). */
  noteOpen: (path: string) => void;
  recordQuiz: (score: number, correct: number, lightning?: boolean) => void;
  updateDeck: (id: string, patch: Partial<Omit<Deck, 'id' | 'cards'>>) => void;
  noteHelperUse: (assignmentId: string, helperId: string) => void;
  noteHelperLast: (helperId: string, line: string) => void;

  /** Everything, for export. */
  snapshot: () => LifeData;
  reset: () => void;
  /** Replace everything with a backup's life section. */
  restore: (d: Partial<LifeData>) => void;
}

export const DEFAULT_PACK: ListItem[] = [
  { id: 'p1', text: 'Laptop or Chromebook' },
  { id: 'p2', text: 'Charger' },
  { id: 'p3', text: 'Homework that’s due' },
  { id: 'p4', text: 'Water bottle' },
  { id: 'p5', text: 'Lunch or money' },
  { id: 'p6', text: 'PE or practice clothes' },
  { id: 'p7', text: 'Keys and ID' },
];

export const DEFAULT_WIND_DOWN: ListItem[] = [
  { id: 'w1', text: 'Check tomorrow’s bag' },
  { id: 'w2', text: 'Alarm set' },
  { id: 'w3', text: 'Phone charging outside the bed' },
  { id: 'w4', text: 'Lights low, screens off' },
  { id: 'w5', text: 'Brush teeth, wash face' },
  { id: 'w6', text: 'Write down tomorrow’s one thing' },
];

// Leitner spacing: box → days until it comes back.
const BOX_DAYS = [0, 1, 2, 4, 8, 16];

const DEFAULT_SETTINGS: LifeSettings = {
  birthday: null,
  windDown: 22 * 60,
  wake: 6 * 60 + 45,
  serviceGoal: 40,
  drivingGoal: 50,
  drivingNightGoal: 10,
  focusGoal: 300,
  emberTheme: 'gold',
  emberAccessory: 'auto',
  whatsNewSeen: 0,
  plus: false,
  plusPlan: null,
  deskHidden: [],
};

export const EMPTY_LIFE: LifeData = {
  wins: [],
  gratitude: {},
  hours: [],
  countdowns: [],
  people: [],
  pack: DEFAULT_PACK,
  packDone: {},
  windDownItems: DEFAULT_WIND_DOWN,
  windDownDone: {},
  worries: [],
  decks: [],
  reviews: [],
  distractions: [],
  oneThing: {},
  oneThingDone: {},
  achievements: {},
  settings: DEFAULT_SETTINGS,
  ai: { week: '', weekUsed: 0, month: '', monthUsed: 0 },
  helperChats: {},
  quiz: { played: 0, best: 0, correct: 0 },
  helperUse: {},
  helperLast: {},
  helperChatAt: {},
  emberMemory: [],
  lastEmberChat: null,
  chatTitles: {},
  replyFeedback: [],
  about: EMPTY_ABOUT,
  safetyPlan: EMPTY_SAFETY,
};

const FILE = 'life.json';

let timer: ReturnType<typeof setTimeout> | null = null;
function persist(data: LifeData) {
  // Nothing saves while showing someone the app (sample data in memory).
  if (isShowing()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      const f = new File(Paths.document, FILE);
      if (!f.exists) f.create();
      f.write(JSON.stringify(data));
    } catch {
      // Retried on the next change.
    }
  }, 300);
}

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function upsert<T extends { id: string }>(list: T[], x: Omit<T, 'id'> & { id?: string }): T[] {
  if (x.id && list.some((y) => y.id === x.id)) return list.map((y) => (y.id === x.id ? ({ ...y, ...x } as T) : y));
  return [...list, { ...x, id: uid() } as T];
}

// Old per-day check lists only need the last couple of weeks.
function trimDays(map: Record<string, string[]>) {
  const cutoff = addDays(dateKey(), -14);
  return Object.fromEntries(Object.entries(map).filter(([k]) => k >= cutoff));
}

function keepSince<T>(map: Record<string, T>, days: number) {
  const cutoff = addDays(dateKey(), -days);
  return Object.fromEntries(Object.entries(map).filter(([k]) => k >= cutoff));
}

export const useLifeStore = create<LifeStore>((set, get) => {
  const data = (): LifeData => {
    const s = get();
    return {
      wins: s.wins,
      gratitude: s.gratitude,
      hours: s.hours,
      countdowns: s.countdowns,
      people: s.people,
      pack: s.pack,
      packDone: s.packDone,
      windDownItems: s.windDownItems,
      windDownDone: s.windDownDone,
      worries: s.worries,
      decks: s.decks,
      reviews: s.reviews,
      distractions: s.distractions,
      oneThing: s.oneThing,
      oneThingDone: s.oneThingDone,
      achievements: s.achievements,
      settings: s.settings,
      ai: s.ai,
      helperChats: s.helperChats,
      quiz: s.quiz,
      helperUse: s.helperUse,
      helperLast: s.helperLast,
      helperChatAt: s.helperChatAt,
      emberMemory: s.emberMemory,
      lastEmberChat: s.lastEmberChat,
      chatTitles: s.chatTitles,
      replyFeedback: s.replyFeedback,
      about: s.about,
      safetyPlan: s.safetyPlan,
    };
  };
  const commit = (patch: Partial<LifeData>) => {
    set(patch);
    // Never save before the file has been read: a store that isn't loaded yet
    // (first moments of launch, or re-created by a dev hot reload) is empty,
    // and saving it would overwrite everything on disk.
    if (!get().loaded) return;
    persist(data());
  };
  const mapDeck = (deckId: string, fn: (d: Deck) => Deck) => commit({ decks: get().decks.map((d) => (d.id === deckId ? fn(d) : d)) });

  return {
    ...EMPTY_LIFE,
    loaded: false,

    putBack: (patch) => commit(patch),
    load: async () => {
      if (get().loaded) return;
      let raw = '';
      try {
        const f = new File(Paths.document, FILE);
        if (f.exists) {
          raw = await f.text();
          const d = JSON.parse(raw) as Partial<LifeData>;
          // Helper chats nobody has touched in 30 days are let go.
          const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
          const chatAt = d.helperChatAt ?? {};
          const chats = Object.fromEntries(Object.entries(d.helperChats ?? {}).filter(([id]) => !chatAt[id] || chatAt[id] >= cutoff));
          set({
            ...EMPTY_LIFE,
            ...d,
            pack: d.pack?.length ? d.pack : DEFAULT_PACK,
            windDownItems: d.windDownItems?.length ? d.windDownItems : DEFAULT_WIND_DOWN,
            settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
            about: { ...EMPTY_ABOUT, ...(d.about ?? {}) },
            safetyPlan: { ...EMPTY_SAFETY, ...(d.safetyPlan ?? {}) },
            helperChats: chats,
            // Day-by-day lists only need recent days; a few months of "one thing" is plenty.
            packDone: trimDays(d.packDone ?? {}),
            windDownDone: trimDays(d.windDownDone ?? {}),
            // A birthday that's passed comes back next year on its own.
            countdowns: (d.countdowns ?? []).map((c) => {
              if (c.kind !== 'birthday' || c.date >= dateKey()) return c;
              const [y, m, dd] = c.date.split('-').map(Number);
              let next = new Date(y + 1, m - 1, dd);
              while (dateKey(next) < dateKey()) next = new Date(next.getFullYear() + 1, m - 1, dd);
              return { ...c, date: dateKey(next), createdAt: new Date().toISOString() };
            }),
            oneThing: keepSince(d.oneThing ?? {}, 90),
            oneThingDone: keepSince(d.oneThingDone ?? {}, 90),
          });
        }
      } catch {
        // Start fresh, but keep the file that couldn't be read.
        if (raw) saveAside(FILE, raw);
      }
      set({ loaded: true });
    },

    addWin: (text, sealedUntil) => {
      const t = text.trim();
      if (!t) return;
      commit({ wins: [{ id: uid(), text: t, at: new Date().toISOString(), ...(sealedUntil ? { sealedUntil } : {}) }, ...get().wins] });
    },
    openWin: (id) => commit({ wins: get().wins.map((w) => (w.id === id && !w.openedAt ? { ...w, openedAt: new Date().toISOString() } : w)) }),
    deleteWin: (id) => commit({ wins: get().wins.filter((w) => w.id !== id) }),
    restoreWin: (w) => {
      if (!get().wins.some((x) => x.id === w.id)) commit({ wins: [w, ...get().wins].sort((a, b) => b.at.localeCompare(a.at)) });
    },
    setGratitude: (date, items) => commit({ gratitude: { ...get().gratitude, [date]: items } }),

    saveHours: (h) => commit({ hours: upsert(get().hours, h) }),
    deleteHours: (id) => commit({ hours: get().hours.filter((h) => h.id !== id) }),

    saveCountdown: (c) => commit({ countdowns: upsert(get().countdowns, { createdAt: new Date().toISOString(), ...c }) }),
    deleteCountdown: (id) => commit({ countdowns: get().countdowns.filter((c) => c.id !== id) }),

    savePerson: (p) => commit({ people: upsert(get().people, p) }),
    deletePerson: (id) => commit({ people: get().people.filter((p) => p.id !== id) }),
    addSafetyItem: (key, text) => {
      const t = text.trim();
      if (!t) return;
      const cur = { ...EMPTY_SAFETY, ...(get().safetyPlan ?? {}) };
      commit({ safetyPlan: { ...cur, [key]: [...cur[key], { id: uid(), text: t }] } });
    },
    removeSafetyItem: (key, id) => {
      const cur = { ...EMPTY_SAFETY, ...(get().safetyPlan ?? {}) };
      commit({ safetyPlan: { ...cur, [key]: cur[key].filter((x) => x.id !== id) } });
    },

    setList: (which, items) => commit({ [which]: items } as Partial<LifeData>),
    toggleListItem: (which, date, id) => {
      const map = get()[which];
      const day = map[date] ?? [];
      const next = day.includes(id) ? day.filter((x) => x !== id) : [...day, id];
      commit({ [which]: trimDays({ ...map, [date]: next }) } as Partial<LifeData>);
    },

    addWorry: (text) => {
      const t = text.trim();
      if (!t) return undefined;
      const id = uid();
      commit({ worries: [{ id, text: t, createdAt: new Date().toISOString(), resolved: false }, ...get().worries] });
      return id;
    },
    resolveWorry: (id) => commit({ worries: get().worries.map((w) => (w.id === id ? { ...w, resolved: true } : w)) }),
    deleteWorry: (id) => commit({ worries: get().worries.filter((w) => w.id !== id) }),

    saveDeck: (d) => {
      const existing = d.id ? get().decks.find((x) => x.id === d.id) : undefined;
      if (existing) {
        const updated = { ...existing, ...d } as Deck;
        commit({ decks: get().decks.map((x) => (x.id === d.id ? updated : x)) });
        return updated;
      }
      const deck: Deck = { ...d, id: uid(), cards: [], createdAt: new Date().toISOString() };
      commit({ decks: [deck, ...get().decks] });
      return deck;
    },
    deleteDeck: (id) => commit({ decks: get().decks.filter((d) => d.id !== id) }),
    restoreDeck: (d) => {
      if (!get().decks.some((x) => x.id === d.id)) commit({ decks: [d, ...get().decks] });
    },
    addCards: (deckId, cards) =>
      mapDeck(deckId, (d) => ({
        ...d,
        cards: [
          ...d.cards,
          ...cards
            .filter((c) => c.front.trim() && c.back.trim())
            .map((c) => ({ id: uid(), front: c.front.trim(), back: c.back.trim(), box: 1, due: dateKey(), seen: 0 })),
        ],
      })),
    updateCard: (deckId, cardId, patch) =>
      mapDeck(deckId, (d) => ({ ...d, cards: d.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)) })),
    deleteCard: (deckId, cardId) => mapDeck(deckId, (d) => ({ ...d, cards: d.cards.filter((c) => c.id !== cardId) })),
    gradeCard: (deckId, cardId, right) =>
      mapDeck(deckId, (d) => ({
        ...d,
        cards: d.cards.map((c) => {
          if (c.id !== cardId) return c;
          const box = right ? Math.min(5, c.box + 1) : 1;
          return { ...c, box, seen: c.seen + 1, due: addDays(dateKey(), BOX_DAYS[box]) };
        }),
      })),

    saveReview: (r) => {
      const rest = get().reviews.filter((x) => x.weekOf !== r.weekOf);
      commit({ reviews: [{ ...r, at: new Date().toISOString() }, ...rest] });
    },

    addDistraction: (text) => {
      const t = text.trim();
      if (!t) return;
      commit({ distractions: [{ id: uid(), text: t, at: new Date().toISOString(), done: false }, ...get().distractions] });
    },
    toggleDistraction: (id) => commit({ distractions: get().distractions.map((d) => (d.id === id ? { ...d, done: !d.done } : d)) }),
    clearDistractions: () => commit({ distractions: get().distractions.filter((d) => !d.done) }),

    setOneThing: (date, text) => commit({ oneThing: { ...get().oneThing, [date]: text } }),
    setOneThingDone: (date, done) => commit({ oneThingDone: { ...get().oneThingDone, [date]: done } }),

    earn: (key) => {
      if (get().achievements[key]) return false;
      commit({ achievements: { ...get().achievements, [key]: new Date().toISOString() } });
      return true;
    },

    setSettings: (patch) => commit({ settings: { ...get().settings, ...patch } }),
    setAI: (ai) => commit({ ai }),
    // Only the last 40 turns are kept per helper.
    setHelperChat: (id, turns) =>
      commit({ helperChats: { ...get().helperChats, [id]: turns.slice(-40) }, helperChatAt: { ...get().helperChatAt, [id]: new Date().toISOString() } }),
    remember: (m) => {
      const mem: EmberMemory = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), ...m };
      // The newest 30 are plenty; only a few are ever sent.
      commit({ emberMemory: [...get().emberMemory, mem].slice(-30) });
      return mem;
    },
    updateMemory: (id, patch) => commit({ emberMemory: get().emberMemory.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
    forget: (id) => commit({ emberMemory: get().emberMemory.filter((m) => m.id !== id) }),
    forgetAll: () => commit({ emberMemory: [], lastEmberChat: null }),
    setLastEmberChat: (chat) => commit({ lastEmberChat: chat }),
    // The newest 100 titles; the journal only shows the last 30 entries.
    rateReply: (f) => {
      const r: ReplyFeedback = { id: uid(), at: new Date().toISOString(), ...f };
      // The newest 50; this is a review list, not an archive.
      commit({ replyFeedback: [...get().replyFeedback, r].slice(-50) });
      return r;
    },
    unrateReply: (id) => commit({ replyFeedback: get().replyFeedback.filter((r) => r.id !== id) }),
    clearFeedback: () => commit({ replyFeedback: [] }),
    setAbout: (patch) => {
      const now = new Date().toISOString();
      const stamps = Object.fromEntries(Object.keys(patch).map((k) => [k, now]));
      const cur = get().about;
      commit({ about: { ...cur, ...patch, setAt: { ...cur.setAt, ...stamps } } });
    },
    forgetAbout: () => {
      const cur = get().about;
      commit({ about: { ...EMPTY_ABOUT, shareWithAI: cur.shareWithAI, learnOff: cur.learnOff, introDone: true } });
    },
    noteOpen: (path) => {
      const cur = get().about;
      if (cur.learnOff) return;
      commit({ about: { ...cur, opened: { ...cur.opened, [path]: (cur.opened[path] ?? 0) + 1 }, recent: [path, ...cur.recent.filter((x) => x !== path)].slice(0, 8) } });
    },
    nameChat: (key, title) => commit({ chatTitles: Object.fromEntries([...Object.entries(get().chatTitles).filter(([k]) => k !== key), [key, title]].slice(-100)) }),
    noteHelperLast: (id, line) => commit({ helperLast: { ...get().helperLast, [id]: { at: new Date().toISOString(), line } } }),
    noteHelperUse: (assignmentId, helperId) => commit({ helperUse: { ...get().helperUse, [assignmentId]: helperId } }),
    recordQuiz: (score, correct, lightning) => {
      const q = get().quiz;
      commit({
        quiz: {
          played: q.played + 1,
          best: Math.max(q.best, score),
          correct: q.correct + correct,
          lightningBest: lightning ? Math.max(q.lightningBest ?? 0, score) : q.lightningBest,
        },
      });
    },
    updateDeck: (id, patch) => mapDeck(id, (d) => ({ ...d, ...patch })),

    snapshot: data,
    reset: () => commit({ ...EMPTY_LIFE }),
    restore: (d) =>
      commit({
        ...EMPTY_LIFE,
        ...d,
        pack: d.pack?.length ? d.pack : DEFAULT_PACK,
        windDownItems: d.windDownItems?.length ? d.windDownItems : DEFAULT_WIND_DOWN,
        settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
        about: { ...EMPTY_ABOUT, ...(d.about ?? {}) },
        safetyPlan: { ...EMPTY_SAFETY, ...(d.safetyPlan ?? {}) },
      }),
  };
});

// ---- Derived ------------------------------------------------------------------

/** Cards due to study today or earlier. */
export function dueCards(deck: Deck, today = dateKey()) {
  return deck.cards.filter((c) => c.due <= today);
}

/** New (never seen), learning (box 1–3), mastered (box 4–5). */
export function deckStats(deck: Deck) {
  const fresh = deck.cards.filter((c) => c.seen === 0).length;
  const mastered = deck.cards.filter((c) => c.seen > 0 && c.box >= 4).length;
  return { fresh, mastered, learning: deck.cards.length - fresh - mastered, total: deck.cards.length };
}

/** "front :: back" or "front - back" or "front\tback", one per line. */
/** Note a day a breathing tool was finished (once per day). */
export function noteBreathDay() {
  const st = useLifeStore.getState();
  const today = dateKey();
  const days = st.settings.breathDays ?? [];
  if (!days.includes(today)) st.setSettings({ breathDays: [...days, today].slice(-90) });
}

/** The lower Desk sections, top to bottom, unless the student reorders them. */
export const DESK_ORDER = ['due', 'mind', 'checkin', 'tiles', 'line'];

export function parseCards(text: string) {
  return text
    .split('\n')
    .map((line) => {
      const m = line.match(/^(.+?)\s*(?:::|\t| — | - |: )\s*(.+)$/);
      return m ? { front: m[1].trim(), back: m[2].trim() } : null;
    })
    .filter((x): x is { front: string; back: string } => !!x);
}

function plain(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** How a typed answer compares with the card: a match, close (a typo or part of it), or a miss. */
export function checkAnswer(typed: string, answer: string): 'match' | 'close' | 'miss' {
  const t = plain(typed);
  const a = plain(answer);
  if (!t) return 'miss';
  if (t === a) return 'match';
  // Typos are fine in words, not in numbers or dates ("1775" isn't "1776").
  const sameNumbers = t.replace(/\D/g, '') === a.replace(/\D/g, '');
  const d = editDistance(t, a);
  if (sameNumbers && a.length >= 5 && d <= Math.max(1, Math.floor(a.length * 0.15))) return 'match';
  if (d <= Math.floor(a.length * 0.35)) return 'close';
  // The key words are there ("powerhouse" for "powerhouse of the cell").
  const words = a.split(' ').filter((w) => w.length > 3);
  const hit = words.filter((w) => t.includes(w)).length;
  if (words.length && hit / words.length >= 0.5) return 'close';
  return 'miss';
}

export function hoursTotal(hours: HoursEntry[], kind: HoursEntry['kind'], nightOnly = false) {
  return hours.filter((h) => h.kind === kind && (!nightOnly || h.night)).reduce((s, h) => s + h.minutes, 0) / 60;
}

/** Monday of the week containing `key`. */
export function weekOf(key = dateKey()) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const back = (date.getDay() + 6) % 7;
  return addDays(key, -back);
}
