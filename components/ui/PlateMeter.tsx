import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { alpha, colors, fonts } from '../../core/theme';

interface PlateMeterProps {
  openCount: number;
  cap: number;
  size?: number;
}

function statusFor(openCount: number, cap: number) {
  const ratio = cap > 0 ? openCount / cap : 0;
  if (ratio > 1) return { label: 'Over your cap', color: colors.unlocked };
  if (ratio >= 0.7) return { label: 'Getting full', color: colors.flame };
  return { label: 'Plenty of room', color: colors.secured };
}

// A plate cut into as many slices as your cap. Each open task takes a
// slice; anything past the cap spills over as a red rim.
export function PlateMeter({ openCount, cap, size = 132 }: PlateMeterProps) {
  const status = statusFor(openCount, cap);
  const c = size / 2;
  const r = size / 2 - 8;
  const slices = Math.max(1, cap);
  const gap = slices > 1 ? 0.06 : 0;
  const over = openCount > cap;

  const arc = (i: number) => {
    const a0 = (i / slices) * Math.PI * 2 - Math.PI / 2 + gap / 2;
    const a1 = ((i + 1) / slices) * Math.PI * 2 - Math.PI / 2 - gap / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)}`;
  };

  return (
    <View style={styles.row}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r - 10} fill={colors.surfaceSunk} stroke={colors.line} strokeWidth={1} />
          <Circle cx={c} cy={c} r={r - 22} fill="none" stroke={colors.line} strokeWidth={1} />
          {over ? <Circle cx={c} cy={c} r={r + 4} fill="none" stroke={alpha(colors.unlocked, 0.45)} strokeWidth={2} /> : null}
          {Array.from({ length: slices }, (_, i) => (
            <Path
              key={i}
              d={arc(i)}
              stroke={i < openCount ? status.color : alpha(colors.textFaint, 0.25)}
              strokeWidth={10}
              strokeLinecap={slices > 1 ? 'butt' : 'round'}
              fill="none"
            />
          ))}
        </Svg>
        <View style={styles.center}>
          <Text style={styles.count}>{openCount}</Text>
          <Text style={styles.of}>of {cap} open</Text>
        </View>
      </View>
      <View style={styles.side}>
        <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
        <Text style={styles.note}>
          {over
            ? `${openCount - cap} more than you meant to carry.`
            : openCount === 0
              ? 'Nothing open right now.'
              : `Room for ${cap - openCount} more.`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: fonts.display,
    fontVariant: ['tabular-nums'],
    fontSize: 34,
    color: colors.text,
  },
  of: {
    marginTop: -2,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
  side: {
    flex: 1,
  },
  status: {
    fontFamily: fonts.display,
    fontSize: 20,
  },
  note: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textMuted,
  },
});
