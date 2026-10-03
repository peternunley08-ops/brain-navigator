import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { emberSay } from '../../components/ember/EmberBuddy';
import { Button } from '../../components/ui/Button';
import { Candle, candleRemaining, candleSeed, type CandleState } from '../../components/ui/Candle';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { HoldToConfirm } from '../../components/ui/HoldToConfirm';
import { Reveal } from '../../components/ui/Reveal';
import { Screen } from '../../components/ui/Screen';
import { Section } from '../../components/ui/Section';
import { goBack } from '../../core/chrome';
import { cheerLine } from '../../core/about';
import { useAudioStore } from '../../core/audioStore';
import { useFlameClock } from '../../core/hooks/useFlameClock';
import { uploadSnapshotImage } from '../../core/imageUpload';
import { CognitiveStateEntry, STATE_LABEL, useBrainNavigatorStore } from '../../core/store';
import { supabase } from '../../core/supabase';
import { alpha, colors, fonts, radii, stateColor } from '../../core/theme';

// Matches the threshold used at save time in new-entry.tsx — a self-rated
// intensity of 7+ is this app's real "high-stress" signal.
const STRESS_THRESHOLD = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

interface Catalyst {
  id: string;
  description: string;
  entities: { name: string } | null;
}

function openFor(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS);
  if (days <= 0) return 'since today';
  return days === 1 ? 'for a day' : `for ${days} days`;
}

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = useBrainNavigatorStore((s) => s.history);
  const closeEntry = useBrainNavigatorStore((s) => s.closeEntry);
  const shelveEntry = useBrainNavigatorStore((s) => s.shelveEntry);
  const setTrove = useBrainNavigatorStore((s) => s.setTrove);
  const fetchHistory = useBrainNavigatorStore((s) => s.fetchHistory);
  const openLoops = useBrainNavigatorStore((s) => s.openLoops);
  const isSaving = useBrainNavigatorStore((s) => s.isSaving);
  const [note, setNote] = useState('');
  const [sealed, setSealed] = useState(false);
  const [shelved, setShelved] = useState(false);
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loadingCatalysts, setLoadingCatalysts] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchedEntry, setFetchedEntry] = useState<CognitiveStateEntry | null>(null);
  const [lookedUp, setLookedUp] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const time = useFlameClock();
  const reducedMotion = useReducedMotion();

  const historyEntry = useMemo(
    () => history.find((e) => e.id === id) ?? openLoops.find((e) => e.id === id),
    [history, openLoops, id]
  );
  const entry = historyEntry ?? fetchedEntry ?? undefined;

  // The history feed is capped to the 50 most recent entries, so an older
  // entry (reached via Kept, Loops, or a saved link) won't be in it — fetch
  // it directly rather than showing "not found".
  useEffect(() => {
    if (historyEntry || !id) return;
    let cancelled = false;

    supabase
      .from('cognitive_state')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setFetchedEntry(data as CognitiveStateEntry);
        setLookedUp(true);
      });

    return () => {
      cancelled = true;
    };
  }, [historyEntry, id]);

  useEffect(() => {
    if (!entry) return;
    let cancelled = false;
    setLoadingCatalysts(true);

    supabase
      .from('catalysts')
      .select('id, description, entities(name)')
      .eq('cognitive_state_id', entry.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setCatalysts(data as unknown as Catalyst[]);
        }
        setLoadingCatalysts(false);
      });

    return () => {
      cancelled = true;
    };
    // Only refetch when the entry itself changes, not on every field edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  // Soften the ambient soundscape while viewing a high-intensity entry;
  // return to the clear tone on leaving.
  useEffect(() => {
    if (!entry) return;
    const stressed = (entry.intensity ?? 0) >= STRESS_THRESHOLD;
    useAudioStore.getState().transitionToMood(stressed ? 'muffled' : 'clear', 1000);
    return () => {
      useAudioStore.getState().transitionToMood('clear', 800);
    };
  }, [entry]);

  const handlePickImage = async () => {
    if (!entry) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.75,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingImage(true);
    const url = await uploadSnapshotImage(result.assets[0].uri, entry.id);
    if (url) {
      await supabase.from('cognitive_state').update({ image_url: url }).eq('id', entry.id);
      await fetchHistory();
      if (!historyEntry) setFetchedEntry((prev) => (prev ? { ...prev, image_url: url } : prev));
    }
    setUploadingImage(false);
  };

  // Closing plays out on the candle at the top — scroll up so it's seen,
  // and only leave once the flame has gone out or floated away.
  // The closing starts playing straight away, while the save happens. If
  // the save fails, the candle relights, the error shows, and nothing
  // pretends it closed.
  const handleSeal = () => {
    if (!entry) return;
    setSealed(true);
    setSaveFailed(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    const leaveAt = Date.now() + (reducedMotion ? 700 : 2100);
    closeEntry(entry.id, note).then((saved) => {
      if (!saved) {
        setSealed(false);
        setSaveFailed(true);
        return;
      }
      setTimeout(() => {
        goBack();
        emberSay(cheerLine('Resolved. That’s one less thing burning.'), 'cheer');
      }, Math.max(0, leaveAt - Date.now()));
    });
  };

  const handleShelve = () => {
    if (!entry) return;
    setShelved(true);
    setSaveFailed(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    const leaveAt = Date.now() + (reducedMotion ? 700 : 2700);
    shelveEntry(entry.id).then((saved) => {
      if (!saved) {
        setShelved(false);
        setSaveFailed(true);
        return;
      }
      setTimeout(() => {
        goBack();
        emberSay('Let go. You don’t have to carry that one anymore.', 'happy');
      }, Math.max(0, leaveAt - Date.now()));
    });
  };

  const displayState = sealed ? 'secured' : shelved ? 'shelved' : (entry?.state ?? 'unlocked');
  const candleState: CandleState =
    displayState === 'secured' ? 'snuffed' : displayState === 'shelved' ? 'floated' : 'lit';

  if (!entry) {
    return (
      <Screen nav={false}>
        {lookedUp ? (
          <EmptyState title="This one isn’t here anymore." body="It may have been removed. Everything else is where you left it.">
            <Button label="Back to the Desk" variant="secondary" onPress={() => goBack()} />
          </EmptyState>
        ) : null}
      </Screen>
    );
  }

  const tint = stateColor(displayState);
  const busy = isSaving || sealed || shelved;
  const setDown = new Date(entry.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Screen nav={false} scrollRef={scrollRef} barTitle={entry.mood || 'Untitled'} tone="ember" glowColor={displayState === 'shelved' ? '#AFA2DE' : '#F5B45C'}>
      <View style={styles.hero}>
        <Candle
          width={156}
          time={time}
          intensity={(entry.intensity ?? 5) / 10}
          remaining={candleRemaining(entry.created_at)}
          seed={candleSeed(entry.id)}
          state={candleState}
          reducedMotion={reducedMotion}
          igniteDelay={200}
        />
        <Animated.View key={displayState} entering={FadeIn.duration(300)} style={[styles.statePill, { borderColor: alpha(tint, 0.5), backgroundColor: alpha(tint, 0.12) }]}>
          <View style={[styles.stateDot, { backgroundColor: tint }]} />
          <Text style={[styles.stateText, { color: tint }]}>
            {STATE_LABEL[displayState]}
            {displayState === 'unlocked' ? ` ${openFor(entry.created_at)}` : ''}
          </Text>
        </Animated.View>
        <Text style={styles.title}>{entry.mood || 'Untitled'}</Text>
        <Text style={styles.date}>Set down {setDown}</Text>
      </View>

      {saveFailed ? (
        <Animated.View entering={FadeInDown.duration(260)}>
          <Card tint={colors.danger} style={styles.errorCard}>
            <Text style={styles.errorText}>Couldn’t save that, so it’s still open. Check your connection and try again.</Text>
          </Card>
        </Animated.View>
      ) : null}

      {entry.notes ? (
        <Reveal index={0}>
          <Card style={styles.notesCard}>
            <Text style={styles.notes}>{entry.notes}</Text>
          </Card>
        </Reveal>
      ) : null}

      {entry.image_url ? (
        <Reveal index={1}>
          <Image source={{ uri: entry.image_url }} style={styles.snapshotImage} />
        </Reveal>
      ) : null}

      <Reveal index={1} style={styles.actionRow}>
        <Button
          label={entry.in_trove ? 'Kept' : 'Keep this'}
          variant="secondary"
          size="sm"
          icon="jar"
          tint={entry.in_trove ? colors.flame : undefined}
          onPress={() => {
            const nextInTrove = !entry.in_trove;
            setTrove(entry.id, nextInTrove);
            if (!historyEntry) {
              setFetchedEntry((prev) => (prev ? { ...prev, in_trove: nextInTrove } : prev));
            }
          }}
          style={styles.flex}
        />
        <Button
          label={uploadingImage ? 'Uploading…' : entry.image_url ? 'Change photo' : 'Add photo'}
          variant="secondary"
          size="sm"
          icon="image"
          loading={uploadingImage}
          onPress={handlePickImage}
          style={styles.flex}
        />
      </Reveal>

      {!loadingCatalysts && catalysts.length > 0 ? (
        <Reveal index={2}>
          <Section title="What set it off">
            <Card padded={false}>
              {catalysts.map((c, i) => (
                <View key={c.id} style={[styles.catalystRow, i > 0 && styles.catalystBorder]}>
                  <View style={styles.catalystDot} />
                  <View style={styles.flex}>
                    <Text style={styles.catalystDescription}>{c.description}</Text>
                    {c.entities?.name ? <Text style={styles.catalystEntity}>{c.entities.name}</Text> : null}
                  </View>
                </View>
              ))}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      {entry.state === 'unlocked' ? (
        <Reveal index={3}>
          <Section
            title="Close it"
            note="Resolve it if it’s handled. Let it go if you’re choosing to stop carrying it. Both count."
          >
            <Field
              placeholder="How did it resolve? (optional)"
              value={note}
              onChangeText={setNote}
              multiline
              editable={!busy}
            />
            <View style={styles.holdRow}>
              <HoldToConfirm
                label={sealed ? 'Resolved' : 'Hold to resolve'}
                holdingLabel="Resolving…"
                onComplete={handleSeal}
                fillColor={colors.secured}
                icon="check"
                size={92}
                disabled={busy}
              />
              <HoldToConfirm
                label={shelved ? 'Let go' : 'Hold to let go'}
                holdingLabel="Letting go…"
                onComplete={handleShelve}
                fillColor={colors.shelved}
                icon="feather"
                size={92}
                disabled={busy}
              />
            </View>
          </Section>
        </Reveal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    marginTop: 4,
  },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  stateDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  stateText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  title: {
    marginTop: 12,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
    textAlign: 'center',
  },
  date: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
  },
  errorCard: {
    marginTop: 18,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.danger,
    textAlign: 'center',
  },
  notesCard: {
    marginTop: 22,
  },
  notes: {
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 25,
    color: colors.textMuted,
  },
  snapshotImage: {
    marginTop: 16,
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  catalystRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  catalystBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  catalystDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: colors.unlocked,
  },
  catalystDescription: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  catalystEntity: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  holdRow: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
