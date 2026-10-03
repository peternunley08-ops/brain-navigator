import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { HelpCard } from '../components/ember/HelpCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import * as Haptics from '../core/haptics';
import { EMPTY_SAFETY, type SafetyKey, useLifeStore } from '../core/lifeStore';
import { colors, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';

const BLUE = '#8FB4E8';

const PARTS: { key: SafetyKey; title: string; note: string; placeholder: string }[] = [
  { key: 'signs', title: 'My warning signs', note: 'What tells me things are getting heavy.', placeholder: 'Not sleeping, pulling away from friends' },
  { key: 'coping', title: 'Things that help me cope', note: 'Small things I can do on my own.', placeholder: 'A walk, music, a shower, breathing' },
  { key: 'reach', title: 'People I can reach', note: 'Someone I can text or call.', placeholder: 'Mom, Jordan, Coach Lee' },
  { key: 'places', title: 'Safe places', note: 'Where I feel calmer.', placeholder: 'My room, the library, Grandma’s house' },
];

// A plan made on a calm day, for a harder one. It stays on this phone: it is
// never sent to AI or to any server.
export default function SafetyPlanScreen() {
  const plan = useLifeStore((s) => s.safetyPlan);
  const people = useLifeStore((s) => s.people);
  const addItem = useLifeStore((s) => s.addSafetyItem);
  const removeItem = useLifeStore((s) => s.removeSafetyItem);
  const putBack = useLifeStore((s) => s.putBack);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const lists = { ...EMPTY_SAFETY, ...(plan ?? {}) };

  const add = (key: SafetyKey, text: string) => {
    if (!text.trim()) return;
    addItem(key, text);
    setDrafts((d) => ({ ...d, [key]: '' }));
    Haptics.selectionAsync().catch(() => {});
  };
  const remove = (key: SafetyKey, id: string) => {
    const before = useLifeStore.getState().safetyPlan ?? EMPTY_SAFETY;
    const gone = lists[key].find((x) => x.id === id);
    removeItem(key, id);
    offerUndo(`Removed “${gone?.text ?? 'item'}”`, () => putBack({ safetyPlan: before }));
  };

  return (
    <Screen title="Safety plan" subtitle="Made now, for a harder moment. It stays on this phone and goes nowhere else." tone="dusk" glowColor={BLUE}>
      {PARTS.map((part, i) => {
        const items = lists[part.key];
        const draft = drafts[part.key] ?? '';
        const names = part.key === 'reach' ? people.filter((p) => !items.some((x) => x.text === p.name)) : [];
        return (
          <Reveal key={part.key} index={i}>
            <Section title={part.title} note={part.note}>
              <View style={styles.list}>
                {items.map((it) => (
                  <Animated.View key={it.id} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
                    <Card style={styles.item}>
                      <Text style={styles.itemText}>{it.text}</Text>
                      <IconButton icon="trash" label={`Remove ${it.text}`} onPress={() => remove(part.key, it.id)} />
                    </Card>
                  </Animated.View>
                ))}
              </View>
              {names.length ? (
                <ChipRow>
                  {names.map((p) => (
                    <Chip key={p.id} label={`Add ${p.name}`} color={BLUE} onPress={() => add('reach', p.name)} />
                  ))}
                </ChipRow>
              ) : null}
              <Field
                value={draft}
                onChangeText={(t) => setDrafts((d) => ({ ...d, [part.key]: t }))}
                placeholder={part.placeholder}
                returnKeyType="done"
                onSubmitEditing={() => add(part.key, draft)}
                containerStyle={styles.gap}
              />
              <Button label="Add" icon="plus" variant="secondary" size="sm" onPress={() => add(part.key, draft)} disabled={!draft.trim()} style={styles.gap} />
            </Section>
          </Reveal>
        );
      })}
      <Reveal index={PARTS.length}>
        <Section title="Help lines" note="Free, private, any time. The first step is reaching out.">
          <HelpCard />
        </Section>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text },
  gap: { marginTop: 10 },
});
