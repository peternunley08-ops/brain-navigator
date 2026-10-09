import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { aboutFilled, pickLabel, questionOfTheDay, THIS_OR_THAT } from '../../core/about';
import { dateKey } from '../../core/dates';
import { firstWeekNotes } from '../../core/deskNotes';
import { learnedNotes } from '../../core/learned';
import { useLifeStore, weekOf, type AboutMe } from '../../core/lifeStore';
import { tonightKey, tonightWeekday } from '../../core/night';
import { useSchoolStore } from '../../core/schoolStore';
import { colors, fonts, textGrow } from '../../core/theme';
import { ThisOrThatDeck } from '../about/ThisOrThatDeck';
import { emberSay } from '../ember/EmberBuddy';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { Pressy } from '../ui/Pressy';
import { Ring } from '../ui/Ring';

const VIOLET = '#B79AF0';
const FIRST_FIVE = THIS_OR_THAT.slice(0, 5);
const RECHECK_DAYS = 60;

// The Desk's small "getting to know you" moments, one at a time:
// five quick cards for someone new, then a question a day (a word or two,
// or skip), and every couple of months a "still true?" on an old answer.
// Everything lands in About you, where it can be changed or forgotten.
/**
 * Which About-you card applies today, if any: the five quick ones, a "still
 * true?", the week in a sentence, the question of the day, or something noticed.
 * `playing` keeps the five on screen once started; `notes` counts the things
 * the app has noticed (asked last, only when nothing else applies).
 * `holdIntro`: a new student's first two days, before the five arrive on Day 3
 * (core/deskNotes.ts firstWeekNotes); nothing About-you shows until then.
 */
export function whenAboutCards(about: AboutMe, onboarded: boolean, today: string, notes: () => number, playing = false, holdIntro = false) {
  if (!onboarded) return null;
  if (!about.introDone && (playing || FIRST_FIVE.some((c) => !about.picks[c.id]))) return holdIntro && !playing ? null : { kind: 'intro' as const };
  const recheck = stillTrue(about, today);
  if (recheck) return { kind: 'still' as const, recheck };
  if (weekSentenceDue(about)) return { kind: 'week' as const };
  const q = questionOfTheDay(about, today);
  if (q) return { kind: 'question' as const, q };
  return about.noticedOn === today || !notes() ? null : { kind: 'noticed' as const };
}

export function AboutCards() {
  const about = useLifeStore((s) => s.about);
  const onboarded = useSchoolStore((s) => s.profile.onboarded);
  const firstWeek = useLifeStore((s) => s.settings.firstWeek);
  const today = dateKey();
  // Once the five cards are showing, they stay until finished or closed,
  // so the last answer gets its "thanks" instead of vanishing mid-swipe.
  const [playing, setPlaying] = useState(false);
  const card = whenAboutCards(about, onboarded, today, () => learnedNotes().length, playing, firstWeekNotes(firstWeek, today).holdIntro);
  const needIntro = card?.kind === 'intro';
  useEffect(() => {
    if (needIntro) setPlaying(true);
  }, [needIntro]);
  if (!card) return null;
  if (card.kind === 'intro') return <GetToKnowYou />;
  if (card.kind === 'still') return <StillTrue {...card.recheck} />;
  if (card.kind === 'week') return <WeekSentence />;
  if (card.kind === 'question') return <Question q={card.q} />;
  return <Noticed />;
}

