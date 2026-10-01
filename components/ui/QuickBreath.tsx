import * as Haptics from '../../core/haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { noteBreathDay } from '../../core/lifeStore';
import { emberSay } from '../ember/EmberBuddy';
import { Pressy } from './Pressy';

const IN = 4000;
const OUT = 6000;
const LENGTHS = [60, 180];

// One minute of breathing, right where you are: four seconds in, six out,
// six times. Slow exhales are what calm the body down. Tap to stop early.
export function QuickBreath({ color = '#8FB4E8' }: { color?: string }) {
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [total, setTotal] = useState(LENGTHS[0]);
  const [left, setLeft] = useState(LENGTHS[0]);
  const grow = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!running) return;
    const t0 = Date.now();
    const clear = () => timers.current.forEach(clearTimeout);
    const breathe = () => {
      setPhase('in');
      grow.value = withTiming(1, { duration: reduced ? 0 : IN, easing: Easing.inOut(Easing.sin) });
      Haptics.selectionAsync().catch(() => {});
      timers.current.push(
        setTimeout(() => {
          setPhase('out');
          grow.value = withTiming(0, { duration: reduced ? 0 : OUT, easing: Easing.inOut(Easing.sin) });
        }, IN)
      );
    };
    breathe();
    const cycle = setInterval(breathe, IN + OUT);
    const tick = setInterval(() => {
      const l = Math.max(0, total - Math.floor((Date.now() - t0) / 1000));
      setLeft(l);
      if (l === 0) {
        setRunning(false);
        noteBreathDay();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        emberSay(`${total / 60 === 1 ? 'One minute' : 'Three minutes'}. Your body got the message: you’re safe right now.`, 'happy');
      }
    }, 250);
    return () => {
      clearInterval(cycle);
      clearInterval(tick);
      clear();
      timers.current = [];
      grow.value = withTiming(0, { duration: 300 });
    };
  }, [running, reduced, grow, total]);

  // Real size, not a scale transform, so the edge stays crisp.
  const orb = useAnimatedStyle(() => {
    const d = 28 + grow.value * 24;
    return { width: d, height: d, borderRadius: d / 2, opacity: 0.55 + grow.value * 0.45 };
  });

  return (
    <Pressy
      onPress={() => {
        setLeft(total);
        setRunning((r) => !r);
      }}
      depth={0.98}
      accessibilityRole="button"
      accessibilityLabel={running ? `Breathe ${phase}. ${left} seconds left. Tap to stop.` : 'One-minute breath. Tap to start.'}
      style={[styles.card, { borderColor: alpha(color, 0.35), backgroundColor: alpha(color, 0.07) }]}
    >
      <View style={styles.orbWrap}>
        <Animated.View style={[styles.orb, { backgroundColor: alpha(color, 0.35), borderColor: color }, orb]} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title}>{running ? (phase === 'in' ? 'Breathe in…' : 'And out, slowly…') : `${total === 60 ? 'One minute' : 'Three minutes'}, right here`}</Text>
        <Text style={styles.body}>{running ? `${left} seconds. Tap to stop.` : 'In for four, out for six. Tap to start.'}</Text>
      </View>
      {!running ? (
        <View style={styles.lengths}>
          {LENGTHS.map((l) => (
            <Pressy
              key={l}
              onPress={() => {
                setTotal(l);
                setLeft(l);
              }}
              hitSlop={6}
              style={[styles.len, total === l && { borderColor: color, backgroundColor: alpha(color, 0.16) }]}
              accessibilityRole="button"
              accessibilityState={{ selected: total === l }}
              accessibilityLabel={`${l / 60} minute${l === 60 ? '' : 's'}`}
            >
              <Text style={[styles.lenText, total === l && { color }]}>{l / 60}m</Text>
            </Pressy>
          ))}
        </View>
      ) : null}
    </Pressy>
  );
}

const styles = StyleSheet.create({
  lengths: {
    gap: 6,
  },
  len: {
    minWidth: 40,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textMuted,
  },
  flex: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  orbWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    borderWidth: 1.5,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
