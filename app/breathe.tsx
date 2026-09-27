import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  type EntryExitAnimationFunction,
  FadeIn,
  FadeOut,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BreathInstrument, STATUS, type BreathValues } from '../components/BreathInstrument';
import { Button } from '../components/ui/Button';
import { BREATH_PATTERNS, cycleLength, PHASE_WORDS, phaseAt } from '../core/breathPatterns';
import { useHealthStore } from '../core/healthStore';
import { colors, fonts, spacing } from '../core/theme';

type UiStatus = 'idle' | 'running' | 'paused' | 'done';

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Each letter rises into place a beat after the one before it.
function letterIn(delay: number): EntryExitAnimationFunction {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: 14 }, { scale: 0.94 }] },
      animations: {
        opacity: withDelay(delay, withTiming(1, { duration: 360, easing: Easing.out(Easing.quad) })),
        transform: [
          { translateY: withDelay(delay, withSpring(0, { damping: 15, stiffness: 170 })) },
          { scale: withDelay(delay, withSpring(1, { damping: 15, stiffness: 170 })) },
        ],
      },
    };
  };
}

function Headline({ text, size }: { text: string; size: number }) {
  let n = 0;
  return (
    <Animated.View exiting={FadeOut.duration(220)} style={styles.headlineInner}>
      {text.split(' ').map((word, wi) => (
        <View key={wi} style={styles.word}>
          {word.split('').map((ch, ci) => (
            <Animated.Text
              key={ci}
              entering={letterIn(n++ * 30)}
              style={[styles.headlineText, { fontSize: size }]}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

export default function BreatheScreen() {
  const { width, height } = useWindowDimensions();
  const size = Math.max(240, Math.min(width - spacing.lg * 2, 360, height - 460));
  const reducedMotion = useReducedMotion();

  const [patternIndex, setPatternIndex] = useState(0);
  const pattern = BREATH_PATTERNS[patternIndex];
  const totalMs = cycleLength(pattern.durations) * pattern.cycles;

  const [ui, setUi] = useState<UiStatus>('idle');
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [logged, setLogged] = useState(false);

  const isHealthAuthorized = useHealthStore((s) => s.isAuthorized);
  const isSavingHealth = useHealthStore((s) => s.isSaving);
  const logMindfulMinutes = useHealthStore((s) => s.logMindfulMinutes);

  // Everything the instrument draws from lives on the UI thread and is
  // advanced by the single frame loop below — React state only carries the
  // words on screen, updated a handful of times per breath.
  const time = useSharedValue(0);
  const breath = useSharedValue(0.4);
  const beadAngle = useSharedValue(0);
  const trail = useSharedValue(0);
  const ripple = useSharedValue(0);
  const glow = useSharedValue(0);
  const status = useSharedValue<number>(STATUS.idle);
  const phaseIdx = useSharedValue(-1);
  const elapsed = useSharedValue(0);
  const durs = useSharedValue<number[]>([...pattern.durations]);
  const total = useSharedValue(totalMs);
  const lastPhase = useSharedValue(-1);
  const lastSecond = useSharedValue(-1);

  const values = useMemo<BreathValues>(
    () => ({ time, breath, beadAngle, trail, ripple, glow, status, phaseIdx }),
    [time, breath, beadAngle, trail, ripple, glow, status, phaseIdx]
  );

  useEffect(() => {
    durs.value = [...pattern.durations];
    total.value = totalMs;
  }, [pattern, totalMs, durs, total]);

  const settleBead = useCallback(() => {
    const a = ((beadAngle.value % 360) + 360) % 360;
    beadAngle.value = a;
    beadAngle.value = withSpring(a > 180 ? 360 : 0, { damping: 16, stiffness: 90 });
    phaseIdx.value = -1;
  }, [beadAngle, phaseIdx]);

  const bridge = useMemo(
    () => ({
      phase: (idx: number, c: number) => {
        setPhase(idx);
        setCycle(c);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
      },
      second: (s: number) => setSecondsLeft(s),
      done: () => {
        setUi('done');
        settleBead();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
    }),
    [settleBead]
  );

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(frame.timeSincePreviousFrame ?? 16, 64);
    time.value += dt;
    const s = status.value;
    let target = breath.value;

    if (s === STATUS.running) {
      elapsed.value += dt;
      if (elapsed.value >= total.value) {
        status.value = STATUS.done;
        glow.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 1800, easing: Easing.out(Easing.quad) })
        );
        scheduleOnRN(bridge.done);
        target = 0.3;
      } else {
        const ph = phaseAt(elapsed.value, durs.value);
        target = ph.breath;
        beadAngle.value = (ph.cycleIndex + ph.cycleProgress) * 360;
        trail.value = ph.cycleProgress;

        const key = ph.cycleIndex * 4 + ph.idx;
        if (key !== lastPhase.value) {
          lastPhase.value = key;
          phaseIdx.value = ph.idx;
          ripple.value = withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) })
          );
          scheduleOnRN(bridge.phase, ph.idx, ph.cycleIndex);
        }
        if (ph.secondsLeft !== lastSecond.value) {
          lastSecond.value = ph.secondsLeft;
          scheduleOnRN(bridge.second, ph.secondsLeft);
        }
      }
    } else if (s === STATUS.idle || s === STATUS.done) {
      // At rest the lantern still breathes, slowly, on its own.
      target = 0.36 + 0.07 * Math.sin(time.value / 1500);
    }

    // Ease toward the target rather than jumping, so starting, pausing, and
    // finishing never snap the flame.
    const k = 1 - Math.exp(-dt / 170);
    breath.value += (target - breath.value) * k;
  });

  const start = useCallback(() => {
    elapsed.value = 0;
    lastPhase.value = -1;
    lastSecond.value = -1;
    trail.value = 0;
    glow.value = withSequence(
      withTiming(1, { duration: 380 }),
      withTiming(0, { duration: 1400, easing: Easing.out(Easing.quad) })
    );
    status.value = STATUS.running;
    setUi('running');
    setPhase(0);
    setCycle(0);
    setSecondsLeft(Math.ceil(pattern.durations[0] / 1000));
    setLogged(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [elapsed, lastPhase, lastSecond, trail, glow, status, pattern]);

  const togglePause = useCallback(() => {
    if (status.value === STATUS.running) {
      status.value = STATUS.paused;
      setUi('paused');
    } else if (status.value === STATUS.paused) {
      status.value = STATUS.running;
      setUi('running');
    } else {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [status]);

  const end = useCallback(() => {
    status.value = STATUS.idle;
    trail.value = withTiming(0, { duration: 400 });
    settleBead();
    setUi('idle');
  }, [status, trail, settleBead]);

  const uiRef = useRef(ui);
  uiRef.current = ui;
  const changePattern = useCallback(
    (i: number) => {
      setPatternIndex(i);
      if (uiRef.current === 'done') {
        status.value = STATUS.idle;
        setUi('idle');
      }
    },
    [status]
  );

  const minutes = Math.max(1, Math.round(totalMs / 60000));
  const handleLog = async () => {
    const ok = await logMindfulMinutes(minutes);
    if (ok) setLogged(true);
  };

  const headline =
    ui === 'running'
      ? PHASE_WORDS[phase]
      : ui === 'paused'
        ? 'Paused'
        : ui === 'done'
          ? 'Done'
          : 'Hold the flame to begin';
  const headlineToken = ui === 'running' ? `run-${cycle}-${phase}` : ui;
  const headlineSize = headline.length <= 11 ? 40 : 30;

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.content}>
        <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

        <Text style={styles.title}>Breathe</Text>
        <View style={styles.subtitleWrap}>
          <Animated.Text
            key={pattern.key}
            entering={FadeIn.duration(380)}
            exiting={FadeOut.duration(200)}
            style={styles.subtitle}
          >
            {pattern.description}
          </Animated.Text>
        </View>

        <View style={styles.stage}>
        <View style={styles.instrumentWrap}>
          <BreathInstrument
            size={size}
            patternIndex={patternIndex}
            reducedMotion={reducedMotion}
            values={values}
            onPatternChange={changePattern}
            onHoldComplete={start}
            onTogglePause={togglePause}
          />
        </View>

        <View style={styles.headline} accessible accessibilityLabel={headline}>
          <Headline key={headlineToken} text={headline} size={headlineSize} />
        </View>

        <View style={styles.readout}>
          {ui === 'idle' ? (
            <Text style={styles.note}>Turn the brass ring to choose a pattern.</Text>
          ) : null}

          {ui === 'running' ? (
            <>
              <Animated.Text
                key={`${cycle}-${phase}-${secondsLeft}`}
                entering={FadeIn.duration(260)}
                style={styles.count}
              >
                {secondsLeft}
              </Animated.Text>
              <Text style={styles.note}>
                Breath {cycle + 1} of {pattern.cycles}
              </Text>
            </>
          ) : null}

          {ui === 'paused' ? (
            <>
              <Text style={styles.note}>Tap the flame to keep going.</Text>
              <Button label="End session" variant="pill" onPress={end} style={styles.action} />
            </>
          ) : null}

          {ui === 'done' ? (
            <>
              <Text style={styles.note}>
                {NUMBER_WORDS[pattern.cycles] ?? pattern.cycles} breaths in {formatDuration(totalMs)}.
              </Text>
              <View style={styles.actions}>
                <Button label="Breathe again" variant="pill" onPress={start} />
                {isHealthAuthorized ? (
                  <Button
                    label={
                      logged
                        ? 'Logged to Health'
                        : isSavingHealth
                          ? 'Logging…'
                          : `Log ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to Health`
                    }
                    variant="pill"
                    onPress={handleLog}
                    disabled={logged || isSavingHealth}
                  />
                ) : null}
              </View>
            </>
          ) : null}
        </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
  },
  subtitleWrap: {
    height: 40,
    marginTop: spacing.xs,
  },
  subtitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  instrumentWrap: {
    alignItems: 'center',
  },
  headline: {
    height: 64,
    marginTop: spacing.lg,
  },
  headlineInner: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    columnGap: 9,
  },
  word: {
    flexDirection: 'row',
  },
  headlineText: {
    fontFamily: fonts.displaySoft,
    color: colors.ink,
  },
  readout: {
    alignItems: 'center',
    minHeight: 96,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: 26,
    color: colors.inkMuted,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkFaint,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
