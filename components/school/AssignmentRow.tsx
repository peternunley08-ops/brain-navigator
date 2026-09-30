import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { daysUntil, dueLabel, KIND_LABEL, type Assignment, useSchoolStore } from '../../core/schoolStore';
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
      if (left === 0) emberSay('That’s everything due by tomorrow. Go do something that isn’t school.', 'cheer');
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(340)} exiting={FadeOut.duration(180)} layout={LinearTransition.springify().damping(18)}>
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
              <>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {cls.name}
                </Text>
              </>
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
        {!compact || soon || late ? (
          <Text style={[styles.due, late && { color: colors.danger }, soon && !late && { color: colors.flame }]}>{dueLabel(a.due)}</Text>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  metaText: {
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  kind: {
    paddingHorizontal: 7,
    height: 18,
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
