import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { InfoList } from '../components/InfoList';
import { useAIStatus } from '../components/helpers/Quota';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { FREE_PER_WEEK, PLANS, PLUS_PER_MONTH } from '../core/aiQuota';
import { colors, fonts } from '../core/theme';

const FREE_TOOLS = [
  { icon: 'people' as const, title: 'Every helper’s own mode', body: 'Quizzo’s games, Pip’s plans, Quill’s questions, Sage’s explain-it-back, Spark’s starts. They run on your phone and never run out.' },
  { icon: 'flame' as const, title: 'Ember’s tips', body: 'What Ember says when you tap it comes from rules over your own data, not AI.' },
  { icon: 'steady' as const, title: 'Every wellness tool', body: 'Breathing, grounding, the toolkit, check-ins, the worry box, and the help lines.' },
  { icon: 'image' as const, title: 'Scanning screenshots', body: 'Your phone reads the text itself. Nothing is sent anywhere.' },
];

const SENT = [
  { icon: 'chat' as const, title: 'What you type, and the chat so far', body: 'The last few messages, so the reply makes sense.' },
  { icon: 'book' as const, title: 'A short note about your day', body: 'Your grade, your next class, what’s due this week, the titles of what’s open on your Desk, and today’s check-in numbers. Never your notes, grades, or journal.' },
  { icon: 'arrow' as const, title: 'Where it goes', body: 'Through this app’s server to Anthropic, the company that makes Claude, which writes the reply.' },
];

// What the AI does, what it costs, and what leaves the phone, in plain words.
export default function AIScreen() {
  const st = useAIStatus();
  let n = 0;
  return (
    <Screen title="How AI works here" subtitle="What’s free, what’s sent, and what it costs.">
      <Reveal index={n++}>
        <Card tint={colors.flame} style={styles.top}>
          <Text style={styles.big}>
            {st.left} of {st.limit} AI replies left {st.plus ? 'this month' : 'this week'}
          </Text>
          <Text style={styles.body}>Only replies written by AI count, and only when one actually arrives. If it can’t answer, nothing is used.</Text>
        </Card>
      </Reveal>
      <Reveal index={n++}>
        <Section title="Free, always">
          <Card>
            <InfoList items={FREE_TOOLS} color={colors.secured} />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="What uses AI">
          <Card>
            <Text style={styles.body}>
              Talking it through with Ember after its first question, and the AI chat with any helper. Each reply is written by Claude. It can be wrong, so check facts that matter.
            </Text>
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="What gets sent">
          <Card>
            <InfoList items={SENT} color={colors.flame} />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="What it costs">
          <Card>
            <Text style={styles.body}>
              Free: {FREE_PER_WEEK} replies a week, starting over each Monday. Plus: {PLUS_PER_MONTH} a month for {PLANS.monthly.price} a month or {PLANS.yearly.price} a year. Each reply costs real money to make, which is why there’s a limit.
            </Text>
            <Button label="See Plus" icon="sparkle" variant="secondary" size="sm" onPress={() => router.push('/plus')} style={styles.btn} />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Text style={styles.foot}>Right now AI replies are still being set up, so chats will say they can’t answer yet. Everything on this page marked free works today.</Text>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: 16,
    gap: 6,
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  btn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  foot: {
    marginTop: 18,
    fontFamily: fonts.displaySoft,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
