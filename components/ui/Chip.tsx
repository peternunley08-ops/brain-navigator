import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { springs } from '../../core/motion';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Icon, type IconName } from './Icon';
import { Pressy } from './Pressy';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Color when selected (defaults to candle gold); also the dot color. */
  color?: string;
  dot?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  /** Spoken label when it should differ from the visible text (e.g. a truncated title). */
  accessibilityLabel?: string;
}

export function Chip({ label, selected, onPress, color = colors.flame, dot, icon, style, accessibilityLabel }: ChipProps) {
  // Choosing a chip gives its contents a small springy swell, a beat after the sink.
  const swell = useSharedValue(1);
  const reduced = useReducedMotion();
  const was = useRef(selected);
  useEffect(() => {
    if (was.current === selected) return;
    was.current = selected;
    if (selected && !reduced) swell.value = withSequence(withSpring(1.08, springs.press), withSpring(1, springs.release));
  }, [selected, reduced, swell]);
  const swellStyle = useAnimatedStyle(() => ({ transform: [{ scale: swell.value }] }));

  return (
    <Pressy
      onPress={onPress}
      depth={0.94}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        selected && { backgroundColor: alpha(color, 0.16), borderColor: alpha(color, 0.7) },
        style,
      ]}
    >
      <Animated.View style={[styles.inner, swellStyle]}>
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      {icon ? <Icon name={icon} size={15} color={selected ? color : colors.textMuted} strokeWidth={2} /> : null}
      <Text style={[styles.text, selected && { color, fontFamily: fonts.bodySemi }]} maxFontSizeMultiplier={1.5}>
        {label}
      </Text>
      </Animated.View>
    </Pressy>
  );
}

// A wrapping row of chips with even gaps.
export function ChipRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
