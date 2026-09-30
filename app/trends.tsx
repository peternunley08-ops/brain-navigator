import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { StatTile } from '../components/ui/StatTile';
import { colors, fonts, layout } from '../core/theme';
import { useWellnessStore } from '../core/wellnessStore';

type MetricKey = 'mood' | 'sleep_hours' | 'sleep_quality' | 'stress_level';

interface Metric {
  key: MetricKey;
  label: string;
  color: string;
  min: number;
  max: number;
  unit: string;
  /** Whether a rising line is good news. */
  upIsGood: boolean;
}

const METRICS: Metric[] = [
  { key: 'mood', label: 'Mood', color: colors.secured, min: 1, max: 5, unit: '/5', upIsGood: true },
  { key: 'sleep_hours', label: 'Sleep', color: '#8FB4E8', min: 0, max: 12, unit: 'h', upIsGood: true },
  { key: 'sleep_quality', label: 'Sleep quality', color: '#AFA2DE', min: 1, max: 5, unit: '/5', upIsGood: true },
  { key: 'stress_level', label: 'Stress', color: colors.unlocked, min: 1, max: 10, unit: '/10', upIsGood: false },
];

const CHART_HEIGHT = 170;
const PAD_X = 14;
const PAD_Y = 18;
const DAYS_SHOWN = 14;

function formatShortDate(dateStr: string) {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

// A smooth path through the points (Catmull-Rom → cubic Bézier).
function smooth(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export default function TrendsScreen() {
  const { width } = useWindowDimensions();
  const checkins = useWellnessStore((s) => s.checkins);
  const fetchCheckins = useWellnessStore((s) => s.fetchCheckins);
  const isLoadingCheckins = useWellnessStore((s) => s.isLoadingCheckins);
  const [metricKey, setMetricKey] = useState<MetricKey>('mood');

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const metric = METRICS.find((m) => m.key === metricKey)!;
  const CHART_WIDTH = Math.min(width, layout.maxWidth) - layout.gutter * 2 - 2;

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
      const x = data.length === 1 ? PAD_X + innerWidth / 2 : PAD_X + (i / (data.length - 1)) * innerWidth;
      const clamped = Math.max(metric.min, Math.min(metric.max, value));
      const ratio = (clamped - metric.min) / (metric.max - metric.min || 1);
      const y = PAD_Y + innerHeight - ratio * innerHeight;
      return { x, y, value };
    });
  }, [data, metricKey, metric, CHART_WIDTH]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const values = data.map((c) => c[metricKey] as number);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];
    const delta = latest - values[0];
    return { avg, latest, delta };
  }, [data, metricKey]);

  const line = smooth(points);
  const area =
    points.length > 1 ? `${line} L${points[points.length - 1].x},${CHART_HEIGHT - PAD_Y} L${points[0].x},${CHART_HEIGHT - PAD_Y} Z` : '';
  const deltaGood = stats ? (metric.upIsGood ? stats.delta >= 0 : stats.delta <= 0) : true;

  return (
    <Screen
      title="Trends"
      subtitle={
        checkins.length === 0
          ? isLoadingCheckins
            ? 'Loading…'
            : 'No check-ins yet.'
          : `Your last ${data.length} of ${checkins.length} check-ins.`
      }
    >
      <Reveal index={0}>
        <ChipRow style={styles.chips}>
          {METRICS.map((m) => (
            <Chip key={m.key} label={m.label} selected={metricKey === m.key} color={m.color} dot onPress={() => setMetricKey(m.key)} />
          ))}
        </ChipRow>
      </Reveal>

      {data.length > 0 ? (
        <>
          <Reveal index={1}>
            <Card padded={false} style={styles.chartCard}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                  <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={metric.color} stopOpacity={0.32} />
                    <Stop offset="1" stopColor={metric.color} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                {[0, 0.5, 1].map((f) => (
                  <Line
                    key={f}
                    x1={PAD_X}
                    x2={CHART_WIDTH - PAD_X}
                    y1={PAD_Y + f * (CHART_HEIGHT - PAD_Y * 2)}
                    y2={PAD_Y + f * (CHART_HEIGHT - PAD_Y * 2)}
                    stroke={colors.line}
                    strokeWidth={1}
                    strokeDasharray={f === 1 ? undefined : '3 5'}
                  />
                ))}
                {area ? <Path d={area} fill="url(#trendFill)" /> : null}
                {line ? <Path d={line} stroke={metric.color} strokeOpacity={0.35} strokeWidth={7} fill="none" strokeLinecap="round" /> : null}
                {line ? <Path d={line} stroke={metric.color} strokeWidth={2.5} fill="none" strokeLinecap="round" /> : null}
                {points.map((p, i) => {
                  const last = i === points.length - 1;
                  return (
                    <Circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={last ? 6 : 3}
                      fill={last ? metric.color : colors.surface}
                      stroke={last ? colors.night : metric.color}
                      strokeWidth={last ? 3 : 1.5}
                    />
                  );
                })}
                <SvgText x={PAD_X} y={PAD_Y - 6} fontSize={10} fontFamily={fonts.bodyMedium} fill={colors.textFaint}>
                  {metric.max}
                </SvgText>
                <SvgText x={PAD_X} y={CHART_HEIGHT - 4} fontSize={10} fontFamily={fonts.bodyMedium} fill={colors.textFaint}>
                  {metric.min}
                </SvgText>
              </Svg>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{formatShortDate(data[0].checkin_date)}</Text>
                <Text style={styles.dateLabel}>{formatShortDate(data[data.length - 1].checkin_date)}</Text>
              </View>
            </Card>
          </Reveal>

          {stats ? (
            <Reveal index={2} style={styles.statsRow}>
              <StatTile label="Average" value={stats.avg.toFixed(1)} unit={metric.unit} />
              <StatTile label="Latest" value={String(stats.latest)} unit={metric.unit} color={metric.color} />
              <StatTile
                label="Change"
                value={`${stats.delta > 0 ? '+' : ''}${stats.delta.toFixed(1)}`}
                color={stats.delta === 0 ? colors.text : deltaGood ? colors.secured : colors.unlocked}
              />
            </Reveal>
          ) : null}
        </>
      ) : (
        <EmptyState
          title={checkins.length === 0 ? 'No lines to draw yet.' : 'Nothing logged for this one yet.'}
          body={checkins.length === 0 ? 'Check in a few days in a row and your trends appear here.' : undefined}
        >
          {checkins.length === 0 ? <Button label="Check in now" icon="sun" onPress={() => router.push('/checkin')} /> : null}
        </EmptyState>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    marginTop: 16,
  },
  chartCard: {
    marginTop: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PAD_X,
    marginTop: 2,
  },
  dateLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
});
