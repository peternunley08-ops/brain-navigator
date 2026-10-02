import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Pressy } from './Pressy';

interface SegmentedProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  style?: StyleProp<ViewStyle>;
}

// Two to four choices in one sunk rail; the chosen one lifts out in gold.
export function Segmented<T extends string>({ options, value, onChange, style }: SegmentedProps<T>) {
  return (
    <View style={[styles.rail, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressy
            key={o.key}
            onPress={() => onChange(o.key)}
            depth={0.95}
            hitSlop={6}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.seg, on && styles.segOn]}
          >
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressy>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunk,
    borderWidth: 1,
    borderColor: colors.line,
  },
  seg: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
  },
  segOn: {
    backgroundColor: alpha(colors.flame, 0.16),
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.5),
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  textOn: {
    fontFamily: fonts.bodySemi,
    color: colors.flame,
  },
});
