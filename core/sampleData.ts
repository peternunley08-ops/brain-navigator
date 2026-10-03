import type { CalendarEvent } from './googleCalendarStore';
import { EMPTY_HUB, type HubData } from './hubStore';
import { EMPTY_ABOUT, EMPTY_LIFE, type LifeData, type LifeSettings } from './lifeStore';
import { EMPTY_SCHOOL, type SchoolData } from './schoolStore';

// A made-up student for "Show someone the app": Riley, an 11th grader with a
// full, believable week. Every date is relative to today, so the sample
// always looks current. Phone numbers use the 555 range; no real people.

const DAY = 86400000;

function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** A date key `n` days from today. */
const on = (n: number) => key(new Date(Date.now() + n * DAY));
/** An ISO time `n` days from now, at a given hour and minute (local). */
function at(n: number, h: number, m = 0) {
  const d = new Date(Date.now() + n * DAY);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
let seq = 0;
const id = (p: string) => `${p}-${++seq}`;

const BIO = 'cls-bio';
const ENG = 'cls-eng';
const ALG = 'cls-alg';
const HIS = 'cls-his';
const SPA = 'cls-spa';
const TRK = 'cls-trk';

export function sampleSchool(): SchoolData {
  seq = 0;
  const weekdays = [1, 2, 3, 4, 5];
  const a = (
    title: string,
    classId: string,
    kind: SchoolData['assignments'][number]['kind'],
    due: number,
    minutes: number | null,
    extra: Partial<SchoolData['assignments'][number]> = {}
  ): SchoolData['assignments'][number] => ({
    id: id('hw'),
    title,
    classId,
    kind,
    due: on(due),
    minutes,
    notes: '',
    done: false,
    doneAt: null,
    createdAt: at(-3, 16),
    ...extra,
  });
  const assignments = [
    a('Cell respiration lab write-up', BIO, 'homework', 1, 45, {
      subtasks: [
        { id: 's1', text: 'Finish the data table', done: true },
        { id: 's2', text: 'Write the analysis', done: false },
        { id: 's3', text: 'Conclusion and sources', done: false },
      ],
    }),
    a('Genetics unit test', BIO, 'test', 4, 120, {
      starred: true,
      subtasks: [
        { id: 's4', text: 'Redo the Punnett square practice', done: true, on: on(0) },
        { id: 's5', text: 'Flashcards: vocab, twice through', done: false, on: on(1) },
        { id: 's6', text: 'Practice test, then fix mistakes', done: false, on: on(2) },
        { id: 's7', text: 'Quick review of the misses', done: false, on: on(3) },
      ],
    }),
    a('The Great Gatsby, ch. 6–7', ENG, 'reading', 0, 30),
    a('Problem set 4.2', ALG, 'homework', 0, 40),
    a('Personal narrative, first draft', ENG, 'essay', 6, 90),
    a('Quiz: logarithms', ALG, 'quiz', 2, 30),
    a('Vocab: el subjuntivo', SPA, 'homework', 1, 20),
    a('DBQ outline: the Progressive Era', HIS, 'project', 8, 75),
    a('Problem set 4.1', ALG, 'homework', -1, 35, { done: true, doneAt: at(-1, 19, 40) }),
    a('Chapter 5 reading', ENG, 'reading', -2, 25, { done: true, doneAt: at(-2, 20, 10) }),
    a('Lab safety quiz', BIO, 'quiz', -5, 15, { done: true, doneAt: at(-5, 15, 30) }),
    a('Spanish oral practice', SPA, 'homework', -3, 20, { done: true, doneAt: at(-3, 18, 50) }),
  ];
  const hw = (t: string) => assignments.find((x) => x.title === t)?.id ?? null;
  const focus = [
    [-11, 19, 25, null],
    [-10, 19, 25, hw('Lab safety quiz')],
    [-9, 20, 50, null],
    [-8, 19, 25, null],
    [-7, 19, 25, hw('Spanish oral practice')],
    [-6, 18, 15, null],
    [-5, 19, 25, null],
    [-4, 19, 25, hw('Chapter 5 reading')],
    [-3, 20, 25, null],
    [-2, 19, 50, hw('Problem set 4.1')],
    [-1, 19, 25, hw('Problem set 4.1')],
    [-1, 20, 25, hw('Genetics unit test')],
    [0, 16, 25, hw('Genetics unit test')],
  ].map(([d, h, m, aid]) => ({ id: id('f'), assignmentId: aid as string | null, minutes: m as number, at: at(d as number, h as number, m as number), rating: 'great' as const }));
  return {
    ...EMPTY_SCHOOL,
    profile: { name: 'Riley', grade: 11, sleepGoal: 9, nightlyCap: 120, onboarded: true },
    classes: [
      { id: BIO, name: 'AP Biology', teacher: 'Ms. Okafor', room: '112', color: '#9FD08A', kind: 'class', days: weekdays, start: 480, end: 530, level: 'ap' },
      { id: ENG, name: 'English 11 Honors', teacher: 'Mr. Alvarez', room: '204', color: '#F5B45C', kind: 'class', days: weekdays, start: 540, end: 590, level: 'honors' },
      { id: ALG, name: 'Algebra II', teacher: 'Mrs. Chen', room: '118', color: '#8FB4E8', kind: 'class', days: weekdays, start: 600, end: 650 },
      { id: HIS, name: 'US History', teacher: 'Mr. Grant', room: '210', color: '#E89AB8', kind: 'class', days: weekdays, start: 750, end: 800 },
      { id: SPA, name: 'Spanish III', teacher: 'Sra. Molina', room: '131', color: '#AFA2DE', kind: 'class', days: weekdays, start: 810, end: 860 },
      { id: TRK, name: 'Track practice', teacher: 'Coach Diaz', room: 'Field', color: '#F0845A', kind: 'activity', days: [1, 3, 5], start: 930, end: 1020 },
    ],
    assignments,
    focus,
    grades: [
      { id: id('g'), classId: BIO, title: 'Unit 2 test', category: 'Tests', score: 88, outOf: 100, date: on(-12) },
      { id: id('g'), classId: BIO, title: 'Osmosis lab', category: 'Labs', score: 19, outOf: 20, date: on(-8) },
      { id: id('g'), classId: BIO, title: 'Lab safety quiz', category: 'Quizzes', score: 10, outOf: 10, date: on(-4) },
      { id: id('g'), classId: ENG, title: 'Gatsby reading quiz', category: 'Quizzes', score: 17, outOf: 20, date: on(-6) },
      { id: id('g'), classId: ENG, title: 'Rhetorical analysis', category: 'Essays', score: 91, outOf: 100, date: on(-14) },
      { id: id('g'), classId: ALG, title: 'Exponents quiz', category: 'Quizzes', score: 14, outOf: 20, date: on(-10) },
      { id: id('g'), classId: ALG, title: 'Problem set 4.1', category: 'Homework', score: 10, outOf: 10, date: on(-1) },
      { id: id('g'), classId: HIS, title: 'Reconstruction essay', category: 'Essays', score: 85, outOf: 100, date: on(-9) },
      { id: id('g'), classId: SPA, title: 'Oral practice', category: 'Speaking', score: 46, outOf: 50, date: on(-3) },
    ],
    stressTags: { [on(-6)]: ['Tests'], [on(-3)]: ['Homework', 'Sleep'], [on(-1)]: ['Tests', 'Friends'], [on(0)]: ['Tests'] },
  };
}

export function sampleHub(): HubData {
  const t = (type: HubData['notes'][number]['blocks'][number]['type'], text: string, checked?: boolean) => ({ id: id('b'), type, text, ...(checked !== undefined ? { checked } : {}) });
  return {
    ...EMPTY_HUB,
    notes: [
      {
        id: 'note-resp',
        title: 'Cellular respiration',
        icon: 'book',
        color: '#9FD08A',
        classId: BIO,
        pinned: true,
        createdAt: at(-5, 9),
        updatedAt: at(-1, 20),
        blocks: [
          t('heading', 'The big picture'),
          t('text', 'Glucose + oxygen → carbon dioxide + water + ATP. Most of the ATP comes from the electron transport chain.'),
          t('heading', 'Three stages'),
          t('numbered', 'Glycolysis: in the cytoplasm, 2 ATP'),
          t('numbered', 'Krebs cycle: in the mitochondria, makes NADH and FADH2'),
          t('numbered', 'Electron transport chain: about 34 ATP'),
          t('quote', 'If there’s no oxygen, it’s fermentation instead.'),
          t('todo', 'Ask Ms. Okafor about the proton gradient', false),
        ],
      },
      {
        id: 'note-gen',
        title: 'Genetics study guide',
        icon: 'flag',
        color: '#9FD08A',
        classId: BIO,
        pinned: false,
        createdAt: at(-2, 19),
        updatedAt: at(0, 16),
        blocks: [
          t('heading', 'Know cold'),
          t('bullet', 'Dominant vs. recessive, genotype vs. phenotype'),
          t('bullet', 'Punnett squares, including dihybrid'),
          t('bullet', 'Incomplete dominance and codominance'),
          t('todo', 'Practice test', false),
          t('todo', 'Vocab flashcards', true),
        ],
      },
      {
        id: 'note-essay',
        title: 'Common App essay: brainstorm',
        icon: 'feather',
        color: '#8FB4E8',
        classId: null,
        pinned: false,
        createdAt: at(-9, 21),
        updatedAt: at(-2, 21),
        wordGoal: 650,
        blocks: [
          t('text', 'The morning I finished last in the 800 and still ran the cool-down lap with the team. Nobody made me. I think that’s the essay: I don’t quit things just because they go badly.'),
          t('text', 'Other idea: teaching my little brother to read with the library’s summer program.'),
        ],
      },
    ],
    colleges: [
      { id: 'col-1', name: 'Oregon State', plan: 'EA', deadline: on(30), status: 'applying', steps: { 'Main essay': false, 'Activities list': true, Transcript: true }, notes: '', tier: 'likely', fee: 65 },
      { id: 'col-2', name: 'UC Santa Cruz', plan: 'RD', deadline: on(58), status: 'researching', steps: {}, notes: 'Marine biology!', tier: 'target', fee: 80 },
      { id: 'col-3', name: 'University of Washington', plan: 'RD', deadline: on(90), status: 'researching', steps: {}, notes: '', tier: 'reach', fee: 80 },
    ],
    plan: [{ id: 'blk-1', date: on(0), title: 'Genetics practice test', start: 1140, end: 1185, color: '#9FD08A', done: false }],
    scholarships: [{ id: 'sch-1', name: 'Rotary Club award', amount: 1000, deadline: on(21), status: 'todo' }],
    recs: [{ id: 'rec-1', teacher: 'Ms. Okafor (Biology)', askedOn: on(-3), due: on(25), status: 'asked', thanked: false }],
    activities: [
      { id: 'act-1', role: 'Varsity runner', org: 'Track and field', description: 'Run the 800 and 1600; captain of the warm-up crew.', grades: [10, 11], hoursPerWeek: 10, weeksPerYear: 30 },
      { id: 'act-2', role: 'Reading buddy', org: 'Public library', description: 'Read with kids every Saturday in the summer program.', grades: [10, 11], hoursPerWeek: 2, weeksPerYear: 20 },
    ],
  };
}

export function sampleLife(real: LifeSettings): LifeData {
  const card = (front: string, back: string, box: number, due: number, seen: number) => ({ id: id('c'), front, back, box, due: on(due), seen });
  return {
    ...EMPTY_LIFE,
    // Keep how the app feels (haptics, Ember's look); drop anything personal; AI off.
    settings: { ...real, birthday: null, aiOff: true, memoryOff: true, deskHidden: [], deskFolded: [], deskOrder: undefined, whatsNewSeen: real.whatsNewSeen } as LifeSettings,
    wins: [
      { id: id('w'), text: 'Asked Mr. Alvarez for help with my thesis', at: at(-1, 15) },
      { id: id('w'), text: 'New best in the 800: 2:21', at: at(-3, 17) },
      { id: id('w'), text: 'Finished the lab before practice', at: at(-4, 14) },
      { id: id('w'), text: 'Went to bed on time three nights in a row', at: at(-6, 22) },
      { id: id('w'), text: 'Started the essay even though I didn’t feel ready', at: at(-9, 21) },
    ],
    gratitude: { [on(0)]: ['Coach Diaz staying late', 'Rain on the way home'], [on(-1)]: ['Jordan’s terrible jokes'] },
    hours: [
      { id: id('h'), kind: 'service', date: on(-6), minutes: 180, note: 'Library summer program' },
      { id: id('h'), kind: 'service', date: on(-13), minutes: 180, note: 'Library summer program' },
      { id: id('h'), kind: 'service', date: on(-20), minutes: 240, note: 'Food bank' },
      { id: id('h'), kind: 'driving', date: on(-2), minutes: 45, note: 'Practice with Mom' },
      { id: id('h'), kind: 'driving', date: on(-5), minutes: 60, note: 'Highway practice', night: true },
    ],
    countdowns: [
      { id: id('cd'), title: 'Track meet', date: on(5), kind: 'event', color: '#F0845A', icon: 'flag' },
      { id: id('cd'), title: 'Homecoming', date: on(16), kind: 'event', color: '#E89AB8', icon: 'star' },
      { id: id('cd'), title: 'Winter break', date: on(70), kind: 'break', color: '#8FB4E8' },
    ],
    people: [
      { id: id('p'), name: 'Mom', phone: '(555) 201-4433', note: 'Always picks up' },
      { id: id('p'), name: 'Jordan', phone: '(555) 310-8890', note: 'Makes me laugh', reachedAt: at(-2, 21) },
      { id: id('p'), name: 'Coach Diaz', phone: '(555) 404-1170', note: '' },
    ],
    worries: [
      { id: id('wy'), text: 'What if I bomb the genetics test', createdAt: at(-1, 22), resolved: false },
      { id: id('wy'), text: 'Jordan seemed upset at lunch', createdAt: at(-4, 13), resolved: true },
    ],
    decks: [
      {
        id: 'deck-gen',
        name: 'Genetics vocab',
        classId: BIO,
        color: '#9FD08A',
        createdAt: at(-4, 19),
        cards: [
          card('Allele', 'One version of a gene', 3, 2, 3),
          card('Genotype', 'The genes you carry (like Bb)', 2, 0, 2),
          card('Phenotype', 'The trait you can see', 4, 6, 4),
          card('Homozygous', 'Two of the same allele (BB or bb)', 1, 0, 1),
          card('Codominance', 'Both alleles show fully (red and white spots)', 1, 0, 1),
          card('Incomplete dominance', 'A blend (red + white → pink)', 0, 0, 0),
        ],
      },
      {
        id: 'deck-spa',
        name: 'El subjuntivo',
        classId: SPA,
        color: '#AFA2DE',
        createdAt: at(-7, 18),
        cards: [
          card('Espero que tú ___ (venir)', 'vengas', 3, 1, 3),
          card('Es importante que nosotros ___ (estudiar)', 'estudiemos', 2, 0, 2),
          card('Quiero que ella ___ (ser) feliz', 'sea', 4, 5, 4),
          card('Ojalá que ___ (hacer) sol', 'haga', 1, 0, 1),
        ],
      },
    ],
    reviews: [{ weekOf: on(-7), well: 'Got ahead on the lab.', hard: 'Algebra quiz nerves.', next: 'Start studying for tests three days out.', at: at(-7, 19) }],
    oneThing: { [on(0)]: 'Finish the lab write-up' },
    quiz: { played: 6, best: 140, correct: 31 },
    about: {
      ...EMPTY_ABOUT,
      picks: { time: 'b', sound: 'a', company: 'b', plan: 'a', feel: 'b', start: 'a' },
      interests: ['Sports', 'Music', 'Photography', 'Outdoors'],
      favSubjects: ['Biology', 'English'],
      hardSubjects: ['Math'],
      studyWays: ['cards', 'practice'],
      calmers: ['breathe', 'vent'],
      cheer: 'calm',
      goals: [
        { id: id('gl'), text: 'Get an A in AP Bio', at: at(-20, 18) },
        { id: id('gl'), text: 'Sleep before 11 on school nights', at: at(-20, 18) },
      ],
      answers: [
        { id: id('an'), q: 'What’s one song you’ve had on repeat lately?', a: 'Anything by Phoebe Bridgers', at: at(-3, 20) },
        { id: id('an'), q: 'Where do you get your best thinking done?', a: 'On long runs', at: at(-5, 20) },
      ],
      weeks: [{ week: on(-7), text: 'Tired, but I kept showing up.' }],
      helped: { breathe: [5, 1], vent: [3, 1] },
      introDone: true,
      opened: { '/today': 6, '/grades': 4, '/flashcards': 5, '/notes': 3 },
      recent: ['/flashcards', '/grades', '/today', '/notes'],
    },
  };
}

/** The online tables, as the stand-in database will serve them. */
export function sampleTables(): Record<string, Record<string, unknown>[]> {
  const checkins = Array.from({ length: 14 }, (_, i) => {
    const n = -13 + i;
    const mood = [3, 4, 3, 2, 4, 4, 5, 3, 3, 4, 2, 4, 4, 4][i];
    const sleep = [7.5, 8, 7, 6, 8.5, 8, 9, 7, 6.5, 8, 5.5, 8, 8.5, 7.5][i];
    return {
      id: `ci-${i}`,
      checkin_date: on(n),
      mood,
      sleep_hours: sleep,
      sleep_quality: Math.max(1, Math.min(5, Math.round(sleep - 4))),
      stress_level: [4, 3, 5, 7, 3, 4, 2, 5, 6, 4, 8, 4, 5, 5][i],
      notes: null,
      created_at: at(n, 21, 10),
      notion_page_id: null,
    };
  });
  const habits = [
    { id: 'hab-1', name: 'Morning walk', frequency: 'daily', category: 'physical', target_per_week: null, archived: false, created_at: at(-20, 8) },
    { id: 'hab-2', name: 'Read 20 minutes', frequency: 'daily', category: 'intellectual', target_per_week: null, archived: false, created_at: at(-20, 8) },
    { id: 'hab-3', name: 'Phone out of the bedroom', frequency: 'daily', category: 'environmental', target_per_week: null, archived: false, created_at: at(-20, 8) },
  ];
  const habitLogs: Record<string, unknown>[] = [];
  for (let n = -9; n <= 0; n++) {
    if (n !== -4) habitLogs.push({ id: `hl-1-${n}`, habit_id: 'hab-1', log_date: on(n), created_at: at(n, 7, 30) });
    if (n % 2 === 0 || n === -1) habitLogs.push({ id: `hl-2-${n}`, habit_id: 'hab-2', log_date: on(n), created_at: at(n, 21) });
    if (n < -1 && n !== -6) habitLogs.push({ id: `hl-3-${n}`, habit_id: 'hab-3', log_date: on(n), created_at: at(n, 22) });
  }
  const entry = (i: number, state: string, mood: string, intensity: number, daysAgo: number, extra: Record<string, unknown> = {}) => ({
    id: `cs-${i}`,
    state,
    mood,
    intensity,
    notes: null,
    created_at: at(-daysAgo, 20),
    in_trove: false,
    notion_page_id: null,
    image_url: null,
    ...extra,
  });
  return {
    cognitive_state: [
      entry(1, 'unlocked', 'The college essay feels huge', 7, 5),
      entry(2, 'unlocked', 'Weird lunch with Jordan', 4, 2),
      entry(3, 'unlocked', 'The Genetics test', 6, 0),
      entry(4, 'secured', 'Asking for the extension', 6, 9, { in_trove: true, notes: 'Mr. Grant said yes. It was fine.' }),
      entry(5, 'secured', 'Track tryouts', 5, 15),
      entry(6, 'secured', 'Lost my bus pass', 3, 12),
      entry(7, 'shelved', 'Comparing myself to everyone online', 5, 18),
    ],
    catalysts: [],
    entities: [],
    resolutions: [{ id: 'res-1', cognitive_state_id: 'cs-4', description: 'Just asked. He said yes.', resolved_at: at(-8, 15), created_at: at(-8, 15) }],
    daily_checkins: checkins,
    habits,
    habit_logs: habitLogs,
    tasks: [
      { id: 'task-1', title: 'Return library books', category: 'occupational', planned_date: on(0), completed: true, completed_at: at(0, 15), created_at: at(0, 7), time_budget_minutes: 15, notion_page_id: null },
      { id: 'task-2', title: 'Call Grandma', category: 'social', planned_date: on(0), completed: false, completed_at: null, created_at: at(0, 7), time_budget_minutes: 20, notion_page_id: null },
      { id: 'task-3', title: 'Stretch after practice', category: 'physical', planned_date: on(0), completed: false, completed_at: null, created_at: at(0, 7), time_budget_minutes: 10, notion_page_id: null },
    ],
    plate_settings: [{ id: true, daily_cap: 6, updated_at: at(-10, 9) }],
    food_logs: [
      { id: 'food-1', name: 'Oatmeal and banana', calories: 380, protein_g: 12, carbs_g: 68, fat_g: 7, logged_date: on(0), created_at: at(0, 7, 15) },
      { id: 'food-2', name: 'Turkey sandwich', calories: 520, protein_g: 32, carbs_g: 54, fat_g: 18, logged_date: on(0), created_at: at(0, 12, 40) },
    ],
    macro_goals: [{ id: true, calories: 2400, protein_g: 110, carbs_g: 300, fat_g: 75, updated_at: at(-10, 9) }],
    sleep_ambient_checks: [],
    vent_entries: [
      { id: 'vent-1', content: 'Practice was rough and I was tired the whole time, but I finished. Tomorrow I’m going to bed earlier.', input_mode: 'type', created_at: at(-1, 21, 30) },
      { id: 'vent-2', content: 'I keep thinking the essay has to be perfect before I start it. It doesn’t. I just have to start.', input_mode: 'voice', created_at: at(-4, 22) },
    ],
  };
}

export function sampleEvents(): CalendarEvent[] {
  return [
    { id: 'ev-1', title: 'Dentist', start: at(0, 16, 30), end: at(0, 17, 15) },
    { id: 'ev-2', title: 'Study group (library)', start: at(0, 18), end: at(0, 19) },
  ];
}
