import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { HelpCard } from '../components/ember/HelpCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { goHome } from '../core/chrome';
import { clock } from '../core/dates';
import { followUpOn, followUpTopic, soundsLikeCrisis } from '../core/emberAI';
import { useEmberStore } from '../core/emberStore';
import * as Haptics from '../core/haptics';
import { useLifeStore, isSealed } from '../core/lifeStore';
import { dueOn, firstClassOn, morningKey, tonightKey } from '../core/night';
import { useSchoolStore } from '../core/schoolStore';
import { alpha, colors, dimensionColor, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';
import { useWellnessStore } from '../core/wellnessStore';
import { plural } from '../core/words';

const MOON = dimensionColor.intellectual;
const NAP_AFTER_MS = 3800;

// Put the day down: what got done, one place to leave whatever is still
// on your mind, what tomorrow starts with, and then goodnight.
export default function GoodnightScreen() {
  const reduced = useReducedMotion();
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const focus = useSchoolStore((s) => s.focus);
  const wins = useLifeStore((s) => s.wins);
  const checkins = useWellnessStore((s) => s.checkins);
  const addWorry = useLifeStore((s) => s.addWorry);
  const [text, setText] = useState('');
  const [kept, setKept] = useState(false);
  const [help, setHelp] = useState(false);

  const key = tonightKey();
  // After midnight the check-in that counts is the one from the day being put down.
  const checkedIn = checkins.some((c) => c.checkin_date === key);
  // Today runs 5 AM to 5 AM, like tonight does.
  const today = useMemo(() => {
    const done = assignments
      .filter((a) => a.doneAt && tonightKey(new Date(a.doneAt)) === key)
      .sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
    const minutes = focus.filter((f) => tonightKey(new Date(f.at)) === key).reduce((sum, f) => sum + f.minutes, 0);
    const won = wins.filter((w) => tonightKey(new Date(w.at)) === key && !isSealed(w));
    return { done, minutes, won };
  }, [assignments, focus, wins, key]);

  const morning = morningKey();
  const first = firstClassOn(classes, morning);
  const due = dueOn(assignments, morning);

  const lines: string[] = [
    ...today.done.slice(0, 3).map((a) => `finished ${a.title}`),
    ...(today.done.length > 3 ? [`finished ${plural(today.done.length - 3, 'more thing')}`] : []),
    ...(today.minutes > 0 ? [`focused for ${plural(today.minutes, 'minute')}`] : []),
    ...today.won.slice(0, 2).map((w) => `added a win: ${w.text}`),
    ...(checkedIn ? ['checked in'] : []),
  ];

  const change = (t: string) => {
    setText(t);
    setKept(false);
    setHelp(soundsLikeCrisis(t));
  };

  const keep = () => {
    const t = text.trim();
    if (!t) return;
    const before = useLifeStore.getState().worries;
    addWorry(t);
    offerUndo('Added to the worry box', () => useLifeStore.getState().putBack({ worries: before }), 'trash');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    setHelp(soundsLikeCrisis(t));
    setText('');
    setKept(true);
  };

  const goodnight = () => {
    // Whatever is typed but not kept yet goes in the box too, so nothing is lost.
    if (text.trim()) addWorry(text.trim());
    const latest = today.done[0];
    // Continuity: if Ember means to ask about something tomorrow, it says so now.
    const ask = followUpOn(morningKey());
    const tomorrow = ask?.followUp ? ` Tomorrow I’ll ask how ${followUpTopic(ask.followUp)} went.` : '';
    // They asked for the goodnight, so it stays whole (night lines are
    // otherwise cut to the first sentence, which dropped "Goodnight.").
    useEmberStore.getState().say(
      (latest
        ? `You finished ${latest.title}. Rest now.`
        : today.minutes >= 10
          ? `${plural(today.minutes, 'minute')} of focus today. Goodnight.`
          : today.won.length
            ? 'You wrote down a win today. Goodnight.'
            : checkedIn
              ? 'You checked in with yourself today. Goodnight.'
            : 'You made it through today. Goodnight.') + tomorrow,
      'happy',
      true
    );
    useLifeStore.getState().setSettings({ putDown: key });
    // A napping Ember keeps its bubble hidden, so let the line be read first.
    setTimeout(() => useEmberStore.getState().setNapping(true), NAP_AFTER_MS);
    goHome();
  };

  return (
    <Screen tone="dusk" glowColor={MOON} nav={false} kicker="Tonight" title="Put the day down" subtitle="A few quiet minutes, then sleep.">
      <Reveal index={0}>
        <Section title="Today you…">
          <Card style={styles.rows}>
            {lines.length ? (
              lines.map((line, i) => (
                <View key={`${i}-${line}`} style={styles.row}>
                  <View style={styles.tick}>
                    <Icon name="check" size={13} color={colors.secured} strokeWidth={3} />
                  </View>
                  <Text style={styles.rowText}>{line}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.soft}>Some days are for resting. That counts.</Text>
            )}
          </Card>
        </Section>
      </Reveal>

      <Reveal index={1}>
        <Section title="Anything still on your mind?">
          <Card tint={MOON}>
            <Field
              value={text}
              onChangeText={change}
              placeholder="Write it down and leave it here"
              accessibilityLabel="Something still on your mind"
              multiline
            />
            <Button label="Put it in the worry box" icon="feather" variant="secondary" onPress={keep} disabled={!text.trim()} style={styles.gap} />
            {kept ? (
              <Animated.Text entering={reduced ? undefined : FadeIn.duration(300)} style={[styles.soft, styles.gap]}>
                In the worry box. It’ll keep.
              </Animated.Text>
            ) : null}
          </Card>
          {help ? <HelpCard /> : null}
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title="Tomorrow starts with">
          <Card style={styles.rows}>
            {first ? (
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: first.color }]} />
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{first.name}</Text>
                  <Text style={styles.sub}>First class at {clock(first.start)}</Text>
                </View>
              </View>
            ) : null}
            {due[0] ? (
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: colors.textFaint }]} />
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{due[0].title}</Text>
                  <Text style={styles.sub}>{due.length > 1 ? `Due tomorrow, and ${plural(due.length - 1, 'more thing')}` : 'Due tomorrow'}</Text>
                </View>
              </View>
            ) : null}
            {!first && !due[0] ? <Text style={styles.soft}>A clear morning.</Text> : null}
          </Card>
        </Section>
      </Reveal>

      <Reveal index={3}>
        <Button label="Goodnight" icon="moon" onPress={goodnight} style={styles.primary} />
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.secured, 0.16),
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  rowTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textFaint,
  },
  soft: {
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
  },
  gap: {
    marginTop: 12,
  },
  primary: {
    marginTop: 24,
  },
});
