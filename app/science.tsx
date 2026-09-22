import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, fonts, radii, spacing } from '../core/theme';

interface Topic {
  id: string;
  title: string;
  teaser: string;
  body: string;
}

const TOPICS: Topic[] = [
  {
    id: 'circadian',
    title: 'Circadian Rhythm',
    teaser: 'Why the same bedtime keeps beating a different one every night.',
    body: "A cluster of about 20,000 neurons in your hypothalamus — the suprachiasmatic nucleus — runs a roughly 24-hour clock that governs sleep, body temperature, and hormone release. It's reset daily mostly by light hitting your eyes, especially in the first hour after waking. Keep that hour consistent (even on weekends) and the clock stays stable; let it drift and you get the same disoriented feeling as jet lag, without ever leaving home.",
  },
  {
    id: 'caffeine',
    title: 'Caffeine & Adenosine',
    teaser: 'Coffee doesn’t wake you up — it just hides that you were already tired.',
    body: "Adenosine is a byproduct of cellular energy use that steadily builds up in your brain the longer you're awake, binding to receptors that make you feel sleepy. Caffeine has a similar shape, so it blocks those receptors without breaking the adenosine down. Your brain is just as tired underneath — which is why, once the caffeine wears off, all that backed-up adenosine binds at once. That sudden crash is the debt coming due, not new fatigue.",
  },
  {
    id: 'habit-loops',
    title: 'Habit Loops',
    teaser: 'Streaks aren’t built by willpower — they’re built by repetition.',
    body: 'Behavioral research describes habits as a three-part loop: a cue triggers a routine, which delivers a reward, which reinforces the cue-routine pairing next time. Repeat that loop enough and the routine starts running with less and less conscious effort — it becomes automatic. This is also why an occasional missed day rarely destroys a habit: the loop is wired from repetition over time, not from a single unbroken chain, so one gap doesn’t unwire what dozens of repetitions already built.',
  },
  {
    id: 'light-mood',
    title: 'Light & Mood',
    teaser: 'Why a gray week can drag on your mood more than a bad one.',
    body: 'Bright light exposure — natural daylight especially — influences serotonin production and helps regulate the same circadian system that governs sleep. Reduced daylight (shorter days, more time indoors) is linked to lower mood and energy for a lot of people, not just in clinical seasonal patterns. Even a short walk outside during daylight hours does double duty: it nudges your circadian clock and gives you a small, real serotonin boost.',
  },
];

export default function ScienceScreen() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <View style={styles.outer}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

        <Text style={styles.title}>The Science</Text>
        <Text style={styles.subtitle}>What's actually behind the numbers you log</Text>

        <View style={styles.list}>
          {TOPICS.map((topic) => {
            const open = openIds.has(topic.id);
            return (
              <Pressable key={topic.id} onPress={() => toggle(topic.id)}>
                <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{topic.title}</Text>
                    <Text style={styles.cardToggle}>{open ? '−' : '+'}</Text>
                  </View>
                  <Text style={styles.teaser}>{topic.teaser}</Text>
                  {open ? <Text style={styles.body}>{topic.body}</Text> : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 100,
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
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    color: colors.inkMuted,
  },
  list: {
    gap: spacing.sm,
  },
  card: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
  },
  cardToggle: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.leather,
  },
  teaser: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  body: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.lanternGlow,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
