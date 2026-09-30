// Candlelight — a study at night, lit by the things you've set down.
//
// Revised 2026-09-29: the whole app moved off the vellum-on-vellum "field
// journal" (every surface the same beige, every button the same brown pill
// with tracked typewriter text) to a warm night. The Desk's candles are the
// light source; the rest of the app is the room they light. One accent —
// candle gold — carries every primary action, and the three entry states
// each get a color that means something against the dark: an ember for
// what's still open, sage for what's resolved, dusk lavender for what was
// let go into the sky.

export const colors = {
  // The room.
  night: '#120F14',
  nightHigh: '#1B1520',
  surface: '#211A25',
  surfaceHigh: '#2B2230',
  surfaceSunk: '#17121A',
  line: 'rgba(255, 228, 190, 0.09)',
  lineStrong: 'rgba(255, 228, 190, 0.18)',

  // Ink, reversed: warm parchment on the dark.
  text: '#F5EBDD',
  textMuted: '#C3B3A0',
  textFaint: '#8E8173',
  hint: '#6B6057',

  // Candlelight — the one accent for actions and focus.
  flame: '#F5B45C',
  flameHot: '#FFDCA6',
  flameDeep: '#DE8238',
  flameInk: '#2A1606', // text on a flame-filled button
  glow: 'rgba(245, 180, 92, 0.16)',
  glowStrong: 'rgba(245, 180, 92, 0.32)',

  // Entry states. `unlocked` stays the one saturated signal.
  unlocked: '#F0845A',
  secured: '#8CC0A8',
  shelved: '#AFA2DE',

  danger: '#F07060',
} as const;

// Washes behind every screen: a little warmer at the top, where the light
// comes from, falling to the darkest night at the bottom.
export const gradients = {
  room: ['#1E1722', '#141016', '#0F0C11'] as const,
  ember: ['#2A1C1F', '#16111A', '#0F0C11'] as const, // a warmer room, for the Desk
  dusk: ['#1D1828', '#141119', '#0F0C11'] as const, // cooler, for Steady and Breathe
  flame: ['#FFD08A', '#F5B45C', '#E4903F'] as const, // primary button fill
} as const;

// Fraunces is the voice of the app and of Ember (its italic); Figtree does
// the everyday work — labels, lists, forms, numbers.
export const fonts = {
  display: 'Fraunces_600SemiBold',
  displaySoft: 'Fraunces_500Medium_Italic',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  // Numbers and gauge readouts. Kept as its own name so readouts can be
  // restyled together; now a sans with tabular figures, not a typewriter.
  mono: 'Figtree_600SemiBold',
} as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.text },
  section: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.text },
  bodyMuted: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.textMuted },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textFaint },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
  voice: { fontFamily: fonts.displaySoft, fontSize: 18, lineHeight: 25, color: colors.text },
  // Kept for older call sites.
  caption: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radii = { sm: 8, md: 14, lg: 22, xl: 30, pill: 999 } as const;

// Screen side gutter, and the room left under scroll content for the nav.
export const layout = { gutter: 20, navClearance: 124, maxWidth: 520 } as const;

export const stateColor = (state: 'secured' | 'shelved' | 'unlocked') => colors[state];

// Tri-color escalation for "how full / how good" readings (0–100) — shared by
// every gauge in the app so the same score always reads as the same color.
export const gaugeColor = (score: number) => {
  if (score >= 70) return colors.secured;
  if (score >= 40) return colors.flame;
  return colors.unlocked;
};

// One color per wellness dimension, for dots and wheel vertices.
export const dimensionColor: Record<string, string> = {
  emotional: '#F0845A',
  environmental: '#8CC0A8',
  financial: '#E6C46A',
  intellectual: '#8FB4E8',
  occupational: '#D99A6C',
  physical: '#9FD08A',
  social: '#E89AB8',
  spiritual: '#AFA2DE',
};

// Hex → rgba, for glows and tints built from a token.
export function alpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
