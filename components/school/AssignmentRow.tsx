import * as Haptics from '../../core/haptics';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeOut, interpolate, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { cheerLine } from '../../core/about';
import { addDays, dateKey, daysUntil, dueLabel, KIND_LABEL, type Assignment, useSchoolStore } from '../../core/schoolStore';
import { offerUndo } from '../../core/undoStore';
import { alpha, colors, fonts } from '../../core/theme';
import { emberSay } from '../ember/EmberBuddy';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

// One thing that's due: a check circle in its class color, what it is, and
// when. Tap the circle to finish it; tap the rest to open it.
export function AssignmentRow({ a, index = 0, compact }: { a: Assignment; index?: number; compact?: boolean }) {
  const cls = useSchoolStore((s) => s.classes.find((c) => c.id === a.classId));
  const toggle = useSchoolStore((s) => s.toggleAssignment);
  const color = cls?.color ?? colors.flame;
  const n = daysUntil(a.due);
  const late = !a.done && n < 0;
  const soon = !a.done && n <= 1;
  const big = a.kind === 'test' || a.kind === 'quiz' || a.kind === 'project';

  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const check = () => {
    const finishing = !a.done;
    if (finishing) pop.value = withSequence(withTiming(1.25, { duration: 110 }), withSpring(1, { damping: 8, stiffness: 260 }));
    Haptics.impactAsync(finishing ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle(a.id);
    if (finishing) {
      const left = useSchoolStore.getState().assignments.filter((x) => !x.done && daysUntil(x.due) <= 1).length;
      if (left === 0) emberSay(cheerLine('That’s everything due by tomorrow. Go do something that isn’t school.'), 'cheer');
    }
  };

  // Swipe right to finish, left to push it to tomorrow.
  const tx = useSharedValue(0);
  const swipeLater = () => {
    const was = a.due;
    const tomorrow = addDays(dateKey(), 1);
    if (was === tomorrow) return;
    useSchoolStore.getState().updateAssignment(a.id, { due: tomorrow });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    offerUndo(`Moved “${a.title}” to tomorrow`, () => useSchoolStore.getState().updateAssignment(a.id, { due: was }), 'arrow');
  };
  // A tick under the finger the moment a swipe will act, and again if it won't.
  const armed = useSharedValue(0);
  const tick = () => Haptics.selectionAsync().catch(() => {});
  const pan = usePanGesture({
    activeOffsetX: [-14, 14],
    failOffsetY: [-10, 10],
    enabled: !a.done,
    onUpdate: (e) => {
      'worklet';
      tx.value = e.translationX;
      const over = e.translationX > 90 ? 1 : e.translationX < -90 ? -1 : 0;
      if (over !== armed.value) {
        armed.value = over;
        scheduleOnRN(tick);
      }
    },
    onFinalize: () => {
      'worklet';
      armed.value = 0;
      const v = tx.value;
      if (v > 90) scheduleOnRN(check);
      else if (v < -90) scheduleOnRN(swipeLater);
      tx.value = withSpring(0, { damping: 18, stiffness: 220 });
    },
  });
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const doneUnder = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [0, 90], [0, 1], 'clamp') }));
  const laterUnder = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-90, 0], [1, 0], 'clamp') }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(340)} exiting={FadeOut.duration(180)} layout={LinearTransition.springify().damping(18)}>
      <Animated.View pointerEvents="none" style={[styles.under, styles.underDone, doneUnder]}>
        <Icon name="check" size={20} color={colors.flameInk} strokeWidth={2.6} />
        <Text style={styles.underText}>Done</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.under, styles.underLater, laterUnder]}>
        <Text style={styles.underText}>Tomorrow</Text>
        <Icon name="arrow" size={20} color={colors.flameInk} strokeWidth={2.6} />
      </Animated.View>
      <GestureDetector gesture={pan}>
      <Animated.View style={slide}>
      <Card
        onPress={() => router.push(`/assignment/${a.id}`)}
        style={[styles.card, compact && styles.compact]}
        tint={late ? colors.danger : undefined}
        accessibilityLabel={`${a.title}, ${KIND_LABEL[a.kind]}${cls ? ` for ${cls.name}` : ''}, due ${dueLabel(a.due)}`}
      >
        <Pressy
          onPress={check}
          depth={0.85}
          haptic="none"
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: a.done }}
          accessibilityLabel={a.done ? 'Mark not done' : 'Mark done'}
        >
          <Animated.View style={[styles.check, { borderColor: a.done ? color : alpha(color, 0.6) }, a.done && { backgroundColor: color }, popStyle]}>
            {a.done ? <Icon name="check" size={16} color={colors.flameInk} strokeWidth={2.8} /> : null}
          </Animated.View>
        </Pressy>
        <View style={styles.body}>
          <Text style={[styles.title, a.done && styles.done]} numberOfLines={2}>
            {a.starred && !a.done ? <Text style={styles.star}>★ </Text> : null}
            {a.title}
          </Text>
          <View style={styles.meta}>
            {cls ? (
              <View style={styles.classTag}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {cls.name}
                </Text>
              </View>
            ) : null}
            {big ? (
              <View style={[styles.kind, { backgroundColor: alpha(color, 0.16) }]}>
                <Text style={[styles.kindText, { color }]}>{KIND_LABEL[a.kind]}</Text>
              </View>
            ) : null}
            {a.minutes && !a.done ? <Text style={styles.metaText}>{a.minutes >= 60 ? `${+(a.minutes / 60).toFixed(1)}h` : `${a.minutes}m`}</Text> : null}
            {a.subtasks?.length && !a.done ? (
              <Text style={styles.metaText}>
                {a.subtasks.filter((t) => t.done).length}/{a.subtasks.length} steps
              </Text>
            ) : null}
            {a.notes ? <Icon name="pen" size={12} color={colors.textFaint} /> : null}
            {a.repeat === 'weekly' ? <Icon name="repeat" size={12} color={colors.textFaint} /> : null}
          </View>
        </View>
        {/* Every row says when; soon and late ones stand out. */}
        <Text style={[styles.due, late && { color: colors.danger }, soon && !late && { color: colors.flame }]}>{dueLabel(a.due)}</Text>
      </Card>
      </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  under: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  underDone: {
    backgroundColor: colors.secured,
    justifyContent: 'flex-start',
  },
  underLater: {
    backgroundColor: colors.flame,
    justifyContent: 'flex-end',
  },
  underText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.flameInk,
  },
  star: {
    color: colors.flame,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  compact: {
    paddingVertical: 12,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.text,
  },
  done: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  // Wraps instead of squeezing, so large text never breaks "steps" mid-word or clips the badge.
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 2,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  classTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    maxWidth: '100%',
  },
  metaText: {
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  kind: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    minHeight: 18,
    borderRadius: 9,
    justifyContent: 'center',
  },
  kindText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
  },
  due: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textMuted,
  },
});
