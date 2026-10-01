import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { addDays, dateKey, isoDay, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';

// Coming back after being out: which classes you missed, and a short,
// ready-to-send note for each teacher asking what to catch up on.
export default function AbsentScreen() {
  const allClasses = useSchoolStore((s) => s.classes);
  const classes = allClasses.filter((c) => c.kind === 'class');
  const [daysOut, setDaysOut] = useState(1);
  const [asked, setAsked] = useState<string[]>([]);

  // School days missed, counting back from yesterday (or today if it's a school day and you're home).
  const missedDays: number[] = [];
  for (let i = 1; missedDays.length < daysOut && i < 14; i++) {
    const [y, m, d] = addDays(dateKey(), -i).split('-').map(Number);
    const wd = isoDay(new Date(y, m - 1, d));
    if (wd <= 5) missedDays.push(wd);
  }
  const missed = classes.filter((c) => c.days.length === 0 || c.days.some((d) => missedDays.includes(d)));

  const note = (teacher: string, name: string) =>
    `Hi ${teacher || 'there'},\n\nI was out ${daysOut === 1 ? 'yesterday' : `the last ${daysOut} school days`} and missed ${name}. Could you let me know what I missed, like notes, homework, or anything I need to make up? I want to get caught up.\n\nThank you!`;

  return (
    <Screen title="I was out" subtitle="Getting caught up is a to-do list, not a mountain.">
      <Reveal index={0}>
        <Section title="How long?">
          <ChipRow>
            {[1, 2, 3, 5].map((n) => (
              <Chip key={n} label={n === 1 ? 'One day' : `${n} days`} selected={daysOut === n} onPress={() => setDaysOut(n)} />
            ))}
          </ChipRow>
        </Section>
      </Reveal>

      {!classes.length ? (
        <EmptyState title="Add your classes first." body="Then this can tell you which teachers to check in with.">
          <Button label="Your schedule" icon="book" variant="secondary" onPress={() => router.push('/classes')} />
        </EmptyState>
      ) : (
        <Reveal index={1}>
          <Section title="Check in with" note={`${asked.length} of ${missed.length} asked`}>
            <View style={styles.list}>
              {missed.map((c) => {
                const done = asked.includes(c.id);
                return (
                  <Card key={c.id} tint={done ? colors.secured : c.color} style={styles.row}>
                    <Pressy
                      onPress={() => setAsked((a) => (done ? a.filter((x) => x !== c.id) : [...a, c.id]))}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: done }}
                      accessibilityLabel={`Asked ${c.name}`}
                      style={[styles.check, { borderColor: done ? colors.secured : alpha(c.color, 0.6) }, done && { backgroundColor: colors.secured }]}
                    >
                      {done ? <Icon name="check" size={14} color={colors.flameInk} strokeWidth={3} /> : null}
                    </Pressy>
                    <View style={styles.flex}>
                      <Text style={styles.name}>{c.name}</Text>
                      <Text style={styles.sub}>{c.teacher || 'Your teacher'}</Text>
                    </View>
                    <Button
                      label="Draft note"
                      icon="message"
                      size="sm"
                      variant="secondary"
                      onPress={async () => {
                        await Share.share({ message: note(c.teacher, c.name) });
                        if (!asked.includes(c.id)) setAsked((a) => [...a, c.id]);
                      }}
                    />
                  </Card>
                );
              })}
            </View>
          </Section>
        </Reveal>
      )}

      {missed.length > 0 ? (
        <Reveal index={2}>
          <Card style={styles.tips}>
            <Text style={styles.tipsTitle}>A good order</Text>
            <Text style={styles.tip}>1. Ask a friend in each class for the notes.</Text>
            <Text style={styles.tip}>2. Check Classroom or Canvas for posted work — scan it in.</Text>
            <Text style={styles.tip}>3. Anything with a test coming up goes first.</Text>
            <Text style={styles.tip}>4. Ask for extra time on the rest. Teachers usually say yes when you ask early.</Text>
            <Button
              label="Scan what I missed"
              icon="image"
              variant="secondary"
              onPress={() => {
                emberSay('Screenshot the Classroom to-do list, I’ll sort it.', 'happy');
                router.push('/scan');
              }}
              style={styles.scan}
            />
          </Card>
        </Reveal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  sub: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  tips: {
    marginTop: 20,
  },
  tipsTitle: {
    marginBottom: 6,
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text,
  },
  tip: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  scan: {
    marginTop: 14,
  },
});
