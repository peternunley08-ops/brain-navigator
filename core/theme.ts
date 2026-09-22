// The Glasshouse Study — warm editorial design tokens.
// Cream paper, leather, typewriter ink, lantern glow.

export const colors = {
  background: '#F4EEE0',
  backgroundAlt: '#EDE4CF',
  backgroundDeep: '#E3D9BE',

  ink: '#3A3226',
  inkMuted: '#6B5E48',
  inkFaint: '#8A7A5C',
  hint: '#B0A487',
  divider: '#D8CCAE',

  leather: '#5B4636',
  leatherDark: '#3A2C22',

  lantern: '#E8A33D',
  lanternGlow: 'rgba(232, 163, 61, 0.25)',

  // cognitive_state labels
  secured: '#4F7A5B',
  shelved: '#8A7A5C',
  unlocked: '#B3562E',

  danger: '#B33A3A',
} as const;

// Soft gradient washes — same warm palette, used behind key screens instead
// of flat fills for a softer, more contemporary feel.
export const gradients = {
  dawn: ['#F4EEE0', '#EFE2C8', '#E8CFA0'] as const, // cream into a warm lantern glow
  dusk: ['#EDE4CF', '#E3D6B4', '#D8C299'] as const, // desk surface into deeper amber
  quiet: ['#F4EEE0', '#E9DFC6', '#EDE4CF'] as const, // subtle, for calmer sections
  night: ['#E3D9BE', '#D3C39D', '#BFA97D'] as const, // dimmer, moodier — late evening into night
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
