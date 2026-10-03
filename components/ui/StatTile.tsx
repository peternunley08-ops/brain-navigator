import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useCountUp } from '../../core/hooks/useCountUp';
import { colors, fonts, radii, textGrow } from '../../core/theme';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

// A number and what it measures — the readout form used across the app.
export function StatTile({ label, value, unit, color = colors.text, style }: StatTileProps) {
  const shown = useCountUp(value);
  return (
    <View style={[styles.tile, style]}>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {shown}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={textGrow.control}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSunk,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
});
