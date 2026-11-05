import * as Haptics from '../core/haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type GestureResponderEvent, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { StatTile } from '../components/ui/StatTile';
import { alpha, colors, fonts, layout } from '../core/theme';
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
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const lastHapticIndex = useRef<number | null>(null);

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

  const handleTouch = (e: GestureResponderEvent) => {
    if (points.length < 2) return;
    const x = e.nativeEvent.locationX;
    let closest = 0;
    let minD = Infinity;
    points.forEach((p, idx) => {
      const d = Math.abs(p.x - x);
      if (d < minD) {
        minD = d;
        closest = idx;
      }
    });
    if (lastHapticIndex.current !== closest) {
      lastHapticIndex.current = closest;
      Haptics.selectionAsync().catch(() => {});
    }
    setScrubIndex(closest);
  };

  const handleRelease = () => {
    setScrubIndex(null);
    lastHapticIndex.current = null;
  };

  const activePoint = scrubIndex != null ? points[scrubIndex] : null;
  const activeCheckin = scrubIndex != null ? data[scrubIndex] : null;

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
            <Chip
              key={m.key}
              label={m.label}
              selected={metricKey === m.key}
              color={m.color}
              dot
              onPress={() => {
                setMetricKey(m.key);
                setScrubIndex(null);
              }}
            />
          ))}
        </ChipRow>
      </Reveal>

      {data.length > 0 ? (
        <>
          <Reveal index={1}>
            <Card
              padded={false}
              style={styles.chartCard}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${metric.label} trend from ${formatShortDate(data[0].checkin_date)} to ${formatShortDate(data[data.length - 1].checkin_date)}${stats ? `: average ${stats.avg.toFixed(1)}${metric.unit}, latest ${stats.latest}${metric.unit}` : ''}`}
            >
              <View
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleTouch}
                onResponderMove={handleTouch}
                onResponderRelease={handleRelease}
                onResponderTerminate={handleRelease}
              >
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
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
                  {activePoint ? (
                    <Line
                      x1={activePoint.x}
                      x2={activePoint.x}
                      y1={PAD_Y}
                      y2={CHART_HEIGHT - PAD_Y}
                      stroke={metric.color}
                      strokeWidth={1.5}
                      strokeDasharray="2 3"
                      opacity={0.8}
                    />
                  ) : null}
                  {points.map((p, i) => {
                    const isSelected = scrubIndex === i;
                    const last = i === points.length - 1 && scrubIndex == null;
                    const r = isSelected ? 7 : last ? 6 : 3;
                    return (
                      <Circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={r}
                        fill={isSelected ? metric.color : last ? metric.color : colors.surface}
                        stroke={isSelected ? colors.text : last ? colors.night : metric.color}
                        strokeWidth={isSelected ? 2.5 : last ? 3 : 1.5}
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
              </View>

              {activeCheckin && activePoint ? (
                <View style={styles.scrubPill}>
                  <View style={styles.scrubHeader}>
                    <Text style={styles.scrubDate}>{formatShortDate(activeCheckin.checkin_date)}</Text>
                    <Text style={[styles.scrubValue, { color: metric.color }]}>
                      {activePoint.value}
                      {metric.unit}
                    </Text>
                  </View>
                  {activeCheckin.notes ? (
                    <Text style={styles.scrubNote} numberOfLines={2}>
                      “{activeCheckin.notes}”
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>{formatShortDate(data[0].checkin_date)}</Text>
                  <Text style={styles.dragHint}>Drag to inspect any day</Text>
                  <Text style={styles.dateLabel}>{formatShortDate(data[data.length - 1].checkin_date)}</Text>
                </View>
              )}
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
  dragHint: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },
  scrubPill: {
    marginTop: 8,
    paddingHorizontal: PAD_X,
    paddingVertical: 6,
    backgroundColor: alpha(colors.surfaceHigh, 0.7),
    borderRadius: 10,
    marginHorizontal: PAD_X,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  scrubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrubDate: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.text,
  },
  scrubValue: {
    fontFamily: fonts.display,
    fontSize: 16,
  },
  scrubNote: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
});
