import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { EmberGlyph } from '../components/ember/EmberSprite';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { HoldToConfirm } from '../components/ui/HoldToConfirm';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { Stepper } from '../components/ui/Stepper';
import { EVENING_HOURS, MORNING_HOURS, TimeField } from '../components/ui/TimeField';
import { warmth } from '../core/achievements';
import { ACCESSORIES, EMBER_THEMES } from '../core/emberLook';
import { useHubStore } from '../core/hubStore';
import { type EmberTheme, useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts, radii } from '../core/theme';

const GRADES = [9, 10, 11, 12];

// Everything about you and how the app behaves, in one place — plus your
// data, which you can take with you or wipe.
export default function SettingsScreen() {
  const profile = useSchoolStore((s) => s.profile);
  const setProfile = useSchoolStore((s) => s.setProfile);
  const settings = useLifeStore((s) => s.settings);
  const setSettings = useLifeStore((s) => s.setSettings);
  // Re-read warmth whenever anything it counts changes.
  const achievements = useLifeStore((s) => s.achievements);
  const assignments = useSchoolStore((s) => s.assignments);
  const w = useMemo(() => warmth(), [achievements, assignments]); // eslint-disable-line react-hooks/exhaustive-deps

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

  let n = 0;
  return (
    <Screen title="Settings" subtitle="About you, Ember, and your data.">
      <Reveal index={n++}>
        <Section title="You">
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
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="Nights" note="Teens need 8–10 hours. Homework shouldn’t eat all of them.">
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
        <Section title="Ember" note={`Warmth ${w}${nextUnlock ? ` · next unlock at ${nextUnlock}` : ' · everything unlocked'}`}>
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
                    label={locked ? `${a.label} · ${a.warmth}` : a.label}
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
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="Goals">
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

      <Reveal index={n++}>
        <Section title="Badges and your year">
          <View style={styles.links}>
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
        <Section title="Your data" note="Schoolwork, notes, and everything on this page live on this phone.">
          <Card>
            <Button label="Export a backup" icon="share" variant="secondary" onPress={exportAll} />
            <Text style={[styles.hint, styles.center]}>A file with everything. The Canvas key is left out.</Text>
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
    gap: 12,
  },
  link: {
    flex: 1,
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
