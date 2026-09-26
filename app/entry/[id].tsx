import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { HoldToConfirm } from '../../components/ui/HoldToConfirm';
import { useAudioStore } from '../../core/audioStore';
import { uploadSnapshotImage } from '../../core/imageUpload';
import { supabase } from '../../core/supabase';
import { CognitiveStateEntry, useBrainNavigatorStore } from '../../core/store';
import { colors, fonts, spacing, stateColor } from '../../core/theme';

// Matches the threshold used at save time in new-entry.tsx — a self-rated
// intensity of 7+ is this app's real "high-stress" signal.
const STRESS_THRESHOLD = 7;

interface Catalyst {
  id: string;
  description: string;
  entities: { name: string } | null;
}

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = useBrainNavigatorStore((s) => s.history);
  const closeEntry = useBrainNavigatorStore((s) => s.closeEntry);
  const shelveEntry = useBrainNavigatorStore((s) => s.shelveEntry);
  const setTrove = useBrainNavigatorStore((s) => s.setTrove);
  const fetchHistory = useBrainNavigatorStore((s) => s.fetchHistory);
  const isSaving = useBrainNavigatorStore((s) => s.isSaving);
  const [note, setNote] = useState('');
  const [sealed, setSealed] = useState(false);
  const [shelved, setShelved] = useState(false);
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loadingCatalysts, setLoadingCatalysts] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchedEntry, setFetchedEntry] = useState<CognitiveStateEntry | null>(null);

  const historyEntry = useMemo(() => history.find((e) => e.id === id), [history, id]);
  const entry = historyEntry ?? fetchedEntry ?? undefined;

  // The Today history feed is capped to the 50 most recent entries, so an
  // older entry (reached via Trove, Open Loops, or a saved link) won't be
  // in it — fetch it directly rather than showing "Entry not found."
  useEffect(() => {
    if (historyEntry || !id) return;
    let cancelled = false;

    supabase
      .from('cognitive_state')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setFetchedEntry(data as CognitiveStateEntry);
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
  }, [entry]);

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

  const handleSeal = () => {
    if (!entry) return;
    setSealed(true);
    closeEntry(entry.id, note).then(() => {
      setTimeout(() => router.back(), 700);
    });
  };

  const handleShelve = () => {
    if (!entry) return;
    setShelved(true);
    shelveEntry(entry.id).then(() => {
      setTimeout(() => router.back(), 700);
    });
  };

  if (!entry) {
    return (
      <View style={styles.root}>
        <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />
        <Text style={styles.notes}>Entry not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

      <Text style={[styles.label, { color: stateColor(entry.state) }]}>{entry.state}</Text>
      <Text style={styles.mood}>{entry.mood || 'Untitled'}</Text>
      <Text style={styles.date}>{new Date(entry.created_at).toLocaleDateString()}</Text>
      {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}

      {entry.image_url ? (
        <Image source={{ uri: entry.image_url }} style={styles.snapshotImage} />
      ) : null}

      <View style={styles.actionRow}>
        <Button
          label={entry.in_trove ? 'In the Trove' : 'Add to Trove'}
          variant="pill"
          onPress={() => {
            const nextInTrove = !entry.in_trove;
            setTrove(entry.id, nextInTrove);
            if (!historyEntry) {
              setFetchedEntry((prev) => (prev ? { ...prev, in_trove: nextInTrove } : prev));
            }
          }}
          style={styles.troveButton}
        />
        <Button
          label={uploadingImage ? 'Uploading…' : entry.image_url ? 'Change Photo' : 'Add Photo'}
          variant="pill"
          onPress={handlePickImage}
          disabled={uploadingImage}
          style={styles.troveButton}
        />
      </View>

      {!loadingCatalysts && catalysts.length > 0 ? (
        <View style={styles.redStringBlock}>
          <Text style={styles.sectionTitle}>Red String</Text>
          <Card style={styles.catalystCard}>
            {catalysts.map((c, i) => (
              <View key={c.id}>
                <View style={styles.catalystRow}>
                  <Text style={styles.catalystDescription}>{c.description}</Text>
                  {c.entities?.name ? (
                    <Text style={styles.catalystEntity}>— {c.entities.name}</Text>
                  ) : null}
                </View>
                {i < catalysts.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {entry.state === 'unlocked' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="How did this resolve? (optional)"
            placeholderTextColor={colors.hint}
            value={note}
            onChangeText={setNote}
            multiline
            editable={!isSaving && !sealed && !shelved}
          />

          <View style={styles.holdRow}>
            <View style={styles.holdWrap}>
              <HoldToConfirm
                label={sealed ? 'Sealed' : 'Hold to Seal'}
                holdingLabel="Sealing…"
                onComplete={handleSeal}
                fillColor={colors.secured}
                borderColor={colors.secured}
                size={84}
              />
            </View>

            <View style={styles.holdWrap}>
              <HoldToConfirm
                label={shelved ? 'Let Float' : 'Hold to Let Float'}
                holdingLabel="Floating…"
                onComplete={handleShelve}
                fillColor={colors.shelved}
                borderColor={colors.shelved}
                size={84}
              />
            </View>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.unlocked,
  },
  sectionTitle: {
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    color: colors.ink,
  },
  mood: {
    marginTop: spacing.sm,
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
  },
  date: {
    marginTop: spacing.xs,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.hint,
  },
  notes: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  snapshotImage: {
    marginTop: spacing.lg,
    width: 260,
    height: 260,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  troveButton: {},
  redStringBlock: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'flex-start',
  },
  catalystCard: {
    marginTop: spacing.sm,
  },
  catalystRow: {
    paddingVertical: spacing.sm,
  },
  catalystDescription: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  catalystEntity: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
  },
  input: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 360,
    minHeight: 80,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    borderRadius: 8,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.backgroundAlt,
    textAlignVertical: 'top',
  },
  holdRow: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    gap: spacing.xl,
  },
  holdWrap: {},
});
