import { StyleSheet, Text, View } from 'react-native';
import { EmberGlyph } from '../components/ember/EmberSprite';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { StatTile } from '../components/ui/StatTile';
import { daysShowedUp } from '../core/achievements';
import { useHubStore } from '../core/hubStore';
import { hoursTotal, useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { colors, fonts } from '../core/theme';

// Everything you've done, added up. Counts, never streaks.
export default function YearScreen() {
  const assignments = useSchoolStore((s) => s.assignments);
  const focus = useSchoolStore((s) => s.focus);
  const grades = useSchoolStore((s) => s.grades);
  const notes = useHubStore((s) => s.notes);
  const colleges = useHubStore((s) => s.colleges);
  const life = useLifeStore();

  const done = assignments.filter((a) => a.done).length;
  const focusHours = Math.round((focus.reduce((s, f) => s + f.minutes, 0) / 60) * 10) / 10;
  const cards = life.decks.reduce((s, d) => s + d.cards.reduce((t, c) => t + c.seen, 0), 0);
  const gratitudeDays = Object.values(life.gratitude).filter((v) => v.some((x) => x.trim())).length;
  const showed = daysShowedUp();
  const service = Math.round(hoursTotal(life.hours, 'service') * 10) / 10;
  const driving = Math.round(hoursTotal(life.hours, 'driving') * 10) / 10;
  const badges = Object.keys(life.achievements).length;

  const line =
    showed === 0
      ? 'It all starts with one day. This page fills in as you go.'
      : `You showed up on ${showed} day${showed === 1 ? '' : 's'}. That’s the whole secret.`;

  let n = 0;
  return (
    <Screen title="Your year" subtitle="Everything you’ve done, added up.">
      <Reveal index={n++}>
        <Card tint={colors.flame} style={styles.hero}>
          <EmberGlyph size={44} />
          <Text style={styles.heroText}>{line}</Text>
        </Card>
      </Reveal>

      <Reveal index={n++}>
        <Section title="School">
          <View style={styles.row}>
            <StatTile label="Finished" value={String(done)} color={colors.secured} />
            <StatTile label="Focus" value={String(focusHours)} unit="h" color={colors.flame} />
            <StatTile label="Grades logged" value={String(grades.length)} />
          </View>
          <View style={[styles.row, styles.gap]}>
            <StatTile label="Cards flipped" value={String(cards)} color="#E89AB8" />
            <StatTile label="Notes" value={String(notes.length)} />
            <StatTile label="Colleges" value={String(colleges.length)} color="#8FB4E8" />
          </View>
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="You">
          <View style={styles.row}>
            <StatTile label="Wins" value={String(life.wins.length)} color="#E6C46A" />
            <StatTile label="Grateful days" value={String(gratitudeDays)} color="#F08A8A" />
            <StatTile label="Badges" value={String(badges)} color={colors.flame} />
          </View>
          <View style={[styles.row, styles.gap]}>
            <StatTile label="Service" value={String(service)} unit="h" color="#9FD08A" />
            <StatTile label="Driving" value={String(driving)} unit="h" color="#8FB4E8" />
            <StatTile label="Reviews" value={String(life.reviews.length)} />
          </View>
        </Section>
      </Reveal>

      {life.wins.length ? (
        <Reveal index={n++}>
          <Section title="Latest wins">
            <Card>
              {life.wins.slice(0, 5).map((w) => (
                <Text key={w.id} style={styles.win}>
                  · {w.text}
                </Text>
              ))}
            </Card>
          </Section>
        </Reveal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroText: {
    flex: 1,
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  gap: {
    marginTop: 10,
  },
  win: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
  },
});
