import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Divider } from '../components/ui/Divider';
import { WellnessWheel } from '../components/ui/WellnessWheel';
import { useBrainNavigatorStore } from '../core/store';
import { colors, fonts, gradients, radii, spacing, stateColor } from '../core/theme';
import { useWellnessWheelStore } from '../core/wellnessWheelStore';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function LanternDesk() {
  const scrollRef = useRef<ScrollView>(null);
  const breath = useRef(new Animated.Value(0.35)).current;
  const [ambienceMuted, setAmbienceMuted] = useState(true);

  const history = useBrainNavigatorStore((s) => s.history);
  const isLoadingHistory = useBrainNavigatorStore((s) => s.isLoadingHistory);
  const error = useBrainNavigatorStore((s) => s.error);
  const fetchHistory = useBrainNavigatorStore((s) => s.fetchHistory);
  const resetDraft = useBrainNavigatorStore((s) => s.resetDraft);

  const wellnessScores = useWellnessWheelStore((s) => s.scores);
  const fetchWellnessScores = useWellnessWheelStore((s) => s.fetchScores);

  useEffect(() => {
    fetchHistory();
    fetchWellnessScores();
  }, [fetchHistory, fetchWellnessScores]);

  useEffect(() => {
    // contentOffset isn't reliably honored on web; scroll explicitly once mounted.
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: SCREEN_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 0.9,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0.35,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const returnToPresent = () => {
    resetDraft();
    scrollRef.current?.scrollTo({ y: SCREEN_HEIGHT, animated: true });
  };

  const stateCounts = useMemo(() => {
    const counts = { secured: 0, shelved: 0, unlocked: 0 };
    for (const entry of history) {
      counts[entry.state] += 1;
    }
    return counts;
  }, [history]);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        contentOffset={{ x: 0, y: SCREEN_HEIGHT }}
        showsVerticalScrollIndicator={false}
      >
        {/* PAST: Root Map */}
        <LinearGradient colors={gradients.quiet} style={styles.section}>
          <Text style={styles.sectionTitle}>Root Map</Text>
          {isLoadingHistory ? (
            <Text style={styles.hint}>Loading…</Text>
          ) : history.length === 0 ? (
            <Text style={styles.hint}>Nothing logged yet</Text>
          ) : (
            <Card style={styles.historyCard}>
              {history.slice(0, 6).map((entry, i) => (
                <View key={entry.id}>
                  <Pressable
                    style={styles.historyRow}
                    onPress={() => router.push(`/entry/${entry.id}`)}
                  >
                    <View
                      style={[styles.stateDot, { backgroundColor: stateColor(entry.state) }]}
                    />
                    <Text style={[styles.historyState, { color: stateColor(entry.state) }]}>
                      {entry.state}
                    </Text>
                    <Text style={styles.historyMood} numberOfLines={1}>
                      {entry.mood || '—'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </Text>
                  </Pressable>
                  {i < history.slice(0, 6).length - 1 ? <Divider /> : null}
                </View>
              ))}
            </Card>
          )}
        </LinearGradient>

        {/* PRESENT: Lantern Desk */}
        <LinearGradient colors={gradients.dawn} style={styles.section}>
          <View style={styles.lanternGlow} />
          <Text style={styles.title}>The Lantern Desk</Text>
          <Text style={styles.subtitle}>Brain Navigator</Text>
          <Text style={styles.status}>Entries logged: {history.length}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </LinearGradient>

        {/* FUTURE: Sanctuary */}
        <LinearGradient colors={gradients.dusk} style={styles.section}>
          <Animated.View style={[styles.sanctuaryGlow, { opacity: breath }]} />
          <Text style={styles.sectionTitle}>Sanctuary</Text>

          {history.length === 0 ? (
            <Text style={styles.hint}>Nothing to reflect on yet</Text>
          ) : (
            <View style={styles.statRow}>
              <StatCard label="Secured" count={stateCounts.secured} color={colors.secured} />
              <StatCard label="Shelved" count={stateCounts.shelved} color={colors.shelved} />
              <StatCard label="Unlocked" count={stateCounts.unlocked} color={colors.unlocked} />
            </View>
          )}

          <Pressable onPress={() => router.push('/wellness')} style={styles.wheelPressable}>
            <WellnessWheel scores={wellnessScores} size={180} showLabels={false} />
            <Text style={styles.wheelHint}>Tap the wheel to open it</Text>
          </Pressable>

          <View style={styles.sanctuaryButtonRow}>
            <Button
              label={ambienceMuted ? 'Ambience Muted' : 'Ambience On'}
              variant="pill"
              // No ambient audio loop is wired up yet — this only toggles visual
              // state. A real implementation would start/stop an expo-av Sound
              // loop here.
              onPress={() => setAmbienceMuted((m) => !m)}
            />
            <Button
              label="The Science"
              variant="pill"
              onPress={() => router.push('/science')}
            />
          </View>
        </LinearGradient>
      </ScrollView>

      <Button
        label="Exit"
        variant="pill"
        onPress={returnToPresent}
        accessibilityLabel="Return to present"
        style={styles.circuitBreaker}
      />

      <BottomNav />
    </View>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={statCardStyles.card}>
      <Text style={[statCardStyles.count, { color }]}>{count}</Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  count: {
    fontFamily: fonts.display,
    fontSize: 24,
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    // each section below is exactly one screen tall
  },
  section: {
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    width: '100%',
    maxWidth: 320,
  },
  lanternGlow: {
    position: 'absolute',
    top: '28%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.lanternGlow,
  },
  sanctuaryGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.lanternGlow,
  },
  sanctuaryButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  wheelPressable: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  wheelHint: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  sectionTitle: {
    fontFamily: fonts.displaySoft,
    fontSize: 22,
    color: colors.ink,
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.hint,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    color: colors.inkMuted,
  },
  status: {
    marginTop: spacing.md,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
  },
  errorText: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  historyCard: {
    marginTop: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  historyState: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    width: 64,
  },
  historyMood: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    marginHorizontal: spacing.sm,
  },
  historyDate: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.hint,
  },
  circuitBreaker: {
    position: 'absolute',
    top: 48,
    right: spacing.lg - 4,
    zIndex: 10,
  },
});
