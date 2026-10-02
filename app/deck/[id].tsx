import * as Haptics from '../../core/haptics';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
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
import { Chip, ChipRow } from '../../components/ui/Chip';
import { goBack } from '../../core/chrome';
import { cheerLine } from '../../core/about';
import { checkAnswer, deckStats, dueCards, type Flashcard, parseCards, useLifeStore } from '../../core/lifeStore';
import { plural } from '../../core/words';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { offerUndo } from '../../core/undoStore';

type Mode = 'cards' | 'study';

export default function DeckScreen() {
  const { id, add } = useLocalSearchParams<{ id: string; add?: string }>();
  const deck = useLifeStore((s) => s.decks.find((d) => d.id === id));
  const [mode, setMode] = useState<Mode>('cards');
  // How you study this deck is remembered with it.
  const typeIt = !!deck?.study?.type;
  const reverse = !!deck?.study?.reverse;
  const hardest = !!deck?.study?.hardest;
  const setStudy = (patch: { type?: boolean; reverse?: boolean; hardest?: boolean }) =>
    deck && useLifeStore.getState().updateDeck(deck.id, { study: { ...deck.study, ...patch } });

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
      subtitle={`${plural(st.total, 'card')}, ${st.mastered} mastered${due ? `, ${due} to study` : ''}`}
      nav={mode !== 'study'}
      right={
        <View style={styles.headerBtns}>
          {deck.cards.length ? (
            <IconButton
              icon="share"
              label="Share deck as text"
              onPress={() =>
                // The same "front :: back" lines "Paste a list" reads, so a friend can import it.
                Share.share({ message: `${deck.name}\n${deck.cards.map((c) => `${c.front} :: ${c.back}`).join('\n')}` })
              }
            />
          ) : null}
          <IconButton
            icon="trash"
            label="Delete deck"
            color={alpha(colors.danger, 0.8)}
            onPress={() => {
              const snap = deck;
              useLifeStore.getState().deleteDeck(deck.id);
              offerUndo(`Deleted “${snap.name}”`, () => useLifeStore.getState().restoreDeck(snap));
              goBack();
            }}
          />
        </View>
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
      {mode === 'study' && deck.cards.length ? (
        <ChipRow style={styles.gapSm}>
          <Chip label="Type the answer" icon="pen" selected={typeIt} onPress={() => setStudy({ type: !typeIt })} />
          <Chip label="Back to front" icon="repeat" selected={reverse} onPress={() => setStudy({ reverse: !reverse })} />
          <Chip label="Hardest first" icon="bolt" selected={hardest} onPress={() => setStudy({ hardest: !hardest })} />
        </ChipRow>
      ) : null}
      {mode === 'cards' ? (
        <CardsView deckId={deck.id} startAdding={add === '1'} onStudy={() => setMode('study')} />
      ) : (
        // Changing the order starts a fresh session in that order.
        <StudyView key={hardest ? 'hard' : 'mix'} deckId={deck.id} typeIt={typeIt} reverse={reverse} hardest={hardest} onDone={() => setMode('cards')} />
      )}
    </Screen>
  );
}

