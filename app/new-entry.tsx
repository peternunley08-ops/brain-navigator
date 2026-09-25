import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Divider } from '../components/ui/Divider';
import { TrackSlider } from '../components/ui/TrackSlider';
import { useAudioStore } from '../core/audioStore';
import { DraftCatalyst, useBrainNavigatorStore } from '../core/store';
import { colors, fonts, radii, spacing } from '../core/theme';

export default function NewEntryScreen() {
  const draftMood = useBrainNavigatorStore((s) => s.draftMood);
  const draftNotes = useBrainNavigatorStore((s) => s.draftNotes);
  const draftIntensity = useBrainNavigatorStore((s) => s.draftIntensity);
  const setDraftMood = useBrainNavigatorStore((s) => s.setDraftMood);
  const setDraftNotes = useBrainNavigatorStore((s) => s.setDraftNotes);
  const setDraftIntensity = useBrainNavigatorStore((s) => s.setDraftIntensity);
  const saveDraft = useBrainNavigatorStore((s) => s.saveDraft);
  const resetDraft = useBrainNavigatorStore((s) => s.resetDraft);
  const isSaving = useBrainNavigatorStore((s) => s.isSaving);
  const error = useBrainNavigatorStore((s) => s.error);

  const [catalysts, setCatalysts] = useState<DraftCatalyst[]>([]);
  const [catalystDescription, setCatalystDescription] = useState('');
  const [catalystEntity, setCatalystEntity] = useState('');

  const addCatalyst = () => {
    if (!catalystDescription.trim()) return;
    setCatalysts((prev) => [
      ...prev,
      { description: catalystDescription.trim(), entityName: catalystEntity.trim() },
    ]);
    setCatalystDescription('');
    setCatalystEntity('');
  };

  const removeCatalyst = (index: number) => {
    setCatalysts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const id = await saveDraft(catalysts);
    if (id) {
      // High self-rated intensity softens the ambient soundscape on save —
      // the real, already-collected stress signal, rather than guessing at
      // one from the free-text notes.
      const stressed = (draftIntensity ?? 0) >= 7;
      useAudioStore.getState().transitionToMood(stressed ? 'muffled' : 'clear', 1000);
      setCatalysts([]);
      router.back();
    }
  };

  const handleCancel = () => {
    resetDraft();
    setCatalysts([]);
    router.back();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Button label="Cancel" variant="pill" onPress={handleCancel} style={styles.back} />

      <Text style={styles.title}>New Entry</Text>

      <Text style={styles.fieldLabel}>What&apos;s the headline?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Argument about the doorknob"
        placeholderTextColor={colors.hint}
        value={draftMood}
        onChangeText={setDraftMood}
      />

      <Text style={styles.fieldLabel}>Intensity</Text>
      <TrackSlider min={1} max={10} value={draftIntensity} onChange={setDraftIntensity} />

      <Text style={styles.fieldLabel}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Anything else worth remembering"
        placeholderTextColor={colors.hint}
        value={draftNotes}
        onChangeText={setDraftNotes}
        multiline
      />

      <Text style={styles.fieldLabel}>What triggered this? (optional)</Text>

      {catalysts.length > 0 ? (
        <Card style={styles.catalystCard}>
          {catalysts.map((c, i) => (
            <View key={`${c.description}-${i}`}>
              <View style={styles.catalystRow}>
                <View style={styles.catalystTextWrap}>
                  <Text style={styles.catalystDescription}>{c.description}</Text>
                  {c.entityName ? (
                    <Text style={styles.catalystEntity}>— {c.entityName}</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => removeCatalyst(i)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
              {i < catalysts.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </Card>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="What happened"
        placeholderTextColor={colors.hint}
        value={catalystDescription}
        onChangeText={setCatalystDescription}
      />
      <TextInput
        style={[styles.input, styles.catalystEntityInput]}
        placeholder="Who/what (optional)"
        placeholderTextColor={colors.hint}
        value={catalystEntity}
        onChangeText={setCatalystEntity}
      />
      <Button
        label="Add Catalyst"
        variant="pill"
        onPress={addCatalyst}
        style={styles.addButton}
      />

      <Button
        label={isSaving ? 'Saving…' : 'Save Entry'}
        onPress={handleSave}
        disabled={isSaving || !draftMood.trim()}
        style={styles.saveButton}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.backgroundAlt,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  catalystCard: {
    marginBottom: spacing.sm,
  },
  catalystRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  catalystTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
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
  removeText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  catalystEntityInput: {
    marginTop: spacing.sm,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  errorText: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
});
