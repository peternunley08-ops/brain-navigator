import { router } from 'expo-router';
import { Linking } from 'react-native';
import { isShowing } from '../../core/showMode';
import { createContext, useContext, useEffect } from 'react';
import { celebrate } from '../../core/celebrateStore';
import { plural } from '../../core/words';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { addDays, dateKey, daysUntil } from '../../core/dates';
import { nextBadge } from '../../core/achievements';
import { closedToday } from '../../core/deskNotes';
import { dueFollowUp, followUpTopic } from '../../core/emberAI';
import { helperById } from '../../core/helpers';
import { useHubStore } from '../../core/hubStore';
import { useLifeStore, weekOf, type Person, type Worry } from '../../core/lifeStore';
import { useWellnessStore } from '../../core/wellnessStore';
import { clock, isoDay, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts } from '../../core/theme';
import { Card } from '../ui/Card';
import { Icon, type IconName } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';

// Each card below has a when…() check next to it: the card's own condition,
// as a plain function, so Ember's note (EmberNote.tsx) asks the same question
// the card does when it decides which one to show.

type Assignments = ReturnType<typeof useSchoolStore.getState>['assignments'];
type Closed = { day: string; ids: string[] } | undefined;

// Inside the "Ember has N more" sheet, opening a card puts the sheet away first.
export const LeaveNoteSheet = createContext<() => void>(() => {});

export function Row({ icon, color, title, body, onPress, onClose }: { icon: IconName; color: string; title: string; body: string; onPress: () => void; onClose?: () => void }) {
  const reduced = useReducedMotion();
  const leave = useContext(LeaveNoteSheet);
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(320)} exiting={reduced ? undefined : FadeOut.duration(180)}>
      <Card
        tint={color}
        onPress={() => {
          leave();
          onPress();
        }}
        style={styles.card}
      >
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
  const hidden = closedToday(closed, id, today);
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

