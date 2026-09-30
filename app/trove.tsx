import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { CandleGlyph } from '../components/ui/CandleGlyph';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Screen } from '../components/ui/Screen';
import { useRealtimeRefetch } from '../core/hooks/useRealtimeRefetch';
import { CognitiveStateEntry, STATE_LABEL } from '../core/store';
import { supabase } from '../core/supabase';
import { alpha, colors, fonts, stateColor } from '../core/theme';

const KEPT = '#E89AB8';

export default function TroveScreen() {
  const [troveEntries, setTroveEntries] = useState<CognitiveStateEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Queried directly rather than derived from the history feed (which is
  // capped to the 50 most recent entries) — otherwise anything kept would
  // silently disappear once 50 newer entries pile up.
  const fetchTrove = useCallback(() => {
    supabase
      .from('cognitive_state')
      .select('*')
      .eq('in_trove', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setTroveEntries(data as CognitiveStateEntry[]);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    fetchTrove();
  }, [fetchTrove]);

  useRealtimeRefetch(['cognitive_state'], fetchTrove);

  return (
    <Screen
      title="Kept"
      subtitle={
        !loaded ? 'Loading…' : troveEntries.length === 0 ? 'Nothing kept yet.' : `${troveEntries.length} you chose to keep.`
      }
    >
      {loaded && troveEntries.length === 0 ? (
        <EmptyState
          art={
            <View style={[styles.jar, { backgroundColor: alpha(KEPT, 0.12) }]}>
              <Icon name="jar" size={30} color={KEPT} />
            </View>
          }
          title="Nothing in the jar yet."
          body="Open any candle and tap “Keep this” to save how you got through it."
        >
          <Button label="Go to the Desk" variant="secondary" onPress={() => router.dismissTo('/')} />
        </EmptyState>
      ) : (
        <View style={styles.list}>
          {troveEntries.map((entry, i) => {
            const state = entry.state === 'secured' ? 'resolved' : entry.state === 'shelved' ? 'letgo' : 'lit';
            const tint = stateColor(entry.state);
            return (
              <Animated.View key={entry.id} entering={FadeInDown.delay(80 + i * 45).duration(380)}>
                <Card onPress={() => router.push(`/entry/${entry.id}`)} style={styles.card}>
                  <CandleGlyph size={30} intensity={(entry.intensity ?? 5) / 10} state={state} />
                  <View style={styles.text}>
                    <Text style={styles.title} numberOfLines={2}>
                      {entry.mood || 'Untitled'}
                    </Text>
                    <Text style={styles.meta}>
                      <Text style={{ color: tint }}>{STATE_LABEL[entry.state]}</Text>,{' '}
                      {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <Icon name="chevron" size={18} color={colors.textFaint} />
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
  jar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    marginTop: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  meta: {
    marginTop: 3,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
});
