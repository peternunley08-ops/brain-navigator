import { StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { springs } from '../../core/motion';
import Svg, { Circle, Path } from 'react-native-svg';
import { alpha, colors, fonts, textGrow } from '../../core/theme';
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
  /** Optional: a long press on a face (the Desk uses it to open the full check-in). */
  onLongPress?: () => void;
}

// Five little Embers, from a low flicker to a bright grin. The chosen one lifts and glows.
export function MoodPicker({ value, onChange, onLongPress }: MoodPickerProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {MOODS.map((m) => (
        <Face key={m.v} mood={m} selected={value === m.v} dimmed={value != null && value !== m.v} onPress={() => onChange(m.v)} onLongPress={onLongPress} />
      ))}
    </View>
  );
}

function Face({
  mood,
  selected,
  dimmed,
  onPress,
  onLongPress,
}: {
  mood: (typeof MOODS)[number];
  selected: boolean;
  dimmed: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const S = 44;
  // The chosen Ember bobs gently, like it's glad you picked it. Still under Reduce Motion.
  const reduced = useReducedMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (selected && !reduced) {
      bob.value = withRepeat(withSequence(withTiming(-2.5, { duration: 900 }), withTiming(0, { duration: 900 })), -1);
    } else {
      cancelAnimation(bob);
      bob.value = withTiming(0, { duration: 200 });
    }
  }, [selected, reduced, bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const lift = useAnimatedStyle(() => ({
    // A lift, not a scale: scaling the glowing face made iOS draw it blurry and blocky.
    transform: [{ translateY: withSpring(selected ? -5 : 0, springs.snappy) }],
    opacity: withSpring(dimmed ? 0.45 : 1, springs.snappy),
  }));
  return (
    <Pressy onPress={onPress} onLongPress={onLongPress} depth={0.9} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={mood.label} accessibilityHint={onLongPress ? 'Double tap and hold for the full check-in' : undefined} style={styles.cell}>
      <Animated.View
        style={[
          styles.face,
          { borderColor: selected ? mood.color : colors.line, backgroundColor: selected ? alpha(mood.color, 0.18) : colors.surfaceSunk },
          selected && { shadowColor: mood.color, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
          lift,
        ]}
      >
        <Animated.View style={bobStyle}>
          <Svg width={S} height={S} viewBox="0 0 44 44">
            <EmberFace v={mood.v} color={mood.color} selected={selected} />
          </Svg>
        </Animated.View>
      </Animated.View>
      <Text style={[styles.label, selected && { color: mood.color, fontFamily: fonts.bodySemi }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={textGrow.bar}>{mood.label}</Text>
    </Pressy>
  );
}

/**
 * Ember, drawn small: the flame stands taller the better the mood, and the
 * face goes from droopy eyes and a frown to happy closed eyes and a grin.
 */
function EmberFace({ v, color, selected }: { v: number; color: string; selected: boolean }) {
  const tip = 13 - (v - 3) * 3; // 19 (rough) … 7 (great)
  const flame = `M22,${tip} C27,${tip + 8} 34,${20 + (v - 3)} 34,29 A12,12 0 0 1 10,29 C10,${20 + (v - 3)} 17,${tip + 8} 22,${tip} Z`;
  const ink = selected ? colors.flameInk : colors.textMuted;
  const fill = selected ? color : alpha(color, 0.16);
  const curve = (v - 3) / 2; // -1 frown … +1 grin
  return (
    <>
      <Path d={flame} fill={fill} stroke={selected ? color : alpha(color, 0.5)} strokeWidth={1.4} />
      {v >= 5 ? (
        <>
          <Path d="M15.5,28 Q17.5,25.5 19.5,28" stroke={ink} strokeWidth={1.8} strokeLinecap="round" fill="none" />
          <Path d="M24.5,28 Q26.5,25.5 28.5,28" stroke={ink} strokeWidth={1.8} strokeLinecap="round" fill="none" />
        </>
      ) : v === 2 ? (
        <>
          <Path d="M15.5,27.5 L19.5,27.5" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M24.5,27.5 L28.5,27.5" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={17.5} cy={27.5} r={1.9} fill={ink} />
          <Circle cx={26.5} cy={27.5} r={1.9} fill={ink} />
          {v === 1 ? (
            <>
              {/* Sad brows: the inner ends lift. */}
              <Path d="M15,25.4 L19.5,23.9" stroke={ink} strokeWidth={1.4} strokeLinecap="round" />
              <Path d="M29,25.4 L24.5,23.9" stroke={ink} strokeWidth={1.4} strokeLinecap="round" />
            </>
          ) : null}
        </>
      )}
      <Path d={`M18.5,${33 - curve} Q22,${33 + curve * 3.5} 25.5,${33 - curve}`} stroke={ink} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </>
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
