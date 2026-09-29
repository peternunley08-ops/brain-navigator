import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, fonts, radii, spacing } from '../core/theme';
import { useAdaptiveGradient } from '../core/adaptiveLight';
import { useWellnessStore } from '../core/wellnessStore';

type MetricKey = 'mood' | 'sleep_hours' | 'sleep_quality' | 'stress_level';

interface Metric {
  key: MetricKey;
  label: string;
  color: string;
  min: number;
  max: number;
}

const METRICS: Metric[] = [
  { key: 'mood', label: 'Mood', color: colors.secured, min: 1, max: 5 },
  { key: 'sleep_hours', label: 'Sleep', color: colors.leather, min: 0, max: 12 },
  { key: 'sleep_quality', label: 'Quality', color: colors.leatherDark, min: 1, max: 5 },
  { key: 'stress_level', label: 'Stress', color: colors.unlocked, min: 1, max: 10 },
];

const CHART_WIDTH = 320;
const CHART_HEIGHT = 140;
const PAD_X = 14;
const PAD_Y = 16;
const DAYS_SHOWN = 14;

function formatShortDate(dateStr: string) {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export default function TrendsScreen() {
  const { gradient } = useAdaptiveGradient();
  const checkins = useWellnessStore((s) => s.checkins);
  const fetchCheckins = useWellnessStore((s) => s.fetchCheckins);
  const isLoadingCheckins = useWellnessStore((s) => s.isLoadingCheckins);
  const [metricKey, setMetricKey] = useState<MetricKey>('mood');

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const metric = METRICS.find((m) => m.key === metricKey)!;

  const data = useMemo(() => {
    return [...checkins]
      .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
      .filter((c) => c[metricKey] != null)
      .slice(-DAYS_SHOWN);
  }, [checkins, metricKey]);

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const innerWidth = CHART_WIDTH - PAD_X * 2;
    const innerHeight = CHART_HEIGHT - PAD_Y * 2;
    return data.map((c, i) => {
      const value = c[metricKey] as number;
      const x =
        data.length === 1 ? PAD_X + innerWidth / 2 : PAD_X + (i / (data.length - 1)) * innerWidth;
      const clamped = Math.max(metric.min, Math.min(metric.max, value));
      const ratio = (clamped - metric.min) / (metric.max - metric.min || 1);
      const y = PAD_Y + innerHeight - ratio * innerHeight;
      return { x, y, value };
    });
  }, [data, metricKey, metric]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const values = data.map((c) => c[metricKey] as number);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];
    const delta = latest - values[0];
    return { avg, latest, delta };
  }, [data, metricKey]);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.outer}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

          <Text style={styles.title}>Trends</Text>
          <Text style={styles.subtitle}>
            {checkins.length === 0
              ? isLoadingCheckins
                ? 'Loading…'
                : 'No check-ins yet'
              : `Last ${data.length} of ${checkins.length} check-ins`}
          </Text>

          <View style={styles.metricRow}>
            {METRICS.map((m) => {
              const active = metricKey === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMetricKey(m.key)}
                  style={[
                    styles.metricChip,
                    active && { backgroundColor: m.color, borderColor: m.color },
                  ]}
                >
                  <Text style={[styles.metricChipText, active && styles.metricChipTextActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {data.length > 0 ? (
            <Card style={styles.chartCard}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Line
                  x1={PAD_X}
                  y1={CHART_HEIGHT - PAD_Y}
                  x2={CHART_WIDTH - PAD_X}
                  y2={CHART_HEIGHT - PAD_Y}
                  stroke={colors.divider}
                  strokeWidth={1}
                />
                <Line
                  x1={PAD_X}
                  y1={PAD_Y}
                  x2={CHART_WIDTH - PAD_X}
                  y2={PAD_Y}
                  stroke={colors.divider}
                  strokeWidth={1}
                  strokeDasharray="2,4"
                />

                {points.length > 1 && (
                  <Polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={metric.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}

                {points.map((p, i) => (
                  <Circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={i === points.length - 1 ? 5 : 3.5}
                    fill={metric.color}
                    stroke={colors.background}
                    strokeWidth={i === points.length - 1 ? 2 : 0}
                  />
                ))}

                <SvgText x={PAD_X} y={PAD_Y - 4} fontSize={9} fontFamily={fonts.mono} fill={colors.hint}>
                  {metric.max}
                </SvgText>
                <SvgText
                  x={PAD_X}
                  y={CHART_HEIGHT - PAD_Y + 12}
                  fontSize={9}
                  fontFamily={fonts.mono}
                  fill={colors.hint}
                >
                  {metric.min}
                </SvgText>
              </Svg>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{formatShortDate(data[0].checkin_date)}</Text>
                <Text style={styles.dateLabel}>
                  {formatShortDate(data[data.length - 1].checkin_date)}
                </Text>
              </View>

              {stats ? (
                <View style={styles.statsRow}>
                  <StatCard label="Average" value={stats.avg.toFixed(1)} />
                  <StatCard label="Latest" value={String(stats.latest)} />
                  <StatCard
                    label="Change"
                    value={`${stats.delta > 0 ? '+' : ''}${stats.delta.toFixed(1)}`}
                  />
                </View>
              ) : null}
            </Card>
          ) : (
            <Text style={styles.hint}>
              {checkins.length === 0
                ? 'Check in from the Desk to start building a trend.'
                : 'No data logged for this metric yet.'}
            </Text>
          )}
        </ScrollView>

        <BottomNav />
      </LinearGradient>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    alignSelf: 'flex-start',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
  metricChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.backgroundAlt,
  },
  metricChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  metricChipTextActive: {
    color: colors.background,
  },
  chartCard: {
    marginTop: spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_WIDTH - PAD_X * 2,
    marginTop: spacing.xs,
  },
  dateLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkFaint,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  statValue: {
    marginTop: spacing.xs,
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  hint: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.hint,
  },
});
