import * as Haptics from '../../core/haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { buildQuiz, type QuizQuestion } from '../../core/helperOffline';
import { celebrate } from '../../core/celebrateStore';
import { useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { emberSay } from '../ember/EmberBuddy';
import { Sparks } from '../ember/Sparks';
import type { EmberRig } from '../ember/useEmberRig';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { ProgressBar } from '../ui/ProgressBar';
import { Pressy } from '../ui/Pressy';

const VIOLET = '#B79AF0';
const LETTERS = ['A', 'B', 'C', 'D'];
/** Seconds per question in a lightning round. */
const LIGHTNING = 10;

// Quizzo's game show: multiple choice built from your own flashcards.
// Right answers score more on a streak, and every answer counts as a
// flashcard review (so the spacing stays honest).
export function QuizGame({
  rig,
  deckId,
  onAskAI,
  onPlaying,
  autoStart,
}: {
  rig: EmberRig;
  deckId?: string;
  onAskAI: () => void;
  onPlaying?: (playing: boolean) => void;
  /** Bumped to start a game right away (from "last time" on the helper screen). */
  autoStart?: number;
}) {
  const decks = useLifeStore((s) => s.decks);
  const gradeCard = useLifeStore((s) => s.gradeCard);
  const recordQuiz = useLifeStore((s) => s.recordQuiz);
  const best = useLifeStore((s) => s.quiz.best);
  const lightningBest = useLifeStore((s) => s.quiz.lightningBest ?? 0);
  const usable = decks.filter((d) => d.cards.length > 0);

  const [picked, setPicked] = useState<string>(deckId && usable.some((d) => d.id === deckId) ? deckId : 'all');
  const [qs, setQs] = useState<QuizQuestion[] | null>(null);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(0);
  const [over, setOver] = useState(false);
  const [lightning, setLightning] = useState(false);
  const [left, setLeft] = useState(LIGHTNING);
  const answerRef = useRef<(k: number) => void>(() => {});

  // Lightning round: the clock runs while a question is open; at zero it's a miss.
  useEffect(() => {
    if (!lightning || !qs || over || i >= qs.length || chosen != null) return;
    const t0 = Date.now();
    setLeft(LIGHTNING);
    const iv = setInterval(() => {
      const l = Math.max(0, LIGHTNING - (Date.now() - t0) / 1000);
      setLeft(l);
      if (l <= 0) {
        clearInterval(iv);
        answerRef.current(-1);
      }
    }, 200);
    return () => clearInterval(iv);
  }, [lightning, qs, over, i, chosen]);

  const chosenDecks = picked === 'all' ? usable : usable.filter((d) => d.id === picked);
  const cardCount = chosenDecks.reduce((s, d) => s + d.cards.length, 0);
  useEffect(() => {
    if (autoStart && cardCount >= 2) start();
    // Only when asked again, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);
  // Fewer than four different answers means true or false questions.
  const smallDeck = new Set(chosenDecks.flatMap((d) => d.cards.map((c) => c.back))).size < 4;

  // Questions missed this game, for a quick replay of just those.
  const [missed, setMissed] = useState<QuizQuestion[]>([]);

  const start = (only?: QuizQuestion[]) => {
    const q = only?.length
      ? only.map((m) => {
          // Same question, choices shuffled so the replay isn't just memory of positions.
          if (m.trueFalse) return m;
          const options = [...m.options].sort(() => Math.random() - 0.5);
          return { ...m, options, answer: options.indexOf(m.options[m.answer]) };
        })
      : buildQuiz(picked === 'all' ? usable : usable.filter((d) => d.id === picked));
    setQs(q);
    setMissed([]);
    setI(0);
    setChosen(null);
    setScore(0);
    setRight(0);
    setStreak(0);
    setOver(false);
    onPlaying?.(true);
    rig.setMood('cheer');
    rig.hopUp(12);
  };

  if (!usable.length) {
    return (
      <EmptyState gear="glasses" title="No flashcards yet." body="Quizzo builds games from your flashcards. Make a deck, or switch to AI chat and get quizzed on any topic.">
        <Button label="Make flashcards" icon="cards" onPress={() => router.push('/flashcards')} />
        <Button label="Quiz me with AI" variant="ghost" size="sm" onPress={onAskAI} />
      </EmptyState>
    );
  }

  if (!qs) {
    return (
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={styles.label}>Which deck?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
          <Chip label="Everything" selected={picked === 'all'} color={VIOLET} onPress={() => setPicked('all')} />
          {usable.map((d) => (
            <Chip key={d.id} label={d.name} dot color={d.color} selected={picked === d.id} onPress={() => setPicked(d.id)} />
          ))}
        </ScrollView>
        <Card style={styles.rules}>
          <Rule
            icon="bolt"
            text={`Up to 10 ${smallDeck ? 'true or false questions' : 'questions, four choices each'}.${lightning ? ` ${LIGHTNING} seconds each; faster answers score more.` : ''}`}
          />
          <Rule icon="flame" text="Streaks score extra. Wrong answers come back tomorrow." />
          <Rule
            icon="trophy"
            text={lightning ? (lightningBest ? `Your lightning best: ${lightningBest} points.` : 'Set your first lightning score.') : best ? `Your best: ${best} points.` : 'Set your first high score.'}
          />
        </Card>
        <View style={styles.modeRow}>
          <Chip label={`Lightning round: ${LIGHTNING} seconds each`} icon="bolt" color={VIOLET} selected={lightning} onPress={() => setLightning((v) => !v)} />
        </View>
        {cardCount < 2 ? <Text style={styles.warn}>Add at least two cards to play.</Text> : null}
        <Button label="Start the game" icon="play" onPress={() => start()} disabled={cardCount < 2} style={styles.go} />
      </Animated.View>
    );
  }

  if (over || i >= qs.length) {
    const pct = qs.length ? right / qs.length : 0;
    return (
      <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.end}>
        <Sparks burst={burst} reach={90} />
        <Icon name="trophy" size={46} color={VIOLET} />
        <Text style={styles.endScore}>{score}</Text>
        <Text style={styles.endLine}>
          {right} of {qs.length} right{score >= best && score > 0 ? '. A new best.' : ''}
        </Text>
        <Text style={styles.endQuip}>
          {pct === 1 ? 'Flawless. Quizzo is speechless. (Quizzo is never speechless.)' : pct >= 0.7 ? 'Big brain energy. The misses come back tomorrow.' : 'Every miss is a card you’ll know next time. That’s the whole trick.'}
        </Text>
        {missed.length ? (
          <Button label={`Replay the ${missed.length} I missed`} icon="repeat" onPress={() => start(missed)} style={styles.go} />
        ) : null}
        <Button label="Play again" icon={missed.length ? 'play' : 'repeat'} variant={missed.length ? 'secondary' : 'primary'} onPress={() => start()} style={styles.go} />
        <Button
          label="Pick another deck"
          variant="ghost"
          size="sm"
          onPress={() => {
            setQs(null);
            onPlaying?.(false);
          }}
        />
      </Animated.View>
    );
  }

  const q = qs[i];
  const answer = (k: number) => {
    if (chosen != null) return;
    setChosen(k);
    const ok = k === q.answer;
    gradeCard(q.deckId, q.card.id, ok);
    if (ok) {
      setScore((s) => s + 10 + streak * 2 + (lightning ? Math.ceil(left) : 0));
      setRight((r) => r + 1);
      setStreak((s) => s + 1);
      setBurst((b) => b + 1);
      rig.setMood('cheer');
      rig.hopUp(16);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setStreak(0);
      setMissed((m) => [...m, q]);
      rig.setMood('concerned');
      rig.wiggle();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  };
  const next = () => {
    rig.setMood('idle');
    if (i + 1 >= qs.length) {
      const final = score;
      recordQuiz(final, right, lightning);
      useLifeStore.getState().noteHelperLast('quizzo', `you scored ${final}, ${right} of ${qs.length} right${lightning ? ' in a lightning round' : ''}`);
      setOver(true);
      setBurst((b) => b + 1);
      if (final >= 100 && final > best) celebrate(`${final} points`, 'A new Quizzo high score. That deck is yours now.', VIOLET, { win: `Scored ${final} in Quizzo` });
      else if (final > best) emberSay(`New Quizzo high score: ${final}!`, 'cheer');
      else if (final >= 100) emberSay(`${final} points. Triple digits again.`, 'cheer');
      return;
    }
    setI(i + 1);
    setChosen(null);
  };

  answerRef.current = answer;

  return (
    <View>
      <View style={styles.hud}>
        <Text style={styles.hudText}>
          {i + 1} / {qs.length}
        </Text>
        <ProgressBar value={(i + (chosen != null ? 1 : 0)) / qs.length} color={VIOLET} height={6} style={styles.flex} />
        <View style={styles.streak}>
          <Icon name="flame" size={14} color={streak >= 2 ? colors.flame : colors.textFaint} />
          <Text style={[styles.hudText, streak >= 2 && { color: colors.flame }]}>{streak}</Text>
        </View>
        <Text style={styles.score}>{score}</Text>
      </View>
      <Animated.View key={q.card.id + i} entering={FadeInRight.duration(260)}>
        <Card tint={VIOLET} style={styles.question}>
          <Sparks burst={burst} reach={60} />
          {q.trueFalse ? <Text style={styles.tf}>True or false?</Text> : null}
          <Text style={styles.qText}>{q.prompt}</Text>
          {lightning ? (
            <View style={styles.clockRow}>
              <ProgressBar value={chosen != null ? 0 : left / LIGHTNING} color={left <= 3 ? colors.danger : VIOLET} height={5} style={styles.flex} />
              <Text style={[styles.clock, left <= 3 && { color: colors.danger }]}>{chosen != null ? '' : Math.ceil(left)}</Text>
            </View>
          ) : null}
        </Card>
        {q.options.map((o, k) => {
          const isRight = chosen != null && k === q.answer;
          const isWrong = chosen === k && k !== q.answer;
          return (
            <Pressy
              key={k}
              onPress={() => answer(k)}
              disabled={chosen != null}
              style={[
                styles.option,
                isRight && { borderColor: colors.secured, backgroundColor: alpha(colors.secured, 0.14) },
                isWrong && { borderColor: colors.danger, backgroundColor: alpha(colors.danger, 0.12) },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${LETTERS[k]}: ${o}`}
            >
              <View style={[styles.letter, isRight && { backgroundColor: colors.secured }, isWrong && { backgroundColor: colors.danger }]}>
                <Text style={[styles.letterText, (isRight || isWrong) && { color: colors.flameInk }]}>{LETTERS[k]}</Text>
              </View>
              <Text style={styles.optionText}>{o}</Text>
              {isRight ? <Icon name="check" size={18} color={colors.secured} strokeWidth={2.6} /> : null}
            </Pressy>
          );
        })}
      </Animated.View>
      {chosen != null ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <Text style={styles.feedback}>
            {chosen === q.answer
              ? streak >= 3
                ? `${streak} in a row`
                : 'Nailed it.'
              : q.trueFalse
                ? `${chosen === -1 ? 'Time! ' : ''}${q.answer === 0 ? 'That one was true.' : `False: it’s “${q.card.back}”.`} It’ll come back tomorrow.`
                : chosen === -1
                  ? `Time! It’s “${q.options[q.answer]}”. It’ll come back tomorrow.`
                  : `It’s “${q.options[q.answer]}”. It’ll come back tomorrow.`}
          </Text>
          <Button label={i + 1 >= qs.length ? 'See my score' : 'Next question'} icon="arrow" onPress={next} style={styles.go} />
        </Animated.View>
      ) : null}
    </View>
  );
}

function Rule({ icon, text }: { icon: 'bolt' | 'flame' | 'trophy'; text: string }) {
  return (
    <View style={styles.rule}>
      <Icon name={icon} size={16} color={VIOLET} />
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  chipScroll: {
    marginHorizontal: -20,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 20,
  },
  rules: {
    marginTop: 14,
    gap: 10,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  modeRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    alignSelf: 'stretch',
  },
  clock: {
    width: 22,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: VIOLET,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  warn: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.flame,
    textAlign: 'center',
  },
  go: {
    marginTop: 16,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  hudText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  score: {
    minWidth: 40,
    textAlign: 'right',
    fontFamily: fonts.display,
    fontSize: 20,
    color: VIOLET,
    fontVariant: ['tabular-nums'],
  },
  question: {
    marginTop: 14,
    minHeight: 130,
    justifyContent: 'center',
  },
  tf: {
    marginBottom: 6,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: VIOLET,
  },
  qText: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 31,
    color: colors.text,
    textAlign: 'center',
  },
  option: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(VIOLET, 0.16),
  },
  letterText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: VIOLET,
  },
  optionText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  feedback: {
    marginTop: 14,
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    color: colors.text,
    textAlign: 'center',
  },
  end: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  endScore: {
    marginTop: 10,
    fontFamily: fonts.display,
    fontSize: 56,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  endLine: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textMuted,
  },
  endQuip: {
    marginTop: 10,
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 320,
  },
});
