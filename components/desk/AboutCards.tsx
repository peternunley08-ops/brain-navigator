import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { aboutFilled, pickLabel, questionOfTheDay, THIS_OR_THAT } from '../../core/about';
import { dateKey } from '../../core/dates';
import { useLifeStore } from '../../core/lifeStore';
import { useSchoolStore } from '../../core/schoolStore';
import { colors, fonts } from '../../core/theme';
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
export function AboutCards() {
  const about = useLifeStore((s) => s.about);
  const onboarded = useSchoolStore((s) => s.profile.onboarded);
  const today = dateKey();
  // Once the five cards are showing, they stay until finished or closed,
  // so the last answer gets its "thanks" instead of vanishing mid-swipe.
  const [playing, setPlaying] = useState(false);
  const needIntro = !about.introDone && (playing || FIRST_FIVE.some((c) => !about.picks[c.id]));
  useEffect(() => {
    if (needIntro) setPlaying(true);
  }, [needIntro]);
  if (!onboarded) return null;

  if (needIntro) return <GetToKnowYou />;
  const recheck = stillTrue(about, today);
  if (recheck) return <StillTrue {...recheck} />;
  const q = questionOfTheDay(about, today);
  return q ? <Question q={q} /> : null;
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
      <Text style={styles.title}>{title}</Text>
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
        <Text style={styles.q}>{q}</Text>
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
        <Text style={styles.q}>Still a {label.toLowerCase()}?</Text>
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
