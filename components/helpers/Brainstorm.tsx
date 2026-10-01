import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { BRAINSTORM } from '../../core/helperOffline';
import { type NoteBlock, uid, useHubStore } from '../../core/hubStore';
import { useLifeStore } from '../../core/lifeStore';
import { colors, fonts } from '../../core/theme';
import { emberSay } from '../ember/EmberBuddy';
import type { EmberRig } from '../ember/useEmberRig';
import { Button } from '../ui/Button';
import { Chip, ChipRow } from '../ui/Chip';
import { Card } from '../ui/Card';
import { Field } from '../ui/Field';
import { ProgressBar } from '../ui/ProgressBar';

const ROSE = '#F58FA8';

// Quill's questions, one at a time. Your answers — in your words — become
// a note you can write from. Quill never writes the essay.
export function Brainstorm({ rig, topic }: { rig: EmberRig; topic?: string }) {
  const createNote = useHubStore((s) => s.createNote);
  const notes = useHubStore((s) => s.notes);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => BRAINSTORM.map((_, i) => (i === 0 && topic ? topic : '')));
  const cur = BRAINSTORM[step];
  const done = step >= BRAINSTORM.length;

  const next = () => {
    rig.talk(true);
    setTimeout(() => rig.talk(false), 700);
    setStep(step + 1);
  };

  const save = () => {
    const blocks: NoteBlock[] = BRAINSTORM.flatMap((b, i) => [
      { id: uid(), type: 'heading', text: b.q } as NoteBlock,
      { id: uid(), type: 'text', text: answers[i] } as NoteBlock,
    ]);
    const note = createNote({ title: `Brainstorm: ${(answers[0] || 'essay').slice(0, 40)}`, icon: 'feather', color: ROSE, blocks, wordGoal: 650 });
    useLifeStore.getState().noteHelperLast('quill', `we brainstormed “${(answers[0] || 'your essay').slice(0, 40)}”`);
    rig.setMood('cheer');
    rig.hopUp(14);
    emberSay('Saved to your Notebook. Every sentence in there is yours.', 'happy');
    router.push(`/note/${note.id}`);
  };

  if (done) {
    return (
      <Animated.View entering={FadeInRight.duration(260)}>
        <Card tint={ROSE} style={styles.card}>
          <Text style={styles.q}>That’s a real start.</Text>
          <Text style={styles.hint}>Your one-sentence point: “{answers[BRAINSTORM.length - 1] || '…'}”</Text>
        </Card>
        <Button label="Save to my Notebook" icon="pen" onPress={save} style={styles.go} />
        <Button label="Go back and change something" variant="ghost" size="sm" onPress={() => setStep(0)} style={styles.ghost} />
      </Animated.View>
    );
  }

  // Essays already in the Notebook, to pick back up instead of starting over.
  const essays = notes
    .filter((n) => n.icon === 'feather' || /essay|personal statement|supplement/i.test(n.title))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);

  return (
    <View>
      {step === 0 && !answers[0]?.trim() && essays.length ? (
        <View style={styles.essays}>
          <Text style={styles.count}>Or pick up where you left off</Text>
          <ChipRow>
            {essays.map((n) => (
              <Chip key={n.id} label={n.title || 'Untitled'} icon="feather" color={ROSE} onPress={() => router.push(`/note/${n.id}`)} />
            ))}
          </ChipRow>
        </View>
      ) : null}
      <ProgressBar value={step / BRAINSTORM.length} color={ROSE} height={5} style={styles.bar} />
      <Animated.View key={step} entering={FadeInRight.duration(240)}>
        <Text style={styles.count}>
          {step + 1} of {BRAINSTORM.length}
        </Text>
        <Text style={styles.q}>{cur.q}</Text>
        <Text style={styles.hint}>{cur.hint}</Text>
        <Field
          multiline
          value={answers[step]}
          onChangeText={(t) => setAnswers(answers.map((a, i) => (i === step ? t : a)))}
          placeholder="Messy is fine."
          containerStyle={styles.field}
        />
      </Animated.View>
      <View style={styles.row}>
        {step > 0 ? <Button label="Back" variant="secondary" onPress={() => setStep(step - 1)} style={styles.flex} /> : null}
        <Button label={step === BRAINSTORM.length - 1 ? 'Finish' : answers[step].trim() ? 'Next' : 'Skip'} icon="arrow" onPress={next} style={styles.flex2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  essays: {
    marginTop: 14,
    marginBottom: 6,
    gap: 6,
  },
  flex: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  bar: {
    marginTop: 16,
  },
  count: {
    marginTop: 14,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: ROSE,
  },
  card: {
    marginTop: 16,
  },
  q: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  hint: {
    marginTop: 6,
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  field: {
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  go: {
    marginTop: 16,
  },
  ghost: {
    alignSelf: 'center',
    marginTop: 6,
  },
});
