import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, type LayoutChangeEvent, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { ThisOrThatDeck } from '../components/about/ThisOrThatDeck';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon, type IconName } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { aboutForAI, CALMERS, CHEER, INTERESTS, pickLabel, STUDY_WAYS, SUBJECTS, THIS_OR_THAT } from '../core/about';
import { plural } from '../core/words';
import { learnedNotes } from '../core/learned';
import { type AboutMe, useLifeStore } from '../core/lifeStore';
import { offerUndo } from '../core/undoStore';
import { useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts, layout } from '../core/theme';

const JUMPS: { key: string; label: string; icon: IconName }[] = [
  { key: 'cards', label: 'This or that', icon: 'sparkle' },
  { key: 'into', label: 'What you’re into', icon: 'heart' },
  { key: 'calm', label: 'Calms you', icon: 'wind' },
  { key: 'goals', label: 'Goals', icon: 'flag' },
  { key: 'noticed', label: 'Noticed', icon: 'timer' },
  { key: 'sharing', label: 'Sharing', icon: 'chat' },
];

const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');

// Everything the app knows about you, in one place: what you told it (by
// playing "This or that", picking chips, answering a question a day) and
// what it has noticed from how you use it, each with where it came from.
// Change any of it, forget any of it, or erase all of it. Nothing here
// leaves the phone unless you turn on sharing with Ember.
// What other parts of the app already know about you (#71–74), shown here
// so it's all in one place. Read-only; each row opens where it lives.
function gatherAround(
  stressTags: Record<string, string[]>,
  people: { name: string }[],
  wins: { text: string; at: string }[],
  weeks: { week: string; text: string }[]
) {
  const rows: { title: string; body: string; icon: IconName; path: string }[] = [];
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  for (const [day, tags] of Object.entries(stressTags)) if (day >= since) for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length) rows.push({ title: 'What’s weighed on you this month', body: top.map(([t, c]) => `${t} (${plural(c, 'day')})`).join(', '), icon: 'feather', path: '/moods' });
  if (people.length) rows.push({ title: 'The people you trust', body: people.map((p) => p.name).slice(0, 5).join(', '), icon: 'people', path: '/people' });
  if (wins.length) rows.push({ title: 'Wins you kept', body: [...wins].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3).map((w) => `“${w.text.slice(0, 50)}”`).join('  '), icon: 'jar', path: '/wins' });
  if (weeks.length) rows.push({ title: 'Your weeks, in a sentence', body: [...weeks].reverse().slice(0, 3).map((w) => `“${w.text}”`).join('  '), icon: 'star', path: '' });
  return rows;
}

