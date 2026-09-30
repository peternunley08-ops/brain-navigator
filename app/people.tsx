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
import { useLifeStore } from '../core/lifeStore';
import { alpha, colors, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';

const PINK = '#E89AB8';

// Openers for when it's hard to know what to say. Tapping one opens
// Messages with it filled in — you still press send.
const OPENERS = ['Hey, are you free to talk?', 'Having a rough day. Can I vent for a sec?', 'Can you check on me later?', 'Want to hang out this week?'];

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

  const text = (p: string) => {
    const digits = p.replace(/[^\d+]/g, '');
    Linking.openURL(opener ? `sms:${digits}&body=${encodeURIComponent(opener)}` : `sms:${digits}`).catch(() => {});
  };
  const call = (p: string) => Linking.openURL(`tel:${p.replace(/[^\d+]/g, '')}`).catch(() => {});

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
                accessibilityHint="Hold to remove"
                style={styles.who}
              >
                <View style={[styles.avatar, { backgroundColor: alpha(PINK, 0.18) }]}>
                  <Text style={styles.initial}>{p.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.note}>{p.note || p.phone}</Text>
                </View>
              </Pressy>
              <IconButton icon="message" label={`Text ${p.name}`} tint={PINK} onPress={() => text(p.phone)} />
              <IconButton icon="phone" label={`Call ${p.name}`} onPress={() => call(p.phone)} />
            </Card>
          </Animated.View>
        ))}
      </View>
      {people.length ? <Text style={styles.hint}>Hold a name to remove it.</Text> : null}
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
