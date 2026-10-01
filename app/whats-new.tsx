import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { colors, fonts } from '../core/theme';

// Every update, newest first, with a way to jump to what changed.
const RELEASES: { title: string; when: string; lines: string[]; links: { label: string; href: string }[] }[] = [
  {
    title: 'Study crew, Plus, and a lot of polish',
    when: 'Fall 2026',
    lines: [
      'Ember’s crew: five helpers with free games, plans, and an AI chat.',
      'Scan many screenshots at once; type homework the way you’d say it on the Desk.',
      'Flashcards you type, study back to front, or make from a note.',
      'Focus month map, the time of day you focus best, and Pomodoro rounds.',
      'Supplement essays, application fees, hours you can share, countdown icons.',
      'Badges that show how close you are, a month-by-month year, and big celebrations.',
    ],
    links: [
      { label: 'Helpers', href: '/helpers' },
      { label: 'Flashcards', href: '/flashcards' },
      { label: 'Focus', href: '/focus' },
      { label: 'Badges', href: '/achievements' },
    ],
  },
  {
    title: 'The high school hub',
    when: 'Fall 2026',
    lines: [
      'School, classes, grades and GPA, your week, and screenshot import.',
      'Notebook, college list, scholarships, rec letters, activities, and financial aid.',
      'Sleep plan, wins jar, toolkit, worry box, Your people, hours, and countdowns.',
    ],
    links: [
      { label: 'School', href: '/school' },
      { label: 'Notebook', href: '/notes' },
      { label: 'College', href: '/college' },
    ],
  },
  {
    title: 'Ember and the Desk',
    when: 'Fall 2026',
    lines: ['Ember the flame lives on every screen. Set things down as candles and watch them close.'],
    links: [{ label: 'Steady', href: '/steady' }],
  },
];

export default function WhatsNewScreen() {
  return (
    <Screen title="What’s new" subtitle="Every update, newest first.">
      {RELEASES.map((r, i) => (
        <Reveal key={r.title} index={i}>
          <Card tint={i === 0 ? colors.flame : undefined} style={styles.card}>
            <Text style={styles.when}>{r.when}</Text>
            <Text style={styles.title}>{r.title}</Text>
            <View style={styles.lines}>
              {r.lines.map((l) => (
                <Text key={l} style={styles.line}>
                  • {l}
                </Text>
              ))}
            </View>
            <ChipRow style={styles.links}>
              {r.links.map((l) => (
                <Chip key={l.href} label={l.label} icon="arrow" onPress={() => router.push(l.href as never)} />
              ))}
            </ChipRow>
          </Card>
        </Reveal>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
  },
  when: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
  title: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
  },
  lines: {
    marginTop: 10,
    gap: 6,
  },
  line: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  links: {
    marginTop: 12,
  },
});
