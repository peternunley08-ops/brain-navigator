import { router } from 'expo-router';
import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { dateKey } from '../../core/dates';
import { firstWeekNotes, type FirstWeek } from '../../core/deskNotes';
import { HELPERS } from '../../core/helpers';
import { useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts } from '../../core/theme';
import { Card } from '../ui/Card';
import { Chip, ChipRow } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { LeaveNoteSheet } from './DayCards';

/** Day 2 of a new student's first week, until opened or skipped. */
export function whenCrew(firstWeek: FirstWeek | undefined, today: string) {
  return firstWeekNotes(firstWeek, today).crew;
}

/** Marks a first-week note as done, so it doesn't come back. */
function markDone(id: string) {
  const fw = useLifeStore.getState().settings.firstWeek;
  if (fw && !fw.done.includes(id)) useLifeStore.getState().setSettings({ firstWeek: { ...fw, done: [...fw.done, id] } });
}

// The helper crew, introduced as Ember's note the day after the welcome
// (it used to be a welcome step). Opening it or × puts it away for good.
export function Crew() {
  const firstWeek = useLifeStore((s) => s.settings.firstWeek);
  const reduced = useReducedMotion();
  const leave = useContext(LeaveNoteSheet);
  if (!whenCrew(firstWeek, dateKey())) return null;
  const open = (href: string) => {
    markDone('crew');
    leave();
    router.push(href as never);
  };
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(320)} exiting={reduced ? undefined : FadeOut.duration(180)}>
      <Card tint={colors.flame} style={styles.card}>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: alpha(colors.flame, 0.16) }]}>
            <Icon name="people" size={20} color={colors.flame} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>Meet the helper crew</Text>
            <Text style={styles.body}>Each one helps with a different part of studying. Their games and plans are free and work on your phone.</Text>
          </View>
          <IconButton icon="close" label="Skip the crew" size={30} onPress={() => markDone('crew')} />
        </View>
        <ChipRow style={styles.chips}>
          {HELPERS.map((h) => (
            <Chip key={h.id} label={h.name} onPress={() => open(`/helper/${h.id}`)} accessibilityLabel={`${h.name}: ${h.tagline}`} />
          ))}
          <Chip label="See them all" icon="arrow" onPress={() => open('/helpers')} />
        </ChipRow>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  chips: {
    marginTop: 12,
  },
});
