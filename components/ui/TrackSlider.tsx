import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../core/theme';

interface TrackSliderProps {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
  fillColor?: string;
}

export function TrackSlider({
  min,
  max,
  value,
  onChange,
  fillColor = colors.leather,
}: TrackSliderProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={styles.trackWrap}>
      <View style={styles.track} />
      <View style={styles.row}>
        {steps.map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={[styles.dot, active && [styles.dotActive, { backgroundColor: fillColor }]]}
            >
              {active ? <Text style={styles.dotText}>{n}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trackWrap: {
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.background,
    shadowColor: colors.leatherDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dotText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.background,
  },
});
