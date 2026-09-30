import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { addDays, dateKey } from './dates';

// Everything around school that makes a student's life easier: wins,
// gratitude, service and driving hours, countdowns, trusted people, the
// bedtime routine and tomorrow's bag, a worry box, flashcards, weekly
// reviews, and how Ember looks. Kept on the phone in life.json, like
// school.json and hub.json — nothing here leaves the device.

export interface Win {
  id: string;
  text: string;
  at: string;
}

export interface HoursEntry {
  id: string;
  kind: 'service' | 'driving' | 'work';
  date: string;
  minutes: number;
  note: string;
  /** Driving only: after dark. */
  night?: boolean;
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
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  note: string;
}

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
}

interface LifeData {
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
}

interface LifeStore extends LifeData {
  loaded: boolean;
  load: () => Promise<void>;

  addWin: (text: string) => void;
  deleteWin: (id: string) => void;
  restoreWin: (w: Win) => void;
  setGratitude: (date: string, items: string[]) => void;

  saveHours: (h: Omit<HoursEntry, 'id'> & { id?: string }) => void;
  deleteHours: (id: string) => void;

  saveCountdown: (c: Omit<Countdown, 'id'> & { id?: string }) => void;
  deleteCountdown: (id: string) => void;

  savePerson: (p: Omit<Person, 'id'> & { id?: string }) => void;
  deletePerson: (id: string) => void;

  setList: (which: 'pack' | 'windDownItems', items: ListItem[]) => void;
  toggleListItem: (which: 'packDone' | 'windDownDone', date: string, id: string) => void;

  addWorry: (text: string) => void;
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

  /** Everything, for export. */
  snapshot: () => LifeData;
  reset: () => void;
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
};

const EMPTY: LifeData = {
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
};

const FILE = 'life.json';

let timer: ReturnType<typeof setTimeout> | null = null;
function persist(data: LifeData) {
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
    };
  };
  const commit = (patch: Partial<LifeData>) => {
    set(patch);
    persist(data());
  };
  const mapDeck = (deckId: string, fn: (d: Deck) => Deck) => commit({ decks: get().decks.map((d) => (d.id === deckId ? fn(d) : d)) });

  return {
    ...EMPTY,
    loaded: false,

    load: async () => {
      if (get().loaded) return;
      try {
        const f = new File(Paths.document, FILE);
        if (f.exists) {
          const d = JSON.parse(await f.text()) as Partial<LifeData>;
          set({
            ...EMPTY,
            ...d,
            pack: d.pack?.length ? d.pack : DEFAULT_PACK,
            windDownItems: d.windDownItems?.length ? d.windDownItems : DEFAULT_WIND_DOWN,
            settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
          });
        }
      } catch {
        // Start fresh.
      }
      set({ loaded: true });
    },

    addWin: (text) => {
      const t = text.trim();
      if (!t) return;
      commit({ wins: [{ id: uid(), text: t, at: new Date().toISOString() }, ...get().wins] });
    },
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

    setList: (which, items) => commit({ [which]: items } as Partial<LifeData>),
    toggleListItem: (which, date, id) => {
      const map = get()[which];
      const day = map[date] ?? [];
      const next = day.includes(id) ? day.filter((x) => x !== id) : [...day, id];
      commit({ [which]: trimDays({ ...map, [date]: next }) } as Partial<LifeData>);
    },

    addWorry: (text) => {
      const t = text.trim();
      if (!t) return;
      commit({ worries: [{ id: uid(), text: t, createdAt: new Date().toISOString(), resolved: false }, ...get().worries] });
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

    snapshot: data,
    reset: () => commit({ ...EMPTY }),
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
export function parseCards(text: string) {
  return text
    .split('\n')
    .map((line) => {
      const m = line.match(/^(.+?)\s*(?:::|\t| — | - |: )\s*(.+)$/);
      return m ? { front: m[1].trim(), back: m[2].trim() } : null;
    })
    .filter((x): x is { front: string; back: string } => !!x);
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
