import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, fonts, spacing } from '../../core/theme';
import { useSleepAmbientStore } from '../../core/sleepAmbientStore';
import { AmbientMicMeter } from './AmbientMicMeter';
import { Card } from './Card';

interface SleepQualityCardProps {
  qualityPct: number | null;
  deepMinutes: number | null;
  remMinutes: number | null;
  lightMinutes: number | null;
}

const CAPSULE_HEIGHT = 72;
const CAPSULE_WIDTH = 26;

const SEGMENTS: { key: 'deep' | 'rem' | 'light'; label: string; color: string }[] = [
  { key: 'deep', label: 'Deep', color: colors.secured },
  { key: 'rem', label: 'REM', color: colors.leather },
  { key: 'light', label: 'Light', color: colors.lantern },
];

export function SleepQualityCard({ qualityPct, deepMinutes, remMinutes, lightMinutes }: SleepQualityCardProps) {
  const history = useSleepAmbientStore((s) => s.history);
  const fetchHistory = useSleepAmbientStore((s) => s.fetchHistory);
  const saveCheck = useSleepAmbientStore((s) => s.saveCheck);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const values = { deep: deepMinutes ?? 0, rem: remMinutes ?? 0, light: lightMinutes ?? 0 };
  const total = values.deep + values.rem + values.light;
  const hasData = total > 0;

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>Sleep Quality</Text>
      <Text style={styles.score}>{qualityPct !== null ? `${qualityPct}%` : '—'}</Text>

      <View style={styles.capsuleRow}>
        {SEGMENTS.map((seg) => {
          const minutes = values[seg.key];
          const ratio = hasData ? minutes / total : 0;
          const filledHeight = hasData ? Math.max(6, ratio * CAPSULE_HEIGHT) : 6;
          return (
            <View key={seg.key} style={styles.capsuleColumn}>
              <Svg width={CAPSULE_WIDTH} height={CAPSULE_HEIGHT}>
                <Rect
                  x={0}
                  y={0}
                  width={CAPSULE_WIDTH}
                  height={CAPSULE_HEIGHT}
                  rx={CAPSULE_WIDTH / 2}
                  fill={colors.background}
                />
                <Rect
                  x={0}
                  y={CAPSULE_HEIGHT - filledHeight}
                  width={CAPSULE_WIDTH}
                  height={filledHeight}
                  rx={CAPSULE_WIDTH / 2}
                  fill={hasData ? seg.color : colors.divider}
                />
              </Svg>
              <Text style={styles.capsuleLabel}>{seg.label}</Text>
              <Text style={styles.capsuleValue}>{hasData ? `${minutes}m` : '—'}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Ambient check</Text>
      <AmbientMicMeter
        onComplete={({ peakLevel, averageLevel, durationSeconds }) =>
          saveCheck({
            sleepScore: qualityPct,
            peakLevel: Math.round(peakLevel * 100) / 100,
            averageLevel: Math.round(averageLevel * 100) / 100,
            durationSeconds,
          })
        }
      />

      {history.length > 0 ? (
        <View style={styles.historyList}>
          {history.slice(0, 3).map((h) => (
            <Text key={h.id} style={styles.historyRow}>
              {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · peak{' '}
              {Math.round(h.peak_level * 100)}%
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  score: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
  },
  capsuleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  capsuleColumn: {
    alignItems: 'center',
  },
  capsuleLabel: {
    marginTop: spacing.xs,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  capsuleValue: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
  historyList: {
    marginTop: spacing.sm,
    gap: 2,
  },
  historyRow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkFaint,
  },
});
