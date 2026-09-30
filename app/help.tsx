import { router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { alpha, colors, fonts } from '../core/theme';

const RED = '#F07060';

interface Line {
  name: string;
  body: string;
  actions: { label: string; url: string; icon: IconName }[];
}

// Real people, right now. Every button opens the phone's own dialer or
// messages app — nothing goes through this app.
const LINES: Line[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    body: 'Free, 24/7, for anyone going through a hard time — you don’t have to be in crisis to reach out.',
    actions: [
      { label: 'Call 988', url: 'tel:988', icon: 'phone' },
      { label: 'Text 988', url: 'sms:988', icon: 'message' },
    ],
  },
  {
    name: 'Crisis Text Line',
    body: 'Text with a trained volunteer, 24/7. Good if talking out loud feels like too much.',
    actions: [{ label: 'Text HOME to 741741', url: 'sms:741741&body=HOME', icon: 'message' }],
  },
  {
    name: 'The Trevor Project',
    body: 'For LGBTQ+ young people, 24/7.',
    actions: [
      { label: 'Call', url: 'tel:18664887386', icon: 'phone' },
      { label: 'Text START to 678678', url: 'sms:678678&body=START', icon: 'message' },
    ],
  },
];

export default function HelpScreen() {
  return (
    <Screen tone="room" glowColor={RED} title="Need help now?" subtitle="You don’t have to handle this alone. Reaching out is a strong thing to do.">
      <Reveal index={0}>
        <Card tint={RED} style={styles.emergency}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: alpha(RED, 0.16) }]}>
              <Icon name="phone" size={22} color={RED} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.title}>In danger right now?</Text>
              <Text style={styles.body}>Call 911, or go to someone near you.</Text>
            </View>
          </View>
          <Button label="Call 911" icon="phone" onPress={() => Linking.openURL('tel:911')} style={styles.callBtn} tint={RED} variant="secondary" />
        </Card>
      </Reveal>

      {LINES.map((l, i) => (
        <Reveal key={l.name} index={i + 1}>
          <Card style={styles.card}>
            <Text style={styles.title}>{l.name}</Text>
            <Text style={styles.body}>{l.body}</Text>
            <View style={styles.actions}>
              {l.actions.map((a) => (
                <Pressy key={a.label} onPress={() => Linking.openURL(a.url)} style={styles.action} accessibilityRole="button" accessibilityLabel={`${a.label}, ${l.name}`}>
                  <Icon name={a.icon} size={16} color={colors.flameInk} strokeWidth={2.2} />
                  <Text style={styles.actionText}>{a.label}</Text>
                </Pressy>
              ))}
            </View>
          </Card>
        </Reveal>
      ))}

      <Reveal index={5}>
        <Section title="Someone you know" note="A person who already knows you can help in ways a hotline can’t.">
          <Card>
            <Text style={styles.body}>
              A parent or guardian, your school counselor, a teacher or coach you trust, a friend’s parent. You can start with
              “I’m having a really hard time and I don’t know what to do.” That’s enough.
            </Text>
          </Card>
        </Section>
      </Reveal>

      <Reveal index={6}>
        <Section title="Right this minute">
          <View style={styles.row2}>
            <Button label="Breathe" icon="wind" variant="secondary" onPress={() => router.push('/breathe')} style={styles.flex} />
            <Button label="Ground yourself" icon="steady" variant="secondary" onPress={() => router.push('/steady')} style={styles.flex} />
          </View>
        </Section>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emergency: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  callBtn: {
    marginTop: 14,
  },
  card: {
    marginTop: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  body: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.flame,
  },
  actionText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.flameInk,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
});
