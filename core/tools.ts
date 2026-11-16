import type { IconName } from '../components/ui/Icon';
import { colors } from './theme';

// Every tool in the Drawer, grouped. Kept here (not in the Drawer page) so
// the app can tell when one is opened, for "Recently opened" and "Most used".
export interface Tool {
  title: string;
  body: string;
  path: string;
  icon: IconName;
  color: string;
  /** New this round: shows a small gold dot in the Drawer until opened. */
  isNew?: true;
}

// Everything that supports the core loop rather than being it. Nothing was
// removed in the redesign; it lives here instead of in the main navigation.
//
// Five groups by what the student needs, not by feature (docs/design/DIRECTION.md,
// "One Lit Thing", phase 3). Everything that was in the Drawer is still here.
// Icon color is a meaning, not a new hue: flame is school work, unlocked is
// still open, secured is resolved, shelved is let go, sky is time. Help stays
// danger. Settings and Plus stay on the quiet parchment.
export const GROUPS: { name: string; tools: Tool[] }[] = [
  {
    name: 'School and study',
    tools: [
      { title: 'Your day', body: 'A timeline of today', path: '/today', icon: 'clock', color: colors.sky },
      { title: 'Your week', body: 'Timetable and workload', path: '/week', icon: 'calendar', color: colors.sky },
      { title: 'Your schedule', body: 'Classes and activities', path: '/classes', icon: 'book', color: colors.sky },
      { title: 'Grades', body: 'Averages, GPA, the final', path: '/grades', icon: 'grade', color: colors.flame },
      { title: 'Sort out what’s late', body: 'One decision each', path: '/triage', icon: 'flag', color: colors.unlocked },
      { title: 'I was out', body: 'Catch up after an absence', path: '/absent', icon: 'message', color: colors.unlocked },
      { title: 'Connections', body: 'Canvas, Classroom, more', path: '/connections', icon: 'sparkle', color: colors.flame },
      { title: 'Scan a screenshot', body: 'Import from Classroom', path: '/scan', icon: 'image', color: colors.flame },
      { title: 'Focus', body: 'Light the study candle', path: '/focus', icon: 'timer', color: colors.flame },
      { title: 'Flashcards', body: 'Spaced repetition decks', path: '/flashcards', icon: 'cards', color: colors.flame },
      { title: 'How to study', body: 'Methods that work', path: '/techniques', icon: 'flask', color: colors.flame },
      { title: 'Notebook', body: 'Notes and study guides', path: '/notes', icon: 'pen', color: colors.flame },
      { title: 'Search', body: 'Find anything', path: '/search', icon: 'search', color: colors.sky },
    ],
  },
  {
    name: 'Feeling okay',
    tools: [
      { title: 'Check-in', body: 'Mood, sleep, stress', path: '/checkin', icon: 'sun', color: colors.unlocked },
      { title: 'Mood map', body: 'A month at a glance', path: '/moods', icon: 'heart', color: colors.shelved },
      { title: 'Sleep', body: 'Tonight’s plan', path: '/sleep', icon: 'bed', color: colors.sky },
      { title: 'Toolkit', body: 'For hard moments', path: '/toolkit', icon: 'sparkle', color: colors.shelved },
      { title: 'Worry box', body: 'Put it down for later', path: '/worry', icon: 'feather', color: colors.shelved },
      { title: 'Your people', body: 'Text someone you trust', path: '/people', icon: 'people', color: colors.secured },
      { title: 'Wins', body: 'The jar and good things', path: '/wins', icon: 'jar', color: colors.secured },
      { title: 'Weekly review', body: 'Five minutes on Sunday', path: '/review', icon: 'star', color: colors.sky },
      { title: 'Health', body: 'From Apple Health', path: '/health', icon: 'heart', color: colors.secured },
      { title: 'Trends', body: 'The last two weeks', path: '/trends', icon: 'trend', color: colors.sky },
      { title: 'Food', body: 'Meals and macros', path: '/nutrition', icon: 'bowl', color: colors.secured },
    ],
  },
  {
    name: 'Your days',
    tools: [
      { title: 'To-dos', body: 'Everything not school', path: '/tasks', icon: 'plate', color: colors.unlocked },
      { title: 'Habits', body: 'Small things you keep', path: '/habits', icon: 'repeat', color: colors.secured },
      { title: 'Countdowns', body: 'Things to look forward to', path: '/countdowns', icon: 'gift', color: colors.sky },
      { title: 'Hours', body: 'Service, driving, work', path: '/hours', icon: 'hands', color: colors.sky },
      { title: 'Calendar', body: 'Today’s schedule', path: '/calendar', icon: 'calendar', color: colors.sky },
      { title: 'Kept', body: 'Entries you saved', path: '/trove', icon: 'jar', color: colors.shelved },
    ],
  },
  {
    name: 'Later and looking back',
    tools: [
      { title: 'Applications', body: 'Deadlines and checklists', path: '/college', icon: 'cap', color: colors.flame },
      { title: 'Activities list', body: 'Common App, with limits', path: '/activities', icon: 'list', color: colors.flame },
      { title: 'Scholarships', body: 'Money for school', path: '/scholarships', icon: 'gift', color: colors.flame },
      { title: 'Rec letters', body: 'Ask, track, thank', path: '/recs', icon: 'message', color: colors.unlocked },
      { title: 'Financial aid', body: 'FAFSA step by step', path: '/aid', icon: 'check', color: colors.flame },
      { title: 'Loops', body: 'Everything still open', path: '/open-loops', icon: 'loops', color: colors.unlocked },
      { title: 'The Map', body: 'What keeps coming up', path: '/topography', icon: 'map', color: colors.shelved },
      { title: 'Wellness wheel', body: 'Eight parts of a life', path: '/wellness', icon: 'wheel', color: colors.shelved },
      { title: 'The science', body: 'Why the numbers move', path: '/science', icon: 'flask', color: colors.flame },
    ],
  },
  {
    name: 'You and the app',
    tools: [
      { title: 'About you', body: 'What the app knows', path: '/about', icon: 'person', color: colors.shelved, isNew: true },
      { title: 'Badges', body: 'Quiet ones, never lost', path: '/achievements', icon: 'trophy', color: colors.secured },
      { title: 'Your year', body: 'Everything, added up', path: '/year', icon: 'star', color: colors.sky, isNew: true },
      { title: 'Plus', body: 'More AI for the crew', path: '/plus', icon: 'sparkle', color: colors.textMuted },
      { title: 'Settings', body: 'You, Ember, your data', path: '/settings', icon: 'settings', color: colors.textMuted },
      { title: 'Need help now', body: 'Real people, any time', path: '/help', icon: 'phone', color: colors.danger },
    ],
  },
];

export const TOOLS: Tool[] = GROUPS.flatMap((g) => g.tools);
export const toolFor = (path: string) => TOOLS.find((t) => t.path === path);