export default function AboutScreen() {
  const about = useLifeStore((s) => s.about);
  const set = useLifeStore((s) => s.setAbout);
  const name = useSchoolStore((s) => s.profile.name);
  const [nick, setNick] = useState(about.nickname);
  // Follow the saved name when it changes elsewhere (Undo after Erase).
  useEffect(() => setNick(about.nickname), [about.nickname]);
  const [goal, setGoal] = useState('');
  const [replay, setReplay] = useState(false);
  const notes = learnedNotes();
  // Jump chips: glide to a section on this long page.
  const list = useRef<ScrollView | null>(null);
  const spots = useRef<Record<string, number>>({});
  const mark = (key: string) => (e: LayoutChangeEvent) => {
    spots.current[key] = e.nativeEvent.layout.y;
  };
  const insets = useSafeAreaInsets();
  const jump = (key: string) => {
    const y = spots.current[key];
    if (y != null) list.current?.scrollTo({ y: Math.max(0, y - insets.top - 60), animated: true });
  };
  const stressTags = useSchoolStore((s) => s.stressTags);
  const people = useLifeStore((s) => s.people);
  const wins = useLifeStore((s) => s.wins);
  const around = gatherAround(stressTags, people, wins, about.weeks);

  const toggle = (key: 'interests' | 'favSubjects' | 'hardSubjects' | 'studyWays' | 'calmers', value: string) => {
    const list = about[key];
    set({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } as Partial<AboutMe>);
  };

  const picked = THIS_OR_THAT.filter((c) => about.picks[c.id]);
  const unpicked = THIS_OR_THAT.length - picked.length;

  const shareAll = () => {
    const lines = [
      `About ${about.nickname || name || 'me'}`,
      ...picked.map((c) => `• ${pickLabel(c, about.picks[c.id])}`),
      about.interests.length ? `Into: ${about.interests.join(', ')}` : '',
      about.favSubjects.length ? `Favorite subjects: ${about.favSubjects.join(', ')}` : '',
      about.hardSubjects.length ? `Hardest subjects: ${about.hardSubjects.join(', ')}` : '',
      about.goals.length ? `Goals: ${about.goals.map((g) => `${g.text}${g.done ? ' (done)' : ''}`).join('; ')}` : '',
      ...about.answers.map((a) => `${a.q} ${a.a}`),
      ...about.weeks.map((w) => `Week of ${w.week}: ${w.text}`),
    ].filter(Boolean);
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  const eraseAll = () =>
    Alert.alert('Erase everything About you?', 'Your answers, picks, goals, and what the app has learned. Your schoolwork and journal stay.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase',
        style: 'destructive',
        onPress: () => {
          const before = useLifeStore.getState().about;
          useLifeStore.getState().forgetAbout();
          setNick('');
          offerUndo('Erased About you', () => useLifeStore.getState().setAbout(before), 'close');
        },
      },
    ]);

  let n = 0;
  return (
    <Screen title="About you" subtitle="What the app knows about you. Change or forget any of it. It stays on this phone." glowColor="#B79AF0" scrollRef={list}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jumpRow} contentContainerStyle={styles.jumps}>
        {JUMPS.map((j) => (
          <Chip key={j.key} label={j.label} icon={j.icon} onPress={() => jump(j.key)} />
        ))}
      </ScrollView>
      <View onLayout={mark('cards')} />
      <Reveal index={n++}>
        <Section title="This or that" note={unpicked ? `${picked.length} answered` : 'All answered'} action={picked.length && !unpicked ? { label: replay ? 'Close' : 'Play again', onPress: () => setReplay((v) => !v) } : undefined}>
          {unpicked || replay ? (
            <ThisOrThatDeck key={replay ? 'replay' : 'first'} replay={replay} onDone={replay ? () => setReplay(false) : undefined} />
          ) : null}
          {picked.length ? (
            <Animated.View layout={LinearTransition} style={styles.pickWrap}>
              {picked.map((c) => (
                <Pressy
                  key={c.id}
                  onPress={() => set({ picks: { ...about.picks, [c.id]: about.picks[c.id] === 'a' ? 'b' : 'a' } })}
                  onLongPress={() => {
                    const before = about.picks;
                    const rest = { ...before };
                    delete rest[c.id];
                    set({ picks: rest });
                    offerUndo(`Forgot “${pickLabel(c, before[c.id])}”`, () => useLifeStore.getState().setAbout({ picks: before }), 'close');
                  }}
                  style={styles.pick}
                  accessibilityRole="button"
                  accessibilityHint="Tap to switch sides, hold to forget"
                >
                  <Icon name={about.picks[c.id] === 'a' ? c.a.icon : c.b.icon} size={14} color={colors.flame} />
                  <Text style={styles.pickText}>{pickLabel(c, about.picks[c.id])}</Text>
                </Pressy>
              ))}
            </Animated.View>
          ) : null}
          {picked.length ? <Text style={styles.hint}>Tap an answer to switch it, hold to forget it.</Text> : null}
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="What Ember calls you">
          <View style={styles.row}>
            <Field
              value={nick}
              onChangeText={setNick}
              onBlur={() => nick.trim() !== about.nickname && set({ nickname: nick.trim().slice(0, 24) })}
              onSubmitEditing={(e) => set({ nickname: e.nativeEvent.text.trim().slice(0, 24) })}
              placeholder={name ? `${name}, or a nickname` : 'A nickname'}
              returnKeyType="done"
              containerStyle={styles.flex}
            />
          </View>
        </Section>
      </Reveal>

      <View onLayout={mark('into')} />
      <Reveal index={n++}>
        <Section title="What you’re into" note={about.interests.length ? `${about.interests.length} picked` : undefined}>
          <ChipRow>
            {INTERESTS.map((i) => (
              <Chip key={i} label={i} selected={about.interests.includes(i)} onPress={() => toggle('interests', i)} />
            ))}
          </ChipRow>
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="Subjects">
          <Text style={styles.sub}>Favorites</Text>
          <ChipRow>
            {SUBJECTS.map((x) => (
              <Chip key={x} label={x} color={colors.secured} selected={about.favSubjects.includes(x)} onPress={() => toggle('favSubjects', x)} />
            ))}
          </ChipRow>
          <Text style={styles.sub}>The hardest ones</Text>
          <ChipRow>
            {SUBJECTS.map((x) => (
              <Chip key={x} label={x} color={colors.unlocked} selected={about.hardSubjects.includes(x)} onPress={() => toggle('hardSubjects', x)} />
            ))}
          </ChipRow>
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="How you study best">
          <ChipRow>
            {STUDY_WAYS.map((w) => (
              <Chip key={w.id} label={w.label} icon={w.icon} selected={about.studyWays.includes(w.id)} onPress={() => toggle('studyWays', w.id)} />
            ))}
          </ChipRow>
        </Section>
      </Reveal>

      <View onLayout={mark('calm')} />
      <Reveal index={n++}>
        <Section title="What calms you" note="These go first on Steady">
          <ChipRow>
            {CALMERS.map((c) => (
              <Chip key={c.id} label={c.label} icon={c.icon} color="#8FB4E8" selected={about.calmers.includes(c.id)} onPress={() => toggle('calmers', c.id)} />
            ))}
          </ChipRow>
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="How Ember cheers you on">
          <View style={styles.cheerList}>
            {CHEER.map((c) => {
              const on = about.cheer === c.id;
              return (
                <Pressy
                  key={c.id}
                  onPress={() => {
                    set({ cheer: on ? null : c.id });
                    if (!on) emberSay(c.sample, 'cheer');
                  }}
                  style={[styles.cheer, on && styles.cheerOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[styles.cheerTitle, on && { color: colors.flame }]}>{c.label}</Text>
                  <Text style={styles.cheerSample}>“{c.sample}”</Text>
                </Pressy>
              );
            })}
          </View>
        </Section>
      </Reveal>

      <View onLayout={mark('goals')} />
      <Reveal index={n++}>
        <Section title="This semester’s goals" note={about.goals.length ? `${about.goals.filter((g) => g.done).length} of ${about.goals.length} done` : 'Up to three'}>
          {about.goals.map((g) => (
            <Animated.View key={g.id} entering={FadeInDown.duration(220)} exiting={FadeOut.duration(160)} layout={LinearTransition} style={styles.goal}>
              <Pressy
                onPress={() => set({ goals: about.goals.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)) })}
                style={[styles.check, g.done && styles.checkOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!g.done }}
                accessibilityLabel={g.text}
              >
                {g.done ? <Icon name="check" size={13} color={colors.flameInk} strokeWidth={3} /> : null}
              </Pressy>
              <Text style={[styles.goalText, g.done && styles.goalDone]}>{g.text}</Text>
              <IconButton icon="close" label={`Remove ${g.text}`} size={30} onPress={() => set({ goals: about.goals.filter((x) => x.id !== g.id) })} />
            </Animated.View>
          ))}
          {about.goals.length < 3 ? (
            <View style={styles.row}>
              <Field
                value={goal}
                onChangeText={setGoal}
                placeholder="Like “Get a B in chem” or “Sleep before 11”"
                returnKeyType="done"
                onSubmitEditing={(e) => {
                  const text = e.nativeEvent.text.trim();
                  if (!text) return;
                  set({ goals: [...about.goals, { id: `${Date.now().toString(36)}`, text: text.slice(0, 80), at: new Date().toISOString() }] });
                  setGoal('');
                }}
                containerStyle={styles.flex}
              />
            </View>
          ) : null}
        </Section>
      </Reveal>

      {about.answers.length ? (
        <Reveal index={n++}>
          <Section title="Your answers" note={`${about.answers.length}`}>
            <Card>
              {[...about.answers].reverse().map((a, i) => (
                <View key={a.id} style={[styles.answer, i > 0 && styles.divider]}>
                  <View style={styles.flex}>
                    <Text style={styles.answerQ}>{a.q}</Text>
                    <Text style={styles.answerA}>{a.a}</Text>
                    <Text style={styles.meta}>{when(a.at)}</Text>
                  </View>
                  <IconButton icon="close" label="Forget this answer" size={30} onPress={() => set({ answers: about.answers.filter((x) => x.id !== a.id) })} />
                </View>
              ))}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      {around.length ? (
        <Reveal index={n++}>
          <Section title="From around the app" note="Already yours, gathered here">
            <Card>
              {around.map((r, i) => (
                <Pressy key={r.title} disabled={!r.path} onPress={() => router.push(r.path as never)} style={[styles.answer, i > 0 && styles.divider]} accessibilityRole={r.path ? 'link' : 'text'}>
                  <Icon name={r.icon} size={16} color={colors.flame} />
                  <View style={styles.flex}>
                    <Text style={styles.answerQ}>{r.title}</Text>
                    <Text style={styles.answerA}>{r.body}</Text>
                  </View>
                  {r.path ? <Icon name="chevron" size={16} color={colors.textFaint} /> : null}
                </Pressy>
              ))}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      <View onLayout={mark('noticed')} />
      <Reveal index={n++}>
        <Section title="Things I’ve noticed" note={about.learnOff ? 'Off' : notes.length ? `${notes.length}` : undefined}>
          <Card>
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchTitle}>Learn from how I use the app</Text>
                <Text style={styles.body}>Patterns from your own focus sessions, check-ins, and taps, worked out on this phone. Each says what it’s based on.</Text>
              </View>
              <Switch value={!about.learnOff} onValueChange={(on) => set({ learnOff: !on })} trackColor={{ true: colors.flame }} accessibilityLabel="Learn from how I use the app" />
            </View>
            {!about.learnOff && notes.length ? (
              notes.map((x) => (
                <View key={x.id} style={[styles.answer, styles.divider]}>
                  <Icon name={x.icon} size={16} color={colors.flame} />
                  <View style={styles.flex}>
                    <Text style={styles.answerA}>{x.text}</Text>
                    <Text style={styles.meta}>{x.basis}</Text>
                  </View>
                  <Button label="Not right" variant="ghost" size="sm" onPress={() => set({ dismissed: [...about.dismissed, x.id] })} />
                </View>
              ))
            ) : !about.learnOff ? (
              <Text style={[styles.body, styles.gap]}>Nothing yet. Patterns show up after you’ve done something at least five times.</Text>
            ) : null}
          </Card>
        </Section>
      </Reveal>

      <View onLayout={mark('sharing')} />
      <Reveal index={n++}>
        <Section title="Ember and the helpers">
          <Card>
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchTitle}>Let them use this</Text>
                <Text style={styles.body}>
                  Off unless you turn it on. When on, one short line about you goes with AI replies (your answers to daily questions and your week never do). Hold any Ember reply to see exactly what went.
                </Text>
              </View>
              <Switch value={about.shareWithAI} onValueChange={(on) => set({ shareWithAI: on })} trackColor={{ true: colors.flame }} accessibilityLabel="Let Ember and the helpers use About you" />
            </View>
            {about.shareWithAI ? <Text style={[styles.preview, styles.gap]}>{aboutForAI(about) ?? 'Nothing to send yet. Answer a few cards first.'}</Text> : null}
          </Card>
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <View style={styles.footer}>
          <Button label="Share all of it" icon="share" variant="secondary" size="sm" onPress={shareAll} />
          <Button label="Erase everything" variant="ghost" size="sm" tint={colors.danger} onPress={eraseAll} />
        </View>
        <Pressy onPress={() => router.push('/privacy')} style={styles.privacy} accessibilityRole="link">
          <Text style={styles.privacyText}>How Brain Navigator handles your data</Text>
        </Pressy>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  jumpRow: {
    marginHorizontal: -layout.gutter,
  },
  jumps: {
    gap: 8,
    paddingTop: 4,
    paddingHorizontal: layout.gutter,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gap: {
    marginTop: 10,
  },
  hint: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  pickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.35),
    backgroundColor: alpha(colors.flame, 0.08),
  },
  pickText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  sub: {
    marginTop: 4,
    marginBottom: 8,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  cheerList: {
    gap: 8,
  },
  cheer: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  cheerOn: {
    borderColor: alpha(colors.flame, 0.6),
    backgroundColor: alpha(colors.flame, 0.08),
  },
  cheerTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  cheerSample: {
    marginTop: 2,
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    color: colors.textMuted,
  },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.secured,
    borderColor: colors.secured,
  },
  goalText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  goalDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  answerQ: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  answerA: {
    marginTop: 2,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  preview: {
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
    justifyContent: 'center',
  },
  privacy: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 6,
  },
  privacyText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textDecorationLine: 'underline',
  },
});
