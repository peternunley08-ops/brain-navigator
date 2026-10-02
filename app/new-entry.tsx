import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Candle } from '../components/ui/Candle';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { TrackSlider } from '../components/ui/TrackSlider';
import { goBack } from '../core/chrome';
import { useAudioStore } from '../core/audioStore';
import { useFlameClock } from '../core/hooks/useFlameClock';
import { DraftCatalyst, useBrainNavigatorStore } from '../core/store';
import { alpha, colors, fonts, radii } from '../core/theme';

function weightWord(n: number | null) {
  if (n == null) return 'Slide to set it';
  if (n <= 2) return 'Light';
  if (n <= 4) return 'Noticeable';
  if (n <= 6) return 'Heavy';
  if (n <= 8) return 'Very heavy';
  return 'Crushing';
}

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

  const time = useFlameClock();
  const reducedMotion = useReducedMotion();

  const [catalysts, setCatalysts] = useState<DraftCatalyst[]>([]);
  const [catalystDescription, setCatalystDescription] = useState('');
  const [catalystEntity, setCatalystEntity] = useState('');

  const addCatalyst = () => {
    if (!catalystDescription.trim()) return;
    setCatalysts((prev) => [...prev, { description: catalystDescription.trim(), entityName: catalystEntity.trim() }]);
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
      goBack();
      emberSay(
        stressed
          ? 'It’s on the desk now. That one’s heavy — be gentle with yourself today.'
          : 'It’s on the desk now. You don’t have to hold it in your head anymore.',
        stressed ? 'concerned' : 'happy'
      );
    }
  };

  const handleCancel = () => {
    resetDraft();
    setCatalysts([]);
    goBack();
  };

  const intensity = (draftIntensity ?? 4) / 10;

  return (
    <Screen
      sheet
      back={handleCancel}
      backIcon="close"
      nav={false}
      tone="ember"
      title="Set something down"
      subtitle="Name it. A few words is enough."
    >
      <Reveal index={0} style={styles.block}>
        <Field
          big
          placeholder="What’s weighing on you?"
          value={draftMood}
          onChangeText={setDraftMood}
          autoFocus={false}
          returnKeyType="done"
          accessibilityLabel="What’s weighing on you"
        />
      </Reveal>

      <Reveal index={1} style={styles.block}>
        <Card style={styles.weightCard}>
          <View style={styles.preview}>
            <Candle
              width={86}
              time={time}
              intensity={intensity}
              remaining={1}
              seed={3.3}
              state={draftIntensity == null ? 'unlit' : 'lit'}
              reducedMotion={reducedMotion}
            />
          </View>
          <View style={styles.weightBody}>
            <Text style={styles.weightLabel}>How heavy is it?</Text>
            <Text style={[styles.weightWord, draftIntensity != null && { color: colors.flame }]}>
              {weightWord(draftIntensity)}
            </Text>
            <TrackSlider min={1} max={10} value={draftIntensity} onChange={setDraftIntensity} labels={['Light', 'Heavy']} />
          </View>
        </Card>
      </Reveal>

      <Reveal index={2} style={styles.block}>
        <Field
          label="Anything else worth remembering?"
          placeholder="Optional"
          value={draftNotes}
          onChangeText={setDraftNotes}
          multiline
        />
      </Reveal>

      <Reveal index={3}>
        <Section title="What set it off?" note="Optional. The Map uses these to show what keeps coming up.">
          {catalysts.length > 0 ? (
            <View style={styles.catalysts}>
              {catalysts.map((c, i) => (
                <Animated.View
                  key={`${c.description}-${i}`}
                  entering={FadeIn.duration(220)}
                  exiting={FadeOut.duration(160)}
                  layout={LinearTransition}
                  style={styles.catalyst}
                >
                  <View style={styles.catalystText}>
                    <Text style={styles.catalystDescription}>{c.description}</Text>
                    {c.entityName ? <Text style={styles.catalystEntity}>{c.entityName}</Text> : null}
                  </View>
                  <Pressy onPress={() => removeCatalyst(i)} hitSlop={10} accessibilityLabel={`Remove ${c.description}`} style={styles.remove}>
                    <Icon name="close" size={14} color={colors.textMuted} strokeWidth={2.2} />
                  </Pressy>
                </Animated.View>
              ))}
            </View>
          ) : null}
          <Field placeholder="What happened" value={catalystDescription} onChangeText={setCatalystDescription} />
          <View style={styles.entityRow}>
            <Field
              containerStyle={styles.entityField}
              placeholder="Who or what was involved"
              value={catalystEntity}
              onChangeText={setCatalystEntity}
              onSubmitEditing={addCatalyst}
            />
            <Button
              label="Add"
              variant="secondary"
              size="sm"
              icon="plus"
              onPress={addCatalyst}
              disabled={!catalystDescription.trim()}
              style={styles.addBtn}
            />
          </View>
        </Section>
      </Reveal>

      <Reveal index={4}>
        <Button
          label={isSaving ? 'Setting it down…' : 'Put it on the desk'}
          icon="candle"
          loading={isSaving}
          onPress={handleSave}
          disabled={isSaving || !draftMood.trim()}
          style={styles.save}
        />
        {!draftMood.trim() ? <Text style={styles.hint}>Give it a name first.</Text> : null}
        {error ? <Text style={styles.errorText}>Couldn’t save that. Check your connection and try again.</Text> : null}
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 18,
  },
  weightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  preview: {
    width: 86,
    alignItems: 'center',
  },
  weightBody: {
    flex: 1,
  },
  weightLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  weightWord: {
    marginTop: 2,
    marginBottom: 8,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textFaint,
  },
  catalysts: {
    gap: 8,
    marginBottom: 12,
  },
  catalyst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: radii.md,
    backgroundColor: alpha(colors.unlocked, 0.08),
    borderWidth: 1,
    borderColor: alpha(colors.unlocked, 0.25),
  },
  catalystText: {
    flex: 1,
  },
  catalystDescription: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  catalystEntity: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  remove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  entityField: {
    flex: 1,
  },
  addBtn: {
    minHeight: 50,
  },
  save: {
    marginTop: 30,
  },
  hint: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
});
