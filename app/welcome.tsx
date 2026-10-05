import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { EmberSprite } from '../components/ember/EmberSprite';
import { Sparks } from '../components/ember/Sparks';
import { useEmberRig } from '../components/ember/useEmberRig';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Screen } from '../components/ui/Screen';
import { Stepper } from '../components/ui/Stepper';
import { goBack } from '../core/chrome';
import { dateKey } from '../core/dates';
import { useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';

const GRADES = [9, 10, 11, 12];
const CAPS = [60, 90, 120, 180];
const STEPS = 3;

// First launch (and replayable from Settings). Ember introduces itself as a
// program and gets three things: what to call you, your classes, and how much
// a school night should hold. All skippable; all changeable later. The helper
// crew (Day 2) and the This-or-that cards (Day 3) arrive later as Ember's notes.
export default function WelcomeScreen() {
  const profile = useSchoolStore((s) => s.profile);
  const classes = useSchoolStore((s) => s.classes);
  const setProfile = useSchoolStore((s) => s.setProfile);
  const rig = useEmberRig();
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [grade, setGrade] = useState<number | null>(profile.grade);
  const [sleepGoal, setSleepGoal] = useState(profile.sleepGoal);
  const [cap, setCap] = useState(profile.nightlyCap);
  const [burst, setBurst] = useState(0);
  // Only a first welcome starts a first week; a replay from Settings doesn't.
  const [firstTime] = useState(() => !profile.onboarded);
  const startFirstWeek = () => {
    const settings = useLifeStore.getState().settings;
    if (firstTime && !settings.firstWeek) useLifeStore.getState().setSettings({ firstWeek: { started: dateKey(), done: [] } });
  };

  useEffect(() => {
    rig.setMood('happy');
    rig.hopUp(12);
    rig.talk(true);
    const t = setTimeout(() => rig.talk(false), 1400);
    return () => clearTimeout(t);
  }, [rig]);

  const next = () => {
    if (step === 0) setProfile({ name: name.trim(), grade });
    if (step === 2) setProfile({ sleepGoal, nightlyCap: cap });
    rig.hopUp(10);
    rig.talk(true);
    setTimeout(() => rig.talk(false), 900);
    if (step < STEPS - 1) {
      setStep(step + 1);
      return;
    }
    setProfile({ onboarded: true });
    startFirstWeek();
    rig.setMood('cheer');
    setBurst((b) => b + 1);
    setTimeout(() => goBack(), 700);
  };

  const skipAll = () => {
    setProfile({ name: name.trim(), grade, onboarded: true });
    startFirstWeek();
    goBack();
  };

  const line =
    step === 0
      ? 'Hi. I’m Ember, a small program that keeps your school days from piling up. What should I call you?'
      : step === 1
        ? classes.length
          ? `${classes.length} class${classes.length === 1 ? '' : 'es'} on your schedule. Add more any time.`
          : 'Let’s get your classes in, so I always know what’s next.'
        : 'How much should a school night hold?';

  return (
    <Screen nav={false} back={false} tone="ember" motes right={<Button label="Skip" variant="ghost" size="sm" onPress={skipAll} />}>
      <View style={styles.stage}>
        <Sparks burst={burst} reach={80} />
        <EmberSprite rig={rig} size={120} seed={4.4} />
      </View>
      <Animated.Text key={`l${step}${classes.length}`} entering={reduced ? undefined : FadeInDown.duration(380)} style={styles.line}>
        {line}
      </Animated.Text>

      <View style={styles.dots}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotOn, i < step && styles.dotDone]} />
        ))}
      </View>

      <Animated.View key={step} entering={reduced ? undefined : FadeInDown.delay(120).duration(380)} exiting={reduced ? undefined : FadeOut.duration(150)}>
        {step === 0 ? (
          <View style={styles.block}>
            <Field label="Your name" placeholder="Your first name (optional)" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="done" />
            <Text style={styles.label}>What grade are you in?</Text>
            <ChipRow>
              {GRADES.map((g) => (
                <Chip key={g} label={`${g}th`} selected={grade === g} onPress={() => setGrade(grade === g ? null : g)} />
              ))}
            </ChipRow>
          </View>
        ) : step === 1 ? (
          <View style={styles.block}>
            <Card tint="#AFA2DE" onPress={() => router.push('/scan')} style={styles.option}>
              <View style={[styles.optIcon, { backgroundColor: alpha('#AFA2DE', 0.16) }]}>
                <Icon name="image" size={22} color="#AFA2DE" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.optTitle}>Scan a screenshot</Text>
                <Text style={styles.optBody}>Screenshot your Google Classroom or Canvas classes, as many as you need. Your phone reads them; nothing is uploaded.</Text>
              </View>
            </Card>
            <Card onPress={() => router.push('/classes')} style={styles.option}>
              <View style={[styles.optIcon, { backgroundColor: alpha(colors.flame, 0.14) }]}>
                <Icon name="book" size={22} color={colors.flame} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.optTitle}>Type them in</Text>
                <Text style={styles.optBody}>Name, color, days, and times. About a minute per class.</Text>
              </View>
            </Card>
          </View>
        ) : (
          <View style={styles.block}>
            <Card>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.optTitle}>Sleep goal</Text>
                  <Text style={styles.optBody}>Teens need 8–10 hours. I’ll notice when you’re short.</Text>
                </View>
                <Stepper value={`${sleepGoal}h`} onDecrement={() => setSleepGoal((v) => Math.max(7, v - 0.5))} onIncrement={() => setSleepGoal((v) => Math.min(11, v + 0.5))} label="sleep goal" minWidth={50} />
              </View>
            </Card>
            <Card style={styles.gap}>
              <Text style={styles.optTitle}>Homework in one night</Text>
              <Text style={styles.optBody}>When more than this is due by tomorrow, I’ll let you know early.</Text>
              <ChipRow style={styles.gap}>
                {CAPS.map((c) => (
                  <Chip key={c} label={c % 60 ? `${c / 60}h`.replace('.5h', '½h') : `${c / 60}h`} selected={cap === c} onPress={() => setCap(c)} />
                ))}
              </ChipRow>
            </Card>
          </View>
        )}
      </Animated.View>

      <Button label={step === STEPS - 1 ? 'Let’s go' : step === 1 && !classes.length ? 'Later' : 'Continue'} icon={step === STEPS - 1 ? 'flame' : 'arrow'} onPress={next} style={styles.next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    marginTop: 4,
  },
  line: {
    marginTop: 10,
    fontFamily: fonts.displaySoft,
    fontSize: 21,
    lineHeight: 29,
    color: colors.text,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.lineStrong,
  },
  dotOn: {
    width: 22,
    backgroundColor: colors.flame,
  },
  dotDone: {
    backgroundColor: alpha(colors.flame, 0.5),
  },
  block: {
    marginTop: 20,
    gap: 4,
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  optIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  optTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  optBody: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gap: {
    marginTop: 10,
  },
  next: {
    marginTop: 24,
  },
});
