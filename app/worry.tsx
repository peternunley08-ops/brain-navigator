import * as Haptics from '../core/haptics';
import { EmberReflect } from '../components/ember/EmberReflect';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { ScienceNote } from '../components/ui/ScienceNote';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { useLifeStore } from '../core/lifeStore';
import { colors, fonts } from '../core/theme';

const LAVENDER = '#AFA2DE';

const COMMON = new Set('about after again also because been being could does doing done even ever every from going have just know like make maybe more much never only really should some still than that their them then there they thing things think this what when where which will with would your'.split(' '));
const words = (t: string) => new Set(t.toLowerCase().match(/[a-z']{4,}/g)?.filter((w) => !COMMON.has(w)) ?? []);

/** How many other worries from the last month share at least two key words with this one. */
function timesBack(text: string, others: { text: string; createdAt: string }[]) {
  const mine = words(text);
  const since = Date.now() - 30 * 86400000;
  return others.filter((o) => o.text !== text && new Date(o.createdAt).getTime() >= since && [...words(o.text)].filter((w) => mine.has(w)).length >= 2).length;
}

// Worry postponement: write the worry down and give it an appointment
// instead of letting it follow you around all day. At worry time, open the
// box — a lot of them will have shrunk on their own.
export default function WorryScreen() {
  const worries = useLifeStore((s) => s.worries);
  const addWorry = useLifeStore((s) => s.addWorry);
  const resolveWorry = useLifeStore((s) => s.resolveWorry);
  const deleteWorry = useLifeStore((s) => s.deleteWorry);
  const [text, setText] = useState('');
  const [showOld, setShowOld] = useState(false);
  // Worry time, timed: fifteen minutes for the box, then it closes for the day.
  const { timer } = useLocalSearchParams<{ timer?: string }>();
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const iv = setInterval(() => {
      tick((n) => n + 1);
      if (Date.now() >= endsAt) {
        clearInterval(iv);
        setEndsAt(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        emberSay('Worry time’s up. The box stays closed until tomorrow. You did the hard part.', 'happy');
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [endsAt]);
  const leftMs = endsAt ? Math.max(0, endsAt - Date.now()) : 0;

  const open = worries.filter((w) => !w.resolved);
  // The newest open worry that's been written down three or more times.
  const repeating = open
    .map((w) => ({ text: w.text, n: timesBack(w.text, worries) }))
    .find((w) => w.n >= 2);
  const handled = worries.filter((w) => w.resolved);
  const hour = new Date().getHours();
  const worryTime = hour >= 16 && hour < 19;

  const add = () => {
    if (!text.trim()) return;
    addWorry(text);
    setText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    emberSay('It’s in the box. You don’t have to hold it until worry time.', 'happy');
  };

  return (
    <Screen tone="dusk" glowColor={LAVENDER} title="Worry box" subtitle="Put it down now. Pick it up at worry time.">
      <Reveal index={0}>
        <Card tint={LAVENDER}>
          <Field value={text} onChangeText={setText} placeholder="What’s on your mind?" multiline />
          <Button label="Put it in the box" icon="feather" onPress={add} disabled={!text.trim()} style={styles.gap} />
          <Text style={styles.hint}>
            {worryTime
              ? 'It’s worry time (4–7 PM). Open the box, give each one 15 minutes, max.'
              : 'Worry time is 4–7 PM. When a worry shows up outside it, jot it here and get back to your day.'}
          </Text>
        </Card>
      </Reveal>

      {(timer || worryTime) && open.length ? (
        <Reveal index={1}>
          <Card style={styles.gap}>
            {endsAt ? (
              <>
                <Text style={styles.timer}>
                  {Math.floor(leftMs / 60000)}:{String(Math.floor((leftMs % 60000) / 1000)).padStart(2, '0')}
                </Text>
                <Text style={styles.hint}>One at a time. Is there one small step? Write it down, or mark it handled.</Text>
                <Button label="Close the box early" variant="ghost" size="sm" onPress={() => setEndsAt(null)} />
              </>
            ) : (
              <Button label="Start 15 minutes of worry time" icon="timer" variant="secondary" tint={LAVENDER} onPress={() => setEndsAt(Date.now() + 15 * 60_000)} />
            )}
          </Card>
        </Reveal>
      ) : null}

      {repeating ? (
        <Reveal index={1}>
          <Card tint={LAVENDER} style={styles.gap}>
            <Text style={styles.backTitle}>This one keeps coming back.</Text>
            <Text style={styles.hint}>“{repeating.text}” has been in the box {repeating.n + 1} times this month. Worries that return are often lighter once someone you trust knows about them. Who could you tell?</Text>
            <Button label="Your people" icon="people" variant="secondary" size="sm" tint={LAVENDER} onPress={() => router.push('/people')} style={styles.gap} />
          </Card>
        </Reveal>
      ) : null}

      <Reveal index={1}>
        <Section title="In the box" note={open.length ? `${open.length}` : undefined}>
          {open.length === 0 ? (
            <EmptyState title="The box is empty." body="Nothing to carry right now." />
          ) : (
            <View style={styles.list}>
              {open.map((w) => (
                <Animated.View key={w.id} entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(220)} layout={LinearTransition}>
                  <Card style={styles.worry}>
                    <Text style={styles.worryText}>{w.text}</Text>
                    <Text style={styles.date}>{new Date(w.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    <EmberReflect input={`Worry: ${w.text}`} label="Is this in my control?" sends="Sends this worry to Claude. Only if you tap." color={LAVENDER} />
                    <View style={styles.actions}>
                      <Button
                        label="Handled"
                        icon="check"
                        size="sm"
                        variant="secondary"
                        tint={colors.secured}
                        onPress={() => {
                          resolveWorry(w.id);
                          emberSay('Handled. Notice that — worries usually shrink when you look at them.', 'cheer');
                        }}
                      />
                      <Button
                        label="Not mine to fix"
                        size="sm"
                        variant="ghost"
                        onPress={() => {
                          deleteWorry(w.id);
                          emberSay('Let go. Some things aren’t yours to carry.', 'happy');
                        }}
                      />
                    </View>
                  </Card>
                </Animated.View>
              ))}
            </View>
          )}
        </Section>
      </Reveal>

      {handled.length ? (
        <Reveal index={2}>
          <Section title="Handled" note={`${handled.length} so far`} action={{ label: showOld ? 'Hide' : 'Show', onPress: () => setShowOld((v) => !v) }}>
            {showOld ? (
              <Card>
                {handled.slice(0, 20).map((w) => (
                  <Pressy key={w.id} onLongPress={() => deleteWorry(w.id)} style={styles.oldRow} accessibilityHint="Hold to remove">
                    <Icon name="check" size={14} color={colors.secured} />
                    <Text style={styles.oldText}>{w.text}</Text>
                  </Pressy>
                ))}
              </Card>
            ) : null}
          </Section>
        </Reveal>
      ) : null}

      <Reveal index={3}>
        <ScienceNote fact="Scheduling a daily 'worry period' and postponing worries until then reduces how much time people spend worrying overall (Borkovec's stimulus-control studies). Most postponed worries feel smaller by the time worry time comes." />
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  gap: {
    marginTop: 12,
  },
  backTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    marginBottom: 6,
  },
  hint: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  worry: {},
  worryText: {
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
  },
  date: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  oldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  oldText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
});
