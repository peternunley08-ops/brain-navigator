import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
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
}

export function Chip({ label, selected, onPress, color = colors.flame, dot, icon, style }: ChipProps) {
  return (
    <Pressy
      onPress={onPress}
      depth={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        selected && { backgroundColor: alpha(color, 0.16), borderColor: alpha(color, 0.7) },
        style,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      {icon ? <Icon name={icon} size={15} color={selected ? color : colors.textMuted} strokeWidth={2} /> : null}
      <Text style={[styles.text, selected && { color, fontFamily: fonts.bodySemi }]}>{label}</Text>
    </Pressy>
  );
}

// A wrapping row of chips with even gaps.
export function ChipRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
