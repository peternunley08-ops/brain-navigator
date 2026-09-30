import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { dateKey, daysUntil, dueLabel } from '../core/dates';
import { type College, COLLEGE_STEPS, type CollegePlan, type CollegeStatus, NOTE_TEMPLATES, STATUS_LABEL, useHubStore } from '../core/hubStore';
import { parseDue } from '../core/scanParser';
import { alpha, colors, fonts } from '../core/theme';

const PLANS: CollegePlan[] = ['ED', 'EA', 'REA', 'RD', 'Rolling'];
const PLAN_LABEL: Record<CollegePlan, string> = { ED: 'Early Decision', EA: 'Early Action', REA: 'Restrictive EA', RD: 'Regular', Rolling: 'Rolling' };
const STATUS_COLOR: Record<CollegeStatus, string> = {
  researching: '#8E8173',
  applying: '#F5B45C',
  submitted: '#8FB4E8',
  accepted: '#8CC0A8',
  waitlisted: '#AFA2DE',
  denied: '#D99A6C',
};

// The usual deadlines, as quick picks — in the coming school year.
function commonDeadlines() {
  const today = dateKey();
  const [y] = today.split('-').map(Number);
  const picks = [
    [10, 1], [10, 15], [11, 1], [11, 15], [11, 30], [0, 1], [0, 15], [1, 1],
  ].map(([m, d]) => {
    let key = dateKey(new Date(y, m, d));
    if (daysUntil(key) < -30) key = dateKey(new Date(y + 1, m, d));
    return key;
  });
  return picks.sort();
}

export default function CollegeScreen() {
  const colleges = useHubStore((s) => s.colleges);
  const saveCollege = useHubStore((s) => s.saveCollege);
  const createNote = useHubStore((s) => s.createNote);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const active = colleges.filter((c) => c.status === 'researching' || c.status === 'applying');
  const next = [...active].filter((c) => c.deadline && daysUntil(c.deadline) >= 0).sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))[0];
  const nextSteps = next ? COLLEGE_STEPS.filter((s) => next.steps[s]).length : 0;

  const sorted = [...colleges].sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'));

  return (
    <Screen title="College" subtitle="Every application, every deadline, in one place." glowColor="#8FB4E8">
      {next ? (
        <Reveal index={0}>
          <Card tint="#8FB4E8" style={styles.next}>
            <Ring progress={nextSteps / COLLEGE_STEPS.length} value={`${nextSteps}`} unit={`/${COLLEGE_STEPS.length}`} color="#8FB4E8" size={78} />
            <View style={styles.flex}>
              <Text style={styles.nextLabel}>Next deadline</Text>
              <Text style={styles.nextName}>{next.name}</Text>
              <Text style={styles.nextMeta}>
                {PLAN_LABEL[next.plan]}, {dueLabel(next.deadline!)} ({daysUntil(next.deadline!)} days)
              </Text>
            </View>
          </Card>
        </Reveal>
      ) : null}

      <Reveal index={1} style={styles.shortcuts}>
        <Button label="Open Common App" icon="arrow" variant="secondary" size="sm" onPress={() => Linking.openURL('https://apply.commonapp.org')} style={styles.flex} />
        <Button
          label="Essay brainstorm"
          icon="feather"
          variant="secondary"
          size="sm"
          onPress={() => {
            const t = NOTE_TEMPLATES.find((x) => x.key === 'essay')!;
            const n = createNote({ title: t.title, icon: t.icon, color: t.color, blocks: t.blocks() });
            router.push(`/note/${n.id}`);
          }}
          style={styles.flex}
        />
      </Reveal>

      <Reveal index={2}>
        <Section title="Your list" action={{ label: adding ? 'Cancel' : 'Add', onPress: () => setAdding((v) => !v) }}>
          {adding ? (
            <AddCollege
              onSave={(c) => {
                saveCollege(c);
                setAdding(false);
                emberSay(`${c.name} is on your list. One checklist at a time.`, 'happy');
              }}
            />
          ) : null}
          {sorted.length === 0 && !adding ? (
            <EmptyState title="No colleges yet." body="Add the schools you’re looking at. Each gets its own deadline and checklist.">
              <Button label="Add a college" icon="plus" onPress={() => setAdding(true)} />
            </EmptyState>
          ) : (
            <View style={styles.list}>
              {sorted.map((c, i) => (
                <CollegeCard key={c.id} c={c} i={i} open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} />
              ))}
            </View>
          )}
        </Section>
      </Reveal>
    </Screen>
  );
}