// One thing the app has noticed, a different one each day, with what it's
// based on. "Not right" drops it for good; "Got it" puts it away for today.
function Noticed() {
  const notes = learnedNotes();
  if (!notes.length) return null;
  const today = dateKey();
  const note = notes[Number(today.replace(/-/g, '')) % notes.length];
  const { about, setAbout } = useLifeStore.getState();
  return (
    <Animated.View key={note.id} entering={FadeInDown.duration(320)} exiting={FadeOut.duration(180)}>
      <Card tint={VIOLET} style={styles.card}>
        <Header title="Something I noticed" onClose={() => setAbout({ noticedOn: today })} />
        <View style={styles.noticeRow}>
          <Icon name={note.icon} size={18} color={VIOLET} />
          <View style={styles.flex}>
            <Text style={styles.notice} maxFontSizeMultiplier={2}>{note.text}</Text>
            <Text style={styles.basis} maxFontSizeMultiplier={2}>{note.basis}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Button label="Not right" variant="ghost" size="sm" onPress={() => setAbout({ dismissed: [...about.dismissed, note.id], noticedOn: today })} />
          <Button label="Got it" variant="secondary" size="sm" onPress={() => setAbout({ noticedOn: today })} />
        </View>
      </Card>
    </Animated.View>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  const about = useLifeStore((s) => s.about);
  return (
    <View style={styles.head}>
      <Pressy onPress={() => router.push('/about')} style={styles.ring} accessibilityRole="link" accessibilityLabel="Open About you" haptic="none">
        <Ring progress={aboutFilled(about)} size={30} stroke={3} color={VIOLET} value="" />
        <View style={styles.ringIcon} pointerEvents="none">
          <Icon name="person" size={14} color={VIOLET} />
        </View>
      </Pressy>
      <Text style={styles.title} maxFontSizeMultiplier={2}>{title}</Text>
      <IconButton icon="close" label="Not now" size={30} onPress={onClose} />
    </View>
  );
}

function GetToKnowYou() {
  const done = () => {
    useLifeStore.getState().setAbout({ introDone: true });
  };
  return (
    <Animated.View entering={FadeInDown.duration(320)} exiting={FadeOut.duration(180)}>
      <Card tint={VIOLET} style={styles.card}>
        <Header title="Five quick ones, so Ember gets you" onClose={done} />
        <ThisOrThatDeck
          cards={FIRST_FIVE}
          doneText="Thanks. More cards, and everything else, are in About you."
          onDone={() => {
            done();
            emberSay('Got it. I’ll keep that in mind.', 'cheer');
          }}
        />
      </Card>
    </Animated.View>
  );
}

function Question({ q }: { q: string }) {
  const [text, setText] = useState('');
  const mark = (answer?: string) => {
    const { about, setAbout } = useLifeStore.getState();
    const today = dateKey();
    setAbout({
      askedOn: [...about.askedOn.filter((d) => d !== today), today].slice(-60),
      ...(answer ? { answers: [...about.answers, { id: Date.now().toString(36), q, a: answer.slice(0, 140), at: new Date().toISOString() }] } : {}),
    });
    if (answer) emberSay('Kept. You can see it in About you.', 'cheer');
  };
  return (
    <Animated.View entering={FadeInDown.duration(320)} exiting={FadeOut.duration(180)}>
      <Card tint={VIOLET} style={styles.card}>
        <Header title="A question for today" onClose={() => mark()} />
        <Text style={styles.q} maxFontSizeMultiplier={textGrow.heading}>{q}</Text>
        <Field
          value={text}
          onChangeText={setText}
          placeholder="A word or two"
          returnKeyType="done"
          maxLength={140}
          onSubmitEditing={(e) => e.nativeEvent.text.trim() && mark(e.nativeEvent.text.trim())}
          containerStyle={styles.gap}
        />
        <View style={styles.actions}>
          <Button label="Skip" variant="ghost" size="sm" onPress={() => mark()} />
          <Button label="Keep it" size="sm" disabled={!text.trim()} onPress={() => mark(text.trim())} />
        </View>
      </Card>
    </Animated.View>
  );
}

// Sundays: the week in a sentence, kept in About you as their story. Sunday
// night runs past midnight, so it reads the night's day, not the calendar's.
function weekSentenceDue(about: AboutMe) {
  const sunday = tonightKey();
  return tonightWeekday() === 0 && !about.weeks.some((w) => w.week === weekOf(sunday)) && !about.askedOn.includes(`week-${sunday}`);
}

// The night stack leads with it on Sunday nights, ahead of the other About-you cards.
export function WeekSentenceCard() {
  const about = useLifeStore((s) => s.about);
  const onboarded = useSchoolStore((s) => s.profile.onboarded);
  return onboarded && weekSentenceDue(about) ? <WeekSentence /> : null;
}

function WeekSentence() {
  const [text, setText] = useState('');
  const today = tonightKey();
  const done = (line?: string) => {
    const { about, setAbout } = useLifeStore.getState();
    if (line) setAbout({ weeks: [...about.weeks, { week: weekOf(today), text: line.slice(0, 160) }] });
    else setAbout({ askedOn: [...about.askedOn, `week-${today}`].slice(-60) });
    if (line) emberSay('Kept. A year of these is a story.', 'cheer');
  };
  return (
    <Animated.View entering={FadeInDown.duration(320)} exiting={FadeOut.duration(180)}>
      <Card tint={VIOLET} style={styles.card}>
        <Header title="Your week in a sentence" onClose={() => done()} />
        <Text style={styles.q} maxFontSizeMultiplier={textGrow.heading}>If this week were one sentence, what would it be?</Text>
        <Field
          value={text}
          onChangeText={setText}
          placeholder="Busy, but I got through it"
          returnKeyType="done"
          maxLength={160}
          onSubmitEditing={(e) => e.nativeEvent.text.trim() && done(e.nativeEvent.text.trim())}
          containerStyle={styles.gap}
        />
        <View style={styles.actions}>
          <Button label="Skip" variant="ghost" size="sm" onPress={() => done()} />
          <Button label="Keep it" size="sm" disabled={!text.trim()} onPress={() => done(text.trim())} />
        </View>
      </Card>
    </Animated.View>
  );
}

/** An old This-or-that answer to check on, if answers are 60+ days old. */
function stillTrue(about: ReturnType<typeof useLifeStore.getState>['about'], today: string) {
  const at = about.setAt.picks;
  const ids = Object.keys(about.picks);
  if (!at || !ids.length || about.askedOn.includes(today)) return null;
  if ((Date.now() - new Date(at).getTime()) / 86400000 < RECHECK_DAYS) return null;
  const id = ids[Number(today.replace(/-/g, '')) % ids.length];
  const card = THIS_OR_THAT.find((c) => c.id === id);
  const side = about.picks[id];
  const label = card ? pickLabel(card, side) : null;
  return card && label ? { id, side, label, other: pickLabel(card, side === 'a' ? 'b' : 'a') ?? '' } : null;
}

function StillTrue({ id, side, label, other }: { id: string; side: string; label: string; other: string }) {
  const answer = (keep: boolean) => {
    const { about, setAbout } = useLifeStore.getState();
    const today = dateKey();
    // Setting picks again re-stamps them, so this comes back in two months.
    setAbout({
      picks: { ...about.picks, [id]: keep ? side : side === 'a' ? 'b' : 'a' },
      askedOn: [...about.askedOn.filter((d) => d !== today), today].slice(-60),
    });
  };
  return (
    <Animated.View entering={FadeInDown.duration(320)} exiting={FadeOut.duration(180)}>
      <Card tint={VIOLET} style={styles.card}>
        <Header title="Checking in on an old answer" onClose={() => answer(true)} />
        <Text style={styles.q} maxFontSizeMultiplier={textGrow.heading}>Still a {label.toLowerCase()}?</Text>
        <View style={styles.actions}>
          <Button label={`More ${other.toLowerCase()} now`} variant="ghost" size="sm" onPress={() => answer(false)} />
          <Button label="Still true" size="sm" onPress={() => answer(true)} />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ring: {
    width: 30,
    height: 30,
  },
  ringIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  flex: {
    flex: 1,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notice: {
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  basis: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  q: {
    fontFamily: fonts.displaySoft,
    fontSize: 19,
    lineHeight: 26,
    color: colors.text,
  },
  gap: {
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
});
