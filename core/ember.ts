// What Ember says. No language model — Ember reads what the app already
// knows (what's open on the Desk, today's check-in, the plate, the habits,
// the hour) and picks the most useful thing to say about it, plus a plain
// explanation of whatever screen you're on. Everything stays on the phone.

import type { IconName } from '../components/ui/Icon';
import type { EmberMood } from './emberStore';
import { useHabitsStore } from './habitsStore';
import { useHubStore } from './hubStore';
import { daysUntil, dueLabel, KIND_LABEL, nowState, tonightsLoad, useSchoolStore } from './schoolStore';
import { useBrainNavigatorStore } from './store';
import { useTasksStore } from './tasksStore';
import { useWellnessStore } from './wellnessStore';

export interface EmberAction {
  label: string;
  href: string;
  icon?: IconName;
}

export interface EmberTip {
  id: string;
  line: string;
  actions?: EmberAction[];
  /** 3 = worth a dot on Ember's head, 0 = small talk. */
  priority: number;
  mood?: EmberMood;
}

export interface EmberAdvice {
  tips: EmberTip[];
  about: { title: string; line: string; actions?: EmberAction[] };
}

const DAY = 24 * 60 * 60 * 1000;

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysOpen(createdAt: string, now: number) {
  return Math.floor((now - new Date(createdAt).getTime()) / DAY);
}

function quoteTitle(title: string | null) {
  const t = (title ?? 'That one').trim();
  return t.length > 34 ? `${t.slice(0, 32)}…` : t;
}

const A = {
  checkin: { label: 'Check in', href: '/checkin', icon: 'sun' },
  breathe: { label: 'Breathe', href: '/breathe', icon: 'wind' },
  vent: { label: 'Let it out', href: '/vent', icon: 'mic' },
  talk: { label: 'Talk it through', href: '/companion', icon: 'chat' },
  setDown: { label: 'Set something down', href: '/new-entry', icon: 'plus' },
  loops: { label: 'See what’s open', href: '/open-loops', icon: 'loops' },
  tasks: { label: 'To-dos', href: '/tasks', icon: 'plate' },
  habits: { label: 'Habits', href: '/habits', icon: 'repeat' },
  trends: { label: 'Trends', href: '/trends', icon: 'trend' },
  drawer: { label: 'The Drawer', href: '/drawer', icon: 'drawer' },
  map: { label: 'The Map', href: '/topography', icon: 'map' },
  school: { label: 'School', href: '/school', icon: 'book' },
  addWork: { label: 'Add homework', href: '/add-assignment', icon: 'plus' },
  classes: { label: 'Add classes', href: '/classes', icon: 'book' },
  scan: { label: 'Scan a screenshot', href: '/scan', icon: 'image' },
  focus: { label: 'Focus', href: '/focus', icon: 'timer' },
  help: { label: 'Need help now', href: '/help', icon: 'phone' },
} satisfies Record<string, EmberAction>;

