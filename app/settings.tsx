import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { EmberGlyph } from '../components/ember/EmberSprite';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { HoldToConfirm } from '../components/ui/HoldToConfirm';
import { IconButton } from '../components/ui/IconButton';
import { Icon } from '../components/ui/Icon';
import { type Jump, JumpChips, useJumps } from '../components/ui/JumpChips';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { Stepper } from '../components/ui/Stepper';
import { EVENING_HOURS, MORNING_HOURS, TimeField } from '../components/ui/TimeField';
import { useAIStatus } from '../components/helpers/Quota';
import { aboutFilled } from '../core/about';
import { goHome } from '../core/chrome';
import { startShow } from '../core/show';
import { warmth } from '../core/achievements';
import { ACCESSORIES, EMBER_THEMES } from '../core/emberLook';
import { useHubStore } from '../core/hubStore';
import { DESK_ORDER, type EmberTheme, hoursTotal, useLifeStore } from '../core/lifeStore';
import { classAverage, dueLabel, letterFor, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts, radii } from '../core/theme';

const GRADES = [9, 10, 11, 12];

// The jump chips at the top, one per part of the story.
const PARTS: Jump[] = [
  { key: 'you', label: 'You', icon: 'star' },
  { key: 'desk', label: 'Your Desk', icon: 'candle' },
  { key: 'ember', label: 'Ember', icon: 'flame' },
  { key: 'ai', label: 'AI', icon: 'sparkle' },
  { key: 'show', label: 'Show someone', icon: 'people' },
  { key: 'data', label: 'Your data', icon: 'share' },
];

const DESK_PARTS: { key: string; label: string }[] = [
  { key: 'countdowns', label: 'Countdowns' },
  { key: 'onething', label: 'One thing' },
  { key: 'capture', label: 'Quick add' },
  { key: 'pinned', label: 'Pinned notes' },
  { key: 'brief', label: 'Morning and evening brief' },
  { key: 'question', label: 'Question of the day' },
  { key: 'nudges', label: 'Nudges' },
  { key: 'due', label: 'Due soon' },
  { key: 'mind', label: 'On your mind' },
  { key: 'checkin', label: 'How you’re doing' },
  { key: 'tiles', label: 'Focus, warmth, habits' },
  { key: 'line', label: 'Line of the day' },
];

