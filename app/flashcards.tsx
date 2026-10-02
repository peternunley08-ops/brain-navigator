import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Reveal } from '../components/ui/Reveal';
import { ScienceNote } from '../components/ui/ScienceNote';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { deckStats, dueCards, parseCards, useLifeStore } from '../core/lifeStore';
import { plural } from '../core/words';
import { CLASS_COLORS, useSchoolStore } from '../core/schoolStore';
import { colors, fonts } from '../core/theme';

// Flashcard decks — the most reliable way to study there is. Cards you
// know come back less often; cards you miss come back tomorrow.
export default function FlashcardsScreen() {
  const { classId, create } = useLocalSearchParams<{ classId?: string; create?: string }>();
  const decks = useLifeStore((s) => s.decks);
  const saveDeck = useLifeStore((s) => s.saveDeck);
  const classes = useSchoolStore((s) => s.classes);
  const real = classes.filter((c) => c.kind === 'class');

  const [making, setMaking] = useState(create === '1' || decks.length === 0);
  const [name, setName] = useState('');
  const [cls, setCls] = useState<string | null>(classId ?? null);
  // A deck a friend shared as text: the first line is its name, the rest are cards.
  const [shared, setShared] = useState('');
  const [pasting, setPasting] = useState(false);
  const sharedLines = shared.split('\n').map((l) => l.trim()).filter(Boolean);
  const sharedCards = parseCards(shared);
  const sharedName = sharedLines[0] && !parseCards(sharedLines[0]).length ? sharedLines[0] : 'Shared deck';
  const importShared = () => {
    if (!sharedCards.length) return;
    const c = real.find((x) => x.id === cls);
    const deck = saveDeck({ name: sharedName, classId: cls, color: c?.color ?? CLASS_COLORS[decks.length % CLASS_COLORS.length] });
    useLifeStore.getState().addCards(deck.id, sharedCards);
    setShared('');
    setPasting(false);
    setMaking(false);
    router.push({ pathname: '/deck/[id]', params: { id: deck.id } });
  };

  const dueTotal = decks.reduce((s, d) => s + dueCards(d).length, 0);

  const make = () => {
    const n = name.trim();
    if (!n) return;
    const c = real.find((x) => x.id === cls);
    const deck = saveDeck({ name: n, classId: cls, color: c?.color ?? CLASS_COLORS[decks.length % CLASS_COLORS.length] });
    setName('');
    setMaking(false);
    router.push({ pathname: '/deck/[id]', params: { id: deck.id, add: '1' } });
  };

  return (
    <Screen
      title="Flashcards"
      subtitle={decks.length ? (dueTotal ? `${plural(dueTotal, 'card')} ready to study.` : 'Nothing due. Your memory’s holding.') : 'Quiz yourself. It beats rereading.'}
      right={decks.length ? <IconButton icon="plus" label="New deck" onPress={() => setMaking((m) => !m)} /> : undefined}
    >
      {making ? (
        <Animated.View entering={FadeInDown.duration(260)}>
          <Section title="New deck">
            <Card>
              <Field placeholder="e.g. Bio unit 4 vocab" value={name} onChangeText={setName} autoFocus returnKeyType="done" onSubmitEditing={make} />
              {real.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
                  <Chip label="No class" selected={!cls} onPress={() => setCls(null)} />
                  {real.map((c) => (
                    <Chip key={c.id} label={c.name} dot color={c.color} selected={cls === c.id} onPress={() => setCls(c.id)} />
                  ))}
                </ScrollView>
              ) : null}
              <Button label="Make the deck" icon="cards" onPress={make} disabled={!name.trim()} style={styles.gap} />
              <Button
                label={pasting ? 'Never mind' : 'Paste a deck someone shared'}
                icon={pasting ? 'close' : 'share'}
                variant="ghost"
                size="sm"
                onPress={() => setPasting((v) => !v)}
                style={styles.gap}
              />
              {pasting ? (
                <>
                  <Field
                    multiline
                    value={shared}
                    onChangeText={setShared}
                    placeholder={'Bio unit 4\nmitosis :: cell division\nosmosis :: water across a membrane'}
                    hint={sharedCards.length ? `“${sharedName}”, ${plural(sharedCards.length, 'card')}` : 'Paste the whole message. The first line becomes the name.'}
                    autoCapitalize="none"
                  />
                  <Button label={`Add “${sharedName}”`} icon="plus" variant="secondary" onPress={importShared} disabled={!sharedCards.length} style={styles.gap} />
                </>
              ) : null}
            </Card>
          </Section>
        </Animated.View>
      ) : null}

      {decks.length === 0 && !making ? <EmptyState gear="glasses" title="No decks yet." body="Make one for whatever’s on the next test." /> : null}

      {decks.length ? (
        <Section title="Your decks">
          <View style={styles.list}>
            {decks.map((d, i) => {
              const st = deckStats(d);
              const due = dueCards(d).length;
              const c = classes.find((x) => x.id === d.classId);
              return (
                <Reveal key={d.id} index={i}>
                  <Card onPress={() => router.push(`/deck/${d.id}`)} tint={due ? d.color : undefined}>
                    <View style={styles.row}>
                      <View style={[styles.icon, { backgroundColor: `${d.color}26` }]}>
                        <Icon name="cards" size={20} color={d.color} />
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.name} numberOfLines={1}>
                          {d.name}
                        </Text>
                        <Text style={styles.sub}>
                          {c ? `${c.name}, ` : ''}
                          {st.total} ${plural(st.total, 'card')}
                        </Text>
                      </View>
                      {due ? (
                        <View style={[styles.due, { backgroundColor: d.color }]}>
                          <Text style={styles.dueText}>{due}</Text>
                        </View>
                      ) : (
                        <Icon name="check" size={18} color={colors.secured} />
                      )}
                    </View>
                    {st.total ? <ProgressBar value={st.mastered / st.total} color={colors.secured} height={5} style={styles.bar} /> : null}
                    {st.total ? (
                      <Text style={styles.stats}>
                        {st.mastered} mastered, {st.learning} learning, {st.fresh} new
                      </Text>
                    ) : null}
                  </Card>
                </Reveal>
              );
            })}
          </View>
        </Section>
      ) : null}

      <Reveal index={decks.length + 1}>
        <ScienceNote fact="Retrieval practice — pulling an answer out of memory instead of reading it again — is one of the strongest findings in learning science. Spacing the reviews out (the Leitner system here) makes it stick for weeks instead of days." />
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: {
    marginTop: 14,
  },
  chipScroll: {
    marginTop: 12,
    marginHorizontal: -18,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 18,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  sub: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  due: {
    minWidth: 30,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.flameInk,
  },
  bar: {
    marginTop: 14,
  },
  stats: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
