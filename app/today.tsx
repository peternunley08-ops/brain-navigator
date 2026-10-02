import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon, type IconName } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { TimeField } from '../components/ui/TimeField';
import { clock, dateKey, daysUntil, isoDay } from '../core/dates';
import { useGoogleCalendarStore } from '../core/googleCalendarStore';
import { useHubStore } from '../core/hubStore';
import { KIND_LABEL, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';

interface Item {
  key: string;
  start: number;
  end: number;
  title: string;
  sub: string;
  color: string;
  icon: IconName;
  kind: 'class' | 'block' | 'event' | 'focus';
  done?: boolean;
  blockId?: string;
}

const LENGTHS = [15, 30, 45, 60, 90];
const BLOCK_COLORS = ['#F5B45C', '#8FB4E8', '#8CC0A8', '#AFA2DE', '#F0845A'];

function minsOf(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

// A day laid out in time: classes from your schedule, Google Calendar
// events, blocks you plan here, and the focus you've already done. Each
// block's height grows with how long it lasts, and a line marks now.
export default function TodayScreen() {
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const focus = useSchoolStore((s) => s.focus);
  const plan = useHubStore((s) => s.plan);
  const addBlock = useHubStore((s) => s.addBlock);
  const toggleBlock = useHubStore((s) => s.toggleBlock);
  const deleteBlock = useHubStore((s) => s.deleteBlock);
  const signedIn = useGoogleCalendarStore((s) => s.signedIn);
  const events = useGoogleCalendarStore((s) => s.events);
  const restoreSession = useGoogleCalendarStore((s) => s.restoreSession);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const [start, setStart] = useState(Math.ceil((nowMins + 5) / 15) * 15);
  const [length, setLength] = useState(30);
  const [color, setColor] = useState(BLOCK_COLORS[0]);
  const [, tick] = useState(0);

  useEffect(() => {
    restoreSession();
    const t = setInterval(() => tick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, [restoreSession]);

  const today = dateKey();
  const day = isoDay();
  const items = useMemo(() => {
    const list: Item[] = [];
    for (const c of classes) {
      if (!c.days.includes(day)) continue;
      list.push({ key: `c${c.id}`, start: c.start, end: c.end, title: c.name, sub: c.room ? `Room ${c.room}` : c.kind === 'activity' ? 'Activity' : 'Class', color: c.color, icon: c.kind === 'activity' ? 'flag' : 'book', kind: 'class' });
    }
    for (const b of plan.filter((p) => p.date === today)) {
      list.push({ key: `b${b.id}`, start: b.start, end: b.end, title: b.title, sub: 'Planned', color: b.color, icon: 'timer', kind: 'block', done: b.done, blockId: b.id });
    }
    if (signedIn) {
      for (const e of events) {
        if (!e.start.includes('T')) continue;
        list.push({ key: `e${e.id}`, start: minsOf(e.start), end: minsOf(e.end), title: e.title, sub: 'Google Calendar', color: '#D99A6C', icon: 'calendar', kind: 'event' });
      }
    }
    for (const f of focus.filter((x) => dateKey(new Date(x.at)) === today)) {
      const end = minsOf(f.at);
      const a = assignments.find((x) => x.id === f.assignmentId);
      list.push({ key: `f${f.id}`, start: Math.max(0, end - f.minutes), end, title: a ? a.title : 'Focus session', sub: `${f.minutes} min of focus`, color: '#F5B45C', icon: 'flame', kind: 'focus', done: true });
    }
    return list.sort((a, b) => a.start - b.start);
  }, [classes, plan, events, signedIn, focus, assignments, today, day]);

  const dueToday = assignments.filter((a) => !a.done && daysUntil(a.due) <= 0);
  const nowIndex = items.findIndex((i) => i.start > nowMins);

  const save = () => {
    if (!title.trim()) return;
    addBlock({ date: today, title: title.trim(), start, end: start + length, color });
    setTitle('');
    setAdding(false);
    emberSay(`${title.trim()} at ${clock(start)}. I’ll keep it on your day.`, 'happy');
  };

  return (
    <Screen
      kicker={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      title="Your day"
      subtitle={items.length ? `${items.length} thing${items.length === 1 ? '' : 's'} on the timeline.` : 'An open day. Plan a block or two.'}
    >
      {dueToday.length ? (
        <Reveal index={0}>
          <View style={styles.dueRow}>
            {dueToday.map((a) => (
              <Pressy key={a.id} onPress={() => router.push(`/assignment/${a.id}`)} style={styles.duePill}>
                <Icon name="flag" size={13} color={colors.flame} />
                <Text style={styles.dueText} numberOfLines={1}>
                  {KIND_LABEL[a.kind]}: {a.title}
                </Text>
              </Pressy>
            ))}
          </View>
        </Reveal>
      ) : null}

      <Reveal index={1}>
        <View style={styles.timeline}>
          {items.map((it, i) => (
            <View key={it.key}>
              {i === nowIndex ? <NowLine mins={nowMins} /> : null}
              <TimelineItem
                it={it}
                past={it.end <= nowMins}
                onToggle={it.blockId ? () => toggleBlock(it.blockId!) : undefined}
                onDelete={it.blockId ? () => deleteBlock(it.blockId!) : undefined}
              />
            </View>
          ))}
          {items.length && nowIndex === -1 ? <NowLine mins={nowMins} /> : null}
          {!items.length ? <Text style={styles.empty}>Nothing scheduled yet today.</Text> : null}
        </View>
      </Reveal>

      <Reveal index={2}>
        <Section title="Plan a block" action={{ label: adding ? 'Cancel' : 'Add', onPress: () => setAdding((v) => !v) }}>
          {adding ? (
            <Animated.View entering={FadeInDown.duration(240)}>
              <Card>
                <Field placeholder="e.g. Chem problem set" value={title} onChangeText={setTitle} />
                <View style={styles.gap}>
                  <TimeField label="Starts" value={start} onChange={setStart} />
                </View>
                <ChipRow style={styles.gap}>
                  {LENGTHS.map((l) => (
                    <Chip key={l} label={l >= 60 ? `${l / 60} h` : `${l} min`} selected={length === l} onPress={() => setLength(l)} icon="clock" />
                  ))}
                </ChipRow>
                <View style={styles.swatches}>
                  {BLOCK_COLORS.map((c) => (
                    <Pressy key={c} onPress={() => setColor(c)} depth={0.85} style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]} />
                  ))}
                </View>
                <Button label={`Add ${clock(start)} – ${clock(start + length)}`} icon="plus" disabled={!title.trim()} onPress={save} style={styles.gap} />
              </Card>
            </Animated.View>
          ) : (
            <Button label="Plan a block" icon="plus" variant="secondary" onPress={() => setAdding(true)} />
          )}
        </Section>
      </Reveal>
    </Screen>
  );
}

function NowLine({ mins }: { mins: number }) {
  return (
    <View style={styles.now}>
      <Text style={styles.nowTime}>{clock(mins)}</Text>
      <View style={styles.nowDot} />
      <View style={styles.nowRule} />
    </View>
  );
}

function TimelineItem({ it, past, onToggle, onDelete }: { it: Item; past: boolean; onToggle?: () => void; onDelete?: () => void }) {
  const length = Math.max(10, it.end - it.start);
  const height = Math.min(130, Math.max(56, length * 1.1));
  return (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOut.duration(160)} layout={LinearTransition.springify().damping(18)} style={[styles.item, past && styles.past]}>
      <Text style={styles.time}>{clock(it.start)}</Text>
      <Pressy
        onPress={onToggle}
        disabled={!onToggle}
        depth={0.9}
        style={[styles.capsule, { height, backgroundColor: it.done ? it.color : alpha(it.color, 0.18), borderColor: alpha(it.color, 0.6) }]}
        accessibilityRole={onToggle ? 'checkbox' : undefined}
        accessibilityState={onToggle ? { checked: !!it.done } : undefined}
      >
        <Icon name={it.done && it.kind === 'block' ? 'check' : it.icon} size={18} color={it.done ? colors.flameInk : it.color} strokeWidth={2.2} />
      </Pressy>
      <View style={styles.itemBody}>
        <Text style={[styles.itemTitle, it.done && it.kind === 'block' && styles.doneText]} numberOfLines={2}>
          {it.title}
        </Text>
        <Text style={styles.itemSub}>
          {clock(it.start)} – {clock(it.end)}, {it.sub}
        </Text>
      </View>
      {onDelete ? (
        <Pressy onPress={onDelete} hitSlop={10} depth={0.85} style={styles.trash} accessibilityLabel={`Remove ${it.title}`}>
          <Icon name="close" size={15} color={colors.textFaint} />
        </Pressy>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: alpha(colors.flame, 0.12),
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.3),
  },
  dueText: {
    flexShrink: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },
  timeline: {
    marginTop: 18,
    gap: 10,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  past: {
    opacity: 0.5,
  },
  time: {
    width: 62,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  capsule: {
    width: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  doneText: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  itemSub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  trash: {
    padding: 4,
  },
  now: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nowTime: {
    width: 62,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.flame,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.flame,
    marginLeft: 17,
  },
  nowRule: {
    flex: 1,
    height: 1.5,
    backgroundColor: alpha(colors.flame, 0.5),
  },
  gap: {
    marginTop: 12,
  },
  swatches: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchOn: {
    borderColor: colors.text,
  },
});
