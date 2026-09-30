import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { ScienceNote } from '../components/ui/ScienceNote';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { WellnessWheel } from '../components/ui/WellnessWheel';
import { colors, dimensionColor, fonts, gaugeColor, layout } from '../core/theme';
import { WELLNESS_DIMENSIONS } from '../core/wellness';
import { useWellnessWheelStore } from '../core/wellnessWheelStore';

function statusLabel(score: number | null) {
  if (score === null) return 'Not enough to say yet';
  if (score >= 70) return 'Balanced';
  if (score >= 40) return 'Building';
  return 'Needs some attention';
}

export default function WellnessScreen() {
  const { width } = useWindowDimensions();
  const scores = useWellnessWheelStore((s) => s.scores);
  const isLoading = useWellnessWheelStore((s) => s.isLoading);
  const fetchScores = useWellnessWheelStore((s) => s.fetchScores);
  const overallScore = useWellnessWheelStore((s) => s.overallScore());

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const wheelSize = Math.min(width, layout.maxWidth) - layout.gutter * 2 - 20;
  // The weakest dimension that has data is the one worth a nudge.
  const weakest = WELLNESS_DIMENSIONS.filter((d) => scores[d.key] !== null).sort(
    (a, b) => (scores[a.key] ?? 0) - (scores[b.key] ?? 0)
  )[0];

  return (
    <Screen title="The wellness wheel" subtitle={isLoading ? 'Loading…' : 'Eight parts of a life, and how they balance.'} tone="dusk" glowColor="#AFA2DE">
      <Reveal index={0}>
        <Card style={styles.hero}>
          <Ring
            progress={overallScore != null ? overallScore / 100 : null}
            value={overallScore != null ? String(overallScore) : undefined}
            label="Balance"
            color={overallScore != null ? gaugeColor(overallScore) : colors.textFaint}
            size={92}
            stroke={8}
          />
          <View style={styles.heroInfo}>
            <Text style={styles.heroStatus}>{statusLabel(overallScore)}</Text>
            <Text style={styles.heroCaption}>
              {weakest && scores[weakest.key] !== null && (scores[weakest.key] ?? 100) < 50
                ? `${weakest.label} is lowest right now. A small task or habit there would help most.`
                : 'Averaged across all eight. Tag tasks and habits to fill in the gaps.'}
            </Text>
          </View>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Card style={styles.wheelCard}>
          <WellnessWheel scores={scores} size={wheelSize} />
        </Card>
        <ScienceNote fact="The Eight Dimensions model treats wellness as more than the absence of illness or stress — it's a balance across emotional, physical, social, financial, occupational, intellectual, environmental, and spiritual life. A dip in one dimension often shows up in another, since they're linked, not separate boxes." />
      </Reveal>

      <Reveal index={2}>
        <Section title="Each part">
          <Card padded={false}>
            {WELLNESS_DIMENSIONS.map((d, i) => {
              const score = scores[d.key];
              const c = dimensionColor[d.key];
              return (
                <View key={d.key} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <Ring progress={score != null ? score / 100 : null} value={score != null ? String(score) : undefined} color={c} size={52} stroke={5} delay={i * 60} />
                  <View style={styles.rowText}>
                    <Text style={[styles.dimLabel, { color: score != null ? colors.text : colors.textMuted }]}>{d.label}</Text>
                    <Text style={styles.dimDesc}>{d.description}</Text>
                    {score === null ? (
                      <Text style={styles.noData} onPress={() => router.push('/habits')}>
                        No tagged tasks or habits yet.
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>
        </Section>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  heroInfo: {
    flex: 1,
  },
  heroStatus: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
  },
  heroCaption: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textMuted,
  },
  wheelCard: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rowText: {
    flex: 1,
  },
  dimLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  dimDesc: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textFaint,
  },
  noData: {
    marginTop: 4,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.flame,
  },
});
