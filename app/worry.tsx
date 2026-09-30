import * as Haptics from 'expo-haptics';
import { useState } from 'react';
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

  const open = worries.filter((w) => !w.resolved);
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
  gap: {
    marginTop: 12,
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
