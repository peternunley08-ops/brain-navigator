import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { alpha, colors, fonts } from '../core/theme';

interface Topic {
  id: string;
  title: string;
  teaser: string;
  body: string;
}

const ART: Record<string, { icon: IconName; color: string }> = {
  circadian: { icon: 'moon', color: '#8FB4E8' },
  caffeine: { icon: 'flask', color: '#D99A6C' },
  'habit-loops': { icon: 'repeat', color: '#8CC0A8' },
  'light-mood': { icon: 'sun', color: '#F5B45C' },
};

const TOPICS: Topic[] = [
  {
    id: 'circadian',
    title: 'Circadian rhythm',
    teaser: 'Why the same bedtime keeps beating a different one every night.',
    body: "A cluster of about 20,000 neurons in your hypothalamus — the suprachiasmatic nucleus — runs a roughly 24-hour clock that governs sleep, body temperature, and hormone release. It's reset daily mostly by light hitting your eyes, especially in the first hour after waking. Keep that hour consistent (even on weekends) and the clock stays stable; let it drift and you get the same disoriented feeling as jet lag, without ever leaving home.",
  },
  {
    id: 'caffeine',
    title: 'Caffeine and adenosine',
    teaser: 'Coffee doesn’t wake you up — it just hides that you were already tired.',
    body: "Adenosine is a byproduct of cellular energy use that steadily builds up in your brain the longer you're awake, binding to receptors that make you feel sleepy. Caffeine has a similar shape, so it blocks those receptors without breaking the adenosine down. Your brain is just as tired underneath — which is why, once the caffeine wears off, all that backed-up adenosine binds at once. That sudden crash is the debt coming due, not new fatigue.",
  },
  {
    id: 'habit-loops',
    title: 'Habit loops',
    teaser: 'Streaks aren’t built by willpower — they’re built by repetition.',
    body: 'Behavioral research describes habits as a three-part loop: a cue triggers a routine, which delivers a reward, which reinforces the cue-routine pairing next time. Repeat that loop enough and the routine starts running with less and less conscious effort — it becomes automatic. This is also why an occasional missed day rarely destroys a habit: the loop is wired from repetition over time, not from a single unbroken chain, so one gap doesn’t unwire what dozens of repetitions already built.',
  },
  {
    id: 'light-mood',
    title: 'Light and mood',
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
    <Screen title="The science" subtitle="What’s actually behind the numbers you log.">
      <View style={styles.list}>
        {TOPICS.map((topic, i) => (
          <Reveal key={topic.id} index={i}>
            <TopicCard topic={topic} open={openIds.has(topic.id)} onToggle={() => toggle(topic.id)} />
          </Reveal>
        ))}
      </View>
    </Screen>
  );
}

function TopicCard({ topic, open, onToggle }: { topic: Topic; open: boolean; onToggle: () => void }) {
  const art = ART[topic.id] ?? { icon: 'flask' as IconName, color: colors.flame };
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: withSpring(open ? '90deg' : '0deg', { damping: 14, stiffness: 200 }) }] }));
  return (
    <Animated.View layout={LinearTransition.springify().damping(18)}>
      <Card tint={open ? art.color : undefined} onPress={onToggle} accessibilityState={{ expanded: open }} accessibilityLabel={topic.title}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: alpha(art.color, 0.14), borderColor: alpha(art.color, 0.3) }]}>
            <Icon name={art.icon} size={20} color={art.color} />
          </View>
          <View style={styles.headText}>
            <Text style={styles.title}>{topic.title}</Text>
            <Text style={styles.teaser}>{topic.teaser}</Text>
          </View>
          <Animated.View style={turn}>
            <Icon name="chevron" size={18} color={colors.textFaint} />
          </Animated.View>
        </View>
        {open ? (
          <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOut.duration(120)}>
            <Text style={styles.body}>{topic.body}</Text>
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  teaser: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textMuted,
  },
  body: {
    marginTop: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
});
