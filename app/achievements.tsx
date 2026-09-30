import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { ALL_ACHIEVEMENTS } from '../core/achievements';
import { useLifeStore } from '../core/lifeStore';
import { alpha, colors, fonts } from '../core/theme';

// Quiet badges. Nothing to lose, no streaks — just things worth noticing.
export default function AchievementsScreen() {
  const got = useLifeStore((s) => s.achievements);
  const earned = ALL_ACHIEVEMENTS.filter((a) => got[a.key]).sort((a, b) => got[b.key].localeCompare(got[a.key]));
  const waiting = ALL_ACHIEVEMENTS.filter((a) => !got[a.key]);

  let n = 0;
  return (
    <Screen title="Badges" subtitle={`${earned.length} of ${ALL_ACHIEVEMENTS.length}. None of them expire.`}>
      <View style={styles.grid}>
        {earned.map((a) => (
          <Reveal key={a.key} index={n++} style={styles.cell}>
            <Card tint={a.color} style={styles.tile}>
              <View style={[styles.medal, { backgroundColor: alpha(a.color, 0.18), borderColor: alpha(a.color, 0.55) }]}>
                <Icon name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={styles.title}>{a.title}</Text>
              <Text style={styles.body}>{a.body}</Text>
              <Text style={styles.date}>{new Date(got[a.key]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </Card>
          </Reveal>
        ))}
        {waiting.map((a) => (
          <Reveal key={a.key} index={n++} style={styles.cell}>
            <Card style={[styles.tile, styles.locked]}>
              <View style={[styles.medal, styles.medalLocked]}>
                <Icon name={a.icon} size={24} color={colors.textFaint} />
              </View>
              <Text style={[styles.title, styles.titleLocked]}>{a.title}</Text>
              <Text style={styles.body}>{a.body}</Text>
            </Card>
          </Reveal>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: 16,
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
  locked: {
    opacity: 0.55,
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
  date: {
    marginTop: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
  },
});
