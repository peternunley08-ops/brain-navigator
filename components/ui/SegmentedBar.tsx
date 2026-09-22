import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../../core/theme';

export interface BarSegment {
  label: string;
  value: number; // any unit, proportional to the others
  color: string;
}

interface SegmentedBarProps {
  segments: BarSegment[];
  height?: number;
}

export function SegmentedBar({ segments, height = 14 }: SegmentedBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <View>
      <View style={[styles.track, { height }]}>
        {total > 0
          ? segments.map((s) =>
              s.value > 0 ? (
                <View
                  key={s.label}
                  style={{ flex: s.value, backgroundColor: s.color, height: '100%' }}
                />
              ) : null
            )
          : null}
      </View>
      <View style={styles.legend}>
        {segments.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
});
