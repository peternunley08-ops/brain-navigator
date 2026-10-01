import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { Pressy } from '../components/ui/Pressy';
import { Icon } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { dateKey, dueLabel } from '../core/dates';
import { type RecLetter, useHubStore } from '../core/hubStore';
import { parseDue } from '../core/scanParser';
import { alpha, colors, fonts } from '../core/theme';

const PINK = '#E89AB8';
const STEPS: { key: RecLetter['status']; label: string }[] = [
  { key: 'ask', label: 'Need to ask' },
  { key: 'asked', label: 'Asked' },
  { key: 'submitted', label: 'Submitted' },
];

function askNote(teacher: string) {
  return `Hi ${teacher},

I’m applying to college this year and I’d be honored if you’d write me a letter of recommendation. Your class is one where I really grew, and I think you know my work well.

I can send you a short brag sheet with my activities, goals, and deadlines. Is there anything else that would help?

Thank you so much for considering it.`;
}

// Rec letters: ask early (4+ weeks), make it easy for them, and say thank you.
export default function RecsScreen() {
  const recs = useHubStore((s) => s.recs);
  const save = useHubStore((s) => s.saveRec);
  const remove = useHubStore((s) => s.deleteRec);
  const [adding, setAdding] = useState(recs.length === 0);
  const [teacher, setTeacher] = useState('');
  const [due, setDue] = useState('');

  const add = () => {
    if (!teacher.trim()) return;
    save({ teacher: teacher.trim(), askedOn: null, due: parseDue(due), status: 'ask', thanked: false });
    setTeacher('');
    setDue('');
    setAdding(false);
  };

  return (
    <Screen
      glowColor={PINK}
      title="Rec letters"
      subtitle="Ask at least four weeks before the deadline. Thank them after."
      right={<IconButton icon="plus" label="Add a recommender" onPress={() => setAdding((a) => !a)} />}
    >
      {adding ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Card tint={PINK} style={styles.gap}>
            <Field value={teacher} onChangeText={setTeacher} placeholder="Who? e.g. Ms. Rivera (Chemistry)" autoCapitalize="words" />
            <Field value={due} onChangeText={setDue} placeholder="Letter due, e.g. 11/1" containerStyle={styles.gap} />
            <Button label="Add" icon="plus" onPress={add} disabled={!teacher.trim()} style={styles.gap} />
          </Card>
        </Animated.View>
      ) : null}
      {recs.length === 0 && !adding ? <EmptyState gear="cap" title="No recommenders yet." body="Most colleges want two teachers and your counselor." /> : null}
      <View style={styles.list}>
        {recs.map((r, i) => (
          <Reveal key={r.id} index={i}>
            <Animated.View exiting={FadeOut.duration(150)} layout={LinearTransition}>
              <Card tint={r.status === 'submitted' ? colors.secured : undefined}>
                <View style={styles.head}>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{r.teacher}</Text>
                    <Text style={styles.meta}>
                      {r.due ? `Due ${dueLabel(r.due)}` : 'No due date'}
                      {r.askedOn ? `, asked ${dueLabel(r.askedOn).toLowerCase()}` : ''}
                    </Text>
                  </View>
                  <IconButton icon="trash" label={`Remove ${r.teacher}`} size={34} color={alpha(colors.danger, 0.7)} onPress={() => remove(r.id)} />
                </View>
                <ChipRow style={styles.gapSm}>
                  {STEPS.map((st) => (
                    <Chip
                      key={st.key}
                      label={st.label}
                      selected={r.status === st.key}
                      color={st.key === 'submitted' ? colors.secured : PINK}
                      onPress={() => {
                        save({ ...r, status: st.key, askedOn: st.key !== 'ask' ? (r.askedOn ?? dateKey()) : null });
                        if (st.key === 'submitted') emberSay(`${r.teacher} submitted it. Time for a thank-you note.`, 'cheer');
                      }}
                    />
                  ))}
                </ChipRow>
                {r.status === 'ask' ? (
                  <Button label="Draft the ask" icon="message" variant="secondary" size="sm" onPress={() => Share.share({ message: askNote(r.teacher.split('(')[0].trim()) })} style={styles.gapSm} />
                ) : null}
                {r.status === 'submitted' ? (
                  <Pressy onPress={() => save({ ...r, thanked: !r.thanked })} style={styles.thanks} accessibilityRole="checkbox" accessibilityState={{ checked: r.thanked }}>
                    <Icon name={r.thanked ? 'check' : 'heart'} size={16} color={r.thanked ? colors.secured : PINK} />
                    <Text style={styles.thanksText}>{r.thanked ? 'Thank-you sent' : 'Send a thank-you note'}</Text>
                  </Pressy>
                ) : null}
                {r.status === 'submitted' && !r.thanked ? (
                  <Button
                    label="Draft the thank-you"
                    icon="message"
                    variant="secondary"
                    size="sm"
                    onPress={() =>
                      Share.share({
                        message: `Dear ${r.teacher.split('(')[0].trim()},\n\nThank you so much for writing my recommendation letter. I know it took real time, and it means a lot that you’d vouch for me. I’ll let you know where I end up.\n\nThank you again.`,
                      })
                    }
                    style={styles.gapSm}
                  />
                ) : null}
              </Card>
            </Animated.View>
          </Reveal>
        ))}
      </View>
      {recs.length ? (
        <Card style={styles.tip}>
          <Text style={styles.tipTitle}>Make it easy for them</Text>
          <Text style={styles.meta}>Give each recommender a one-page brag sheet: your activities, a moment from their class you’re proud of, your deadlines, and where to submit.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: 12,
  },
  gapSm: {
    marginTop: 10,
  },
  list: {
    gap: 10,
    marginTop: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  thanks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  thanksText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  tip: {
    marginTop: 20,
  },
  tipTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
  },
});
