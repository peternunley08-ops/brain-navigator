import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { alpha, colors } from '../../core/theme';

/** True where iOS draws Liquid Glass (iOS 26 and up). Elsewhere callers keep their solid fill. */
export const GLASS = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/** The room's warm dark, laid over the glass so text stays easy to read. */
export const GLASS_TINT = alpha(colors.night, 0.45);

// Floating chrome (the tab bar, the + sheet, round buttons over the page) is
// glass, like Apple's own bars: the page shows through, softly, so you keep
// your place. Put it first inside a view so the content sits on top.
export function GlassFill({ radius = 0, tint = GLASS_TINT, style }: { radius?: number; tint?: string; style?: StyleProp<ViewStyle> }) {
  if (!GLASS) return null;
  return (
    <GlassView
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius }, style]}
      glassEffectStyle="regular"
      colorScheme="dark"
      tintColor={tint}
    />
  );
}
