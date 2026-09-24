import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, fonts, spacing } from '../../core/theme';

interface PlateMeterProps {
  openCount: number;
  cap: number;
}

const METER_WIDTH = 280;
const METER_HEIGHT = 20;

function statusFor(ratio: number) {
  if (ratio >= 1) return { label: 'Over capacity', color: colors.unlocked };
  if (ratio >= 0.7) return { label: 'Getting full', color: colors.lantern };
  return { label: 'Plenty of room', color: colors.secured };
}

export function PlateMeter({ openCount, cap }: PlateMeterProps) {
  const ratio = cap > 0 ? openCount / cap : 0;
  const fillWidth = Math.min(ratio, 1) * METER_WIDTH;
  const status = statusFor(ratio);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.count}>
          {openCount} <Text style={styles.countMuted}>/ {cap} today</Text>
        </Text>
        <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
      </View>
      <Svg width={METER_WIDTH} height={METER_HEIGHT}>
        <Rect
          x={0}
          y={0}
          width={METER_WIDTH}
          height={METER_HEIGHT}
          rx={METER_HEIGHT / 2}
          fill={colors.background}
          stroke={colors.divider}
          strokeWidth={1}
        />
        {fillWidth > 0 ? (
          <Rect
            x={0}
            y={0}
            width={fillWidth}
            height={METER_HEIGHT}
            rx={METER_HEIGHT / 2}
            fill={status.color}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: METER_WIDTH,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  count: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  countMuted: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
  },
  status: {
    fontFamily: fonts.mono,
    fontSize: 11,
  },
});