function CardsView({ deckId, startAdding, onStudy }: { deckId: string; startAdding: boolean; onStudy: () => void }) {
  const deck = useLifeStore((s) => s.decks.find((d) => d.id === deckId))!;
  const addCards = useLifeStore((s) => s.addCards);
  const deleteCard = useLifeStore((s) => s.deleteCard);
  const updateCard = useLifeStore((s) => s.updateCard);
  const [editing, setEditing] = useState<string | null>(null);
  const [find, setFind] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [bulk, setBulk] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  // Big decks render in pages so the screen stays quick.
  const [shown, setShown] = useState(40);
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
        {st.total ? <Button label={due ? `Study ${plural(due, 'card')}` : 'Study anyway'} icon="play" onPress={onStudy} style={styles.gap} /> : null}
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
                  label={parsed.length ? `Add ${plural(parsed.length, 'card')}` : 'Add cards'}
                  icon="plus"
                  disabled={!parsed.length}
                  onPress={() => {
                    addCards(deck.id, parsed);
                    emberSay(`${plural(parsed.length, 'card')} in. Quiz yourself before you reread anything.`, 'happy');
                    setBulk('');
                    setBulkOpen(false);
                  }}
                  style={styles.gap}
                />
              </>
            ) : (
              <>
                <Field placeholder="Front: the question or term" value={front} onChangeText={setFront} autoFocus={startAdding} />
                <Field placeholder="Back: the answer" value={back} onChangeText={setBack} containerStyle={styles.gapSm} returnKeyType="done" onSubmitEditing={addOne} />
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
              {deck.cards.length > 10 ? (
                <Field value={find} onChangeText={setFind} placeholder="Find a card" autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" />
              ) : null}
              {[...deck.cards]
                .reverse()
                .filter((c) => !find.trim() || `${c.front} ${c.back}`.toLowerCase().includes(find.trim().toLowerCase()))
                .slice(0, shown)
                .map((c) => (
                <Animated.View key={c.id} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
                  {editing === c.id ? (
                    <Card style={styles.editCard}>
                      <Field defaultValue={c.front} onChangeText={(t) => t.trim() && updateCard(deck.id, c.id, { front: t.trim() })} placeholder="Front" autoFocus />
                      <Field defaultValue={c.back} onChangeText={(t) => t.trim() && updateCard(deck.id, c.id, { back: t.trim() })} placeholder="Back" containerStyle={styles.gapSm} />
                      <Button label="Done" icon="check" variant="secondary" size="sm" onPress={() => setEditing(null)} style={styles.gapSm} />
                    </Card>
                  ) : (
                  <Card style={styles.cardRow} onPress={() => setEditing(c.id)} accessibilityHint="Tap to edit">
                    <View style={styles.flex}>
                      <Text style={styles.front}>{c.front}</Text>
                      <Text style={styles.back}>{c.back}</Text>
                    </View>
                    <View style={[styles.box, { backgroundColor: alpha(c.box >= 4 ? colors.secured : c.seen ? colors.flame : colors.textFaint, 0.18) }]}>
                      <Text style={[styles.boxText, { color: c.box >= 4 ? colors.secured : c.seen ? colors.flame : colors.textFaint }]}>{c.seen ? c.box : 'new'}</Text>
                    </View>
                    <Pressy
                      onPress={() => {
                        const before = useLifeStore.getState().decks;
                        deleteCard(deck.id, c.id);
                        offerUndo('Removed a card', () => useLifeStore.getState().putBack({ decks: before }), 'trash');
                      }}
                      hitSlop={10}
                      accessibilityLabel={`Delete card ${c.front}`}
                    >
                      <Icon name="close" size={15} color={colors.textFaint} />
                    </Pressy>
                  </Card>
                  )}
                </Animated.View>
              ))}
              {deck.cards.length > shown ? (
                <Button label={`Show ${Math.min(40, deck.cards.length - shown)} more`} variant="ghost" size="sm" onPress={() => setShown((n) => n + 40)} />
              ) : null}
            </View>
          </Section>
        </Reveal>
      ) : null}
    </>
  );
}

