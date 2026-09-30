import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { candleRemaining } from '../components/ui/Candle';
import { CandleGlyph } from '../components/ui/CandleGlyph';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Screen } from '../components/ui/Screen';
import { useOpenLoops } from '../core/hooks/useOpenLoops';
import { alpha, colors, fonts } from '../core/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

function age(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS);
  if (days <= 0) return 'Open since today';
  return days === 1 ? 'Open for a day' : `Open for ${days} days`;
}

export default function OpenLoopsScreen() {
  const openLoops = useOpenLoops();
  // Oldest first — the ones that have burned longest are the ones to look at.
  const sorted = useMemo(() => [...openLoops].sort((a, b) => a.created_at.localeCompare(b.created_at)), [openLoops]);

  return (
    <Screen
      back={false}
      title="Loops"
      subtitle={
        openLoops.length === 0
          ? 'Nothing left open.'
          : `${openLoops.length} ${openLoops.length === 1 ? 'thing is' : 'things are'} waiting to close. Oldest first.`
      }
    >
      {sorted.length === 0 ? (
        <EmptyState title="Every loop is closed." body="When something’s on your mind, set it down and it’ll wait here until you’re ready.">
          <Button label="Set something down" icon="plus" onPress={() => router.push('/new-entry')} style={styles.cta} />
        </EmptyState>
      ) : (
        <View style={styles.list}>
          {sorted.map((entry, i) => {
            const intensity = (entry.intensity ?? 5) / 10;
            return (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.delay(80 + i * 50).duration(420)}
                exiting={FadeOut.duration(200)}
                layout={LinearTransition.springify().damping(18)}
              >
                <Card onPress={() => router.push(`/entry/${entry.id}`)} style={styles.card} accessibilityLabel={`${entry.mood || 'Untitled'}, ${age(entry.created_at)}`}>
                  <View style={styles.row}>
                    <View style={styles.glyph}>
                      <CandleGlyph size={34} intensity={intensity} remaining={candleRemaining(entry.created_at)} />
                    </View>
                    <View style={styles.text}>
                      <Text style={styles.title} numberOfLines={2}>
                        {entry.mood || 'Untitled'}
                      </Text>
                      <Text style={styles.meta}>{age(entry.created_at)}</Text>
                      <View style={styles.heat}>
                        {Array.from({ length: 10 }, (_, k) => (
                          <View
                            key={k}
                            style={[
                              styles.heatDot,
                              k < (entry.intensity ?? 5) && { backgroundColor: alpha(colors.unlocked, 0.35 + (k / 10) * 0.65) },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    <Icon name="chevron" size={18} color={colors.textFaint} />
                  </View>
                </Card>
              </Animated.View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 18,
    gap: 12,
  },
  card: {
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  glyph: {
    width: 44,
    alignItems: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text,
  },
  meta: {
    marginTop: 3,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textFaint,
  },
  heat: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 9,
  },
  heatDot: {
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceHigh,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