// Everything about you and how the app behaves, in one place — plus your
// data, which you can take with you or wipe.
export default function SettingsScreen() {
  const jumps = useJumps();
  const profile = useSchoolStore((s) => s.profile);
  const setProfile = useSchoolStore((s) => s.setProfile);
  const settings = useLifeStore((s) => s.settings);
  const about = useLifeStore((s) => s.about);
  const showSomeone = () =>
    Alert.alert(
      'Show a sample student?',
      'The app fills with Riley, a made-up 11th grader. Your own data stays hidden and safe, AI is off, and nothing you do while showing is saved. Tap the gold pill at the top to come back.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show',
          onPress: async () => {
            await startShow();
            goHome();
            emberSay('Meet Riley. Look around. Nothing here is yours, so tap anything.', 'cheer');
          },
        },
      ]
    );
  const setSettings = useLifeStore((s) => s.setSettings);
  const deskOrder = settings.deskOrder ?? DESK_ORDER;
  const moveDesk = (i: number, by: number) => {
    const next = [...deskOrder];
    const j = i + by;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSettings({ deskOrder: next });
  };
  // Re-read warmth whenever anything it counts changes.
  const achievements = useLifeStore((s) => s.achievements);
  const assignments = useSchoolStore((s) => s.assignments);
  const w = useMemo(() => warmth(), [achievements, assignments]); // eslint-disable-line react-hooks/exhaustive-deps

  const ai = useAIStatus();
  const [birthday, setBirthday] = useState(settings.birthday ? settings.birthday.replace('-', '/') : '');

  const nextUnlock = [...Object.values(EMBER_THEMES).map((t) => t.warmth), ...ACCESSORIES.map((a) => a.warmth)]
    .filter((x) => x > w)
    .sort((a, b) => a - b)[0];

  const saveBirthday = (text: string) => {
    setBirthday(text);
    const m = text.match(/^(\d{1,2})[/-](\d{1,2})$/);
    if (m) {
      const mm = Number(m[1]);
      const dd = Number(m[2]);
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        setSettings({ birthday: `${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}` });
        return;
      }
    }
    if (!text.trim()) setSettings({ birthday: null });
  };

  const exportAll = async () => {
    const school = useSchoolStore.getState();
    const hub = useHubStore.getState();
    const data = {
      exportedAt: new Date().toISOString(),
      app: 'Brain Navigator',
      school: {
        classes: school.classes,
        assignments: school.assignments,
        focus: school.focus,
        grades: school.grades,
        profile: school.profile,
        stressTags: school.stressTags,
      },
      // The Canvas token stays out of exports.
      hub: {
        notes: hub.notes,
        colleges: hub.colleges,
        plan: hub.plan,
        scholarships: hub.scholarships,
        recs: hub.recs,
        activities: hub.activities,
        aid: hub.aid,
      },
      life: useLifeStore.getState().snapshot(),
    };
    const json = JSON.stringify(data, null, 2);
    try {
      const f = new File(Paths.cache, `brain-navigator-${new Date().toISOString().slice(0, 10)}.json`);
      if (f.exists) f.delete();
      f.create();
      f.write(json);
      await Share.share({ url: f.uri, title: 'Brain Navigator backup' });
    } catch {
      await Share.share({ message: json });
    }
  };

  // A plain summary anyone can read: for a parent, a counselor, or just to keep.
  const shareSummary = () => {
    const school = useSchoolStore.getState();
    const hub = useHubStore.getState();
    const life = useLifeStore.getState();
    const open = school.assignments.filter((a) => !a.done).sort((a, b) => a.due.localeCompare(b.due));
    const cls = (id: string | null) => school.classes.find((c) => c.id === id)?.name;
    const lines = [
      `${school.profile.name || 'My'} school summary, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      '',
      'Classes',
      ...school.classes.filter((c) => c.kind === 'class').map((c) => {
        const avg = classAverage(school.grades, c);
        return `• ${c.name}${c.teacher ? `, ${c.teacher}` : ''}${avg != null ? `: ${avg.toFixed(1)}% (${letterFor(avg)})` : ''}`;
      }),
      '',
      `Still to do (${open.length})`,
      ...open.slice(0, 20).map((a) => `• ${a.title}${cls(a.classId) ? `, ${cls(a.classId)}` : ''}, due ${dueLabel(a.due)}`),
      ...(hub.colleges.length ? ['', 'Colleges', ...hub.colleges.map((c) => `• ${c.name}, ${c.plan}${c.deadline ? `, ${dueLabel(c.deadline)}` : ''}, ${c.status}`)] : []),
      ...(hub.scholarships.length ? ['', 'Scholarships', ...hub.scholarships.map((x) => `• ${x.name}${x.amount ? `, $${x.amount}` : ''}, ${x.status}`)] : []),
      '',
      `Service hours: ${Math.round(hoursTotal(life.hours, 'service') * 10) / 10}. Driving: ${Math.round(hoursTotal(life.hours, 'driving') * 10) / 10}.`,
      `Badges: ${Object.keys(life.achievements).length}. Wins in the jar: ${life.wins.length}.`,
    ];
    Share.share({ message: lines.join('\n') });
  };

  // Restore: paste a backup's text, see what's in it, then hold to replace.
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const backup = useMemo(() => {
    if (!pasted.trim()) return null;
    // If it was typed rather than pasted, iOS may have curled the quotes; try straightening them.
    const parse = (t: string) => {
      try {
        return JSON.parse(t);
      } catch {
        return JSON.parse(t.replace(/[“”]/g, '"'));
      }
    };
    try {
      const d = parse(pasted.trim());
      if (d?.app !== 'Brain Navigator' || !d.school || !d.hub || !d.life) return { error: 'That isn’t a Brain Navigator backup. Paste the whole file’s text.' } as const;
      return { data: d } as const;
    } catch {
      return { error: 'That text is cut off or changed. Paste the whole backup, from the first { to the last }.' } as const;
    }
  }, [pasted]);
  const restore = () => {
    if (!backup || !('data' in backup)) return;
    const d = backup.data;
    useSchoolStore.getState().restore(d.school);
    useHubStore.getState().restore(d.hub);
    useLifeStore.getState().restore(d.life);
    setPasted('');
    setRestoreOpen(false);
    emberSay('Everything’s back where it was.', 'cheer');
  };

  const resetAll = () => {
    for (const name of ['school.json', 'hub.json', 'life.json']) {
      try {
        const f = new File(Paths.document, name);
        if (f.exists) f.delete();
      } catch {
        // Keep going.
      }
    }
    useLifeStore.getState().reset();
    useSchoolStore.setState({ classes: [], assignments: [], focus: [], grades: [], stressTags: {} });
    useHubStore.setState({ notes: [], colleges: [], plan: [], scholarships: [], recs: [], activities: [], aid: {} });
    setProfile({ onboarded: false });
    emberSay('Fresh start. I’m still here.', 'happy');
    router.replace('/welcome');
  };

  // The page reads like a story: you, your Desk, Ember, AI, then your data
  // (and the button that wipes it) at the very end.
  let n = 0;
  return (
    <Screen title="Settings" subtitle="You, your Desk, Ember, AI, and your data." scrollRef={jumps.scrollRef}>
      <JumpChips items={PARTS} onJump={jumps.jump} />

      <View onLayout={jumps.mark('you')} />
      <Reveal index={n++}>
        <Section title="You" icon="star">
          <Card>
            <Field label="Your name" value={profile.name} onChangeText={(t) => setProfile({ name: t })} placeholder="First name" autoCapitalize="words" />
            <Text style={styles.label}>Grade</Text>
            <ChipRow>
              {GRADES.map((g) => (
                <Chip key={g} label={`${g}th`} selected={profile.grade === g} onPress={() => setProfile({ grade: profile.grade === g ? null : g })} />
              ))}
            </ChipRow>
            <Field
              label="Birthday (month/day)"
              value={birthday}
              onChangeText={saveBirthday}
              placeholder="e.g. 4/17"
              keyboardType="numbers-and-punctuation"
              containerStyle={styles.gap}
              hint="Only so Ember can say happy birthday."
            />
          </Card>
          <Card onPress={() => router.push('/about')} style={styles.aboutCard} accessibilityLabel="About you" accessibilityHint="What the app knows about you">
            <Ring progress={aboutFilled(about)} size={44} stroke={4} color="#B79AF0" value={`${Math.round(aboutFilled(about) * 100)}`} unit="%" />
            <View style={styles.flexOne}>
              <Text style={styles.dangerTitle}>About you</Text>
              <Text style={styles.aboutBody}>What you like, how you study, what calms you. Change or forget any of it.</Text>
            </View>
            <Icon name="chevron" size={18} color={colors.textFaint} />
          </Card>
          <View style={[styles.links, styles.linksGap]}>
            <Card onPress={() => router.push('/achievements')} style={styles.link}>
              <Icon name="trophy" size={22} color={colors.flame} />
              <Text style={styles.linkText}>Badges</Text>
            </Card>
            <Card onPress={() => router.push('/year')} style={styles.link}>
              <Icon name="star" size={22} color={colors.flame} />
              <Text style={styles.linkText}>Your year</Text>
            </Card>
          </View>
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="Nights" icon="moon" iconColor="#8FB4E8" note="Teens need 8–10 hours. Homework shouldn’t eat all of them.">
          <Card>
            <Row label="Sleep goal" hint="Hours a night">
              <Stepper value={`${profile.sleepGoal}h`} onDecrement={() => setProfile({ sleepGoal: Math.max(6, profile.sleepGoal - 0.5) })} onIncrement={() => setProfile({ sleepGoal: Math.min(11, profile.sleepGoal + 0.5) })} label="sleep goal" minWidth={52} />
            </Row>
            <Row label="Homework cap" hint="What fits in a school night">
              <Stepper value={`${profile.nightlyCap}m`} onDecrement={() => setProfile({ nightlyCap: Math.max(30, profile.nightlyCap - 15) })} onIncrement={() => setProfile({ nightlyCap: Math.min(300, profile.nightlyCap + 15) })} label="homework cap" minWidth={56} />
            </Row>
            <View style={styles.gap}>
              <TimeField label="Wind down at" value={settings.windDown} onChange={(v) => setSettings({ windDown: v })} hours={EVENING_HOURS} />
            </View>
            <View style={styles.gap}>
              <TimeField label="Wake up at" value={settings.wake} onChange={(v) => setSettings({ wake: v })} hours={MORNING_HOURS} />
            </View>
          </Card>
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="Goals" icon="flag">
          <Card>
            <Row label="Focus a week" hint="Minutes of focus sessions">
              <Stepper value={`${Math.round(settings.focusGoal / 60 * 10) / 10}h`} onDecrement={() => setSettings({ focusGoal: Math.max(60, settings.focusGoal - 30) })} onIncrement={() => setSettings({ focusGoal: Math.min(1800, settings.focusGoal + 30) })} label="weekly focus goal" minWidth={52} />
            </Row>
            <Row label="Service hours" hint="Your school or club’s requirement">
              <Stepper value={settings.serviceGoal} onDecrement={() => setSettings({ serviceGoal: Math.max(5, settings.serviceGoal - 5) })} onIncrement={() => setSettings({ serviceGoal: settings.serviceGoal + 5 })} label="service hours goal" />
            </Row>
            <Row label="Driving hours" hint="California asks for 50, 10 at night">
              <Stepper value={settings.drivingGoal} onDecrement={() => setSettings({ drivingGoal: Math.max(10, settings.drivingGoal - 5) })} onIncrement={() => setSettings({ drivingGoal: settings.drivingGoal + 5 })} label="driving hours goal" />
            </Row>
          </Card>
        </Section>
      </Reveal>

      <View onLayout={jumps.mark('desk')} />
      <Reveal index={n++}>
        <Section title="Your Desk" icon="candle" note="Tap to hide what you don’t use. The class card always stays.">
          <ChipRow>
            {DESK_PARTS.map((p) => {
              const on = !settings.deskHidden.includes(p.key);
              return (
                <Chip
                  key={p.key}
                  label={p.label}
                  icon={on ? 'check' : undefined}
                  selected={on}
                  onPress={() => setSettings({ deskHidden: on ? [...settings.deskHidden, p.key] : settings.deskHidden.filter((k) => k !== p.key) })}
                />
              );
            })}
          </ChipRow>
          <Text style={styles.label}>Order, top to bottom</Text>
          <Card padded={false} style={styles.orderCard}>
            {deskOrder.map((k, i) => (
              <View key={k} style={[styles.orderRow, i > 0 && styles.orderLine]}>
                <Text style={[styles.orderText, settings.deskHidden.includes(k) && styles.orderHidden]}>{DESK_PARTS.find((p) => p.key === k)?.label ?? k}</Text>
                {/* Rotated from outside: Pressy's own press transform would replace a rotate passed as its style. */}
                <View style={styles.up}>
                  <IconButton icon="back" label={`Move ${DESK_PARTS.find((p) => p.key === k)?.label} up`} size={34} disabled={i === 0} onPress={() => moveDesk(i, -1)} />
                </View>
                <View style={styles.down}>
                  <IconButton
                    icon="back"
                    label={`Move ${DESK_PARTS.find((p) => p.key === k)?.label} down`}
                    size={34}
                    disabled={i === deskOrder.length - 1}
                    onPress={() => moveDesk(i, 1)}
                  />
                </View>
              </View>
            ))}
          </Card>
        </Section>
      </Reveal>

      <View onLayout={jumps.mark('ember')} />
      <Reveal index={n++}>
        <Section title="Ember" icon="flame" note={`Warmth ${w}${nextUnlock ? `, next unlock at ${nextUnlock}` : ', everything unlocked'}`}>
          <Card>
            <View style={styles.emberHead}>
              <EmberGlyph size={48} />
              <View style={styles.flex}>
                <Text style={styles.emberTitle}>Warmth grows as you look after things.</Text>
                <Text style={styles.hint}>Finishing work, focus sessions, wins, gratitude, and badges all add to it.</Text>
              </View>
            </View>
            {nextUnlock ? <ProgressBar value={w / nextUnlock} style={styles.gap} /> : null}
            <Text style={styles.label}>Color</Text>
            <View style={styles.swatches}>
              {(Object.keys(EMBER_THEMES) as EmberTheme[]).map((key) => {
                const t = EMBER_THEMES[key];
                const locked = w < t.warmth;
                const on = settings.emberTheme === key;
                return (
                  <Pressy
                    key={key}
                    onPress={() => {
                      if (locked) {
                        emberSay(`${t.label} unlocks at ${t.warmth} warmth. You’re at ${w}.`, 'curious');
                        return;
                      }
                      setSettings({ emberTheme: key });
                      emberSay(`${t.label}. How do I look?`, 'cheer');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.label}${locked ? `, locked until ${t.warmth} warmth` : ''}`}
                    accessibilityState={{ selected: on, disabled: locked }}
                    style={[styles.swatch, on && { borderColor: t.body[1] }]}
                  >
                    <View style={[styles.swatchDot, { backgroundColor: t.body[1], opacity: locked ? 0.35 : 1 }]}>
                      {locked ? <Icon name="close" size={12} color={colors.night} strokeWidth={2.4} /> : null}
                    </View>
                    <Text style={[styles.swatchLabel, on && { color: colors.text }]} numberOfLines={1}>
                      {locked ? `${t.warmth}` : t.label}
                    </Text>
                  </Pressy>
                );
              })}
            </View>
            <Text style={styles.label}>Wearing</Text>
            <ChipRow>
              {ACCESSORIES.map((a) => {
                const locked = w < a.warmth;
                return (
                  <Chip
                    key={a.key}
                    label={locked ? `${a.label} (${a.warmth} warmth)` : a.label}
                    selected={settings.emberAccessory === a.key}
                    onPress={() => {
                      if (locked) {
                        emberSay(`That unlocks at ${a.warmth} warmth.`, 'curious');
                        return;
                      }
                      setSettings({ emberAccessory: a.key });
                    }}
                  />
                );
              })}
            </ChipRow>
          </Card>
          <Card style={styles.nextCard}>
            <Text style={[styles.label, styles.firstLabel]}>How much Ember talks</Text>
            <ChipRow>
              <Chip label="Chatty" selected={!settings.emberQuiet} onPress={() => setSettings({ emberQuiet: false })} />
              <Chip label="Quiet" selected={!!settings.emberQuiet} onPress={() => setSettings({ emberQuiet: true })} />
              <Chip
                label="Silent in class"
                icon={settings.quietInClass !== false ? 'check' : undefined}
                selected={settings.quietInClass !== false}
                onPress={() => setSettings({ quietInClass: settings.quietInClass === false })}
              />
            </ChipRow>
            <Text style={styles.hint}>Quiet keeps the big moments and important tips. Silent in class uses your class times.</Text>
            <Text style={styles.label}>Big moments</Text>
            <ChipRow>
              <Chip label="Whole screen" selected={!settings.quietCelebrations} onPress={() => setSettings({ quietCelebrations: false })} />
              <Chip label="Just Ember" selected={!!settings.quietCelebrations} onPress={() => setSettings({ quietCelebrations: true })} />
            </ChipRow>
            <Text style={styles.label}>Vibration</Text>
            <ChipRow>
              {(['full', 'light', 'off'] as const).map((h) => (
                <Chip key={h} label={h === 'full' ? 'Full' : h === 'light' ? 'Light taps' : 'Off'} selected={(settings.haptics ?? 'full') === h} onPress={() => setSettings({ haptics: h })} />
              ))}
            </ChipRow>
          </Card>
        </Section>
      </Reveal>

      <View onLayout={jumps.mark('ai')} />
      <Reveal index={n++}>
        <Section title="AI and Plus" icon="sparkle" note="Only replies written by AI count. Everything on your phone is free.">
          <Card onPress={() => router.push('/plus')}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.rowLabel}>{ai.plus ? 'Plus' : 'Free plan'}</Text>
                <Text style={styles.hint}>
                  {ai.left} of {ai.limit} AI replies left {ai.plus ? 'this month' : 'this week'}. Resets {ai.resets}.
                </Text>
              </View>
              <Icon name="chevron" size={16} color={colors.textFaint} />
            </View>
            <ProgressBar value={ai.used / ai.limit} color={ai.left <= 3 ? colors.unlocked : colors.flame} style={styles.gap} />
          </Card>
          <Button label="How AI works here" icon="help" variant="ghost" size="sm" onPress={() => router.push('/ai')} style={styles.restoreToggle} />
        </Section>
        <Section title="Privacy" icon="star" note="Everything stays on this phone.">
          <Card>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.rowLabel}>Hide the app in the app switcher</Text>
                <Text style={styles.hint}>A candle covers the screen when you swipe away, so private pages don’t show.</Text>
              </View>
              <Switch value={!settings.veilOff} onValueChange={(v) => useLifeStore.getState().setSettings({ veilOff: !v })} trackColor={{ true: colors.flame }} accessibilityLabel="Hide the app in the app switcher" />
            </View>
          </Card>
        </Section>
      </Reveal>

      <View onLayout={jumps.mark('show')} />
      <Reveal index={n++}>
        <Section title="Show someone the app" icon="sparkle" note="For showing a friend, a teacher, or a counselor.">
          <Card onPress={showSomeone} style={styles.aboutCard} accessibilityLabel="Show someone the app" accessibilityHint="Swaps in a made-up student. Nothing of yours is shown or changed.">
            <View style={styles.showIcon}>
              <Icon name="people" size={20} color={colors.flame} />
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.dangerTitle}>Show a sample student</Text>
              <Text style={styles.aboutBody}>Riley’s week fills the app. Your homework, journal, and About you stay hidden and untouched, and nothing saves.</Text>
            </View>
            <Icon name="chevron" size={18} color={colors.textFaint} />
          </Card>
          <View style={[styles.links, styles.linksGap]}>
            <Card onPress={() => router.push('/whats-new')} style={styles.link}>
              <Icon name="gift" size={22} color={colors.flame} />
              <Text style={styles.linkText}>What’s new</Text>
            </Card>
            <Card onPress={() => router.push('/welcome')} style={styles.link}>
              <Icon name="flame" size={22} color={colors.flame} />
              <Text style={styles.linkText}>Replay the welcome</Text>
            </Card>
          </View>
        </Section>
      </Reveal>

      <View onLayout={jumps.mark('data')} />
      <Reveal index={n++}>
        <Section title="Your data" icon="share" iconColor="#8CC0A8" note="Schoolwork, notes, and everything on this page live on this phone.">
          <Card>
            <Button label="Export a backup" icon="share" variant="secondary" onPress={exportAll} />
            <Button label="Share a summary as text" icon="list" variant="ghost" size="sm" onPress={shareSummary} style={styles.restoreToggle} />
            <Text style={[styles.hint, styles.center]}>A file with everything. The Canvas key is left out.</Text>
            <Button label="Where your stuff lives" icon="pin" variant="ghost" size="sm" onPress={() => router.push('/privacy')} style={styles.restoreToggle} />
            <Button
              label={restoreOpen ? 'Never mind' : 'Restore from a backup'}
              icon={restoreOpen ? 'close' : 'repeat'}
              variant="ghost"
              size="sm"
              onPress={() => {
                setRestoreOpen((v) => !v);
                setPasted('');
              }}
              style={styles.restoreToggle}
            />
            {restoreOpen ? (
              <>
                <Field
                  multiline
                  value={pasted}
                  onChangeText={setPasted}
                  placeholder="Open the backup file, copy all of its text, and paste it here."
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={styles.paste}
                />
                {backup && 'error' in backup ? <Text style={[styles.hint, { color: colors.danger }]}>{backup.error}</Text> : null}
                {backup && 'data' in backup ? (
                  <>
                    <Text style={styles.hint}>
                      From {new Date(backup.data.exportedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}:{' '}
                      {backup.data.school.assignments?.length ?? 0} assignments, {backup.data.school.classes?.length ?? 0} classes,{' '}
                      {backup.data.hub.notes?.length ?? 0} notes, {backup.data.life.decks?.length ?? 0} decks. This replaces what’s on this phone now.
                    </Text>
                    <View style={styles.hold}>
                      <HoldToConfirm label="Hold to restore" holdingLabel="Keep holding" onComplete={restore} icon="repeat" size={92} />
                    </View>
                  </>
                ) : null}
              </>
            ) : null}
          </Card>
          <Card tint={colors.danger} style={styles.danger}>
            <Text style={styles.dangerTitle}>Start over</Text>
            <Text style={styles.hint}>Erases classes, assignments, grades, notes, colleges, flashcards, and everything else on this phone. Check-ins and entries in your account stay.</Text>
            <View style={styles.hold}>
              <HoldToConfirm label="Hold to erase" holdingLabel="Keep holding" onComplete={resetAll} fillColor={colors.danger} icon="trash" size={92} />
            </View>
          </Card>
        </Section>
      </Reveal>
    </Screen>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  orderCard: {
    marginTop: 4,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 6,
  },
  orderLine: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  orderText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  orderHidden: {
    color: colors.textFaint,
  },
  up: {
    transform: [{ rotate: '90deg' }],
  },
  down: {
    transform: [{ rotate: '-90deg' }],
  },
  restoreToggle: {
    marginTop: 10,
    alignSelf: 'center',
  },
  paste: {
    minHeight: 110,
    maxHeight: 200,
    fontSize: 12,
  },
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: 14,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  hint: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  center: {
    textAlign: 'center',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  emberHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emberTitle: {
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    lineHeight: 21,
    color: colors.text,
  },
  swatches: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunk,
  },
  swatchDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linksGap: {
    marginTop: 12,
  },
  nextCard: {
    marginTop: 12,
  },
  firstLabel: {
    marginTop: 0,
  },
  flexOne: {
    flex: 1,
  },
  showIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.flame, 0.14),
  },
  aboutCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aboutBody: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  link: {
    flexBasis: '46%',
    flexGrow: 1,
    width: undefined,
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  danger: {
    marginTop: 12,
    backgroundColor: alpha(colors.danger, 0.04),
  },
  dangerTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  hold: {
    alignItems: 'center',
    marginTop: 16,
  },
});
