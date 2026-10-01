import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { EXPLAIN_CHECKS } from '../../core/helperOffline';
import { type NoteBlock, uid, useHubStore } from '../../core/hubStore';
import { useLifeStore } from '../../core/lifeStore';
import { colors, fonts } from '../../core/theme';
import { emberSay } from '../ember/EmberBuddy';
import type { EmberRig } from '../ember/useEmberRig';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

const FOREST = '#93D37A';

// Sage's Feynman check, no AI needed: name the idea, explain it like
// you're talking to a 12-year-old, then run the checks. The gaps you find
// are exactly what to study.
export function ExplainBack({ rig, topic: initial, onAskAI }: { rig: EmberRig; topic?: string; onAskAI: (text: string) => void }) {
  const createNote = useHubStore((s) => s.createNote);
  const [topic, setTopic] = useState(initial ?? '');
  const [text, setText] = useState('');
  const [checked, setChecked] = useState<number[]>([]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const ready = words >= 15;

  const save = () => {
    const blocks: NoteBlock[] = [
      { id: uid(), type: 'heading', text: 'In my own words' },
      { id: uid(), type: 'text', text },
      { id: uid(), type: 'heading', text: 'Gaps to study' },
      ...EXPLAIN_CHECKS.filter((_, i) => !checked.includes(i)).map((c) => ({ id: uid(), type: 'todo', text: c, checked: false }) as NoteBlock),
    ];
    const note = createNote({ title: topic || 'Explained', icon: 'flask', color: FOREST, blocks });
    useLifeStore.getState().noteHelperLast('sage', `you explained ${topic ? `“${topic}”` : 'an idea'} in your own words`);
    rig.setMood('cheer');
    emberSay('Saved. Explaining it is how it sticks.', 'happy');
    router.push(`/note/${note.id}`);
  };

  return (
    <View>
      <Field label="What idea?" value={topic} onChangeText={setTopic} placeholder="e.g. Photosynthesis, the French Revolution" containerStyle={styles.gap} />
      <Field
        label="Explain it like you’re talking to a 12-year-old"
        value={text}
        onChangeText={(t) => {
          setText(t);
          if (t.trim().split(/\s+/).length === 15) {
            rig.setMood('happy');
            rig.hopUp(8);
          }
        }}
        multiline
        placeholder="No notes. Just what you know."
        containerStyle={styles.gap}
        hint={`${words} word${words === 1 ? '' : 's'}${ready ? '' : '. Aim for at least 15.'}`}
      />
      {ready ? (
        <Animated.View entering={FadeInDown.duration(260)}>
          <Card tint={FOREST} style={styles.gap}>
            <Text style={styles.title}>Now check it</Text>
            {EXPLAIN_CHECKS.map((c, i) => {
              const on = checked.includes(i);
              return (
                <Pressy key={c} onPress={() => setChecked(on ? checked.filter((x) => x !== i) : [...checked, i])} style={styles.check} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <Icon name={on ? 'check' : 'plus'} size={16} color={on ? colors.secured : colors.textFaint} />
                  <Text style={[styles.checkText, on && styles.checkDone]}>{c}</Text>
                </Pressy>
              );
            })}
            <Text style={styles.hint}>Anything you can’t check is your study list.</Text>
          </Card>
          <Button label="Save to my Notebook" icon="pen" onPress={save} style={styles.go} />
          <Button
            label="Have Sage check it (AI)"
            variant="secondary"
            icon="sparkle"
            onPress={() => onAskAI(`Here's how I'd explain ${topic || 'this'}: ${text}\n\nWhat did I get right, and what's missing?`)}
            style={styles.go2}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    marginTop: 14,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    marginBottom: 6,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  checkDone: {
    color: colors.textFaint,
  },
  hint: {
    marginTop: 6,
    fontFamily: fonts.displaySoft,
    fontSize: 13,
    color: colors.textMuted,
  },
  go: {
    marginTop: 16,
  },
  go2: {
    marginTop: 10,
  },
});