function StudyView({ deckId, typeIt, reverse, hardest, onDone }: { deckId: string; typeIt: boolean; reverse: boolean; hardest: boolean; onDone: () => void }) {
  const deck = useLifeStore((s) => s.decks.find((d) => d.id === deckId))!;
  const gradeCard = useLifeStore((s) => s.gradeCard);
  const reduced = useReducedMotion();

  // The session's queue is fixed when it starts: due cards first, or
  // everything if nothing's due. Misses go to the back to try again.
  const [queue, setQueue] = useState<string[]>(() => {
    const due = dueCards(deck);
    const pool = due.length ? due : deck.cards;
    const mixed = [...pool].sort(() => Math.random() - 0.5);
    // Hardest first: lowest box first, and among those the most-reviewed (the ones that keep slipping).
    return (hardest ? mixed.sort((a, b) => a.box - b.box || b.seen - a.seen) : mixed).map((c) => c.id);
  });
  const [total] = useState(queue.length);
  const [right, setRight] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [burst, setBurst] = useState(0);
  const [typed, setTyped] = useState('');
  const flip = useSharedValue(0);

  const card: Flashcard | undefined = deck.cards.find((c) => c.id === queue[0]);
  // Back to front: show the definition, recall the term.
  const ask = card ? (reverse ? card.back : card.front) : '';
  const reply = card ? (reverse ? card.front : card.back) : '';
  const verdict = typeIt && flipped && card ? checkAnswer(typed, reply) : null;

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
    setTyped('');
    setFlipped(false);
    flip.value = 0;
    setQueue((q) => (ok ? q.slice(1) : [...q.slice(1), q[0]]));
    if (ok && queue.length === 1) {
      setBurst((b) => b + 1);
      emberSay(cheerLine('Deck done. Your brain just did the hard, good kind of work.'), 'cheer');
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
          {total} ${plural(total, 'card')} reviewed. Cards you knew come back in a few days; the tricky ones come back tomorrow.
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
      <Pressy
        onPress={turn}
        disabled={typeIt && !flipped}
        depth={0.98}
        accessibilityRole="button"
        accessibilityLabel={flipped ? `Answer: ${reply}. Tap to flip back.` : `${ask}. Tap to see the answer.`}
        style={[styles.flipWrap, typeIt && styles.flipShort]}
      >
        <Animated.View style={[styles.face, { borderColor: alpha(deck.color, 0.45) }, frontStyle]}>
          <Text style={styles.faceLabel}>{reverse ? 'Back' : 'Front'}</Text>
          <Text style={styles.faceText}>{ask}</Text>
          {typeIt ? null : <Text style={styles.tapHint}>Say it in your head, then tap</Text>}
        </Animated.View>
        <Animated.View style={[styles.face, styles.faceBack, { borderColor: alpha(deck.color, 0.7), backgroundColor: alpha(deck.color, 0.1) }, backStyle]}>
          <Text style={[styles.faceLabel, { color: deck.color }]}>{reverse ? 'Front' : 'Back'}</Text>
          <Text style={styles.faceText}>{reply}</Text>
          {verdict ? (
            <Text style={[styles.verdict, { color: verdict === 'match' ? colors.secured : verdict === 'close' ? colors.flame : colors.unlocked }]}>
              {verdict === 'match' ? 'You had it' : verdict === 'close' ? `Close: you wrote “${typed.trim()}”` : typed.trim() ? `You wrote “${typed.trim()}”` : 'No answer typed'}
            </Text>
          ) : null}
        </Animated.View>
      </Pressy>
      {typeIt ? (
        <Field
          // Uncontrolled: a fresh field per card, and fast typing never loses letters.
          key={card.id}
          defaultValue=""
          onChangeText={(t) => !flipped && setTyped(t)}
          placeholder="Type what’s on the other side"
          autoFocus
          autoCorrect={false}
          // Return checks; after a match, Return again moves on. The keyboard stays up between cards.
          returnKeyType={flipped ? 'next' : 'done'}
          submitBehavior="submit"
          onSubmitEditing={() => (flipped ? verdict === 'match' && answer(true) : turn())}
          containerStyle={styles.gap}
        />
      ) : null}
      {flipped ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.answers}>
          <Button label="Again" icon="repeat" variant="secondary" tint={colors.unlocked} onPress={() => answer(false)} style={styles.flex} />
          <Button label={verdict === 'close' ? 'Count it' : 'Got it'} icon="check" onPress={() => answer(true)} style={styles.flex} />
        </Animated.View>
      ) : (
        <Button label={typeIt ? 'Check' : 'Show the answer'} variant="secondary" onPress={turn} style={styles.gap} />
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
  headerBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  flipShort: {
    height: 200,
  },
  verdict: {
    position: 'absolute',
    bottom: 18,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 13,
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
  editCard: {
    paddingVertical: 12,
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
    fontVariant: ['tabular-nums'],
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
