import { router } from 'expo-router';
import { EmberReflect } from '../components/ember/EmberReflect';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TAG_TOOLS } from '../components/desk/DayCards';
import { emberSay } from '../components/ember/EmberBuddy';
import { bestCalmer } from '../core/learned';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { ConditionsCard } from '../components/ui/ConditionsCard';
import { Field } from '../components/ui/Field';
import { MoodPicker } from '../components/ui/MoodPicker';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { Screen } from '../components/ui/Screen';
import { ScienceNote } from '../components/ui/ScienceNote';
import { Stepper } from '../components/ui/Stepper';
import { TrackSlider } from '../components/ui/TrackSlider';
import { goBack } from '../core/chrome';
import { useHealthStore } from '../core/healthStore';
import { dateKey, STRESS_SOURCES, useSchoolStore } from '../core/schoolStore';
import { colors, fonts } from '../core/theme';
import { useWellnessStore } from '../core/wellnessStore';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const DATE_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const STEADY_OFFER = { title: 'Stress is high', body: 'Two minutes of slow breathing settles the body fast.', icon: 'wind', color: '#8FB4E8', href: '/breathe' };

export default function CheckinScreen() {
  const fetchCheckins = useWellnessStore((s) => s.fetchCheckins);
  const todaysCheckin = useWellnessStore((s) => s.todaysCheckin);
  const saveTodayCheckin = useWellnessStore((s) => s.saveTodayCheckin);
  const isSaving = useWellnessStore((s) => s.isSaving);
  const error = useWellnessStore((s) => s.error);

  const isHealthAuthorized = useHealthStore((s) => s.isAuthorized);
  const healthSleepHours = useHealthStore((s) => s.sleepHoursLastNight);

  const [mood, setMood] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const sleepGoal = useSchoolStore((s) => s.profile.sleepGoal);
  const savedTags = useSchoolStore((s) => s.stressTags[dateKey()]);
  const setStressTags = useSchoolStore((s) => s.setStressTags);
  const [tags, setTags] = useState<string[]>(savedTags ?? []);
  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    // Await the fetch's own promise rather than watching isLoadingCheckins
    // from a second effect — that flag flips to true synchronously inside
    // fetchCheckins, but this effect's closure is created in the same
    // render pass and can't observe it until a later commit. On a cold
    // session (checkins still empty on the very first render), that race
    // let this hydrate-once-then-stop logic fire before the real fetch
    // landed: if today's check-in already existed, its values would never
    // populate the form, yet "Update" would still show over the blank
    // fields — saving would silently overwrite real data with nulls.
    fetchCheckins().then(() => {
      if (cancelled) return;
      const existing = todaysCheckin();
      if (existing) {
        setMood(existing.mood);
        setSleepHours(existing.sleep_hours);
        setSleepQuality(existing.sleep_quality);
        setStressLevel(existing.stress_level);
        setNotes(existing.notes ?? '');
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, fetchCheckins, todaysCheckin]);

  const existing = todaysCheckin();

  // What to offer right after saving: the tool for what's weighing on you, or breathing when stress is high.
  // On a hard day (stress 7+ or mood 2 or lower), what helped them before
  // comes first, then their own calming pick, then breathing.
  const hard = (stressLevel != null && stressLevel >= 7) || (mood != null && mood <= 2);
  const calm = hard ? bestCalmer() : null;
  const offer =
    tags.map((t) => TAG_TOOLS[t]).find(Boolean) ??
    (calm ? { title: `Try ${calm.label.toLowerCase()}`, body: `${calm.why} A few minutes might take the edge off.`, icon: calm.icon, color: '#8FB4E8', href: calm.path } : hard ? STEADY_OFFER : null);

  const handleSave = async () => {
    const ok = await saveTodayCheckin({ mood, sleepHours, sleepQuality, stressLevel, notes });
    if (ok) {
      setStressTags(dateKey(), tags);
      setSaved(true);
      // With something to offer, stay a moment so it can be tapped.
      if (offer) return;
      setTimeout(() => {
        goBack();
        if (stressLevel != null && stressLevel >= 7) {
          emberSay('Thanks for telling me. Stress is high today — Steady is one tap away.', 'concerned');
        } else if (mood != null && mood >= 4) {
          emberSay('Logged. Glad today’s feeling decent.', 'happy');
        } else if (mood != null && mood <= 2) {
          emberSay('Logged. Rough days count too. I’m here.', 'concerned');
        } else {
          emberSay('Logged. Thanks for checking in.', 'happy');
        }
      }, 600);
    }
  };

  const stepSleep = (d: number) => setSleepHours((h) => Math.max(0, Math.min(14, (h ?? 7) + d)));

  return (
    <Screen
      kicker={DATE_LABEL}
      title={greeting()}
      subtitle={existing ? 'You can still change today’s check-in.' : 'How are you doing, really?'}
      nav={false}
    >
      <Reveal index={0}>
        <Card style={styles.glance}>
          <Ring progress={mood != null ? mood / 5 : null} value={mood != null ? String(mood) : undefined} unit="/5" label="Mood" color={colors.secured} size={72} />
          <Ring
            progress={sleepHours != null ? Math.min(1, sleepHours / sleepGoal) : null}
            value={sleepHours != null ? String(sleepHours) : undefined}
            unit="h"
            label="Sleep"
            color="#8FB4E8"
            size={72}
          />
          <Ring
            progress={stressLevel != null ? 1 - (stressLevel - 1) / 9 : null}
            value={stressLevel != null ? String(11 - stressLevel) : undefined}
            unit="/10"
            label="Calm"
            color={colors.flame}
            size={72}
          />
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Card style={styles.block}>
          <Text style={styles.q}>How’s your mood?</Text>
          <ScienceNote fact="Morning sunlight exposure boosts serotonin and helps set your circadian clock — even 10 minutes outside can measurably lift mood within the hour." />
          <View style={styles.gap} />
          <MoodPicker value={mood} onChange={setMood} />
        </Card>
      </Reveal>

      <Reveal index={2}>
        <Card style={styles.block}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.q}>How long did you sleep?</Text>
              <Text style={styles.sub}>
                {sleepHours == null
                  ? 'Teens need 8–10 hours'
                  : sleepHours >= sleepGoal
                    ? `${sleepHours} hours, right on target`
                    : `${sleepHours} hours, ${+(sleepGoal - sleepHours).toFixed(1)} short of your goal`}
              </Text>
            </View>
            <Stepper
              value={sleepHours == null ? '–' : `${sleepHours}h`}
              onDecrement={() => stepSleep(-0.5)}
              onIncrement={() => stepSleep(0.5)}
              label="sleep"
              minWidth={52}
            />
          </View>
          {isHealthAuthorized && healthSleepHours !== null && healthSleepHours !== sleepHours ? (
            <Chip
              label={`Use ${healthSleepHours}h from Apple Health`}
              icon="heart"
              onPress={() => setSleepHours(healthSleepHours)}
              style={styles.healthChip}
            />
          ) : null}

          <Text style={[styles.q, styles.spaced]}>How well did you sleep?</Text>
          <ScienceNote fact="Your circadian rhythm is a roughly 24-hour clock run by a cluster of neurons in your hypothalamus. It's reset daily by light — a consistent wake time, even on weekends, is one of the strongest levers for better sleep quality." />
          <TrackSlider min={1} max={5} value={sleepQuality} onChange={setSleepQuality} fillColor="#8FB4E8" labels={['Rough', 'Restful']} />
        </Card>
      </Reveal>

      <Reveal index={3}>
        <Card style={styles.block}>
          <Text style={styles.q}>How stressed are you?</Text>
          <ScienceNote fact="Caffeine doesn't create energy — it blocks adenosine, the molecule that builds up all day and makes you feel sleepy. That's the 'coffee crash': the adenosine was there the whole time, just muted, and it catches up with you at once." />
          <TrackSlider min={1} max={10} value={stressLevel} onChange={setStressLevel} fillColor={colors.unlocked} labels={['Calm', 'Overwhelmed']} />
          <Text style={[styles.q, styles.spaced]}>What’s it coming from?</Text>
          <Text style={styles.sub}>Pick any. It helps Ember spot what keeps coming up.</Text>
          <ChipRow style={styles.tags}>
            {STRESS_SOURCES.map((t) => (
              <Chip key={t} label={t} selected={tags.includes(t)} color={colors.unlocked} onPress={() => toggleTag(t)} />
            ))}
          </ChipRow>
        </Card>
      </Reveal>

      <Reveal index={4}>
        <View style={styles.block}>
          <Field label="Anything worth remembering about today?" placeholder="Optional" value={notes} onChangeText={setNotes} multiline />
        </View>
      </Reveal>

      <Reveal index={5}>
        <View style={styles.block}>
          <ConditionsCard />
        </View>
      </Reveal>

      <Reveal index={6}>
        <Button
          label={saved ? 'Saved' : existing ? 'Update check-in' : 'Save check-in'}
          icon={saved ? 'check' : 'sun'}
          loading={isSaving}
          onPress={handleSave}
          disabled={isSaving || saved || !hydrated}
          style={styles.save}
        />
        {error ? <Text style={styles.errorText}>Couldn’t save that. Check your connection and try again.</Text> : null}
        {saved ? (
          <EmberReflect
            input={[
              'Check-in:',
              mood != null ? `mood ${mood}/5` : null,
              stressLevel != null ? `stress ${stressLevel}/10` : null,
              sleepHours != null ? `slept ${sleepHours}h` : null,
              sleepQuality != null ? `sleep quality ${sleepQuality}/5` : null,
              tags.length ? `what's on it: ${tags.join(', ')}` : null,
              notes.trim() ? `note: ${notes.trim()}` : null,
            ]
              .filter(Boolean)
              .join(' ')}
            label="A word from Ember"
            sends="Sends today’s numbers, tags, and note to Claude. Only if you tap."
          />
        ) : null}
        {saved && offer ? (
          <Animated.View entering={FadeInDown.duration(260)}>
            <Card tint={offer.color} style={styles.offer}>
              <Text style={styles.offerTitle}>Saved. {offer.title}?</Text>
              <Text style={styles.offerBody}>{offer.body}</Text>
              <View style={styles.offerRow}>
                <Button label="Try it" icon="arrow" size="sm" tint={offer.color} variant="secondary" onPress={() => router.replace(offer.href as never)} />
                <Button label="Done for now" size="sm" variant="ghost" onPress={() => goBack()} />
              </View>
            </Card>
          </Animated.View>
        ) : null}
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  offer: {
    marginTop: 14,
    gap: 4,
  },
  offerTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  offerBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  glance: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  block: {
    marginTop: 14,
  },
  gap: {
    height: 10,
  },
  q: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 24,
    color: colors.text,
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  spaced: {
    marginTop: 24,
  },
  flex: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tags: {
    marginTop: 12,
  },
  healthChip: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  save: {
    marginTop: 24,
  },
  errorText: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
});
