import type { EmberAccessory, EmberTheme } from './lifeStore';

// Ember's colors and accessories. Warmth — earned by looking after yourself
// and your work — unlocks more of them. Nothing is ever taken away.

export interface EmberPalette {
  label: string;
  body: [string, string, string];
  core: [string, string, string];
  glow: [string, string];
  cheek: string;
  ink: string;
  /** Warmth needed to unlock. */
  warmth: number;
}

export const EMBER_THEMES: Record<EmberTheme, EmberPalette> = {
  gold: {
    label: 'Gold',
    body: ['#FFE6AE', '#F9AE4E', '#E0612A'],
    core: ['#FFFAEA', '#FFE7B4', '#FFD28A'],
    glow: ['#FFB75E', '#FF9A45'],
    cheek: '#FF7A5C',
    ink: '#3A1A08',
    warmth: 0,
  },
  rose: {
    label: 'Rose',
    body: ['#FFE0E6', '#F58FA8', '#D4486E'],
    core: ['#FFF5F7', '#FFD6E0', '#FFB3C6'],
    glow: ['#FF9AB5', '#F0648C'],
    cheek: '#E0406A',
    ink: '#3A0E1C',
    warmth: 20,
  },
  ocean: {
    label: 'Ocean',
    body: ['#DDF3FF', '#7CC4F2', '#3A7FD0'],
    core: ['#F5FCFF', '#D2EEFF', '#A8DCFF'],
    glow: ['#8FD0FF', '#4FA0E8'],
    cheek: '#FF8FA8',
    ink: '#0E2238',
    warmth: 50,
  },
  forest: {
    label: 'Forest',
    body: ['#E6FAD8', '#93D37A', '#3F9A5A'],
    core: ['#F7FFF0', '#DDF5CC', '#BDE9A6'],
    glow: ['#A9E58C', '#5DB86E'],
    cheek: '#FF8F7A',
    ink: '#12301A',
    warmth: 100,
  },
  violet: {
    label: 'Twilight',
    body: ['#EEE6FF', '#B79AF0', '#7650C8'],
    core: ['#FBF8FF', '#E6DCFF', '#CDBBFF'],
    glow: ['#C3A8FF', '#8E6AE0'],
    cheek: '#FF8FC0',
    ink: '#22143F',
    warmth: 200,
  },
};

export const ACCESSORIES: { key: EmberAccessory; label: string; warmth: number }[] = [
  { key: 'auto', label: 'Depends on the moment', warmth: 0 },
  { key: 'none', label: 'Nothing', warmth: 0 },
  { key: 'glasses', label: 'Study glasses', warmth: 0 },
  { key: 'cap', label: 'Graduation cap', warmth: 10 },
  { key: 'headphones', label: 'Headphones', warmth: 30 },
  { key: 'scarf', label: 'Cozy scarf', warmth: 60 },
];

export type Worn = Exclude<EmberAccessory, 'auto'>;

/** What Ember wears on a screen when the choice is "depends on the moment". */
export function autoAccessory(pathname: string, hour = new Date().getHours()): Worn {
  if (pathname.startsWith('/college') || pathname.startsWith('/activities') || pathname.startsWith('/scholarships')) return 'cap';
  if (/^\/(notes|note|flashcards|deck|grades|techniques|class)/.test(pathname)) return 'glasses';
  if (hour >= 21 || hour < 5) return 'scarf';
  return 'none';
}