// A plain explanation of every screen — "what am I looking at, and what
// do I do here?"
const ABOUT: Record<string, { title: string; line: string; actions?: EmberAction[] }> = {
  '/': {
    title: 'The Desk',
    line: 'Your day at a glance: the class you’re in or have next, what’s due soon, and what’s on your mind. Each candle is something weighing on you — tap one to resolve it or let it go.',
    actions: [A.addWork, A.setDown],
  },
  '/school': {
    title: 'School',
    line: 'Everything due, grouped by when. Tap a circle to finish something. “Tonight’s load” warns you when more is due by tomorrow than a night can hold.',
    actions: [A.addWork, A.scan],
  },
  '/focus': {
    title: 'Focus',
    line: 'Pick one thing and a length, then light the candle. It burns down while you work. When it’s out, take a real break.',
  },
  '/classes': {
    title: 'Your schedule',
    line: 'Your classes and activities with their days and times. That’s how I know what’s next — and it lets homework belong to a class.',
    actions: [A.scan],
  },
  '/class-edit': {
    title: 'A class',
    line: 'A name, a color, the days, and the times. Teacher and room are optional.',
  },
  '/add-assignment': {
    title: 'Adding something due',
    line: 'Name it, pick the class and day, and guess how long it’ll take. The guess is what lets me warn you about a heavy night.',
  },
  '/assignment': {
    title: 'An assignment',
    line: 'Start a focus session on it, mark it done, or change the details. For tests I’ll suggest how to study.',
  },
  '/help': {
    title: 'Need help now',
    line: 'Real people, any time. Every button opens your phone’s own dialer or messages. Nothing goes through this app.',
  },
  '/today': {
    title: 'Your day',
    line: 'Classes, calendar events, focus, and blocks you plan, laid out in time. Plan a block for the thing you keep putting off — it’s easier to start when it has a time.',
  },
  '/notes': {
    title: 'Notebook',
    line: 'Your own pages. Start from a template — class notes and study guides come with headings in. Tag a page to a class to find it later.',
  },
  '/note': {
    title: 'A page',
    line: 'Return on a heading, bullet, or checklist starts a new line of the same kind. Backspace on an empty line removes it.',
  },
  '/college': {
    title: 'College',
    line: 'Each school gets its deadline and a checklist — essay, supplements, recs, transcript, scores. The next deadline is always at the top.',
  },
  '/connections': {
    title: 'Connections',
    line: 'Google Calendar and Canvas connect for real. Classroom comes in by screenshot. The rest are one tap away.',
  },
  '/scan': {
    title: 'Scanning a screenshot',
    line: 'Pick a screenshot of Google Classroom or Canvas. Your phone reads the text itself, then you choose what to bring in.',
  },
  '/open-loops': {
    title: 'Loops',
    line: 'Everything that’s still open, oldest first. Tap one to close it: resolve it if it’s handled, or let it go if you’re choosing not to carry it.',
  },
  '/topography': {
    title: 'The Map',
    line: 'Each dot is something you set down. Lines join it to the people and things behind it. The ones that keep showing up are worth a look.',
  },
  '/steady': {
    title: 'Steady',
    line: 'For when it’s a lot, right now. Breathe slows your body down. Let it out gets the words out of your head. Or talk it through with me.',
    actions: [A.breathe, A.talk],
  },
  '/new-entry': {
    title: 'Setting something down',
    line: 'Just name it — a few words is enough. Slide the flame to how heavy it feels. It becomes a candle on your Desk until you close it.',
  },
  '/drawer': {
    title: 'The Drawer',
    line: 'Everything else lives here: your check-in, health, trends, the plate, habits, food, calendar, and what you’ve kept.',
  },
  '/checkin': {
    title: 'Check-in',
    line: 'Once a day: mood, sleep, and stress. Takes a minute. It’s what lets me notice when a day is harder than usual.',
  },
  '/health': {
    title: 'Health',
    line: 'Your steps, resting heart rate, and sleep from Apple Health, read-only. Mindful minutes from Breathe get written back.',
  },
  '/trends': {
    title: 'Trends',
    line: 'How your check-ins have moved over the last two weeks. Tap a measure to switch lines.',
    actions: [A.checkin],
  },
  '/tasks': {
    title: 'To-dos',
    line: 'What you’re carrying today. The cap is how much you want on the plate, not a goal to hit. Tap a task to mark it done.',
  },
  '/habits': {
    title: 'Habits',
    line: 'Small things you want to keep doing. Tap a habit’s circle when you’ve done it today; the streak counts itself.',
  },
  '/nutrition': {
    title: 'Food',
    line: 'Log a meal with whatever numbers you know. The ring fills toward your daily goal. Goals are yours to change.',
  },
  '/calendar': {
    title: 'Calendar',
    line: 'Today on your Google Calendar. Add a focus block that starts now, straight from here.',
  },
  '/trove': {
    title: 'Kept',
    line: 'Entries you chose to keep, so you can come back to how you got through them.',
  },
  '/wellness': {
    title: 'The wellness wheel',
    line: 'Eight parts of a life, scored from your own tasks, habits, check-ins, and closed candles. A hollow point means there’s not enough yet to say.',
    actions: [A.tasks, A.habits],
  },
  '/science': {
    title: 'The science',
    line: 'Short reads on why sleep, caffeine, light, and habits move the numbers you log.',
  },
  '/vent': {
    title: 'Let it out',
    line: 'Speak or type whatever’s in your head, then let it go. Nothing here is graded, and speech turns into text right on your phone.',
  },
  '/entry': {
    title: 'A candle',
    line: 'Resolve it if it’s handled — add a note about how. Let it go if you’re choosing to stop carrying it. Both count as closing it.',
  },
};

