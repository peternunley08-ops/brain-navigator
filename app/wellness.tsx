import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RadialGauge } from '../components/ui/RadialGauge';
import { ScienceNote } from '../components/ui/ScienceNote';
import { WellnessWheel } from '../components/ui/WellnessWheel';
import { colors, fonts, gaugeColor, spacing } from '../core/theme';
import { useAdaptiveGradient } from '../core/adaptiveLight';
import { WELLNESS_DIMENSIONS } from '../core/wellness';
import { useWellnessWheelStore } from '../core/wellnessWheelStore';

function statusLabel(score: number | null) {
  if (score === null) return 'Not enough data yet';
  if (score >= 70) return 'Balanced';
  if (score >= 40) return 'Building';
  return 'Needs attention';
}

export default function WellnessScreen() {
  const { gradient } = useAdaptiveGradient();
  const scores = useWellnessWheelStore((s) => s.scores);
  const isLoading = useWellnessWheelStore((s) => s.isLoading);
  const fetchScores = useWellnessWheelStore((s) => s.fetchScores);
  const overallScore = useWellnessWheelStore((s) => s.overallScore());

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  return (
    <View style={styles.outer}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

          <Text style={styles.title}>The Wellness Wheel</Text>
          <Text style={styles.subtitle}>{isLoading ? 'Loading…' : 'Eight dimensions, one balance'}</Text>

          <Card style={styles.heroCard}>
            <RadialGauge
              size={104}
              strokeWidth={10}
              value={overallScore ?? 0}
              label={overallScore !== null ? `${overallScore}` : '—'}
              caption="Balance"
              color={overallScore !== null ? gaugeColor(overallScore) : colors.divider}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.heroStatus}>{statusLabel(overallScore)}</Text>
              <Text style={styles.heroCaption}>
                Averaged across all eight dimensions below — tap Tasks or Habits to fill in the gaps.
              </Text>
            </View>
          </Card>

          <ScienceNote fact="The Eight Dimensions model treats wellness as more than the absence of illness or stress — it's a balance across emotional, physical, social, financial, occupational, intellectual, environmental, and spiritual life. A dip in one dimension often shows up in another, since they're linked, not separate boxes." />

          <Card style={styles.wheelCard}>
            <WellnessWheel scores={scores} size={280} />
          </Card>

          <View style={styles.list}>
            {WELLNESS_DIMENSIONS.map((d) => {
              const score = scores[d.key];
              return (
                <Card key={d.key} style={styles.dimensionCard}>
                  <RadialGauge
                    size={64}
                    strokeWidth={6}
                    value={score ?? 0}
                    label={score !== null ? `${score}` : '—'}
                    color={score !== null ? gaugeColor(score) : colors.divider}
                  />
                  <View style={styles.dimensionInfo}>
                    <Text style={styles.dimensionLabel}>{d.label}</Text>
                    <Text style={styles.dimensionDescription}>{d.description}</Text>
                    {score === null ? (
                      <Text style={styles.noDataText}>
                        No tagged tasks or habits yet — add one from Tasks or Habits.
                      </Text>
                    ) : null}
                  </View>
                </Card>
              );
            })}
          </View>
        </ScrollView>

        <BottomNav />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  gradient: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 100,
    alignItems: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    alignSelf: 'flex-start',
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    alignSelf: 'flex-start',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  heroInfo: {
    flex: 1,
  },
  heroStatus: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.ink,
  },
  heroCaption: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  wheelCard: {
    marginTop: spacing.lg,
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  list: {
    marginTop: spacing.xl,
    width: '100%',
    gap: spacing.sm,
  },
  dimensionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dimensionInfo: {
    flex: 1,
  },
  dimensionLabel: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
  },
  dimensionDescription: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  noDataText: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.hint,
  },
});
