import * as Haptics from '../core/haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { dayPhaseFor } from '../core/adaptiveLight';
import { lineForToday } from '../core/dayLines';
import { colors, fonts } from '../core/theme';
import { EmberSprite } from './ember/EmberSprite';
import { Sparks } from './ember/Sparks';
import { useEmberRig } from './ember/useEmberRig';
import { Backdrop } from './ui/Backdrop';

interface EntryThresholdProps {
  onEnter: () => void;
}

const HOLD_MS = 1100;

const HELLO = {
  dawn: 'Early one. Hi.',
  day: 'Hi. Good to see you.',
  dusk: 'Evening. Come sit.',
  night: 'Still up? Come in.',
};

// The way in. Ember is asleep on the threshold, a coal. Hold it and it
// warms up — the flame grows under your thumb — until it wakes, says hello,
// and lets you in.
export function EntryThreshold({ onEnter }: EntryThresholdProps) {
  // The same student line the Desk shows today, instead of an adult quote.
  const quote = useMemo(() => ({ text: lineForToday(), author: 'Ember' }), []);
  const rig = useEmberRig({ glance: false });
  const [awake, setAwake] = useState(false);
  const [burst, setBurst] = useState(0);
  const warmth = useSharedValue(0);
  const leave = useSharedValue(0);

  useEffect(() => {
    rig.setMood('sleepy');
  }, [rig]);

  const wake = () => {
    setAwake(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    rig.setMood('cheer');
    rig.hopUp(22);
    setBurst((b) => b + 1);
    leave.value = withDelay(1100, withTiming(1, { duration: 420, easing: Easing.in(Easing.quad) }, (f) => {
      'worklet';
      if (f) scheduleOnRN(onEnter);
    }));
  };

  const pressIn = () => {
    if (awake) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    rig.yawn();
    cancelAnimation(warmth);
    warmth.value = withTiming(1, { duration: HOLD_MS * (1 - warmth.value), easing: Easing.inOut(Easing.quad) }, (f) => {
      'worklet';
      if (f) scheduleOnRN(wake);
    });
    rig.flare.value = withTiming(1.22, { duration: HOLD_MS });
    rig.sleepy.value = withTiming(0.35, { duration: HOLD_MS });
  };

  const pressOut = () => {
    if (awake || warmth.value >= 1) return;
    cancelAnimation(warmth);
    warmth.value = withTiming(0, { duration: 420 });
    rig.setMood('sleepy');
  };

  const halo = useAnimatedStyle(() => ({
    opacity: 0.25 + warmth.value * 0.75,
    transform: [{ scale: 0.7 + warmth.value * 0.6 }],
  }));
  const page = useAnimatedStyle(() => ({
    opacity: 1 - leave.value,
    transform: [{ scale: 1 + leave.value * 0.06 }],
  }));

  const phase = dayPhaseFor();

  return (
    <Animated.View style={[styles.root, page]}>
      <Backdrop tone="ember" glowAt={0.52} motes />

      <Animated.View entering={FadeIn.duration(900)} style={styles.quoteBlock}>
        <Text style={styles.quoteText}>“{quote.text}”</Text>
        <Text style={styles.author}>{quote.author}</Text>
      </Animated.View>

      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.emberHit}
        accessibilityRole="button"
        accessibilityLabel="Hold to wake Ember and come in"
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={wake}
      >
        <Animated.View style={[styles.halo, halo]}>
          <Svg width={260} height={260}>
            <Defs>
              <RadialGradient id="wakeHalo" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#F5A050" stopOpacity={0.45} />
                <Stop offset="0.5" stopColor="#F5A050" stopOpacity={0.12} />
                <Stop offset="1" stopColor="#F5A050" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={130} cy={130} r={130} fill="url(#wakeHalo)" />
          </Svg>
        </Animated.View>
        <Sparks burst={burst} reach={90} />
        <EmberSprite rig={rig} size={128} />
      </Pressable>

      <View style={styles.bottom}>
        <Text style={styles.cue}>{awake ? HELLO[phase] : 'Hold Ember to wake it'}</Text>
        {!awake ? <Text style={styles.sub}>Ember is the little flame who helps you find your way.</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 80,
  },
  quoteBlock: {
    maxWidth: 380,
    alignItems: 'center',
  },
  quoteText: {
    fontFamily: fonts.displaySoft,
    fontSize: 22,
    lineHeight: 31,
    color: colors.text,
    textAlign: 'center',
  },
  author: {
    marginTop: 14,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textFaint,
  },
  emberHit: {
    width: 220,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 260,
    height: 260,
  },
  bottom: {
    alignItems: 'center',
    minHeight: 60,
  },
  cue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
  },
  sub: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
