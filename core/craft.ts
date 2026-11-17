// Semantic depth for the candlelit room. Glass stays on floating chrome; paper stays readable.
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import { alpha, colors, radii } from './theme';

export const curve: ViewStyle = Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {};

export const layers = {
  page: 0,
  content: 1,
  raised: 2,
  float: 10,
  chrome: 20,
  sheet: 30,
  toast: 40,
} as const;

export type Elevation = 'rest' | 'raised' | 'float' | 'overlay';

export function elevation(level: Elevation): ViewStyle {
  const hairline = { borderWidth: StyleSheet.hairlineWidth };
  if (level === 'rest') {
    return {
      ...curve,
      ...hairline,
      borderColor: colors.line,
      borderTopColor: colors.lineStrong,
      backgroundColor: colors.surface,
    };
  }
  if (level === 'raised') {
    return {
      ...curve,
      ...hairline,
      borderColor: colors.line,
      borderTopColor: colors.lineStrong,
      backgroundColor: colors.surfaceHigh,
      shadowColor: colors.shadow,
      shadowOpacity: 0.28,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    };
  }
  if (level === 'float') {
    return {
      ...curve,
      ...hairline,
      borderColor: colors.lineStrong,
      backgroundColor: colors.surfaceHigh,
      shadowColor: colors.shadow,
      shadowOpacity: 0.38,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    };
  }
  return {
    ...curve,
    ...hairline,
    borderColor: colors.line,
    shadowColor: colors.shadowDeep,
    shadowOpacity: 0.48,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  };
}

export type Material = 'paper' | 'sunk' | 'high' | 'veil';

export function material(kind: Material): ViewStyle {
  if (kind === 'sunk') return { backgroundColor: colors.surfaceSunk };
  if (kind === 'high') return { backgroundColor: colors.surfaceHigh };
  if (kind === 'veil') return { backgroundColor: alpha(colors.night, 0.55) };
  return { backgroundColor: colors.surface };
}

export function radiusFor(size: 'sm' | 'md' | 'lg' | 'xl' | 'pill'): ViewStyle {
  return { borderRadius: radii[size], ...curve };
}

export type CraftState = 'rest' | 'pressed' | 'disabled' | 'selected';

export function stateWash(tone: string, state: CraftState): ViewStyle {
  if (state === 'pressed') return { backgroundColor: alpha(tone, 0.09) };
  if (state === 'selected') {
    return {
      backgroundColor: alpha(tone, 0.14),
      borderColor: alpha(tone, 0.45),
      borderWidth: StyleSheet.hairlineWidth,
    };
  }
  if (state === 'disabled') return { opacity: 0.45 };
  return { backgroundColor: alpha(tone, 0.05) };
}

const toneKeys = ['flame', 'unlocked', 'secured', 'shelved', 'sky', 'danger', 'text', 'night'] as const;

export function craftCatalog(): { count: number; pillars: string[]; sample: string[] } {
  const materials = ['paper', 'sunk', 'high', 'veil'] as const;
  const elevations = ['rest', 'raised', 'float', 'overlay'] as const;
  const radiusSizes = ['sm', 'md', 'lg', 'xl', 'pill'] as const;
  const states = ['rest', 'pressed', 'disabled', 'selected'] as const;
  const count = materials.length * elevations.length * radiusSizes.length * states.length * toneKeys.length * 2 * 2;
  const sample: string[] = [];
  for (const kind of materials) {
    for (const level of elevations) {
      for (const size of radiusSizes) {
        for (const state of states) {
          for (const tone of toneKeys) {
            sample.push(`${kind}, ${level}, ${size}, ${state}, ${tone}`);
            if (sample.length === 12) {
              return {
                count,
                pillars: ['Visual depth', 'Motion and physics', 'Craft and precision', 'Tokenized system'],
                sample,
              };
            }
          }
        }
      }
    }
  }
  return {
    count,
    pillars: ['Visual depth', 'Motion and physics', 'Craft and precision', 'Tokenized system'],
    sample,
  };
}