/** Which brief applies now: the morning's (5–11, with classes or something due), the evening's (5 PM on), or none. */
export function whenDayBrief(classes: ReturnType<typeof useSchoolStore.getState>['classes'], assignments: Assignments, now = new Date()): 'morning' | 'evening' | null {
  const h = now.getHours();
  if (h >= 5 && h < 11) {
    const today = dateKey(now);
    const todays = firstClassOn(isoDay(now), classes);
    const due = assignments.filter((a) => !a.done && a.due <= today).length;
    return todays.length || due ? 'morning' : null;
  }
  return h >= 17 ? 'evening' : null;
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
  const today = dateKey(now);
  const kind = whenDayBrief(classes, assignments, now);

  if (kind === 'morning') {
    const todays = firstClassOn(isoDay(now), classes);
    const due = assignments.filter((a) => !a.done && a.due <= today).length;
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

  if (kind === 'evening') {
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

/** A test or quiz within two days (or an essay within four), unless closed today. */
export function whenHelperNudge(assignments: Assignments, hidden: boolean) {
  if (hidden) return null;
  const soon = assignments
    .filter((a) => !a.done && (a.kind === 'test' || a.kind === 'quiz') && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 2)
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  const essay = !soon ? assignments.find((a) => !a.done && a.kind === 'essay' && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 4) : undefined;
  const target = soon ?? essay;
  return target ? { target, soon: !!soon } : null;
}

// A test or quiz within two days: offer the right helper.
export function HelperNudge() {
  const assignments = useSchoolStore((s) => s.assignments);
  const decks = useLifeStore((s) => s.decks);
  const [hidden, setHidden] = useClosedToday('HelperNudge');
  const hit = whenHelperNudge(assignments, hidden);
  if (!hit) return null;
  const { target, soon } = hit;
  const helper = helperById(soon ? 'quizzo' : 'quill')!;
  const d = daysUntil(target.due);
  const when = d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;
  return (
    <Row
      icon="people"
      color={helper.color}
      title={soon ? `${target.title} is ${when}` : `${target.title} is due ${when}`}
      body={
        soon
          ? decks.some((d) => d.cards.length > 1)
            ? `Warm up with ${helper.name}: a quick game from your flashcards.`
            : `Warm up with ${helper.name}: a quick quiz on it, one question at a time.`
          : `${helper.name} can help you find what to say. You write it.`
      }
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

/** The first thing tagged in today's check-in that hasn't been closed today. */
export function whenTagTool(tags: string[] | undefined, closed: Closed, today: string) {
  // Closing one shows the next thing you tagged, if there was more than one.
  const gone = closed?.day === today ? closed.ids : [];
  return (tags ?? []).map((t) => TAG_TOOLS[t]).filter(Boolean).filter((t) => !gone.includes(`tag-${t.title}`))[0] ?? null;
}

export function TagTool() {
  const tags = useSchoolStore((s) => s.stressTags[dateKey()]);
  const closed = useLifeStore((st) => st.settings.deskClosed);
  const today = dateKey();
  const tool = whenTagTool(tags, closed, today);
  if (!tool) return null;
  const gone = closed?.day === today ? closed.ids : [];
  const close = () => useLifeStore.getState().setSettings({ deskClosed: { day: today, ids: [...gone, `tag-${tool.title}`] } });
  return <Row key={tool.title} icon={tool.icon} color={tool.color} title={tool.title} body={tool.body} onPress={() => router.push(tool.href as never)} onClose={close} />;
}

// Days away, read once the first time the Desk asks this session (before
// lastSeen moves to today), so the card and Ember's note agree.
let awayAtOpen: number | null = null;
export function awayOnOpen() {
  if (awayAtOpen == null) {
    const last = useLifeStore.getState().settings.lastSeen;
    awayAtOpen = last ? -daysUntil(last) : 0;
  }
  return awayAtOpen;
}

/** Keeps today as the last day the Desk was opened (after days away are read). */
export function useMarkSeen() {
  useEffect(() => {
    awayOnOpen();
    const today = dateKey();
    if (useLifeStore.getState().settings.lastSeen !== today) useLifeStore.getState().setSettings({ lastSeen: today });
  }, []);
}

export function whenWelcomeBack(away: number, hidden: boolean) {
  return away >= 2 && !hidden;
}

// After two or more days away: a plain hello and what's coming, no guilt.
export function WelcomeBack() {
  const assignments = useSchoolStore((s) => s.assignments);
  const away = awayOnOpen();
  const [hidden, setHidden] = useClosedToday('WelcomeBack');
  useMarkSeen();
  if (!whenWelcomeBack(away, hidden)) return null;
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

export function whenBirthday(birthday: string | null | undefined, today: string, hidden: boolean) {
  return !!birthday && today.slice(5) === birthday && !hidden;
}

// On your birthday, the Desk says so first.
export function Birthday() {
  const birthday = useLifeStore((s) => s.settings.birthday);
  const name = useSchoolStore((s) => s.profile.name);
  const today = dateKey();
  const [hidden, setHidden] = useClosedToday('Birthday');
  const isToday = whenBirthday(birthday, today, false);
  useEffect(() => {
    if (isToday) celebrate(`Happy birthday${name ? `, ${name}` : ''}`, 'Go easy on yourself today. The list can wait a little.', '#E89AB8', { key: `birthday-${today.slice(0, 4)}` });
  }, [isToday, name, today]);
  if (!isToday || hidden) return null;
  return <Row icon="gift" color="#E89AB8" title={`Happy birthday${name ? `, ${name}` : ''}`} body="Ember says the candles today are all yours." onPress={() => router.push('/wins')} onClose={setHidden} />;
}

/** A test or project one to three days out with no steps yet. */
export function whenPlanTest(assignments: Assignments, hidden: boolean) {
  if (hidden) return null;
  return (
    assignments
      .filter((a) => !a.done && (a.kind === 'test' || a.kind === 'project') && !a.subtasks?.length && daysUntil(a.due) >= 1 && daysUntil(a.due) <= 3)
      .sort((a, b) => a.due.localeCompare(b.due))[0] ?? null
  );
}

// A test or project within three days with no steps yet: offer to plan it backward.
export function PlanTest() {
  const assignments = useSchoolStore((s) => s.assignments);
  const [hidden, setHidden] = useClosedToday('PlanTest');
  const t = whenPlanTest(assignments, hidden);
  if (!t) return null;
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

/** Monday and Tuesday before 2 PM, when last week's review named something to try. */
export function whenTryThisWeek(reviews: ReturnType<typeof useLifeStore.getState>['reviews'], hidden: boolean, now = new Date()) {
  const dow = now.getDay();
  if (hidden || (dow !== 1 && dow !== 2) || now.getHours() >= 14) return null;
  const last = reviews.find((r) => r.weekOf === addDays(weekOf(), -7));
  return last?.next.trim() ? last : null;
}

// Monday and Tuesday before 2 PM: what last week's review said to try.
export function TryThisWeek() {
  const reviews = useLifeStore((s) => s.reviews);
  const [hidden, setHidden] = useClosedToday('TryThisWeek');
  const last = whenTryThisWeek(reviews, hidden);
  if (!last) return null;
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

/** An unsaved check-in from today, or a note left in the last twelve hours. Never while showing. */
export function whenPickUp(
  draft: string | undefined,
  lastNote: { id: string; at: string } | undefined,
  checkins: { checkin_date: string }[],
  notes: { id: string; title: string }[],
  hidden: boolean,
) {
  if (hidden || isShowing()) return null;
  const today = dateKey();
  const savedToday = checkins.some((c) => c.checkin_date === today);
  if (draft === today && !savedToday) {
    return { body: new Date().getHours() < 12 ? 'Your check-in from this morning' : 'Your check-in from earlier today', path: '/checkin' };
  }
  if (lastNote && Date.now() - new Date(lastNote.at).getTime() < 12 * 3600 * 1000) {
    const note = notes.find((n) => n.id === lastNote.id);
    if (note) return { body: `The note you were writing: ${note.title.trim() || 'Untitled'}`, path: `/note/${note.id}` };
  }
  return null;
}

// Pick up where you left off: an unsaved check-in, or the note last written.
export function PickUp() {
  const draft = useLifeStore((s) => s.settings.checkinDraft);
  const lastNote = useLifeStore((s) => s.settings.lastNote);
  const checkins = useWellnessStore((s) => s.checkins);
  const notes = useHubStore((s) => s.notes);
  const [hidden, setHidden] = useClosedToday('PickUp');
  const hit = whenPickUp(draft, lastNote, checkins, notes, hidden);
  if (!hit) return null;
  return <Row icon="pen" color={colors.flame} title="Pick up where you left off" body={hit.body} onPress={() => router.push(hit.path as never)} onClose={setHidden} />;
}

/** The nearest badge, once it's at least half way. */
export function whenNextBadge(next: ReturnType<typeof nextBadge>, hidden: boolean) {
  return next && !hidden && next.have / next.need >= 0.5 ? next : null;
}

// The badge you're closest to, as a quiet heads-up. No countdown: a number
// left reads as a target to chase, and badges are a nice surprise, not a goal.
export function NextBadge() {
  // Re-read when anything that counts toward a badge changes.
  useSchoolStore((s) => s.assignments);
  useSchoolStore((s) => s.focus);
  useLifeStore((s) => s.wins);
  const [hidden, setHidden] = useClosedToday('NextBadge');
  const next = whenNextBadge(nextBadge(), hidden);
  if (!next) return null;
  return (
    <Row
      icon={next.badge.icon}
      color={next.badge.color}
      title={`On the way to ${next.badge.title}`}
      body={next.badge.body}
      onPress={() => router.push('/achievements')}
      onClose={setHidden}
    />
  );
}

/** A gratitude from at least six days ago, a different one each day of the month. */
export function whenResurface(gratitude: Record<string, string[]>, hidden: boolean) {
  if (hidden) return null;
  const cutoff = addDays(dateKey(), -6);
  const past = Object.entries(gratitude)
    .filter(([k, v]) => k <= cutoff && v.some((x) => x.trim()))
    .sort(([a], [b]) => a.localeCompare(b));
  if (!past.length) return null;
  const day = Number(dateKey().slice(8));
  const [k, items] = past[day % past.length];
  const kept = items.filter((x) => x.trim());
  return { k, item: kept[day % kept.length] };
}

// Something they were grateful for a while ago, brought back once a day.
export function Resurface() {
  const gratitude = useLifeStore((s) => s.gratitude);
  const [hidden, setHidden] = useClosedToday('Resurface');
  const hit = whenResurface(gratitude, hidden);
  if (!hit) return null;
  const [y, m, d] = hit.k.split('-').map(Number);
  return (
    <Row
      icon="heart"
      color="#F08A8A"
      title={`On ${new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, you were grateful for`}
      body={`“${hit.item}”`}
      onPress={() => router.push('/wins')}
      onClose={setHidden}
    />
  );
}

/** Something the student told Ember about is done, and AI is on. */
export function whenFollowUp(due: ReturnType<typeof dueFollowUp>, aiOff: boolean) {
  return due?.followUp && !aiOff ? due : null;
}

// Something the student told Ember about is done now: ask how it went.
// Only from memories they agreed to keep; hiding it counts as answered.
export function FollowUp() {
  useLifeStore((s) => s.emberMemory);
  const aiOff = useLifeStore((s) => !!s.settings.aiOff);
  const due = whenFollowUp(dueFollowUp(), aiOff);
  if (!due?.followUp) return null;
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

/** Open worries, between 4 and 7 PM (0 when it isn't worry time). */
export function whenWorryTime(worries: Worry[], hidden: boolean, h = new Date().getHours()) {
  const open = worries.filter((w) => !w.resolved).length;
  return !open || hidden || h < 16 || h >= 19 ? 0 : open;
}

// Late afternoon, with worries waiting in the box.
export function WorryTime() {
  const worries = useLifeStore((s) => s.worries);
  const [hidden, setHidden] = useClosedToday('WorryTime');
  const open = whenWorryTime(worries, hidden);
  if (!open) return null;
  return (
    <Row
      icon="feather"
      color="#AFA2DE"
      title="It’s worry time"
      body={`${open} worr${open === 1 ? 'y is' : 'ies are'} waiting in the box. Give each fifteen minutes, then let the rest of the evening be yours.`}
      onPress={() => router.push({ pathname: '/worry', params: { timer: '15' } })}
      onClose={setHidden}
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

/** Weekend daytime, once a week, when someone in Your people has a number. Never while showing. */
export function whenOneKindThing(people: Person[], kindWeek: string | undefined, hidden: boolean, now = new Date()) {
  if (isShowing() || hidden) return null;
  const dow = now.getDay();
  const week = weekOf();
  if ((dow !== 6 && dow !== 0) || now.getHours() < 9 || now.getHours() >= 18 || kindWeek === week) return null;
  const reachable = people.filter((p) => p.phone.trim());
  if (!reachable.length) return null;
  const n = Math.floor(Date.parse(week) / (7 * 86400000));
  return { week, person: reachable[n % reachable.length], line: KIND_LINES[n % KIND_LINES.length] };
}

export function OneKindThing() {
  const people = useLifeStore((s) => s.people);
  const kindWeek = useLifeStore((s) => s.settings.kindWeek);
  const setSettings = useLifeStore((s) => s.setSettings);
  const [hidden, setHidden] = useClosedToday('OneKindThing');
  const hit = whenOneKindThing(people, kindWeek, hidden);
  if (!hit) return null;
  const { week, person, line } = hit;
  return (
    <Row
      icon="message"
      color={colors.flame}
      title={`One kind thing: text ${person.name}`}
      body={`“${line}” Tap to open it in Messages. Nothing sends until you do.`}
      onPress={() => {
        setSettings({ kindWeek: week });
        Linking.openURL('sms:' + person.phone.replace(/[^\d+]/g, '') + '&body=' + encodeURIComponent(line)).catch(() => {});
      }}
      onClose={setHidden}
    />
  );
}