function AddCollege({ onSave }: { onSave: (c: Omit<College, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<CollegePlan>('RD');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [custom, setCustom] = useState('');

  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOut.duration(140)}>
      <Card style={styles.addCard}>
        <Field placeholder="College name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Text style={styles.label}>Applying</Text>
        <ChipRow>
          {PLANS.map((p) => (
            <Chip key={p} label={PLAN_LABEL[p]} selected={plan === p} color="#8FB4E8" onPress={() => setPlan(p)} />
          ))}
        </ChipRow>
        <Text style={styles.label}>Deadline</Text>
        <ChipRow>
          {commonDeadlines().map((d) => (
            <Chip key={d} label={dueLabel(d)} selected={deadline === d} color="#8FB4E8" onPress={() => setDeadline(d)} />
          ))}
        </ChipRow>
        <Field
          containerStyle={styles.gap}
          placeholder="Or type it, like 12/1"
          value={custom}
          onChangeText={(t) => {
            setCustom(t);
            const d = parseDue(t);
            if (d) setDeadline(d);
          }}
        />
        <Button
          label="Add to my list"
          icon="plus"
          disabled={!name.trim()}
          onPress={() => onSave({ name: name.trim(), plan, deadline, status: 'applying', steps: {}, notes: '' })}
          style={styles.gap}
        />
      </Card>
    </Animated.View>
  );
}

function CollegeCard({ c, i, open, onToggle }: { c: College; i: number; open: boolean; onToggle: () => void }) {
  const toggleStep = useHubStore((s) => s.toggleStep);
  const saveCollege = useHubStore((s) => s.saveCollege);
  const deleteCollege = useHubStore((s) => s.deleteCollege);
  const done = COLLEGE_STEPS.filter((s) => c.steps[s]).length;
  const n = c.deadline ? daysUntil(c.deadline) : null;
  const color = STATUS_COLOR[c.status];

  return (
    <Animated.View entering={FadeInDown.delay(i * 40).duration(320)} layout={LinearTransition.springify().damping(18)}>
      <Card onPress={onToggle} tint={open ? '#8FB4E8' : undefined}>
        <View style={styles.cardHead}>
          <View style={styles.flex}>
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.meta}>
              {PLAN_LABEL[c.plan]}
              {c.deadline ? `, ${dueLabel(c.deadline)}` : ''}
              {n != null && n >= 0 && n <= 30 && (c.status === 'applying' || c.status === 'researching') ? ` — ${n} days` : ''}
            </Text>
          </View>
          <View style={[styles.status, { backgroundColor: alpha(color, 0.16) }]}>
            <Text style={[styles.statusText, { color }]}>{STATUS_LABEL[c.status]}</Text>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(done / COLLEGE_STEPS.length) * 100}%` }]} />
        </View>

        {open ? (
          <Animated.View entering={FadeInDown.duration(220)}>
            <View style={styles.steps}>
              {COLLEGE_STEPS.map((s) => (
                <Pressy key={s} onPress={() => toggleStep(c.id, s)} style={styles.step} accessibilityRole="checkbox" accessibilityState={{ checked: !!c.steps[s] }}>
                  <View style={[styles.box, c.steps[s] && styles.boxOn]}>
                    {c.steps[s] ? <Icon name="check" size={12} color={colors.flameInk} strokeWidth={3} /> : null}
                  </View>
                  <Text style={[styles.stepText, c.steps[s] && styles.stepDone]}>{s}</Text>
                </Pressy>
              ))}
            </View>
            <Text style={styles.label}>Status</Text>
            <ChipRow>
              {(Object.keys(STATUS_LABEL) as CollegeStatus[]).map((st) => (
                <Chip
                  key={st}
                  label={STATUS_LABEL[st]}
                  selected={c.status === st}
                  color={STATUS_COLOR[st]}
                  onPress={() => {
                    saveCollege({ ...c, status: st });
                    if (st === 'accepted') emberSay(`${c.name} said YES. Take a second with that.`, 'cheer');
                    if (st === 'submitted') emberSay(`Submitted to ${c.name}. That’s a big one off your plate.`, 'cheer');
                  }}
                />
              ))}
            </ChipRow>
            <Button label="Remove from list" variant="ghost" size="sm" icon="trash" tint={colors.danger} onPress={() => deleteCollege(c.id)} style={styles.remove} />
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  next: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  nextLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#8FB4E8',
  },
  nextName: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
  },
  nextMeta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  list: {
    gap: 10,
  },
  addCard: {
    marginBottom: 12,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  gap: {
    marginTop: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  status: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  track: {
    marginTop: 12,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceSunk,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#8FB4E8',
  },
  steps: {
    marginTop: 14,
    gap: 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: '#8FB4E8',
    borderColor: '#8FB4E8',
  },
  stepText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  stepDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  remove: {
    marginTop: 10,
    alignSelf: 'center',
  },
});
