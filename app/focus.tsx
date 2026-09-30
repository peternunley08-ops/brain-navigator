import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { EmberSprite } from '../components/ember/EmberSprite';
import { Sparks } from '../components/ember/Sparks';
import { useEmberRig } from '../components/ember/useEmberRig';
import { Button } from '../components/ui/Button';
import { Candle, type CandleState } from '../components/ui/Candle';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { useFlameClock } from '../core/hooks/useFlameClock';
import { addDays, dateKey, focusMinutesOn, useSchoolStore } from '../core/schoolStore';
import { colors, fonts } from '../core/theme';

type Phase = 'setup' | 'running' | 'paused' | 'done' | 'break';

const LENGTHS = [15, 25, 45, 60];
const BREAK_MIN = 5;

function mmss(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// A focus session is a candle: light it, and it burns down while you work.
// Ember sits beside it with its reading glasses on. Time comes from real
// timestamps, so it stays right if you lock the phone mid-session.
export default function FocusScreen() {
  const { assignment: assignmentParam } = useLocalSearchParams<{ assignment?: string }>();
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const focus = useSchoolStore((s) => s.focus);
  const logFocus = useSchoolStore((s) => s.logFocus);
  const toggleAssignment = useSchoolStore((s) => s.toggleAssignment);

  const time = useFlameClock();
  const reduced = useReducedMotion();
  const rig = useEmberRig();

  const open = useMemo(() => assignments.filter((a) => !a.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6), [assignments]);
  const [target, setTarget] = useState<string | null>(assignmentParam ?? null);
  const [length, setLength] = useState(25);
  const [phase, setPhase] = useState<Phase>('setup');
  const [burst, setBurst] = useState(0);

  // Timer: when it started, how much was banked before a pause.
  const startedAt = useRef(0);
  const banked = useRef(0);
  const [now, setNow] = useState(Date.now());
  const [breakEnds, setBreakEnds] = useState(0);

  useEffect(() => {
    if (assignmentParam) setTarget(assignmentParam);
  }, [assignmentParam]);

  const elapsed = phase === 'running' ? banked.current + (now - startedAt.current) : banked.current;
  const total = length * 60_000;
  const progress = Math.min(1, elapsed / total);

  useEffect(() => {
    if (phase !== 'running' && phase !== 'break') return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [phase]);

  // The session finishes itself when the candle's burned down.
  useEffect(() => {
    if (phase === 'running' && elapsed >= total) finish(true);
    if (phase === 'break' && now >= breakEnds) {
      setPhase('setup');
      rig.setMood('happy');
      rig.hopUp(10);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  useEffect(() => {
    if (phase === 'running') {
      rig.holdGaze(true);
      rig.setMood('listening');
    } else if (phase === 'break') {
      rig.holdGaze(false);
      rig.setMood('sleepy');
    } else if (phase !== 'done') {
      rig.holdGaze(false);
      rig.setMood('idle');
      rig.look(-0.6, 0.1);
    }
  }, [phase, rig]);

  const start = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    banked.current = 0;
    startedAt.current = Date.now();
    setNow(Date.now());
    setPhase('running');
  };

  const pause = () => {
    banked.current += Date.now() - startedAt.current;
    setPhase('paused');
  };

  const resume = () => {
    startedAt.current = Date.now();
    setNow(Date.now());
    setPhase('running');
  };

  const finish = (complete: boolean) => {
    const worked = phase === 'running' ? banked.current + (Date.now() - startedAt.current) : banked.current;
    const minutes = Math.round(worked / 60_000);
    banked.current = worked;
    if (minutes >= 1) logFocus(minutes, target);
    if (!complete && minutes < 1) {
      banked.current = 0;
      setPhase('setup');
      return;
    }
    setPhase('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    rig.holdGaze(false);
    rig.setMood('cheer');
    rig.hopUp(18);
    setBurst((b) => b + 1);
    setTimeout(() => rig.setMood('happy'), 1400);
  };

  const takeBreak = () => {
    setBreakEnds(Date.now() + BREAK_MIN * 60_000);
    setNow(Date.now());
    setPhase('break');
  };

  const t = assignments.find((a) => a.id === target);
  const workedMin = Math.round(banked.current / 60_000);

  const candleState: CandleState = phase === 'setup' || phase === 'break' ? 'unlit' : phase === 'done' ? 'snuffed' : 'lit';
  const remaining = phase === 'setup' || phase === 'break' ? 1 : 1 - 0.62 * progress;

  // Last seven days of focus, for the little bar chart.
  const today = dateKey();
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(today, i - 6);
    const [y, m, d] = key.split('-').map(Number);
    return { key, letter: new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'narrow' }), min: focusMinutesOn(focus, key) };
  });
  const weekMax = Math.max(30, ...week.map((w) => w.min));
  const todayMin = week[6].min;

  return (
    <Screen back={false} tone="ember" motes={phase !== 'running'} title="Focus" subtitle="One thing. One candle.">
      <View style={styles.stage}>
        <View style={styles.candle}>
          <Candle width={132} time={time} intensity={0.55} remaining={remaining} seed={5.5} state={candleState} reducedMotion={reduced} />
        </View>
        <View style={styles.ember}>
          <Sparks burst={burst} reach={60} />
          <EmberSprite rig={rig} size={74} glasses seed={3.1} />
        </View>
      </View>

      <View style={styles.readout}>
        {phase === 'running' || phase === 'paused' ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.center}>
            <Text style={styles.timer}>{mmss(total - elapsed)}</Text>
            <Text style={styles.label}>{phase === 'paused' ? 'Paused' : t ? `Working on ${t.title}` : 'Just focusing'}</Text>
          </Animated.View>
        ) : phase === 'done' ? (
          <Animated.View entering={FadeInDown.duration(360)} style={styles.center}>
            <Text style={styles.doneTitle}>{workedMin >= length ? 'Candle’s out. Well done.' : `${workedMin} minutes in.`}</Text>
            <Text style={styles.label}>
              {workedMin} minute{workedMin === 1 ? '' : 's'} of real focus{t ? ` on ${t.title}` : ''}.
            </Text>
          </Animated.View>
        ) : phase === 'break' ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.center}>
            <Text style={styles.timer}>{mmss(breakEnds - now)}</Text>
            <Text style={styles.label}>Break. Stand up, drink water, look at something far away.</Text>
          </Animated.View>
        ) : null}
      </View>

      {phase === 'setup' ? (
        <>
          <Reveal index={0}>
            <Section title="What are you working on?">
              <ChipRow>
                <Chip label="Just focus" selected={target === null} onPress={() => setTarget(null)} />
                {open.map((a) => {
                  const c = classes.find((x) => x.id === a.classId);
                  return (
                    <Chip key={a.id} label={a.title.length > 24 ? `${a.title.slice(0, 23)}…` : a.title} dot color={c?.color ?? colors.flame} selected={target === a.id} onPress={() => setTarget(a.id)} />
                  );
                })}
              </ChipRow>
            </Section>
          </Reveal>
          <Reveal index={1}>
            <Section title="How long?">
              <ChipRow>
                {LENGTHS.map((l) => (
                  <Chip key={l} label={`${l} min`} icon="timer" selected={length === l} onPress={() => setLength(l)} />
                ))}
              </ChipRow>
            </Section>
          </Reveal>
          <Reveal index={2}>
            <Button label="Light the candle" icon="flame" onPress={start} style={styles.primary} />
          </Reveal>
        </>
      ) : null}

      {phase === 'running' ? (
        <View style={styles.row}>
          <Button label="Pause" icon="pause" variant="secondary" onPress={pause} style={styles.flex} />
          <Button label="End" icon="close" variant="ghost" onPress={() => finish(false)} />
        </View>
      ) : null}
      {phase === 'paused' ? (
        <View style={styles.row}>
          <Button label="Keep going" icon="play" onPress={resume} style={styles.flex} />
          <Button label="End" icon="close" variant="ghost" onPress={() => finish(false)} />
        </View>
      ) : null}
      {phase === 'done' ? (
        <View style={styles.stack}>
          <Button label={`Take a ${BREAK_MIN}-minute break`} icon="sun" onPress={takeBreak} />
          <Button label="Another round" icon="repeat" variant="secondary" onPress={start} />
          {t && !t.done ? (
            <Button
              label="Mark it done"
              icon="check"
              variant="secondary"
              tint={colors.secured}
              onPress={() => {
                toggleAssignment(t.id);
                emberSay(`${t.title}: done. That’s the good stuff.`, 'cheer');
                setTarget(null);
                banked.current = 0;
                setPhase('setup');
              }}
            />
          ) : null}
        </View>
      ) : null}
      {phase === 'break' ? (
        <Button label="Skip the break" variant="ghost" size="sm" onPress={() => setPhase('setup')} style={styles.skip} />
      ) : null}

      {phase === 'setup' || phase === 'done' ? (
        <Reveal index={3}>
          <Section title="This week" note={todayMin ? `${todayMin} minutes today.` : 'Nothing yet today.'}>
            <Card style={styles.weekCard}>
              {week.map((w, i) => (
                <View key={w.key} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: `${Math.max(4, (w.min / weekMax) * 100)}%`, backgroundColor: i === 6 ? colors.flame : colors.lineStrong }]} />
                  </View>
                  <Text style={[styles.barLabel, i === 6 && { color: colors.flame }]}>{w.letter}</Text>
                </View>
              ))}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      {phase === 'setup' && open.length === 0 && !target ? (
        <Button label="Add what’s due first" icon="plus" variant="ghost" size="sm" onPress={() => router.push('/add-assignment')} style={styles.skip} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  candle: {
    alignItems: 'center',
  },
  ember: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readout: {
    minHeight: 84,
    justifyContent: 'center',
    marginTop: 8,
  },
  center: {
    alignItems: 'center',
  },
  timer: {
    fontFamily: fonts.display,
    fontSize: 54,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  doneTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
  },
  primary: {
    marginTop: 22,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  flex: {
    flex: 1,
  },
  stack: {
    gap: 10,
    marginTop: 10,
  },
  skip: {
    marginTop: 12,
    alignSelf: 'center',
  },
  weekCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barTrack: {
    height: 70,
    width: 12,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 12,
    borderRadius: 6,
  },
  barLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
  },
});
