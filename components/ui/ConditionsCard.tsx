import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../../core/theme';
import { useWeatherStore } from '../../core/weatherStore';
import { compassLabel, weatherCodeEmoji, weatherCodeLabel } from '../../core/weatherCodes';
import { Card } from './Card';

export function ConditionsCard() {
  const isAuthorized = useWeatherStore((s) => s.isAuthorized);
  const isLoading = useWeatherStore((s) => s.isLoading);
  const error = useWeatherStore((s) => s.error);
  const locationLabel = useWeatherStore((s) => s.locationLabel);
  const temperatureF = useWeatherStore((s) => s.temperatureF);
  const weatherCode = useWeatherStore((s) => s.weatherCode);
  const windMph = useWeatherStore((s) => s.windMph);
  const humidityPct = useWeatherStore((s) => s.humidityPct);
  const hasMarineData = useWeatherStore((s) => s.hasMarineData);
  const waveHeightFt = useWeatherStore((s) => s.waveHeightFt);
  const wavePeriodS = useWeatherStore((s) => s.wavePeriodS);
  const waveDirectionDeg = useWeatherStore((s) => s.waveDirectionDeg);
  const swellHeightFt = useWeatherStore((s) => s.swellHeightFt);
  const connect = useWeatherStore((s) => s.connect);
  const refresh = useWeatherStore((s) => s.refresh);

  if (!isAuthorized) {
    return (
      <Card style={styles.connectCard}>
        <Text style={styles.connectText}>
          Share your location for live weather and surf conditions right here on Today.
        </Text>
        <Pressable onPress={connect} style={styles.connectButton}>
          <Text style={styles.connectButtonText}>{isLoading ? 'Locating…' : 'Enable Conditions'}</Text>
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.locationText}>{locationLabel ?? 'Current location'}</Text>
        <Pressable onPress={refresh} hitSlop={8}>
          <Text style={styles.refreshText}>{isLoading ? '···' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <View style={styles.weatherRow}>
        <Text style={styles.emoji}>{weatherCode !== null ? weatherCodeEmoji(weatherCode) : '—'}</Text>
        <View style={styles.weatherInfo}>
          <Text style={styles.tempText}>
            {temperatureF !== null ? `${Math.round(temperatureF)}°` : '—'}
          </Text>
          <Text style={styles.conditionText}>
            {weatherCode !== null ? weatherCodeLabel(weatherCode) : 'No data'}
          </Text>
        </View>
        <View style={styles.miniStats}>
          <Text style={styles.miniStat}>
            Wind {windMph !== null ? `${Math.round(windMph)} mph` : '—'}
          </Text>
          <Text style={styles.miniStat}>
            Humidity {humidityPct !== null ? `${Math.round(humidityPct)}%` : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {hasMarineData ? (
        <View style={styles.surfRow}>
          <SurfStat label="Wave" value={waveHeightFt !== null ? `${waveHeightFt.toFixed(1)}ft` : '—'} />
          <SurfStat label="Period" value={wavePeriodS !== null ? `${Math.round(wavePeriodS)}s` : '—'} />
          <SurfStat
            label="Direction"
            value={waveDirectionDeg !== null ? compassLabel(waveDirectionDeg) : '—'}
          />
          <SurfStat label="Swell" value={swellHeightFt !== null ? `${swellHeightFt.toFixed(1)}ft` : '—'} />
        </View>
      ) : (
        <Text style={styles.noSurfText}>Not close enough to the coast for surf data.</Text>
      )}
    </Card>
  );
}

function SurfStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.surfStat}>
      <Text style={styles.surfValue}>{value}</Text>
      <Text style={styles.surfLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  connectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    gap: spacing.sm,
  },
  connectText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  connectButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.leather,
  },
  connectButtonText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.background,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
  },
  refreshText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.leather,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  emoji: {
    fontSize: 34,
    marginRight: spacing.sm,
  },
  weatherInfo: {
    flex: 1,
  },
  tempText: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
  },
  conditionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  miniStats: {
    alignItems: 'flex-end',
  },
  miniStat: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkFaint,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  surfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surfStat: {
    alignItems: 'center',
  },
  surfValue: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
  },
  surfLabel: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  noSurfText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.hint,
  },
});
