import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { goBack } from '../core/chrome';
import * as Haptics from '../core/haptics';
import { useLifeStore } from '../core/lifeStore';
import { colors, fonts } from '../core/theme';

// Asked once, before anything is ever sent to the AI (App Store guideline
// 5.1.2(i) and health-data consent laws): what goes, to whom, what doesn't,
// and that saying no keeps every other part of the app working.
const SENT = [
  'What you type to Ember or a helper, with phone numbers, emails and street addresses blanked out first',
  'A short note so the reply fits your day: your first name and grade, your classes, what’s due this week, what’s open on your Desk, and today’s check-in (mood, stress, sleep, some of which can come from Apple Health)',
  'About you and things Ember remembers, only if you turn those on',
];
const NOT_SENT = ['Your notes, journal, vents and grades, unless you paste them into a chat', 'Your location, contacts or photos', 'Anything while AI is off, or before you say yes here'];

export default function AIConsentScreen() {
  const agree = () => {
    useLifeStore.getState().setSettings({ aiConsentAt: new Date().toISOString(), aiOff: false });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    emberSay('Thanks. Ask me again and I’ll think it through.', 'happy');
    goBack();
  };
  const notNow = () => {
    emberSay('No problem. I’ll use my own questions, and everything else works the same.', 'happy');
    goBack();
  };

  return (
    <Screen sheet back={notNow} backIcon="close" nav={false} tone="dusk" title="Before Ember thinks with AI" subtitle="Ember’s replies are written by Claude, an AI made by Anthropic. Ember is a computer program, not a person.">
      <Reveal index={0}>
        <Card>
          <Text style={styles.head}>What’s sent when you ask</Text>
          {SENT.map((s) => (
            <Row key={s} icon="arrow" text={s} />
          ))}
        </Card>
      </Reveal>
      <Reveal index={1}>
        <Card style={styles.gap}>
          <Text style={styles.head}>What isn’t</Text>
          {NOT_SENT.map((s) => (
            <Row key={s} icon="check" text={s} />
          ))}
        </Card>
      </Reveal>
      <Reveal index={2}>
        <Card style={styles.gap}>
          <Text style={styles.head}>Where it goes</Text>
          <Text style={styles.body}>
            Through this app’s server to Anthropic, which writes the reply. Anthropic doesn’t use it to train its models and keeps it only for a limited time for safety. Nothing is sold or used for ads.
          </Text>
          <Text style={[styles.body, styles.gapSmall]}>
            Ember isn’t a therapist or a doctor. If you’re in danger or thinking about hurting yourself, call or text 988, or tell an adult you trust.
          </Text>
        </Card>
      </Reveal>
      <Reveal index={3}>
        <Button label="Allow AI replies" icon="sparkle" onPress={agree} style={styles.gap} />
        <Button label="Not now" variant="ghost" onPress={notNow} style={styles.gapSmall} />
        <Text style={styles.foot} accessibilityRole="link" onPress={() => router.push('/ai')}>
          You can change this any time in How AI works here.
        </Text>
      </Reveal>
    </Screen>
  );
}

function Row({ icon, text }: { icon: 'arrow' | 'check'; text: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={14} color={icon === 'check' ? colors.secured : colors.flame} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    marginTop: 14,
  },
  gapSmall: {
    marginTop: 8,
  },
  head: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 5,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  foot: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
