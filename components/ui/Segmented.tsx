import { StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { curve } from '../../core/craft';
import { alpha, colors, fonts, radii, textGrow } from '../../core/theme';
import { Pressy } from './Pressy';

interface SegmentedProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  style?: StyleProp<ViewStyle>;
}

// Two to four choices in one sunk rail; the chosen one lifts out in gold.
export function Segmented<T extends string>({ options, value, onChange, style }: SegmentedProps<T>) {
  // At the largest text sizes a one-line choice breaks mid-word; stack the rail and let it wrap.
  const stack = useWindowDimensions().fontScale > 1.5;
  return (
    <View style={[styles.rail, stack && styles.railStack, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressy
            key={o.key}
            onPress={() => onChange(o.key)}
            depth={0.95}
            hitSlop={6}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            style={[styles.seg, stack && styles.segStack, on && styles.segOn]}
          >
            <Text
              style={[styles.text, on && styles.textOn]}
              numberOfLines={stack ? 2 : 1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              maxFontSizeMultiplier={textGrow.control}
            >
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
    ...curve,
    backgroundColor: colors.surfaceSunk,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  railStack: {
    flexDirection: 'column',
  },
  seg: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    ...curve,
    paddingHorizontal: 8,
  },
  segStack: {
    flex: 0,
    alignSelf: 'stretch',
    paddingVertical: 6,
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
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  textOn: {
    fontFamily: fonts.bodySemi,
    color: colors.flame,
  },
});
