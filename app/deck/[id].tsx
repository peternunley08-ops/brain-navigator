import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { emberSay } from '../../components/ember/EmberBuddy';
import { Sparks } from '../../components/ember/Sparks';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Pressy } from '../../components/ui/Pressy';
import { Reveal } from '../../components/ui/Reveal';
import { Screen } from '../../components/ui/Screen';
import { Section } from '../../components/ui/Section';
import { Segmented } from '../../components/ui/Segmented';
import { StatTile } from '../../components/ui/StatTile';
import { deckStats, dueCards, type Flashcard, parseCards, useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { offerUndo } from '../../core/undoStore';

type Mode = 'cards' | 'study';

export default function DeckScreen() {
  const { id, add } = useLocalSearchParams<{ id: string; add?: string }>();
  const deck = useLifeStore((s) => s.decks.find((d) => d.id === id));
  const [mode, setMode] = useState<Mode>('cards');

  if (!deck) {
    return (
      <Screen>
        <EmptyState title="This deck is gone." />
      </Screen>
    );
  }

  const st = deckStats(deck);
  const due = dueCards(deck).length;

  return (
    <Screen
      glowColor={deck.color}
      title={deck.name}
      subtitle={`${st.total} cards · ${st.mastered} mastered${due ? ` · ${due} to study` : ''}`}
      nav={mode !== 'study'}
      right={
        <IconButton
          icon="trash"
          label="Delete deck"
          color={alpha(colors.danger, 0.8)}
          onPress={() => {
            const snap = deck;
            useLifeStore.getState().deleteDeck(deck.id);
            offerUndo(`Deleted “${snap.name}”`, () => useLifeStore.getState().restoreDeck(snap));
            router.back();
          }}
        />
      }
    >
      <Reveal index={0}>
        <Segmented<Mode>
          options={[
            { key: 'cards', label: 'Cards' },
            { key: 'study', label: due ? `Study ${due}` : 'Study' },
          ]}
          value={mode}
          onChange={setMode}
          style={styles.seg}
        />
      </Reveal>
      {mode === 'cards' ? <CardsView deckId={deck.id} startAdding={add === '1'} onStudy={() => setMode('study')} /> : <StudyView deckId={deck.id} onDone={() => setMode('cards')} />}
    </Screen>
  );
}

function CardsView({ deckId, startAdding, onStudy }: { deckId: string; startAdding: boolean; onStudy: () => void }) {
  const deck = useLifeStore((s) => s.decks.find((d) => d.id === deckId))!;
  const addCards = useLifeStore((s) => s.addCards);
  const deleteCard = useLifeStore((s) => s.deleteCard);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [bulk, setBulk] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const parsed = useMemo(() => parseCards(bulk), [bulk]);
  const st = deckStats(deck);
  const due = dueCards(deck).length;

  const addOne = () => {
    if (!front.trim() || !back.trim()) return;
    addCards(deck.id, [{ front, back }]);
    setFront('');
    setBack('');
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <>
      <Reveal index={1}>
        <View style={styles.stats}>
          <StatTile label="New" value={String(st.fresh)} />
          <StatTile label="Learning" value={String(st.learning)} color={colors.flame} />
          <StatTile label="Mastered" value={String(st.mastered)} color={colors.secured} />
        </View>
        {st.total ? <Button label={due ? `Study ${due} card${due === 1 ? '' : 's'}` : 'Study anyway'} icon="play" onPress={onStudy} style={styles.gap} /> : null}
      </Reveal>

      <Reveal index={2}>
        <Section title="Add cards" action={{ label: bulkOpen ? 'One at a time' : 'Paste a list', onPress: () => setBulkOpen((v) => !v) }}>
          <Card>
            {bulkOpen ? (
              <>
                <Field
                  multiline
                  value={bulk}
                  onChangeText={setBulk}
                  placeholder={'mitochondria :: powerhouse of the cell\nosmosis :: water moving across a membrane'}
                  hint="One card per line. Separate the two sides with :: or a dash."
                />
                <Button
                  label={parsed.length ? `Add ${parsed.length} card${parsed.length === 1 ? '' : 's'}` : 'Add cards'}
                  icon="plus"
                  disabled={!parsed.length}
                  onPress={() => {
                    addCards(deck.id, parsed);
                    emberSay(`${parsed.length} cards in. Quiz yourself before you reread anything.`, 'happy');
                    setBulk('');
                    setBulkOpen(false);
                  }}
                  style={styles.gap}
                />
              </>
            ) : (
              <>
                <Field placeholder="Front — the question or term" value={front} onChangeText={setFront} autoFocus={startAdding} />
                <Field placeholder="Back — the answer" value={back} onChangeText={setBack} containerStyle={styles.gapSm} returnKeyType="done" onSubmitEditing={addOne} />
                <Button label="Add card" icon="plus" variant="secondary" onPress={addOne} disabled={!front.trim() || !back.trim()} style={styles.gap} />
              </>
            )}
          </Card>
        </Section>
      </Reveal>

      {deck.cards.length ? (
        <Reveal index={3}>
          <Section title="All cards" note={`${deck.cards.length}`}>
            <View style={styles.list}>
              {[...deck.cards].reverse().map((c) => (
                <Animated.View key={c.id} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
                  <Card style={styles.cardRow}>
                    <View style={styles.flex}>
                      <Text style={styles.front}>{c.front}</Text>
                      <Text style={styles.back}>{c.back}</Text>
                    </View>
                    <View style={[styles.box, { backgroundColor: alpha(c.box >= 4 ? colors.secured : c.seen ? colors.flame : colors.textFaint, 0.18) }]}>
                      <Text style={[styles.boxText, { color: c.box >= 4 ? colors.secured : c.seen ? colors.flame : colors.textFaint }]}>{c.seen ? c.box : 'new'}</Text>
                    </View>
                    <Pressy onPress={() => deleteCard(deck.id, c.id)} hitSlop={10} accessibilityLabel={`Delete card ${c.front}`}>
                      <Icon name="close" size={15} color={colors.textFaint} />
                    </Pressy>
                  </Card>
                </Animated.View>
              ))}
            </View>
          </Section>
        </Reveal>
      ) : null}
    </>
  );
}

function StudyView({ deckId, onDone }: { deckId: string; onDone: () => void }) {
  const deck = useLifeStore((s) => s.decks.find((d) => d.id === deckId))!;
  const gradeCard = useLifeStore((s) => s.gradeCard);
  const reduced = useReducedMotion();

  // The session's queue is fixed when it starts: due cards first, or
  // everything if nothing's due. Misses go to the back to try again.
  const [queue, setQueue] = useState<string[]>(() => {
    const due = dueCards(deck);
    const pool = due.length ? due : deck.cards;
    return [...pool].sort(() => Math.random() - 0.5).map((c) => c.id);
  });
  const [total] = useState(queue.length);
  const [right, setRight] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [burst, setBurst] = useState(0);
  const flip = useSharedValue(0);

  const card: Flashcard | undefined = deck.cards.find((c) => c.id === queue[0]);

  const turn = () => {
    const to = flipped ? 0 : 1;
    setFlipped(!flipped);
    flip.value = reduced ? to : withTiming(to, { duration: 380 });
    Haptics.selectionAsync().catch(() => {});
  };

  const answer = (ok: boolean) => {
    if (!card) return;
    gradeCard(deck.id, card.id, ok);
    Haptics.impactAsync(ok ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    if (ok) setRight((r) => r + 1);
    setFlipped(false);
    flip.value = 0;
    setQueue((q) => (ok ? q.slice(1) : [...q.slice(1), q[0]]));
    if (ok && queue.length === 1) {
      setBurst((b) => b + 1);
      emberSay('Deck done. Your brain just did the hard, good kind of work.', 'cheer');
    }
  };

  // At rest each face gets no 3D transform at all, so its text stays crisp.
  const frontStyle = useAnimatedStyle(() => ({
    transform: flip.value === 0 ? [] : [{ perspective: 900 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: flip.value === 1 ? [] : [{ perspective: 900 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  if (!deck.cards.length) {
    return <EmptyState title="Add a few cards first." />;
  }

  if (!card) {
    return (
      <Animated.View entering={FadeIn} style={styles.done}>
        <Sparks burst={burst} reach={80} />
        <Icon name="trophy" size={44} color={colors.flame} />
        <Text style={styles.doneTitle}>That’s the deck.</Text>
        <Text style={styles.doneBody}>
          {total} card{total === 1 ? '' : 's'} reviewed. Cards you knew come back in a few days; the tricky ones come back tomorrow.
        </Text>
        <Button label="Back to the cards" variant="secondary" onPress={onDone} style={styles.gap} />
      </Animated.View>
    );
  }

  return (
    <View>
      <View style={styles.progressRow}>
        <ProgressBar value={(total - queue.length) / Math.max(1, total)} color={deck.color} style={styles.flex} />
        <Text style={styles.count}>
          {total - queue.length}/{total}
        </Text>
      </View>
      <Pressy onPress={turn} depth={0.98} accessibilityRole="button" accessibilityLabel={flipped ? `Answer: ${card.back}. Tap to flip back.` : `${card.front}. Tap to see the answer.`} style={styles.flipWrap}>
        <Animated.View style={[styles.face, { borderColor: alpha(deck.color, 0.45) }, frontStyle]}>
          <Text style={styles.faceLabel}>Front</Text>
          <Text style={styles.faceText}>{card.front}</Text>
          <Text style={styles.tapHint}>Say it in your head, then tap</Text>
        </Animated.View>
        <Animated.View style={[styles.face, styles.faceBack, { borderColor: alpha(deck.color, 0.7), backgroundColor: alpha(deck.color, 0.1) }, backStyle]}>
          <Text style={[styles.faceLabel, { color: deck.color }]}>Back</Text>
          <Text style={styles.faceText}>{card.back}</Text>
        </Animated.View>
      </Pressy>
      {flipped ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.answers}>
          <Button label="Again" icon="repeat" variant="secondary" tint={colors.unlocked} onPress={() => answer(false)} style={styles.flex} />
          <Button label="Got it" icon="check" onPress={() => answer(true)} style={styles.flex} />
        </Animated.View>
      ) : (
        <Button label="Show the answer" variant="secondary" onPress={turn} style={styles.gap} />
      )}
      <Text style={styles.score}>{right} right so far</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  seg: {
    marginTop: 14,
  },
  gap: {
    marginTop: 14,
  },
  gapSm: {
    marginTop: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  list: {
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  front: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  back: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  box: {
    minWidth: 34,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  count: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  flipWrap: {
    marginTop: 18,
    height: 280,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backfaceVisibility: 'hidden',
  },
  faceBack: {},
  faceLabel: {
    position: 'absolute',
    top: 18,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textFaint,
  },
  faceText: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 33,
    color: colors.text,
    textAlign: 'center',
  },
  tapHint: {
    position: 'absolute',
    bottom: 18,
    fontFamily: fonts.displaySoft,
    fontSize: 13,
    color: colors.textFaint,
  },
  answers: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  score: {
    marginTop: 14,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
  },
  done: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  doneTitle: {
    marginTop: 14,
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
  },
  doneBody: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
});
