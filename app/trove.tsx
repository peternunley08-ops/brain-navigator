import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Divider } from '../components/ui/Divider';
import { useBrainNavigatorStore } from '../core/store';
import { colors, fonts, spacing, stateColor } from '../core/theme';

export default function TroveScreen() {
  const history = useBrainNavigatorStore((s) => s.history);
  const troveEntries = useMemo(() => history.filter((e) => e.in_trove), [history]);

  return (
    <View style={styles.root}>
      <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

      <Text style={styles.title}>Personal Trove</Text>
      <Text style={styles.subtitle}>
        {troveEntries.length === 0 ? 'Nothing kept yet' : `${troveEntries.length} kept`}
      </Text>

      {troveEntries.length > 0 ? (
        <Card style={styles.card}>
          {troveEntries.map((entry, i) => (
            <View key={entry.id}>
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/entry/${entry.id}`)}
              >
                <View style={[styles.dot, { backgroundColor: stateColor(entry.state) }]} />
                <Text style={styles.mood} numberOfLines={1}>
                  {entry.mood || '—'}
                </Text>
                <Text style={styles.date}>
                  {new Date(entry.created_at).toLocaleDateString()}
                </Text>
              </Pressable>
              {i < troveEntries.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </Card>
      ) : null}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
    alignSelf: 'flex-start',
  },
  card: {
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  mood: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    marginRight: spacing.sm,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.hint,
  },
});
