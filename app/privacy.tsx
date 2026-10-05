import { StyleSheet, Text } from 'react-native';
import { InfoList } from '../components/InfoList';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { colors, fonts } from '../core/theme';

const PHONE = [
  { icon: 'book' as const, title: 'School', body: 'Classes, homework, grades, focus sessions, and your sleep and homework goals.' },
  { icon: 'pen' as const, title: 'Notes and college', body: 'Your Notebook, colleges, essays, scholarships, rec letters, activities, and financial aid.' },
  { icon: 'heart' as const, title: 'You', body: 'Wins, gratitude, hours, countdowns, Your people (names and numbers), the worry box, flashcards, helper chats, badges, and settings.' },
  { icon: 'mic' as const, title: 'Your voice', body: 'Speech to text runs on the phone. The recording never leaves it.' },
  { icon: 'image' as const, title: 'Screenshots you scan', body: 'Read on the phone and thrown away. Nothing is uploaded.' },
];

const ONLINE = [
  { icon: 'sun' as const, title: 'Check-ins', body: 'Mood, sleep, stress, and the note you add.' },
  { icon: 'candle' as const, title: 'Your Desk', body: 'What you set down, how heavy it felt, and how it closed. The Map is built from these.' },
  { icon: 'feather' as const, title: 'Let it out and Talk it through', body: 'What you wrote or said there, once you save it.' },
  { icon: 'list' as const, title: 'Tasks, habits, and food', body: 'Your plate, habit check-offs, and meals if you log them.' },
];

const SENT = [
  { icon: 'chat' as const, title: 'Anthropic (Claude)', body: 'Only when you use an AI chat: your messages and a short note about your day. See How AI works.' },
  { icon: 'calendar' as const, title: 'Google', body: 'Only if you connect Google Calendar, to read and add events.' },
  { icon: 'cap' as const, title: 'Canvas', body: 'Only if you add a Canvas key, to read your to-do list. The key stays in this phone’s keychain and is left out of backups.' },
];

// Where everything lives, said plainly, including the parts that aren't locked yet.
export default function PrivacyScreen() {
  let n = 0;
  return (
    <Screen title="Where your stuff lives" subtitle="On this phone, online, or sent somewhere, and what that means.">
      <Reveal index={n++}>
        <Section title="Only on this phone">
          <Card>
            <InfoList items={PHONE} color={colors.secured} />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="Online, in the app’s database">
          <Card>
            <InfoList items={ONLINE} color={colors.flame} />
            <Text style={styles.warn}>
              This is still a one-person version of the app, so the online part doesn’t have a login yet. Treat it like a notebook someone else could open: don’t put anything there you’d be upset for another person to read. Real accounts come before anyone else uses it.
            </Text>
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="Sent to other services">
          <Card>
            <InfoList items={SENT} color="#8FB4E8" />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Text style={styles.foot}>A backup from Settings holds everything on this phone. Erasing in Settings clears this phone; your online check-ins and entries stay.</Text>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warn: {
    marginTop: 16,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.unlocked,
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
