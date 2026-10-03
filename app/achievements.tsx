import { useEffect, useState } from 'react';
import { InteractionManager, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { type Achievement, ALL_ACHIEVEMENTS, badgeGroup, type BadgeGroup, badgeProgress } from '../core/achievements';
import { useLifeStore } from '../core/lifeStore';
import { alpha, colors, fonts } from '../core/theme';

const GROUPS: { key: BadgeGroup; title: string }[] = [
  { key: 'school', title: 'School' },
  { key: 'study', title: 'Study' },
  { key: 'you', title: 'You' },
];

// Quiet badges. Nothing to lose, no streaks — just things worth noticing.
// Grouped by where they come from; the ones that count show how close you are.
export default function AchievementsScreen() {
  const got = useLifeStore((s) => s.achievements);
  const earnedCount = ALL_ACHIEVEMENTS.filter((a) => got[a.key]).length;
  const [open, setOpen] = useState<string | null>(null);

  // Every tile is laid out at once so nothing moves; the icons and bars past the first few fill in once the page settles.
  const [rest, setRest] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setRest(true));
    return () => task.cancel();
  }, []);

  let n = 0;
  return (
    <Screen title="Badges" subtitle={`${earnedCount} of ${ALL_ACHIEVEMENTS.length}. None of them expire. Tap one you’ve earned for the details.`}>
      {GROUPS.map((g) => {
        const list = ALL_ACHIEVEMENTS.filter((a) => badgeGroup(a.key) === g.key);
        // Earned first (newest first), then the closest to done.
        const earned = list.filter((a) => got[a.key]).sort((a, b) => got[b.key].localeCompare(got[a.key]));
        const waiting = list
          .filter((a) => !got[a.key])
          .map((a) => ({ a, p: badgeProgress(a.key) }))
          .sort((x, y) => (y.p ? y.p.have / y.p.need : 0) - (x.p ? x.p.have / x.p.need : 0));
        return (
          <Reveal key={g.key} index={n++}>
            <Section title={g.title} note={`${earned.length} of ${list.length}`}>
              <View style={styles.grid}>
                {earned.map((a) => (
                  <View key={a.key} style={styles.cell}>
                    <Card
                      tint={a.color}
                      style={styles.tile}
                      onPress={() => setOpen(open === a.key ? null : a.key)}
                      onLongPress={() => share(a)}
                      accessibilityLabel={`${a.title}. ${a.body} Earned ${new Date(got[a.key]).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`}
                      accessibilityHint="Tap for details, hold to share"
                    >
                      <View style={[styles.medal, { backgroundColor: alpha(a.color, 0.18), borderColor: alpha(a.color, 0.55) }]}>
                        <Icon name={a.icon} size={24} color={a.color} />
                      </View>
                      <Text style={styles.title}>{a.title}</Text>
                      <Text style={styles.body}>{a.body}</Text>
                      {open === a.key ? (
                        <>
                          <Text style={styles.date}>Earned {new Date(got[a.key]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                          <Button label="Share" icon="share" variant="secondary" size="sm" tint={a.color} onPress={() => share(a)} style={styles.share} />
                        </>
                      ) : (
                        <Text style={styles.date}>{new Date(got[a.key]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                      )}
                    </Card>
                  </View>
                ))}
                {waiting.map(({ a, p }, i) => {
                  const full = rest || i < 6;
                  return (
                  <View key={a.key} style={styles.cell}>
                    <Card style={[styles.tile, styles.locked]}>
                      <View style={[styles.medal, styles.medalLocked]}>
                        {full ? <Icon name={a.icon} size={24} color={colors.textFaint} /> : null}
                      </View>
                      <Text style={[styles.title, styles.titleLocked]}>{a.title}</Text>
                      <Text style={styles.body}>{a.body}</Text>
                      {p && p.have > 0 ? (
                        <View style={styles.progress}>
                          {full ? <ProgressBar value={p.have / p.need} color={a.color} height={4} /> : <View style={styles.barHold} />}
                          <Text style={styles.date}>
                            {p.have} of {p.need} {p.unit}
                          </Text>
                        </View>
                      ) : null}
                    </Card>
                  </View>
                  );
                })}
              </View>
            </Section>
          </Reveal>
        );
      })}
    </Screen>
  );
}

function share(a: Achievement) {
  Share.share({ message: `I earned “${a.title}” in Brain Navigator: ${a.body}` });
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  tile: {
    alignItems: 'center',
    minHeight: 168,
  },
  barHold: {
    height: 4,
  },
  locked: {
    opacity: 0.6,
  },
  medal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  medalLocked: {
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  titleLocked: {
    color: colors.textMuted,
  },
  body: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
  },
  share: {
    marginTop: 10,
  },
  progress: {
    alignSelf: 'stretch',
    marginTop: 10,
    alignItems: 'center',
    gap: 2,
  },
  date: {
    marginTop: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
    fontVariant: ['tabular-nums'],
  },
});
