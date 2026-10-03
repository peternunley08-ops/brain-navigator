import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { addDays, dateKey } from '../../core/dates';
import { useLifeStore } from '../../core/lifeStore';
import { useSchoolStore } from '../../core/schoolStore';
import { alpha, colors } from '../../core/theme';
import { useWellnessStore } from '../../core/wellnessStore';
import { plural } from '../../core/words';

const DAYS = 14;

// A thin line of the last two weeks. A day glows gold if you showed up:
// a check-in, a focus session, a finished assignment, or a win. No numbers.
export function StreakOfLight() {
  const checkins = useWellnessStore((s) => s.checkins);
  const focus = useSchoolStore((s) => s.focus);
  const assignments = useSchoolStore((s) => s.assignments);
  const wins = useLifeStore((s) => s.wins);

  const days = useMemo(() => {
    const lit = new Set<string>();
    for (const c of checkins) lit.add(c.checkin_date);
    for (const f of focus) lit.add(dateKey(new Date(f.at)));
    for (const a of assignments) if (a.doneAt) lit.add(dateKey(new Date(a.doneAt)));
    for (const w of wins) lit.add(dateKey(new Date(w.at)));
    const today = dateKey();
    return Array.from({ length: DAYS }, (_, i) => {
      const key = addDays(today, i - (DAYS - 1));
      return { key, on: lit.has(key) };
    });
  }, [checkins, focus, assignments, wins]);

  const count = days.filter((d) => d.on).length;
  const todayLit = days[DAYS - 1].on;
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduce || todayLit) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1600 }), withTiming(0, { duration: 1600 })), -1);
    return () => cancelAnimation(pulse);
  }, [reduce, todayLit, pulse]);

  const todayStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: 0.35 + 0.65 * pulse.value };
  });

  return (
    <View style={styles.row} accessible accessibilityLabel={`You showed up on ${count} of the last ${plural(DAYS, 'day')}`}>
      {days.map((d, i) => {
        const isToday = i === DAYS - 1;
        return isToday && !d.on ? (
          <Animated.View key={d.key} style={[styles.seg, { backgroundColor: alpha(colors.flame, 0.6) }, todayStyle]} />
        ) : (
          <View key={d.key} style={[styles.seg, { backgroundColor: d.on ? alpha(colors.flame, 0.75) : colors.line }, d.on && styles.glow]} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2, width: '100%', height: 2 },
  seg: { flex: 1, height: 2, borderRadius: 1 },
  glow: { shadowColor: colors.flame, shadowOpacity: 0.7, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
});
