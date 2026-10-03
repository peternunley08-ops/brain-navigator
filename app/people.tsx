import * as Haptics from '../core/haptics';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { daysUntil } from '../core/dates';
import { openSafe } from '../core/links';
import { type Person, useLifeStore } from '../core/lifeStore';
import { alpha, colors, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';

const PINK = '#E89AB8';

// Openers for when it's hard to know what to say. Tapping one opens
// Messages with it filled in — you still press send.
const CAN_TALK = 'Can you talk?';
const OPENERS = [CAN_TALK, 'Having a rough day. Can I vent for a sec?', 'Can you check on me later?', 'Want to hang out this week?'];

// The few people you'd actually reach out to, one tap away. Numbers stay
// on this phone.
export default function PeopleScreen() {
  const people = useLifeStore((s) => s.people);
  const savePerson = useLifeStore((s) => s.savePerson);
  const deletePerson = useLifeStore((s) => s.deletePerson);
  const [adding, setAdding] = useState(people.length === 0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [opener, setOpener] = useState<string | null>(null);

  const add = () => {
    if (!name.trim() || !phone.trim()) return;
    savePerson({ name: name.trim(), phone: phone.trim(), note: note.trim() });
    setName('');
    setPhone('');
    setNote('');
    setAdding(false);
  };

  // Remember when you last reached out, so the app can nudge you about the quiet ones.
  const reached = (p: Person) => savePerson({ ...p, reachedAt: new Date().toISOString() });
  // Opens Messages with the words already in the box. The app never sends anything.
  const text = (p: Person, words: string | null = opener) => {
    const digits = p.phone.replace(/[^\d+]/g, '');
    reached(p);
    openSafe(words ? `sms:${digits}&body=${encodeURIComponent(words)}` : `sms:${digits}`);
  };
  const call = (p: Person) => {
    reached(p);
    Linking.openURL(`tel:${p.phone.replace(/[^\d+]/g, '')}`).catch(() => {});
  };

  return (
    <Screen
      title="Your people"
      subtitle="Who you’d reach out to. One tap away when it’s hard to start."
      right={people.length ? <IconButton icon="plus" label="Add someone" onPress={() => setAdding((a) => !a)} /> : undefined}
    >
      {adding ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Card tint={PINK} style={styles.gap}>
            <Field label="Name" value={name} onChangeText={setName} placeholder="Mom, Jordan, Coach Lee…" autoCapitalize="words" />
            <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="(555) 123-4567" keyboardType="phone-pad" containerStyle={styles.gap} />
            <Field label="Why them (optional)" value={note} onChangeText={setNote} placeholder="Always makes me laugh" containerStyle={styles.gap} />
            <Button label="Add" icon="plus" onPress={add} disabled={!name.trim() || !phone.trim()} style={styles.gap} />
          </Card>
        </Animated.View>
      ) : null}

      {people.length === 0 && !adding ? <EmptyState title="No one here yet." body="Add two or three people you trust." /> : null}

      {people.length ? (
        <Reveal index={0}>
          <Section title="Start with" note="Pick one, then text. You still press send.">
            <ChipRow>
              {OPENERS.map((o) => (
                <Chip key={o} label={o} selected={opener === o} color={PINK} onPress={() => setOpener(opener === o ? null : o)} />
              ))}
            </ChipRow>
          </Section>
        </Reveal>
      ) : null}

      <View style={styles.list}>
        {people.map((p) => (
          <Animated.View key={p.id} entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
            <Card style={styles.person}>
              <Pressy
                onLongPress={() => {
                  const snap = p;
                  deletePerson(p.id);
                  offerUndo(`Removed ${snap.name}`, () => savePerson(snap));
                }}
                accessible={false}
                style={styles.who}
              >
                <View style={[styles.avatar, { backgroundColor: alpha(PINK, 0.18) }]}>
                  <Text style={styles.initial}>{p.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.flex}>
                  <View
                    accessible
                    accessibilityLabel={[p.name, p.note || p.phone, p.reachedAt ? sinceLine(p.reachedAt) : ''].filter(Boolean).join(', ')}
                    accessibilityHint="Swipe up or down for the remove action"
                    accessibilityActions={[{ name: 'remove', label: `Remove ${p.name}` }]}
                    onAccessibilityAction={() => {
                      const snap = p;
                      deletePerson(p.id);
                      offerUndo(`Removed ${snap.name}`, () => savePerson(snap));
                    }}
                  >
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={styles.note}>{p.note || p.phone}</Text>
                    {p.reachedAt ? <Text style={styles.reached}>{sinceLine(p.reachedAt)}</Text> : null}
                  </View>
                  <Pressy
                    onPress={() => {
                      reached(p);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Talked to ${p.name} in person`}
                  >
                    <Text style={styles.inPerson}>Talked in person</Text>
                  </Pressy>
                  <Pressy
                    onPress={() => text(p, CAN_TALK)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Text ${p.name}: ${CAN_TALK}`}
                    accessibilityHint="Opens Messages with the text ready. You press send."
                  >
                    <Text style={styles.inPerson}>Ask “Can you talk?”</Text>
                  </Pressy>
                </View>
              </Pressy>
              <IconButton icon="message" label={`Text ${p.name}`} tint={PINK} onPress={() => text(p)} />
              <IconButton icon="phone" label={`Call ${p.name}`} onPress={() => call(p)} />
            </Card>
          </Animated.View>
        ))}
      </View>
      {people.length ? <Text style={styles.hint}>Hold a name to remove it.</Text> : null}
    </Screen>
  );
}

function sinceLine(iso: string) {
  const d = new Date(iso);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ago = -daysUntil(key);
  return ago <= 0 ? 'Reached out today' : ago === 1 ? 'Reached out yesterday' : `Reached out ${ago} days ago`;
}

const styles = StyleSheet.create({
  inPerson: {
    marginTop: 4,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#E89AB8',
  },
  reached: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: 12,
  },
  list: {
    gap: 10,
    marginTop: 20,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  who: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: PINK,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  note: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  hint: {
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
