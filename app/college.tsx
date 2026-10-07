import { router } from 'expo-router';
import { plural } from '../core/words';
import { useState, memo } from 'react';
import { Linking, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { sprung } from '../core/motion';
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
import {
  type College,
  COLLEGE_STEPS,
  type CollegePlan,
  type CollegeStatus,
  type CollegeTier,
  NOTE_TEMPLATES,
  STATUS_LABEL,
  TIER_COLOR,
  TIER_LABEL,
  uid,
  useHubStore,
} from '../core/hubStore';
import { useLifeStore } from '../core/lifeStore';
import { type IconName } from '../components/ui/Icon';
import { celebrate } from '../core/celebrateStore';
import { essayWords } from '../core/words';
import { parseDue } from '../core/scanParser';
import { alpha, colors, fonts, radii } from '../core/theme';
import { offerUndo } from '../core/undoStore';

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

const TIERS: CollegeTier[] = ['reach', 'target', 'likely'];

const TOOLS: { label: string; icon: IconName; path: string }[] = [
  { label: 'Scholarships', icon: 'gift', path: '/scholarships' },
  { label: 'Rec letters', icon: 'message', path: '/recs' },
  { label: 'Activities', icon: 'list', path: '/activities' },
  { label: 'Financial aid', icon: 'check', path: '/aid' },
];

export default function CollegeScreen() {
  const colleges = useHubStore((s) => s.colleges);
  const aiOff = useLifeStore((s) => !!s.settings.aiOff);
  const notes = useHubStore((s) => s.notes);
  const saveCollege = useHubStore((s) => s.saveCollege);
  const createNote = useHubStore((s) => s.createNote);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const active = colleges.filter((c) => c.status === 'researching' || c.status === 'applying');
  const next = [...active].filter((c) => c.deadline && daysUntil(c.deadline) >= 0).sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))[0];
  const nextSteps = next ? COLLEGE_STEPS.filter((s) => next.steps[s]).length : 0;

  const sorted = [...colleges].sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'));
  const scholarships = useHubStore((s) => s.scholarships);
  const recs = useHubStore((s) => s.recs);

  // Every date that matters, in one line: applications, scholarships, rec letters.
  const timeline = [
    ...active.filter((c) => c.deadline).map((c) => ({ key: `c${c.id}`, date: c.deadline!, title: c.name, kind: c.plan, color: '#8FB4E8' })),
    ...scholarships.filter((x) => x.deadline && x.status === 'todo').map((x) => ({ key: `s${x.id}`, date: x.deadline!, title: x.name, kind: 'Scholarship', color: '#E6C46A' })),
    ...recs.filter((x) => x.due && x.status !== 'submitted').map((x) => ({ key: `r${x.id}`, date: x.due!, title: `${x.teacher}’s letter`, kind: 'Rec', color: '#E89AB8' })),
    // Supplements not started yet, for a deadline within two weeks.
    ...active
      .filter((c) => c.deadline && daysUntil(c.deadline) <= 14)
      .flatMap((c) =>
        (c.supplements ?? [])
          .filter((sup) => !sup.done && (!sup.noteId || !notes.find((n) => n.id === sup.noteId)?.blocks.some((b) => b.text.trim())))
          .map((sup) => ({ key: `p${sup.id}`, date: c.deadline!, title: `${c.name}: ${sup.prompt}`, kind: 'Supplement, not started', color: '#8FB4E8' }))
      ),
    ...scholarships.filter((x) => x.status === 'applied' && x.hearBy).map((x) => ({ key: `h${x.id}`, date: x.hearBy!, title: x.name, kind: 'Hear back', color: '#E6C46A' })),
  ]
    .filter((x) => daysUntil(x.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const tierCounts = TIERS.map((t) => colleges.filter((c) => c.tier === t).length);
  // What applying will cost, with waivers taken out.
  const withFee = colleges.filter((c) => c.fee && c.status !== 'denied');
  const feeTotal = withFee.filter((c) => !c.waiver).reduce((s, c) => s + (c.fee ?? 0), 0);
  const waived = withFee.filter((c) => c.waiver).length;
  const tiered = tierCounts.reduce((a, b) => a + b, 0);
  const balanceLine =
    tiered < 3
      ? 'Mark each school reach, target, or likely to see how balanced your list is.'
      : tierCounts[2] === 0
        ? 'No likely schools yet. Add one or two you’d be happy at and are very likely to get into.'
        : tierCounts[0] > tierCounts[1] + tierCounts[2]
          ? 'Reach-heavy. That’s fine if you also have solid targets and likelies.'
          : 'A balanced list. Nice.';

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

      <Reveal index={1}>
        <View style={styles.tools}>
          {TOOLS.map((t) => (
            <Pressy key={t.path} onPress={() => router.push(t.path as never)} style={styles.tool} accessibilityRole="button" accessibilityLabel={t.label}>
              <View style={styles.toolIcon}>
                <Icon name={t.icon} size={19} color="#8FB4E8" />
              </View>
              <Text style={styles.toolLabel}>{t.label}</Text>
            </Pressy>
          ))}
        </View>
      </Reveal>

      {colleges.length ? (
        <Reveal index={1}>
          <Card style={styles.balance}>
            <Text style={styles.balanceTitle}>Your list’s balance</Text>
            <View style={styles.balanceBar}>
              {TIERS.map((t, i) =>
                tierCounts[i] ? <View key={t} style={{ flex: tierCounts[i], backgroundColor: TIER_COLOR[t] }} /> : null
              )}
              {tiered === 0 ? <View style={[styles.flex, { backgroundColor: colors.surfaceSunk }]} /> : null}
            </View>
            <View style={styles.balanceLegend}>
              {TIERS.map((t, i) => (
                <Text key={t} style={[styles.balanceItem, { color: TIER_COLOR[t] }]}>
                  {tierCounts[i]} {TIER_LABEL[t].toLowerCase()}
                </Text>
              ))}
            </View>
            <Text style={styles.nextMeta}>{balanceLine}</Text>
            {withFee.length ? (
              <Text style={[styles.nextMeta, styles.gap]}>
                Application fees: ${feeTotal}
                {waived ? `, ${waived} waived` : ''}. Fee waivers are free to ask for through the Common App or your counselor.
              </Text>
            ) : null}
          </Card>
        </Reveal>
      ) : null}

      {timeline.length ? (
        <Reveal index={1}>
          <Section title="Coming up">
            <Card>
              {timeline.map((x, i) => (
                <TimelineRow key={x.key} item={x} index={i} length={timeline.length} styles={styles} colors={colors} />
              ))}
            </Card>
          </Section>
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
      {!aiOff ? (
        <Reveal index={1}>
          <Button
            label="Find an essay topic with Quill"
            icon="sparkle"
            variant="ghost"
            size="sm"
            onPress={() =>
              router.push({
                pathname: '/helper/[id]',
                params: {
                  id: 'quill',
                  ask: `Help me find a college essay topic${active.length ? ` (I'm applying to ${active.slice(0, 6).map((c) => c.name).join(', ')})` : ''}. Ask me questions about my life one at a time, and help me notice which story only I could tell. Don't write any of it for me.`,
                },
              })
            }
            style={styles.quill}
          />
        </Reveal>
      ) : null}

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
            <EmptyState gear="cap" title="No colleges yet." body="Add the schools you’re looking at. Each gets its own deadline and checklist.">
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
  const [tier, setTier] = useState<CollegeTier | undefined>(undefined);

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
        <Text style={styles.label}>For you, it’s a</Text>
        <ChipRow>
          {TIERS.map((t) => (
            <Chip key={t} label={TIER_LABEL[t]} dot color={TIER_COLOR[t]} selected={tier === t} onPress={() => setTier(tier === t ? undefined : t)} />
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
          onPress={() => onSave({ name: name.trim(), plan, deadline, status: 'applying', steps: {}, notes: '', tier })}
          style={styles.gap}
        />
      </Card>
    </Animated.View>
  );
}

type TimelineItem = { key: string; date: string; title: string; kind: string; color: string };

interface TimelineRowProps {
  item: TimelineItem;
  index: number;
  length: number;
  styles: Record<string, any>;
  colors: Record<string, string>;
}

const TimelineRow = memo(
  ({ item, index, length, styles, colors }: TimelineRowProps) => {
    const d = daysUntil(item.date);
    return (
      <View key={item.key} style={[styles.tlRow, index === length - 1 && styles.tlLast]}>
        <View style={[styles.tlDot, { backgroundColor: item.color }]} />
        <View style={styles.flex}>
          <Text style={styles.tlTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.nextMeta}>
            {item.kind}, {dueLabel(item.date)}
          </Text>
        </View>
        <Text style={[styles.tlDays, d <= 7 && { color: colors.unlocked }]}>{d === 0 ? 'today' : `${d}d`}</Text>
      </View>
    );
  },
  (prev, next) => prev.item === next.item && prev.index === next.index && prev.length === next.length
);
TimelineRow.displayName = 'TimelineRow';

function CollegeCard({ c, i, open, onToggle }: { c: College; i: number; open: boolean; onToggle: () => void }) {
  const toggleStep = useHubStore((s) => s.toggleStep);
  const saveCollege = useHubStore((s) => s.saveCollege);
  const deleteCollege = useHubStore((s) => s.deleteCollege);
  const notes = useHubStore((s) => s.notes);
  const [supPrompt, setSupPrompt] = useState('');
  const [supLimit, setSupLimit] = useState(250);
  const done = COLLEGE_STEPS.filter((s) => c.steps[s]).length;
  const sups = c.supplements ?? [];

  const addSup = () => {
    const prompt = supPrompt.trim();
    if (!prompt) return;
    saveCollege({ ...c, supplements: [...sups, { id: uid(), prompt, limit: supLimit }] });
    setSupPrompt('');
  };
  // Each supplement gets its own note with the word limit set, made the first time you open it.
  const writeSup = (sup: NonNullable<College['supplements']>[number]) => {
    const existing = sup.noteId ? useHubStore.getState().notes.find((x) => x.id === sup.noteId) : undefined;
    if (existing) return router.push(`/note/${existing.id}`);
    const note = useHubStore.getState().createNote({ title: `${c.name}: ${sup.prompt}`.slice(0, 80), icon: 'feather', color: '#8FB4E8', wordGoal: sup.limit });
    saveCollege({ ...c, supplements: sups.map((x) => (x.id === sup.id ? { ...x, noteId: note.id } : x)) });
    router.push(`/note/${note.id}`);
  };
  const n = c.deadline ? daysUntil(c.deadline) : null;
  const color = STATUS_COLOR[c.status];

  return (
    <Animated.View entering={FadeInDown.delay(i * 40).duration(320)} layout={sprung(LinearTransition)}>
      <Card tint={open ? '#8FB4E8' : undefined}>
        {/* Only the header opens and closes the card, so a stray tap inside the form doesn't fold it away. */}
        <Pressy onPress={onToggle} depth={0.98} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.cardHead}>
          <View style={styles.flex}>
            <View style={styles.nameRow}>
              {c.tier ? <View style={[styles.tierDot, { backgroundColor: TIER_COLOR[c.tier] }]} /> : null}
              <Text style={styles.name}>{c.name}</Text>
            </View>
            <Text style={styles.meta}>
              {PLAN_LABEL[c.plan]}
              {c.deadline ? `, ${dueLabel(c.deadline)}` : ''}
              {n != null && n >= 0 && n <= 30 && (c.status === 'applying' || c.status === 'researching') ? `, in ${plural(n, 'day')}` : ''}
            </Text>
          </View>
          <View style={[styles.status, { backgroundColor: alpha(color, 0.16) }]}>
            <Text style={[styles.statusText, { color }]}>{STATUS_LABEL[c.status]}</Text>
          </View>
        </Pressy>
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
            <Text style={styles.label}>Supplement essays</Text>
            {[...sups].sort((a, b) => Number(!!a.done) - Number(!!b.done)).map((sup) => {
              const note = sup.noteId ? notes.find((x) => x.id === sup.noteId) : undefined;
              const words = note ? essayWords(note.blocks) : 0;
              return (
                <Pressy key={sup.id} onPress={() => writeSup(sup)} style={[styles.sup, sup.done && styles.supDone]} accessibilityRole="button" accessibilityLabel={`${sup.prompt}, ${sup.done ? 'done' : `${words} of ${sup.limit} words`}`}>
                  <Pressy
                    onPress={() => saveCollege({ ...c, supplements: sups.map((x) => (x.id === sup.id ? { ...x, done: !x.done } : x)) })}
                    hitSlop={12}
                    style={[styles.box, sup.done && styles.boxOn]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: !!sup.done }}
                    accessibilityLabel={`${sup.prompt} finished`}
                  >
                    {sup.done ? <Icon name="check" size={12} color={colors.flameInk} strokeWidth={3} /> : null}
                  </Pressy>
                  <View style={styles.flex}>
                    <Text style={styles.stepText} numberOfLines={2}>
                      {sup.prompt}
                    </Text>
                    <Text style={styles.meta}>{note ? `${words} of ${sup.limit} words` : `${sup.limit} words. Tap to start writing.`}</Text>
                  </View>
                  <Pressy
                    onPress={() => {
                      const before = sups;
                      saveCollege({ ...c, supplements: sups.filter((x) => x.id !== sup.id) });
                      offerUndo(`Removed “${sup.prompt}”`, () => {
                        const cur = useHubStore.getState().colleges.find((k) => k.id === c.id);
                        if (cur) useHubStore.getState().saveCollege({ ...cur, supplements: before });
                      });
                    }}
                    hitSlop={10}
                    accessibilityLabel={`Remove ${sup.prompt}`}
                  >
                    <Icon name="close" size={14} color={colors.textFaint} />
                  </Pressy>
                </Pressy>
              );
            })}
            <Field value={supPrompt} onChangeText={setSupPrompt} placeholder="Add a prompt, like “Why us?”" returnKeyType="done" onSubmitEditing={addSup} containerStyle={styles.gapSm} />
            {supPrompt.trim() ? (
              <ChipRow style={styles.gapSm}>
                {[100, 150, 250, 350, 650].map((n) => (
                  <Chip key={n} label={`${n} words`} selected={supLimit === n} color="#8FB4E8" onPress={() => setSupLimit(n)} />
                ))}
                <Chip label="Add" icon="plus" color={colors.flame} onPress={addSup} />
              </ChipRow>
            ) : null}
            <View style={styles.feeHead}>
              <Text style={styles.label}>Application fee</Text>
              {c.fee && !c.waiver ? (
                <Pressy
                  onPress={() =>
                    Share.share({
                      message: `Hi,\n\nI’m applying to ${c.name} and the application fee ($${c.fee}) is a real cost for my family. Could you help me request a fee waiver, or tell me how to qualify?\n\nThank you.`,
                    })
                  }
                  hitSlop={6}
                  accessibilityRole="button"
                >
                  <Text style={styles.waiverAsk}>Ask about a waiver</Text>
                </Pressy>
              ) : null}
            </View>
            <View style={styles.feeRow}>
              <Field
                value={c.fee != null ? String(c.fee) : ''}
                onChangeText={(t) => {
                  const v = parseInt(t.replace(/\D/g, ''), 10);
                  saveCollege({ ...c, fee: Number.isFinite(v) ? v : null });
                }}
                placeholder="$ amount"
                keyboardType="number-pad"
                containerStyle={styles.flex}
              />
              <Chip label="Fee waiver" icon={c.waiver ? 'check' : undefined} selected={!!c.waiver} color={colors.secured} onPress={() => saveCollege({ ...c, waiver: !c.waiver })} />
            </View>
            <Text style={styles.label}>Reach, target, or likely?</Text>
            <ChipRow>
              {TIERS.map((t) => (
                <Chip key={t} label={TIER_LABEL[t]} dot color={TIER_COLOR[t]} selected={c.tier === t} onPress={() => saveCollege({ ...c, tier: c.tier === t ? undefined : t })} />
              ))}
            </ChipRow>
            <Text style={styles.label}>If you visited</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressy
                  key={n}
                  onPress={() => saveCollege({ ...c, visitRating: c.visitRating === n ? undefined : n })}
                  hitSlop={4}
                  accessibilityLabel={`${plural(n, 'star')}`}
                  accessibilityState={{ selected: (c.visitRating ?? 0) >= n }}
                >
                  <Icon name="star" size={24} color={(c.visitRating ?? 0) >= n ? colors.flame : colors.lineStrong} strokeWidth={2} />
                </Pressy>
              ))}
            </View>
            <Field
              value={c.visitNotes ?? ''}
              onChangeText={(t) => saveCollege({ ...c, visitNotes: t })}
              placeholder="What stood out? The vibe, the dorms, the food…"
              multiline
              containerStyle={styles.gap}
            />
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
                    if (st === 'accepted') celebrate(`${c.name} said yes`, 'Take a second with that. You did this.', '#8FB4E8', { key: `college-yes-${c.id}`, win: `${c.name} said yes` });
                    if (st === 'submitted') emberSay(`Submitted to ${c.name}. That’s a big one off your plate.`, 'cheer');
                  }}
                />
              ))}
            </ChipRow>
            <Button label="Remove from list" variant="ghost" size="sm" icon="trash" tint={colors.danger} onPress={() => {
                const index = useHubStore.getState().colleges.findIndex((x) => x.id === c.id);
                deleteCollege(c.id);
                offerUndo(`Removed ${c.name}`, () => useHubStore.getState().restoreCollege(c, index));
              }}
              style={styles.remove}
            />
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  quill: {
    alignSelf: 'center',
    marginTop: 4,
  },
  supDone: {
    opacity: 0.55,
  },
  feeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waiverAsk: {
    marginTop: 14,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.flame,
  },
  sup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  gapSm: {
    marginTop: 8,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  tool: {
    alignItems: 'center',
    gap: 6,
    width: 76,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha('#8FB4E8', 0.14),
    borderWidth: 1,
    borderColor: colors.line,
  },
  toolLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  balance: {
    marginTop: 14,
  },
  balanceTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  balanceBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
    gap: 2,
  },
  balanceLegend: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  balanceItem: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  tlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tlLast: {
    borderBottomWidth: 0,
  },
  tlDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tlTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  tlDays: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.textMuted,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
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
    borderRadius: radii.pill,
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
