// The Glasshouse Study — a field journal for the inner weather.
// Aged vellum, fountain ink, brass and verdigris instrument fittings.
// Revised 2026-09-23: moved off the near-default warm-cream-plus-terracotta
// palette and the tracked-uppercase eyebrow label toward something specific
// to this subject — see docs/todo.md for the reasoning.

export const colors = {
  background: '#EFE7D4',
  backgroundAlt: '#E4D9BC',
  backgroundDeep: '#D6C79F',

  ink: '#21201C',
  inkMuted: '#524C3E',
  inkFaint: '#7A7259',
  hint: '#A79C7C',
  divider: '#D2C4A0',

  // Instrument brass — the primary accent, replacing the old amber "lantern".
  leather: '#8C6A2F',
  leatherDark: '#5E4A21',

  // Kept as an alias so existing lantern-glow usages still resolve; now
  // brass-toned rather than amber.
  lantern: '#8C6A2F',
  lanternGlow: 'rgba(140, 106, 47, 0.22)',

  // Patinated copper — a second, cooler instrument tone.
  verdigris: '#5B7268',
  verdigrisGlow: 'rgba(91, 114, 104, 0.2)',

  // cognitive_state labels — unlocked is the one deliberately saturated
  // color in the whole palette, so it actually reads as a signal.
  secured: '#5B7268',
  shelved: '#7A7259',
  unlocked: '#9C4A31',

  danger: '#9C4A31',
} as const;

// Soft gradient washes — same palette, used behind key screens instead of
// flat fills for a softer, more contemporary feel.
export const gradients = {
  dawn: ['#EFE7D4', '#E9DCB9', '#DFC896'] as const, // vellum into a brass glow
  dusk: ['#E4D9BC', '#D8C89C', '#C9B382'] as const, // desk surface into deeper brass
  quiet: ['#EFE7D4', '#E5D9B8', '#E4D9BC'] as const, // subtle, for calmer sections
  night: ['#D6C79F', '#C4AE7D', '#AC9662'] as const, // dimmer, moodier — late evening into night
} as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displaySoft: 'Fraunces_500Medium_Italic',
  body: 'Lora_400Regular',
  bodyMedium: 'Lora_500Medium',
  mono: 'CourierPrime_400Regular',
} as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 32, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  bodyMuted: { fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.inkFaint,
    textTransform: 'uppercase' as const,
  },
  caption: { fontFamily: fonts.mono, fontSize: 11, color: colors.hint },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radii = { sm: 4, md: 8, lg: 20, xl: 28, pill: 999 } as const;

export const stateColor = (state: 'secured' | 'shelved' | 'unlocked') => colors[state];

// Tri-color escalation for "how full / how good" readings (0–100) — shared by
// every gauge in the app so the same score always reads as the same color.
export const gaugeColor = (score: number) => {
  if (score >= 70) return colors.secured;
  if (score >= 40) return colors.lantern;
  return colors.unlocked;
};
