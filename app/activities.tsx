import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { type Activity, useHubStore } from '../core/hubStore';
import { alpha, colors, fonts } from '../core/theme';

const BLUE = '#8FB4E8';
const LIMITS = { role: 50, org: 100, description: 150 };
const GRADES = [9, 10, 11, 12];

// The Common App activities list: ten slots, strict character limits.
// Drafting it here with live counters beats discovering the limit in the
// portal at midnight.
export default function ActivitiesScreen() {
  const list = useHubStore((s) => s.activities);
  const save = useHubStore((s) => s.saveActivity);
  const remove = useHubStore((s) => s.deleteActivity);
  const move = useHubStore((s) => s.moveActivity);
  const [editing, setEditing] = useState<string | 'new' | null>(list.length ? null : 'new');

  return (
    <Screen
      glowColor={BLUE}
      title="Activities list"
      subtitle={`${list.length} of 10. Most important first.`}
      right={list.length < 10 ? <IconButton icon="plus" label="Add an activity" onPress={() => setEditing('new')} /> : undefined}
    >
      {editing === 'new' ? <Editor onDone={() => setEditing(null)} /> : null}
      {list.length === 0 && editing !== 'new' ? <EmptyState title="Nothing listed yet." body="Clubs, sports, jobs, family responsibilities, and things you do on your own all count." /> : null}
      <View style={styles.list}>
        {list.map((a, i) =>
          editing === a.id ? (
            <Editor key={a.id} existing={a} onDone={() => setEditing(null)} />
          ) : (
            <Reveal key={a.id} index={i}>
              <Animated.View exiting={FadeOut.duration(150)} layout={LinearTransition}>
                <Card onPress={() => setEditing(a.id)}>
                  <View style={styles.head}>
                    <Text style={styles.num}>{i + 1}</Text>
                    <View style={styles.flex}>
                      <Text style={styles.role}>{a.role || 'Position'}</Text>
                      <Text style={styles.org}>{a.org}</Text>
                    </View>
                    <View style={styles.moves}>
                      <IconButton icon="back" label="Move up" size={30} onPress={() => move(a.id, -1)} style={styles.up} />
                      <IconButton icon="back" label="Move down" size={30} onPress={() => move(a.id, 1)} style={styles.down} />
                    </View>
                  </View>
                  {a.description ? <Text style={styles.desc}>{a.description}</Text> : null}
                  <Text style={styles.meta}>
                    {a.grades.length ? `Grades ${a.grades.join(', ')}` : 'Grades not set'}
                    {a.hoursPerWeek ? ` · ${a.hoursPerWeek} hr/wk` : ''}
                    {a.weeksPerYear ? ` · ${a.weeksPerYear} wk/yr` : ''}
                  </Text>
                  <Button label="Remove" variant="ghost" size="sm" tint={colors.danger} onPress={() => remove(a.id)} style={styles.remove} />
                </Card>
              </Animated.View>
            </Reveal>
          )
        )}
      </View>
      {list.length ? (
        <Card style={styles.tip}>
          <Text style={styles.tipTitle}>Descriptions that work</Text>
          <Text style={styles.meta}>Start with a verb. Use numbers. Cut filler words. “Led 12-person team; raised $2,400 for food bank” beats “I was a member who helped with fundraising.”</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

function Editor({ existing, onDone }: { existing?: Activity; onDone: () => void }) {
  const save = useHubStore((s) => s.saveActivity);
  const [role, setRole] = useState(existing?.role ?? '');
  const [org, setOrg] = useState(existing?.org ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [grades, setGrades] = useState<number[]>(existing?.grades ?? []);
  const [hours, setHours] = useState(existing?.hoursPerWeek ? String(existing.hoursPerWeek) : '');
  const [weeks, setWeeks] = useState(existing?.weeksPerYear ? String(existing.weeksPerYear) : '');

  const done = () => {
    if (!role.trim() && !org.trim()) return onDone();
    save({
      id: existing?.id,
      role: role.trim().slice(0, LIMITS.role),
      org: org.trim().slice(0, LIMITS.org),
      description: description.trim().slice(0, LIMITS.description),
      grades,
      hoursPerWeek: parseFloat(hours) || null,
      weeksPerYear: parseFloat(weeks) || null,
    });
    onDone();
  };

  return (
    <Animated.View entering={FadeInDown.duration(240)}>
      <Card tint={BLUE} style={styles.editor}>
        <Counted label="Position or role" value={role} onChange={setRole} limit={LIMITS.role} placeholder="Captain, Founder, Cashier…" />
        <Counted label="Organization" value={org} onChange={setOrg} limit={LIMITS.org} placeholder="Robotics Club, Trader Joe’s…" />
        <Counted label="What you did" value={description} onChange={setDescription} limit={LIMITS.description} placeholder="Verbs and numbers." multiline />
        <Text style={styles.label}>Grades</Text>
        <ChipRow>
          {GRADES.map((g) => (
            <Chip key={g} label={`${g}th`} selected={grades.includes(g)} color={BLUE} onPress={() => setGrades((x) => (x.includes(g) ? x.filter((y) => y !== g) : [...x, g].sort()))} />
          ))}
        </ChipRow>
        <View style={styles.row}>
          <Field label="Hours / week" value={hours} onChangeText={setHours} keyboardType="decimal-pad" containerStyle={styles.flex} />
          <Field label="Weeks / year" value={weeks} onChangeText={setWeeks} keyboardType="number-pad" containerStyle={styles.flex} />
        </View>
        <Button label={existing ? 'Save' : 'Add to list'} icon="check" onPress={done} style={styles.save} />
      </Card>
    </Animated.View>
  );
}

function Counted({ label, value, onChange, limit, placeholder, multiline }: { label: string; value: string; onChange: (t: string) => void; limit: number; placeholder: string; multiline?: boolean }) {
  const left = limit - value.length;
  return (
    <View style={styles.counted}>
      <View style={styles.countedHead}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.count, left < 10 && { color: colors.flame }, left < 0 && { color: colors.danger }]}>{left}</Text>
      </View>
      <Field value={value} onChangeText={onChange} placeholder={placeholder} multiline={multiline} maxLength={limit} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    gap: 10,
    marginTop: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  num: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: BLUE,
    width: 24,
  },
  role: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  org: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  moves: {
    flexDirection: 'row',
    gap: 6,
  },
  up: {
    transform: [{ rotate: '90deg' }],
  },
  down: {
    transform: [{ rotate: '-90deg' }],
  },
  desc: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  meta: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  remove: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  editor: {
    marginTop: 14,
    backgroundColor: alpha(BLUE, 0.03),
  },
  counted: {
    marginBottom: 12,
  },
  countedHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    marginBottom: 6,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  count: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textFaint,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  save: {
    marginTop: 16,
  },
  tip: {
    marginTop: 20,
  },
  tipTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
  },
});