export function adviseFor(pathname: string, now = new Date()): EmberAdvice {
  const route = pathname.startsWith('/entry/')
    ? '/entry'
    : pathname.startsWith('/assignment/')
      ? '/assignment'
      : pathname.startsWith('/note/')
        ? '/note'
        : pathname;
  const tips: EmberTip[] = [];
  const hour = now.getHours();
  const ms = now.getTime();

  const openLoops = useBrainNavigatorStore.getState().openLoops;
  const checkin = useWellnessStore.getState().todaysCheckin();
  const { tasks, dailyCap } = useTasksStore.getState();
  const { habits, logs } = useHabitsStore.getState();

  const lateNight = hour >= 23 || hour < 4;
  const oldest = [...openLoops].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  const oldestDays = oldest ? daysOpen(oldest.created_at, ms) : 0;

  // ---- Anywhere ----------------------------------------------------------

  if (checkin?.stress_level != null && checkin.stress_level >= 7) {
    tips.push({
      id: `stress-${todayKey(now)}`,
      line: 'You marked stress high today. Want to steady yourself before anything else?',
      actions: [A.breathe, A.vent],
      priority: 3,
      mood: 'concerned',
    });
  }

  if (lateNight) {
    tips.push({
      id: `late-${todayKey(now)}`,
      line: 'It’s late. Whatever’s still open will keep until morning. A slow breath before sleep?',
      actions: [A.breathe],
      priority: 2,
      mood: 'sleepy',
    });
  }

  if (!checkin && hour >= 7 && !lateNight) {
    tips.push({
      id: `checkin-${todayKey(now)}`,
      line: 'You haven’t checked in today. It takes about a minute, and it helps me notice how you’re doing.',
      actions: [A.checkin],
      priority: 2,
      mood: 'curious',
    });
  }

  const sleepGoal = useSchoolStore.getState().profile.sleepGoal;
  if (checkin?.sleep_hours != null && checkin.sleep_hours < sleepGoal - 1) {
    tips.push({
      id: `sleep-${todayKey(now)}`,
      line: `You slept about ${checkin.sleep_hours} hours — teens need 8 to 10. Go easy today, and try for an earlier night.`,
      priority: 1,
      mood: 'concerned',
    });
  }

  if (oldest && oldestDays >= 7) {
    tips.push({
      id: `old-${oldest.id}`,
      line: `“${quoteTitle(oldest.mood)}” has been burning for ${oldestDays} days. Is it ready to be resolved — or let go?`,
      actions: [{ label: 'Look at it', href: `/entry/${oldest.id}`, icon: 'candle' }],
      priority: 2,
      mood: 'curious',
    });
  }

  if (openLoops.length >= 4) {
    tips.push({
      id: `many-${openLoops.length}`,
      line: `${openLoops.length} things are open on your desk. Pick the smallest one — just one — and close it.`,
      actions: [A.loops],
      priority: 2,
      mood: 'concerned',
    });
  }

  // ---- School ------------------------------------------------------------

  const school = useSchoolStore.getState();
  const openWork = school.assignments.filter((a) => !a.done);
  const overdue = openWork.filter((a) => daysUntil(a.due) < 0);
  const tests = openWork
    .filter((a) => (a.kind === 'test' || a.kind === 'quiz') && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 3)
    .sort((a, b) => a.due.localeCompare(b.due));
  const load = tonightsLoad(school.assignments);
  const className = (id: string | null) => school.classes.find((c) => c.id === id)?.name;

  if (overdue.length) {
    const a = overdue[0];
    tips.push({
      id: `overdue-${a.id}`,
      line: `“${quoteTitle(a.title)}” was due ${dueLabel(a.due).toLowerCase()}. Finish it, or move the date so it stops nagging you.`,
      actions: [{ label: 'Open it', href: `/assignment/${a.id}`, icon: 'book' }],
      priority: 3,
      mood: 'concerned',
    });
  }

  if (tests.length) {
    const t = tests[0];
    const n = daysUntil(t.due);
    const cls = className(t.classId);
    tips.push({
      id: `test-${t.id}-${todayKey(now)}`,
      line:
        n === 0
          ? `${cls ? `${cls} ` : ''}${KIND_LABEL[t.kind].toLowerCase()} today. You’ve got this — breathe before you walk in.`
          : lateNight && n === 1
            ? `The ${cls ? `${cls} ` : ''}${KIND_LABEL[t.kind].toLowerCase()} is tomorrow. Sleep will do more for it now than another hour of cramming.`
            : `${cls ? `${cls} ` : 'A '}${KIND_LABEL[t.kind].toLowerCase()} ${dueLabel(t.due).toLowerCase() === 'tomorrow' ? 'tomorrow' : `on ${dueLabel(t.due)}`}. Two short study sessions beat one long cram.`,
      actions: n === 0 ? [A.breathe] : [{ label: 'Study for it', href: `/focus?assignment=${t.id}`, icon: 'timer' }],
      priority: 3,
      mood: n === 0 ? 'happy' : 'curious',
    });
  }

  if (load.minutes > school.profile.nightlyCap) {
    const h = (load.minutes / 60).toFixed(load.minutes % 60 ? 1 : 0);
    tips.push({
      id: `load-${todayKey(now)}-${load.minutes}`,
      line: `About ${h} hours is due by tomorrow — more than a night holds. Start the biggest thing first, and ask for more time if you need it.`,
      actions: [A.school],
      priority: 2,
      mood: 'concerned',
    });
  }

  const colleges = useHubStore.getState().colleges.filter(
    (c) => (c.status === 'applying' || c.status === 'researching') && c.deadline && daysUntil(c.deadline) >= 0 && daysUntil(c.deadline) <= 14
  );
  if (colleges.length) {
    const c = [...colleges].sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))[0];
    tips.push({
      id: `college-${c.id}-${todayKey(now)}`,
      line: `${c.name} is due ${dueLabel(c.deadline!).toLowerCase() === 'tomorrow' ? 'tomorrow' : `in ${daysUntil(c.deadline!)} days`}. What’s left on its checklist?`,
      actions: [{ label: 'College list', href: '/college', icon: 'cap' }],
      priority: 3,
      mood: 'curious',
    });
  }

  if (school.loaded && school.classes.length === 0 && (route === '/' || route === '/school')) {
    tips.push({
      id: 'no-classes',
      line: 'Add your classes and I’ll always know what’s next. Quickest way: screenshot your Google Classroom.',
      actions: [A.scan, A.classes],
      priority: 1,
      mood: 'curious',
    });
  }

  if (route === '/school' && openWork.length === 0 && school.assignments.length > 0) {
    tips.push({ id: 'school-clear', line: 'Nothing due. You’re actually caught up. Go enjoy it.', priority: 0, mood: 'cheer' });
  }

  const ns = nowState(school.classes, now);
  if (route === '/' && ns.kind === 'next' && ns.minsUntil <= 10) {
    tips.push({ id: `next-${ns.cls.id}-${todayKey(now)}`, line: `${ns.cls.name} starts in ${ns.minsUntil} minutes${ns.cls.room ? `, room ${ns.cls.room}` : ''}.`, priority: 1 });
  }

  // ---- This screen -------------------------------------------------------

  if (route === '/' || route === '/open-loops') {
    if (openLoops.length === 0) {
      tips.push({
        id: 'clear',
        line: 'Your desk is clear. Nothing’s burning. That’s worth noticing.',
        actions: [A.setDown],
        priority: 0,
        mood: 'happy',
      });
    } else if (openLoops.length === 1) {
      tips.push({
        id: 'one-open',
        line: `Just one candle: “${quoteTitle(openLoops[0].mood)}”. Tap it when you’re ready to close it.`,
        actions: [{ label: 'Open it', href: `/entry/${openLoops[0].id}`, icon: 'candle' }],
        priority: 0,
      });
    }
  }

  if (route === '/tasks') {
    const open = tasks.filter((t) => !t.completed).length;
    if (tasks.length > 0 && open === 0) {
      tips.push({ id: 'plate-done', line: 'Everything on the plate is done. Really, well done.', priority: 1, mood: 'cheer' });
    } else if (open > dailyCap) {
      tips.push({
        id: 'plate-over',
        line: `There are ${open} open things on a plate you capped at ${dailyCap}. What could wait until tomorrow?`,
        priority: 2,
        mood: 'concerned',
      });
    } else if (tasks.length === 0) {
      tips.push({ id: 'plate-empty', line: 'Nothing on the plate yet. Add the one thing that matters most today.', priority: 0 });
    }
  }

  if (route === '/habits') {
    const today = todayKey(now);
    const undone = habits.filter(
      (h) => !h.archived && h.frequency === 'daily' && !logs.some((l) => l.habit_id === h.id && l.log_date === today)
    );
    if (undone.length > 0) {
      tips.push({
        id: `habit-${undone[0].id}-${today}`,
        line: `“${undone[0].name}” isn’t logged yet today. Tap its circle once you’ve done it.`,
        priority: 1,
      });
    } else if (habits.length > 0) {
      tips.push({ id: 'habits-done', line: 'Every daily habit is logged. That’s a streak kept.', priority: 0, mood: 'happy' });
    }
  }

  if (route === '/trends') {
    const count = useWellnessStore.getState().checkins.length;
    if (count < 3) {
      tips.push({
        id: 'trends-few',
        line: 'A few more days of check-ins and these lines will start to mean something.',
        actions: [A.checkin],
        priority: 0,
      });
    }
  }

  if (route === '/steady') {
    tips.push({
      id: 'steady',
      line: 'If you don’t know which one, start with Breathe. Two minutes is enough to take the edge off.',
      actions: [A.breathe],
      priority: 0,
    });
  }

  // ---- Something to say when nothing's pressing ------------------------

  if (tips.length === 0) {
    tips.push({
      id: 'hello',
      line: greeting(now),
      actions: route === '/' ? [A.setDown, A.talk] : [A.talk],
      priority: 0,
    });
  }

  tips.sort((a, b) => b.priority - a.priority);
  return { tips, about: ABOUT[route] ?? ABOUT['/'] };
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return 'Still up? I’m here too. Tap me whenever you need something.';
  if (h < 12) return 'Morning. I’m Ember — tap me any time you’re not sure what to do next.';
  if (h < 17) return 'Afternoon. I’m around if you need a hand with anything.';
  if (h < 22) return 'Evening. A good time to set down whatever the day left you holding.';
  return 'It’s getting late. I’ll keep the light on.';
}
