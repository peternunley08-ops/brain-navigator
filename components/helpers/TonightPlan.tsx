import * as Haptics from '../../core/haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dateKey } from '../../core/dates';
import { buildTonightPlan } from '../../core/helperOffline';
import { useHubStore } from '../../core/hubStore';
import { useLifeStore } from '../../core/lifeStore';
import { nightNow } from '../../core/night';
import { clock, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts } from '../../core/theme';
import { emberSay } from '../ember/EmberBuddy';
import type { EmberRig } from '../ember/useEmberRig';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip, ChipRow } from '../ui/Chip';
import { TimeField } from '../ui/TimeField';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

const OCEAN = '#7CC4F2';

function hm(m: number) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r} min`;
}

// Pip's plan for tonight: what's due soonest, in 25-minute chunks with
// breaks, inside the homework cap and before wind-down. One tap puts it on
// "Your day".
export function TonightPlan({ rig }: { rig: EmberRig }) {
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const cap = useSchoolStore((s) => s.profile.nightlyCap);
  const windDown = useLifeStore((s) => s.settings.windDown);
  const addBlock = useHubStore((s) => s.addBlock);
  const [added, setAdded] = useState(false);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [firstId, setFirstId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  // "Busy until…" choices: the next few whole hours before wind-down.
  const now = nightNow();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const later = [16, 17, 18, 19, 20, 21].map((h) => h * 60).filter((m) => m > nowMin && m < windDown - 30).slice(0, 4);

  const plan = useMemo(() => buildTonightPlan(assignments, { cap, windDown, startAt: startAt ?? undefined, first: firstId }), [assignments, cap, windDown, startAt, firstId]);
  const first = plan.steps.find((s) => s.kind === 'work');
  const last = plan.steps[plan.steps.length - 1];

  if (!plan.steps.length) {
    return (
      <EmptyState
        title={plan.leftOut.length ? 'Tonight’s already full.' : 'Nothing due in the next two days.'}
        body={plan.leftOut.length ? 'It’s past your wind-down, or you’ve hit your homework cap. Sleep is part of the plan.' : 'Pip approves of rest. Want to get ahead on something? Try the AI chat.'}
      />
    );
  }

  const putOnDay = () => {
    for (const s of plan.steps) {
      if (s.kind !== 'work') continue;
      const color = classes.find((c) => c.id === s.classId)?.color ?? OCEAN;
      addBlock({ date: dateKey(), title: s.title, start: s.start, end: s.end, color });
    }
    setAdded(true);
    useLifeStore.getState().noteHelperLast('pip', `we planned ${hm(plan.workMinutes)} of work from ${clock(plan.steps[0].start)}`);
    rig.setMood('cheer');
    rig.hopUp(16);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    emberSay('Pip put tonight on Your day. One block at a time.', 'happy');
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      {nowMin < windDown - 30 ? (
        <View style={styles.busy}>
          <Text style={styles.busyLabel}>Busy until…</Text>
          <ChipRow>
            <Chip label="Start now" color={OCEAN} selected={startAt == null} onPress={() => setStartAt(null)} />
            {later.map((m) => (
              <Chip key={m} label={clock(m)} color={OCEAN} selected={startAt === m} onPress={() => setStartAt(m)} />
            ))}
            <Chip
              label={startAt != null && !later.includes(startAt) ? clock(startAt) : 'Other time'}
              icon="clock"
              color={OCEAN}
              selected={picking || (startAt != null && !later.includes(startAt))}
              onPress={() => {
                // The field shows a time as soon as it opens, so the plan uses it too.
                if (!picking && startAt == null) setStartAt(Math.ceil((nowMin + 60) / 15) * 15);
                setPicking((v) => !v);
              }}
            />
          </ChipRow>
          {picking ? (
            <TimeField
              label="Busy until"
              value={startAt ?? Math.ceil((nowMin + 60) / 15) * 15}
              onChange={(m) => setStartAt(m)}
              hours={[15, 16, 17, 18, 19, 20, 21, 22]}
            />
          ) : null}
        </View>
      ) : null}
      <Card tint={OCEAN} style={styles.summary}>
        <Text style={styles.big}>{hm(plan.workMinutes)} of work</Text>
        <Text style={styles.sub}>
          {clock(plan.steps[0].start)} – {clock(last.end)}, with breaks, cap {hm(cap)}
        </Text>
      </Card>
      <View style={styles.steps}>
        {plan.steps.map((s, i) => {
          const color = s.kind === 'break' ? colors.textFaint : classes.find((c) => c.id === s.classId)?.color ?? OCEAN;
          return (
            <Animated.View key={i} entering={FadeInDown.delay(i * 50).duration(260)}>
              <Pressy
                onPress={() => s.kind === 'work' && s.assignmentId && setFirstId(s.assignmentId)}
                disabled={s.kind !== 'work'}
                depth={0.98}
                style={styles.step}
                accessibilityRole={s.kind === 'work' ? 'button' : undefined}
                accessibilityHint={s.kind === 'work' ? 'Tap to do this one first' : undefined}
              >
                <Text style={styles.time}>{clock(s.start)}</Text>
                <View style={[styles.rail, { backgroundColor: alpha(color, s.kind === 'break' ? 0.3 : 0.9) }]} />
                <View style={styles.flex}>
                  <Text style={[styles.title, s.kind === 'break' && styles.breakText]} numberOfLines={2}>
                    {s.title}
                  </Text>
                  <Text style={styles.len}>{s.end - s.start} min</Text>
                </View>
              </Pressy>
            </Animated.View>
          );
        })}
      </View>
      {plan.steps.filter((x) => x.kind === 'work').length > 1 ? <Text style={styles.tip}>Tap a step to do it first.</Text> : null}
      {plan.leftOut.length ? (
        <Card style={styles.left}>
          <Icon name="flag" size={16} color={colors.flame} />
          <Text style={styles.leftText}>
            Doesn’t fit tonight: {plan.leftOut.map((a) => a.title).join(', ')}. Move one, or ask for more time.
          </Text>
        </Card>
      ) : null}
      <Button label={added ? 'On Your day' : 'Put it on my day'} icon={added ? 'check' : 'calendar'} onPress={putOnDay} disabled={added} style={styles.go} />
      {first?.assignmentId ? (
        <Button
          label="Start the first block"
          icon="timer"
          variant="secondary"
          onPress={() => router.push({ pathname: '/focus', params: { assignment: first.assignmentId } })}
          style={styles.go2}
        />
      ) : null}
      {added ? <Button label="See Your day" variant="ghost" size="sm" onPress={() => router.push('/today')} style={styles.ghost} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tip: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
  busy: {
    marginTop: 14,
    gap: 8,
  },
  busyLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  flex: {
    flex: 1,
  },
  summary: {
    marginTop: 14,
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  steps: {
    marginTop: 14,
    gap: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    minHeight: 44,
  },
  time: {
    width: 64,
    paddingTop: 2,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  rail: {
    width: 4,
    borderRadius: 2,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  breakText: {
    fontFamily: fonts.body,
    color: colors.textFaint,
  },
  len: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  left: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  leftText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  go: {
    marginTop: 16,
  },
  go2: {
    marginTop: 10,
  },
  ghost: {
    alignSelf: 'center',
    marginTop: 6,
  },
});
