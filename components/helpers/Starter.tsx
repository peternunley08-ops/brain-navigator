import * as Haptics from '../../core/haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { HYPE, smallestStart } from '../../core/helperOffline';
import { useLifeStore } from '../../core/lifeStore';
import { dueLabel, useSchoolStore } from '../../core/schoolStore';
import { colors, fonts } from '../../core/theme';
import { emberSay } from '../ember/EmberBuddy';
import { Sparks } from '../ember/Sparks';
import type { EmberRig } from '../ember/useEmberRig';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

const GOLD = '#F9AE4E';

// Spark gets you moving: the smallest good first step, a hype meter you
// fill by tapping, a five-minute start, and a win in the jar when you go.
export function Starter({ rig, assignmentId }: { rig: EmberRig; assignmentId?: string }) {
  const assignments = useSchoolStore((s) => s.assignments);
  const addWin = useLifeStore((s) => s.addWin);
  const task = assignments.find((a) => a.id === assignmentId && !a.done) ?? smallestStart(assignments);
  const [line, setLine] = useState(0);
  const [hype, setHype] = useState(0);
  const [burst, setBurst] = useState(0);
  const [did, setDid] = useState(false);

  const pump = () => {
    const next = Math.min(1, hype + 0.2);
    setHype(next);
    setLine((l) => (l + 1) % HYPE.length);
    rig.hopUp(8 + next * 14);
    rig.setMood(next >= 1 ? 'cheer' : 'happy');
    Haptics.impactAsync(next >= 1 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (next >= 1) setBurst((b) => b + 1);
  };

  return (
    <View>
      <Card tint={GOLD} style={styles.task}>
        <Sparks burst={burst} reach={70} />
        <Text style={styles.kicker}>{task ? 'Your tiny first step' : 'Nothing due — nice.'}</Text>
        <Text style={styles.title}>{task ? task.title : 'Want to get ahead on something? Or rest. Both count.'}</Text>
        {task ? <Text style={styles.sub}>Due {dueLabel(task.due).toLowerCase()}. Just open it and give it five minutes.</Text> : null}
      </Card>

      <Animated.Text key={line} entering={FadeIn.duration(260)} style={styles.line}>
        “{HYPE[line]}”
      </Animated.Text>
      <View style={styles.meterRow}>
        <Text style={styles.meterLabel}>Hype</Text>
        <ProgressBar value={hype} color={hype >= 1 ? colors.flame : GOLD} height={10} style={styles.flex} />
      </View>
      <Button label={hype >= 1 ? 'MAXIMUM HYPE' : 'Hype me up'} icon="bolt" variant="secondary" tint={GOLD} onPress={pump} style={styles.gap} />

      {task ? (
        <Button
          label="5 minutes. Go."
          icon="timer"
          onPress={() => {
            emberSay('Five minutes. That’s it. Go!', 'cheer');
            router.push({ pathname: '/focus', params: { assignment: task.id, quick: '5' } });
          }}
          style={styles.gap}
        />
      ) : null}
      {task ? (
        <Button
          label="Too much? Just two minutes"
          icon="hourglass"
          variant="ghost"
          size="sm"
          onPress={() => {
            // The two-minute rule: starting is the hard part, and two minutes is almost nothing.
            emberSay('Two minutes. If you want to stop after, you can.', 'happy');
            router.push({ pathname: '/focus', params: { assignment: task.id, quick: '2' } });
          }}
          style={styles.ghost}
        />
      ) : null}
      {task && !did ? (
        <Animated.View entering={FadeInDown.delay(200)}>
          <Button
            label="I started it!"
            variant="ghost"
            size="sm"
            onPress={() => {
              setDid(true);
              addWin(`Started ${task.title}`);
              useLifeStore.getState().noteHelperLast('spark', `you started “${task.title}”`);
              setBurst((b) => b + 1);
              rig.setMood('cheer');
              rig.hopUp(20);
              emberSay('STARTED. That was the hard part. It’s in your wins jar.', 'cheer');
            }}
            style={styles.ghost}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: 12,
  },
  task: {
    marginTop: 16,
  },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: GOLD,
  },
  title: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  sub: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  line: {
    marginTop: 18,
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    lineHeight: 25,
    color: colors.text,
    textAlign: 'center',
    minHeight: 50,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  meterLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  ghost: {
    alignSelf: 'center',
    marginTop: 6,
  },
});
