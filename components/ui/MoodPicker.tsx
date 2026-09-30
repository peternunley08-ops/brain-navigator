import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { alpha, colors, fonts } from '../../core/theme';
import { Pressy } from './Pressy';

const MOODS = [
  { v: 1, label: 'Rough', color: '#F0845A' },
  { v: 2, label: 'Low', color: '#E6A15A' },
  { v: 3, label: 'Okay', color: '#F5C35C' },
  { v: 4, label: 'Good', color: '#B7C98A' },
  { v: 5, label: 'Great', color: '#8CC0A8' },
];

interface MoodPickerProps {
  value: number | null;
  onChange: (v: number) => void;
}

// Five small faces from a frown to a grin. The chosen one lifts and glows.
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {MOODS.map((m) => (
        <Face key={m.v} mood={m} selected={value === m.v} dimmed={value != null && value !== m.v} onPress={() => onChange(m.v)} />
      ))}
    </View>
  );
}

function Face({
  mood,
  selected,
  dimmed,
  onPress,
}: {
  mood: (typeof MOODS)[number];
  selected: boolean;
  dimmed: boolean;
  onPress: () => void;
}) {
  const curve = (mood.v - 3) / 2; // -1 frown … +1 grin
  const S = 44;
  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(selected ? -4 : 0, { damping: 12, stiffness: 260 }) }, { scale: withSpring(selected ? 1.12 : 1, { damping: 12, stiffness: 260 }) }],
    opacity: withSpring(dimmed ? 0.45 : 1),
  }));
  return (
    <Pressy onPress={onPress} depth={0.9} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={mood.label} style={styles.cell}>
      <Animated.View
        style={[
          styles.face,
          { borderColor: selected ? mood.color : colors.line, backgroundColor: selected ? alpha(mood.color, 0.18) : colors.surfaceSunk },
          selected && { shadowColor: mood.color, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
          lift,
        ]}
      >
        <Svg width={S} height={S} viewBox="0 0 44 44">
          <Circle cx={16} cy={18} r={2.4} fill={selected ? mood.color : colors.textMuted} />
          <Circle cx={28} cy={18} r={2.4} fill={selected ? mood.color : colors.textMuted} />
          <Path
            d={`M14,${28 - curve * 1.5} Q22,${28 + curve * 6} 30,${28 - curve * 1.5}`}
            stroke={selected ? mood.color : colors.textMuted}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
      <Text style={[styles.label, selected && { color: mood.color, fontFamily: fonts.bodySemi }]}>{mood.label}</Text>
    </Pressy>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    alignItems: 'center',
    width: 58,
  },
  face: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
});
