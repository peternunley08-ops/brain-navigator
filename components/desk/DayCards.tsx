import { router } from 'expo-router';
import { Linking } from 'react-native';
import { isShowing } from '../../core/showMode';
import { useEffect, useState } from 'react';
import { celebrate } from '../../core/celebrateStore';
import { plural } from '../../core/words';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { addDays, dateKey, daysUntil } from '../../core/dates';
import { nextBadge } from '../../core/achievements';
import { dueFollowUp, followUpTopic } from '../../core/emberAI';
import { helperById } from '../../core/helpers';
import { useHubStore } from '../../core/hubStore';
import { useLifeStore, weekOf } from '../../core/lifeStore';
import { useWellnessStore } from '../../core/wellnessStore';
import { clock, isoDay, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts } from '../../core/theme';
import { Card } from '../ui/Card';
import { Icon, type IconName } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';

function Row({ icon, color, title, body, onPress, onClose }: { icon: IconName; color: string; title: string; body: string; onPress: () => void; onClose?: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(320)} exiting={FadeOut.duration(180)}>
      <Card tint={color} onPress={onPress} style={styles.card}>
        <View style={[styles.icon, { backgroundColor: alpha(color, 0.16) }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
        {onClose ? <IconButton icon="close" label="Hide for today" size={30} onPress={onClose} /> : <Icon name="chevron" size={16} color={colors.textFaint} />}
      </Card>
    </Animated.View>
  );
}

// A card closed with × stays closed for the rest of the day, even after the
// app restarts (kept in settings; it comes back tomorrow).
export function useClosedToday(id: string): [boolean, () => void] {
  const today = dateKey();
  const closed = useLifeStore((st) => st.settings.deskClosed);
  const hidden = closed?.day === today && closed.ids.includes(id);
  const close = () => {
    const cur = useLifeStore.getState().settings.deskClosed;
    const ids = cur?.day === today ? cur.ids : [];
    useLifeStore.getState().setSettings({ deskClosed: { day: today, ids: [...ids.filter((x) => x !== id), id] } });
  };
  return [hidden, close];
}

function firstClassOn(day: number, classes: ReturnType<typeof useSchoolStore.getState>['classes']) {
  return classes.filter((c) => c.kind === 'class' && c.days.includes(day)).sort((a, b) => a.start - b.start);
}

// Morning (5–11): today's shape. Evening (5 PM on): tomorrow's shape and
// when to be asleep. Only one shows at a time.
export function DayBrief() {
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const goal = useSchoolStore((s) => s.profile.sleepGoal);
  const wake = useLifeStore((s) => s.settings.wake);
  const focus = useSchoolStore((s) => s.focus);
  const oneThing = useLifeStore((s) => s.oneThing);
  const countdowns = useLifeStore((s) => s.countdowns);
  const pack = useLifeStore((s) => s.pack);
  const now = new Date();
  const h = now.getHours();
  const today = dateKey(now);

  if (h >= 5 && h < 11) {
    const todays = firstClassOn(isoDay(now), classes);
    const due = assignments.filter((a) => !a.done && a.due <= today).length;
    if (!todays.length && !due) return null;
    const first = todays[0];
    const weekMin = focus.filter((f) => dateKey(new Date(f.at)) >= weekOf(today)).reduce((s, f) => s + f.minutes, 0);
    const one = oneThing[today]?.trim();
    const soon = countdowns.filter((c) => daysUntil(c.date) > 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    return (
      <Row
        icon="sun"
        color="#F5A36B"
        title="This morning"
        body={[
          first ? `${todays.length} class${todays.length === 1 ? '' : 'es'}, starting with ${first.name} at ${clock(first.start)}.` : 'No classes today.',
          due ? `${plural(due, 'thing')} due today.` : 'Nothing due today.',
          one ? `Your one thing: ${one}.` : null,
          weekMin >= 30 ? `${Math.round((weekMin / 60) * 10) / 10} hours of focus so far this week.` : null,
          soon ? `${soon.title} in ${plural(daysUntil(soon.date), 'day')}.` : null,
        ]
          .filter(Boolean)
          .join(' ')}
        onPress={() => router.push('/today')}
      />
    );
  }

  if (h >= 17) {
    const tomorrow = addDays(today, 1);
    const [y, m, d] = tomorrow.split('-').map(Number);
    const tmr = firstClassOn(isoDay(new Date(y, m - 1, d)), classes);
    const due = assignments.filter((a) => !a.done && a.due === tomorrow);
    const lightsOut = (((wake - goal * 60 - 15) % 1440) + 1440) % 1440;
    return (
      <Row
        icon="moon"
        color="#8FB4E8"
        title="Tomorrow"
        body={[
          tmr[0] ? `First up: ${tmr[0].name} at ${clock(tmr[0].start)}.` : 'No classes on the schedule.',
          due.length ? `${due.length} due: ${due.slice(0, 2).map((a) => a.title).join(', ')}${due.length > 2 ? '…' : ''}.` : 'Nothing due.',
          pack.length ? 'Pack the bag tonight.' : null,
          `Lights out by ${clock(lightsOut)}.`,
        ]
          .filter(Boolean)
          .join(' ')}
        onPress={() => router.push('/sleep')}
      />
    );
  }
  return null;
}

// A test or quiz within two days: offer the right helper.
export function HelperNudge() {
  const assignments = useSchoolStore((s) => s.assignments);
  const [hidden, setHidden] = useClosedToday('HelperNudge');
  const soon = assignments
    .filter((a) => !a.done && (a.kind === 'test' || a.kind === 'quiz') && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 2)
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  const essay = !soon ? assignments.find((a) => !a.done && a.kind === 'essay' && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 4) : undefined;
  const target = soon ?? essay;
  if (!target || hidden) return null;
  const helper = helperById(soon ? 'quizzo' : 'quill')!;
  const d = daysUntil(target.due);
  const when = d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;
  return (
    <Row
      icon="people"
      color={helper.color}
      title={soon ? `${target.title} is ${when}` : `${target.title} is due ${when}`}
      body={soon ? `Warm up with ${helper.name}: a quick game from your flashcards.` : `${helper.name} can help you find what to say. You write it.`}
      onPress={() => router.push({ pathname: '/helper/[id]', params: { id: helper.id, about: target.id } })}
      onClose={setHidden}
    />
  );
}

// What today's check-in said was weighing on you, matched with the tool
// that fits it. Hidden once dismissed for the day.
export const TAG_TOOLS: Record<string, { title: string; body: string; icon: IconName; color: string; href: string }> = {
  Tests: { title: 'Tests on your mind', body: 'Quizzo can turn your flashcards into a quick warm-up.', icon: 'bolt', color: '#B79AF0', href: '/helper/quizzo' },
  Homework: { title: 'Homework piling up', body: 'Pip can fit tonight into your cap, with breaks.', icon: 'calendar', color: '#7CC4F2', href: '/helper/pip' },
  Friends: { title: 'Friend stuff', body: 'Talking it through with Ember can untangle it a little.', icon: 'chat', color: '#F08A8A', href: '/companion' },
  Family: { title: 'Family stuff', body: 'Put it in the worry box and give it fifteen minutes later.', icon: 'feather', color: '#AFA2DE', href: '/worry' },
  Sports: { title: 'A lot on the field', body: 'Two minutes of slow breathing settles the body fast.', icon: 'wind', color: '#8FB4E8', href: '/breathe' },
  Job: { title: 'Work and school at once', body: 'See the whole week, and where the light days are.', icon: 'calendar', color: '#F5B45C', href: '/week' },
  College: { title: 'College pressure', body: 'One next step at a time. Your list is waiting.', icon: 'cap', color: '#8CC0A8', href: '/college' },
  Sleep: { title: 'Sleep’s been rough', body: 'Tonight’s wind-down and bedtime are ready for you.', icon: 'moon', color: '#8FB4E8', href: '/sleep' },
  Money: { title: 'Money worries', body: 'Write it down in the worry box, so it’s not all in your head.', icon: 'feather', color: '#AFA2DE', href: '/worry' },
  'Social media': { title: 'Scrolling taking over', body: 'A focus session with the phone in another room.', icon: 'timer', color: colors.flame, href: '/focus' },
};

export function TagTool() {
  const tags = useSchoolStore((s) => s.stressTags[dateKey()]);
  // Closing one shows the next thing you tagged, if there was more than one.
  const closed = useLifeStore((st) => st.settings.deskClosed);
  const today = dateKey();
  const gone = closed?.day === today ? closed.ids : [];
  const tools = (tags ?? []).map((t) => TAG_TOOLS[t]).filter(Boolean).filter((t) => !gone.includes(`tag-${t.title}`));
  const tool = tools[0];
  if (!tool) return null;
  const close = () => useLifeStore.getState().setSettings({ deskClosed: { day: today, ids: [...gone, `tag-${tool.title}`] } });
  return <Row key={tool.title} icon={tool.icon} color={tool.color} title={tool.title} body={tool.body} onPress={() => router.push(tool.href as never)} onClose={close} />;
}

// After two or more days away: a plain hello and what's coming, no guilt.
export function WelcomeBack() {
  const assignments = useSchoolStore((s) => s.assignments);
  const [away] = useState(() => {
    const last = useLifeStore.getState().settings.lastSeen;
    return last ? -daysUntil(last) : 0;
  });
  const [hidden, setHidden] = useClosedToday('WelcomeBack');
  useEffect(() => {
    const today = dateKey();
    if (useLifeStore.getState().settings.lastSeen !== today) useLifeStore.getState().setSettings({ lastSeen: today });
  }, []);
  if (away < 2 || hidden) return null;
  const week = assignments.filter((a) => !a.done && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 7).length;
  const late = assignments.filter((a) => !a.done && daysUntil(a.due) < 0).length;
  return (
    <Row
      icon="sun"
      color="#F5A36B"
      title={`Welcome back. It’s been ${away} days.`}
      body={[week ? `${plural(week, 'thing')} due this week.` : 'Nothing due this week.', late ? `${late} slipped past; triage helps.` : null].filter(Boolean).join(' ')}
      onPress={() => router.push(late ? '/triage' : '/school')}
      onClose={setHidden}
    />
  );
}

// On your birthday, the Desk says so first.
export function Birthday() {
  const birthday = useLifeStore((s) => s.settings.birthday);
  const name = useSchoolStore((s) => s.profile.name);
  const today = dateKey();
  const isToday = !!birthday && today.slice(5) === birthday;
  useEffect(() => {
    if (isToday) celebrate(`Happy birthday${name ? `, ${name}` : ''}`, 'Go easy on yourself today. The list can wait a little.', '#E89AB8', { key: `birthday-${today.slice(0, 4)}` });
  }, [isToday, name, today]);
  if (!isToday) return null;
  return <Row icon="gift" color="#E89AB8" title={`Happy birthday${name ? `, ${name}` : ''}`} body="Ember says the candles today are all yours." onPress={() => router.push('/wins')} />;
}

// A test or project within three days with no steps yet: offer to plan it backward.
export function PlanTest() {
  const assignments = useSchoolStore((s) => s.assignments);
  const [hidden, setHidden] = useClosedToday('PlanTest');
  const t = assignments
    .filter((a) => !a.done && (a.kind === 'test' || a.kind === 'project') && !a.subtasks?.length && daysUntil(a.due) >= 1 && daysUntil(a.due) <= 3)
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  if (!t || hidden) return null;
  const d = daysUntil(t.due);
  return (
    <Row
      icon="layers"
      color="#AFA2DE"
      title={`${t.title} is ${d === 1 ? 'tomorrow' : `in ${d} days`}, no plan yet`}
      body="Spread the studying over the days you have. Tap to plan it backward."
      onPress={() => router.push(`/assignment/${t.id}`)}
      onClose={setHidden}
    />
  );
}

// Monday and Tuesday before 2 PM: what last week's review said to try.
export function TryThisWeek() {
  const reviews = useLifeStore((s) => s.reviews);
  const [hidden, setHidden] = useClosedToday('TryThisWeek');
  const now = new Date();
  const dow = now.getDay();
  if (hidden || (dow !== 1 && dow !== 2) || now.getHours() >= 14) return null;
  const last = reviews.find((r) => r.weekOf === addDays(weekOf(), -7));
  if (!last?.next.trim()) return null;
  return (
    <Row
      icon="flag"
      color={colors.flame}
      title="This week you said you’d try"
      body={`“${last.next.trim()}”`}
      onPress={() => router.push('/review')}
      onClose={setHidden}
    />
  );
}

// Pick up where you left off: an unsaved check-in, or the note last written.
export function PickUp() {
  const draft = useLifeStore((s) => s.settings.checkinDraft);
  const lastNote = useLifeStore((s) => s.settings.lastNote);
  const checkins = useWellnessStore((s) => s.checkins);
  const notes = useHubStore((s) => s.notes);
  const [hidden, setHidden] = useClosedToday('PickUp');
  if (hidden || isShowing()) return null;
  const today = dateKey();
  const savedToday = checkins.some((c) => c.checkin_date === today);
  let body = '';
  let path = '';
  if (draft === today && !savedToday) {
    body = new Date().getHours() < 12 ? 'Your check-in from this morning' : 'Your check-in from earlier today';
    path = '/checkin';
  } else if (lastNote && Date.now() - new Date(lastNote.at).getTime() < 12 * 3600 * 1000) {
    const note = notes.find((n) => n.id === lastNote.id);
    if (note) {
      body = `The note you were writing: ${note.title.trim() || 'Untitled'}`;
      path = `/note/${note.id}`;
    }
  }
  if (!path) return null;
  return <Row icon="pen" color={colors.flame} title="Pick up where you left off" body={body} onPress={() => router.push(path as never)} onClose={setHidden} />;
}

// The badge you're closest to, as a small nudge with the number left.
export function NextBadge() {
  // Re-read when anything that counts toward a badge changes.
  useSchoolStore((s) => s.assignments);
  useSchoolStore((s) => s.focus);
  useLifeStore((s) => s.wins);
  const next = nextBadge();
  if (!next || next.have / next.need < 0.5) return null;
  const left = next.need - next.have;
  // Focus is counted in minutes; past an hour and a half it reads better in hours.
  const hrs = (m: number) => Math.round((m / 60) * 10) / 10;
  const inHours = next.unit === 'minutes' && left >= 90;
  return (
    <Row
      icon={next.badge.icon}
      color={next.badge.color}
      title={inHours ? `${hrs(left)} more hours for ${next.badge.title}` : `${left} more ${next.unit} for ${next.badge.title}`}
      body={inHours ? `${hrs(next.have)} of ${hrs(next.need)} hours so far.` : `${next.have} of ${next.need} so far. ${next.badge.body}`}
      onPress={() => router.push('/achievements')}
    />
  );
}

// Something they were grateful for a while ago, brought back once a day.
export function Resurface() {
  const gratitude = useLifeStore((s) => s.gratitude);
  const cutoff = addDays(dateKey(), -6);
  const past = Object.entries(gratitude)
    .filter(([k, v]) => k <= cutoff && v.some((x) => x.trim()))
    .sort(([a], [b]) => a.localeCompare(b));
  if (!past.length) return null;
  const day = Number(dateKey().slice(8));
  const [k, items] = past[day % past.length];
  const item = items.filter((x) => x.trim())[day % items.filter((x) => x.trim()).length];
  const [y, m, d] = k.split('-').map(Number);
  return (
    <Row
      icon="heart"
      color="#F08A8A"
      title={`On ${new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, you were grateful for`}
      body={`“${item}”`}
      onPress={() => router.push('/wins')}
    />
  );
}

// Something the student told Ember about is done now: ask how it went.
// Only from memories they agreed to keep; hiding it counts as answered.
export function FollowUp() {
  useLifeStore((s) => s.emberMemory);
  const aiOff = useLifeStore((s) => !!s.settings.aiOff);
  const due = dueFollowUp();
  if (!due?.followUp || aiOff) return null;
  const topic = followUpTopic(due.followUp);
  return (
    <Row
      icon="chat"
      color={colors.flame}
      title={`How did ${topic} go?`}
      body="You mentioned it to Ember. Tell it how it went, good or bad."
      onPress={() => router.push('/companion')}
      onClose={() => useLifeStore.getState().updateMemory(due.id, { followedUp: true })}
    />
  );
}

// Late afternoon, with worries waiting in the box.
export function WorryTime() {
  const worries = useLifeStore((s) => s.worries);
  const open = worries.filter((w) => !w.resolved).length;
  const h = new Date().getHours();
  if (!open || h < 16 || h >= 19) return null;
  return (
    <Row
      icon="feather"
      color="#AFA2DE"
      title="It’s worry time"
      body={`${open} worr${open === 1 ? 'y is' : 'ies are'} waiting in the box. Give each fifteen minutes, then let the rest of the evening be yours.`}
      onPress={() => router.push({ pathname: '/worry', params: { timer: '15' } })}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
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
});

// One kind thing, once a week (weekends, daytime): a ready line to text someone.
// Nothing is sent for them; the message app opens with the line filled in.
const KIND_LINES = [
  'Thinking of you. Hope your week was good.',
  'No reason, just glad you’re in my life.',
  'Saw something that made me think of you.',
  'Hope you’re having a gentle weekend.',
];

export function OneKindThing() {
  const people = useLifeStore((s) => s.people);
  const kindWeek = useLifeStore((s) => s.settings.kindWeek);
  const setSettings = useLifeStore((s) => s.setSettings);
  const [hidden, setHidden] = useClosedToday('OneKindThing');
  if (isShowing() || hidden) return null;
  const now = new Date();
  const dow = now.getDay();
  const week = weekOf();
  if ((dow !== 6 && dow !== 0) || now.getHours() < 9 || now.getHours() >= 18 || kindWeek === week) return null;
  const reachable = people.filter((p) => p.phone.trim());
  if (!reachable.length) return null;
  const n = Math.floor(Date.parse(week) / (7 * 86400000));
  const person = reachable[n % reachable.length];
  const line = KIND_LINES[n % KIND_LINES.length];
  return (
    <Row
      icon="message"
      color={colors.flame}
      title={`One kind thing: text ${person.name}`}
      body={`“${line}” Tap to open it in Messages. Nothing sends until you do.`}
      onPress={() => {
        setSettings({ kindWeek: week });
        Linking.openURL('sms:' + person.phone.trim() + '&body=' + encodeURIComponent(line)).catch(() => {});
      }}
      onClose={setHidden}
    />
  );
}
