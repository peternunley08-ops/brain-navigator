import * as Haptics from '../core/haptics';
import * as ImagePicker from 'expo-image-picker';
import { recognizeText, textRecognitionAvailable } from '../modules/text-recognition';
import { type FoundGrade, parseGrades } from '../core/scanParser';
import { ProgressBar } from '../components/ui/ProgressBar';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { ScienceNote } from '../components/ui/ScienceNote';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { Sparkline } from '../components/ui/Sparkline';
import { StatTile } from '../components/ui/StatTile';
import { Stepper } from '../components/ui/Stepper';
import {
  classAverage,
  dateKey,
  finalNeeded,
  gpa,
  GRADE_CATEGORIES,
  letterFor,
  type SchoolClass,
  useSchoolStore,
} from '../core/schoolStore';
import { useLifeStore } from '../core/lifeStore';
import { offerUndo } from '../core/undoStore';
import { alpha, colors, fonts, gaugeColor } from '../core/theme';

// B or better reads sage, C gold, below that ember.
function gradeColor(pct: number) {
  return pct >= 80 ? colors.secured : pct >= 70 ? colors.flame : colors.unlocked;
}

// Grades, your way: log scores as they come back, see the average the way
// your teacher calculates it (weighted categories or plain points), and
// know exactly what you need on the final.
export default function GradesScreen() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const classes = useSchoolStore((s) => s.classes);
  const grades = useSchoolStore((s) => s.grades);
  const real = classes.filter((c) => c.kind === 'class');
  const [selected, setSelected] = useState<string | null>(classId ?? null);
  const cls = real.find((c) => c.id === selected) ?? null;
  const g = gpa(classes, grades);

  if (!real.length) {
    return (
      <Screen title="Grades">
        <EmptyState gear="glasses" title="Add your classes first." body="Then log grades as they come back and see where each class stands.">
          <Button label="Your schedule" icon="book" variant="secondary" onPress={() => router.push('/classes')} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen title="Grades" subtitle={cls ? cls.name : 'Where every class stands.'}>
      <Reveal index={0}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classRow} style={styles.classScroll}>
          <Chip label="All classes" selected={!cls} onPress={() => setSelected(null)} />
          {real.map((c) => (
            <Chip key={c.id} label={c.name} dot color={c.color} selected={selected === c.id} onPress={() => setSelected(c.id)} />
          ))}
        </ScrollView>
      </Reveal>

      {cls ? <ClassGrades cls={cls} /> : <Overview gpa={g} classes={real} onPick={setSelected} />}
    </Screen>
  );
}

function Overview({
  gpa: g,
  classes,
  onPick,
}: {
  gpa: ReturnType<typeof gpa>;
  classes: SchoolClass[];
  onPick: (id: string) => void;
}) {
  const grades = useSchoolStore((s) => s.grades);
  return (
    <>
      <Reveal index={1}>
        <Section title="GPA" note={g ? `From ${g.classes} class${g.classes === 1 ? '' : 'es'} with grades. Your school’s official number may differ.` : 'Shows up once you log a grade.'}>
          <View style={styles.row}>
            <StatTile label="Unweighted" value={g ? g.unweighted.toFixed(2) : '–'} color={g ? gaugeColor((g.unweighted / 4) * 100) : colors.textFaint} />
            <StatTile label="Weighted" value={g ? g.weighted.toFixed(2) : '–'} color={g ? colors.flame : colors.textFaint} />
          </View>
        </Section>
      </Reveal>
      <Reveal index={2}>
        <Section title="Classes">
          <View style={styles.list}>
            {classes.map((c) => {
              const avg = classAverage(grades, c);
              const mine = grades.filter((x) => x.classId === c.id).sort((a, b) => a.date.localeCompare(b.date));
              const trend = mine.map((_, i) => classAverage(mine.slice(0, i + 1), c) ?? 0);
              return (
                <Card key={c.id} onPress={() => onPick(c.id)} style={styles.classCard}>
                  <View style={[styles.bar, { backgroundColor: c.color }]} />
                  <View style={styles.flex}>
                    <Text style={styles.className} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.sub}>
                      {avg == null ? 'No grades yet' : `${avg.toFixed(1)}%, ${mine.length} grade${mine.length === 1 ? '' : 's'}`}
                      {c.level && c.level !== 'regular' ? `, ${c.level === 'ap' ? 'AP' : 'Honors'}` : ''}
                    </Text>
                  </View>
                  {trend.length > 1 ? <Sparkline values={trend} color={c.color} width={64} height={28} /> : null}
                  <Text style={[styles.letterSmall, { color: avg == null ? colors.textFaint : gradeColor(avg) }]}>{avg == null ? '–' : letterFor(avg)}</Text>
                </Card>
              );
            })}
          </View>
        </Section>
      </Reveal>
    </>
  );
}

function ClassGrades({ cls }: { cls: SchoolClass }) {
  const grades = useSchoolStore((s) => s.grades);
  const addGrade = useSchoolStore((s) => s.addGrade);
  const deleteGrade = useSchoolStore((s) => s.deleteGrade);
  const saveClass = useSchoolStore((s) => s.saveClass);
  const aiOff = useLifeStore((s) => !!s.settings.aiOff);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tests');
  const [score, setScore] = useState('');
  const [outOf, setOutOf] = useState('100');
  const [editWeights, setEditWeights] = useState(false);
  const [target, setTarget] = useState(90);
  const [finalWeight, setFinalWeight] = useState(20);
  const [wiScore, setWiScore] = useState('');
  const [wiOutOf, setWiOutOf] = useState('100');
  const [wiCat, setWiCat] = useState('Tests');
  const [scanned, setScanned] = useState<FoundGrade[] | null>(null);
  const [scanPicked, setScanPicked] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  // Read grades off a gradebook screenshot; nothing is saved until you pick.
  const scanGrades = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: true, selectionLimit: 5, quality: 1 });
    if (res.canceled || !res.assets?.length) return;
    setScanning(true);
    const found: FoundGrade[] = [];
    for (const [i, asset] of res.assets.entries()) {
      try {
        const lines = await recognizeText(asset.uri);
        for (const g of parseGrades(lines.map((l) => ({ text: l.text, x: l.x, y: l.y })))) found.push({ ...g, key: `${i}-${g.key}` });
      } catch {
        // Skip a screenshot that can't be read.
      }
    }
    setScanning(false);
    // Leave out ones already logged.
    const have = new Set(grades.filter((g) => g.classId === cls.id).map((g) => `${g.title.toLowerCase()}|${g.score}|${g.outOf}`));
    const fresh = found.filter((g) => !have.has(`${g.title.toLowerCase()}|${g.score}|${g.outOf}`));
    setScanned(fresh);
    setScanPicked(fresh.map((g) => g.key));
    if (!fresh.length) emberSay('I couldn’t find grades like “88/100” in that. Try zooming in on the grade list.', 'concerned');
  };
  const importScanned = () => {
    const picked = (scanned ?? []).filter((g) => scanPicked.includes(g.key));
    for (const g of picked) addGrade({ classId: cls.id, title: g.title, category: g.category, score: g.score, outOf: g.outOf, date: dateKey() });
    setScanned(null);
    emberSay(`${picked.length} grade${picked.length === 1 ? '' : 's'} in. Check the categories look right.`, 'happy');
  };

  const mine = grades.filter((g) => g.classId === cls.id).sort((a, b) => b.date.localeCompare(a.date));
  const avg = classAverage(grades, cls);
  const weights = cls.weights ?? {};
  const weightTotal = Object.values(weights).reduce((s, w) => s + w, 0);
  const s = parseFloat(score);
  const o = parseFloat(outOf);
  const valid = title.trim() && !Number.isNaN(s) && !Number.isNaN(o) && o > 0 && s >= 0;

  const add = () => {
    if (!valid) return;
    addGrade({ classId: cls.id, title: title.trim(), category, score: s, outOf: o, date: dateKey() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const pct = (s / o) * 100;
    emberSay(
      pct >= 90 ? 'Look at that. Earned.' : pct >= 75 ? 'Solid. Logged.' : 'Logged. One grade is information, not a verdict.',
      pct >= 75 ? 'cheer' : 'concerned'
    );
    setTitle('');
    setScore('');
  };

  const setWeight = (cat: string, delta: number) => {
    const next = { ...weights, [cat]: Math.max(0, Math.min(100, (weights[cat] ?? 0) + delta)) };
    Object.keys(next).forEach((k) => next[k] === 0 && delete next[k]);
    saveClass({ ...cls, weights: next });
  };

  const needed = avg != null ? finalNeeded(avg, target, finalWeight / 100) : null;
  const ws = parseFloat(wiScore);
  const wo = parseFloat(wiOutOf);
  const whatIf =
    !Number.isNaN(ws) && !Number.isNaN(wo) && wo > 0
      ? classAverage([...grades, { id: 'what-if', classId: cls.id, title: 'What if', category: wiCat, score: ws, outOf: wo, date: dateKey() }], cls)
      : null;
  const goal = cls.goal;

  return (
    <>
      <Reveal index={1}>
        <Card tint={cls.color} style={styles.hero}>
          <View style={[styles.letterBig, { borderColor: alpha(cls.color, 0.55), backgroundColor: alpha(cls.color, 0.14) }]}>
            <Text style={[styles.letterBigText, { color: cls.color }]}>{avg == null ? '–' : letterFor(avg)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.pct}>{avg == null ? 'No grades yet' : `${avg.toFixed(1)}%`}</Text>
            <Text style={styles.sub}>
              {weightTotal ? `Weighted by category (${weightTotal}% set)` : 'Total points'}, {mine.length} grade{mine.length === 1 ? '' : 's'}
            </Text>
          </View>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Section title="Your goal" note={goal ? undefined : 'Pick what you’re aiming for.'}>
          <ChipRow>
            {[93, 90, 85, 80, 70].map((g) => (
              <Chip key={g} label={`${g}% (${letterFor(g)})`} selected={goal === g} color={cls.color} onPress={() => saveClass({ ...cls, goal: goal === g ? undefined : g })} />
            ))}
          </ChipRow>
          {goal && avg != null ? (
            <View style={styles.goalBox}>
              <ProgressBar value={Math.min(1, avg / goal)} color={avg >= goal ? colors.secured : cls.color} />
              <Text style={styles.goalText}>
                {avg >= goal ? `At ${avg.toFixed(1)}%, you’re at or above your goal. Keep it steady.` : `${(goal - avg).toFixed(1)} points to go. The what-if below shows what one grade would do.`}
              </Text>
            </View>
          ) : null}
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title="Log a grade">
          <Card>
            <Field placeholder="What was it? e.g. Unit 3 test" value={title} onChangeText={setTitle} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow} style={styles.catScroll}>
              {GRADE_CATEGORIES.map((c) => (
                <Chip key={c} label={c} selected={category === c} color={cls.color} onPress={() => setCategory(c)} />
              ))}
            </ScrollView>
            <View style={styles.scoreRow}>
              <Field placeholder="Score" value={score} onChangeText={setScore} keyboardType="decimal-pad" containerStyle={styles.flex} accessibilityLabel="Score" />
              <Text style={styles.outOf}>out of</Text>
              <Field placeholder="100" value={outOf} onChangeText={setOutOf} keyboardType="decimal-pad" containerStyle={styles.flex} accessibilityLabel="Out of" />
            </View>
            {valid ? <Text style={styles.preview}>{((s / o) * 100).toFixed(1)}%, {letterFor((s / o) * 100)}</Text> : null}
            <Button label="Log it" icon="plus" onPress={add} disabled={!valid} style={styles.gap} />
            {textRecognitionAvailable ? (
              <Button
                label={scanning ? 'Reading…' : 'Scan grades from a screenshot'}
                icon="image"
                variant="ghost"
                size="sm"
                loading={scanning}
                onPress={scanGrades}
                style={styles.scanBtn}
              />
            ) : null}
            {scanned && scanned.length ? (
              <View style={styles.scanned}>
                <Text style={styles.calcLabel}>Found {scanned.length}. Uncheck any that are wrong.</Text>
                {scanned.map((g) => {
                  const on = scanPicked.includes(g.key);
                  return (
                    <Pressy
                      key={g.key}
                      onPress={() => setScanPicked(on ? scanPicked.filter((k) => k !== g.key) : [...scanPicked, g.key])}
                      style={styles.scanRow}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                    >
                      <Icon name={on ? 'check' : 'plus'} size={16} color={on ? colors.secured : colors.textFaint} />
                      <Text style={styles.scanTitle} numberOfLines={1}>
                        {g.title}
                      </Text>
                      <Text style={styles.scanMeta}>
                        {g.score}/{g.outOf}, {g.category}
                      </Text>
                    </Pressy>
                  );
                })}
                <Button label={`Add ${scanPicked.length} grade${scanPicked.length === 1 ? '' : 's'}`} icon="check" variant="secondary" onPress={importScanned} disabled={!scanPicked.length} style={styles.gap} />
              </View>
            ) : null}
          </Card>
        </Section>
      </Reveal>

      <Reveal index={3}>
        <Section
          title="How it’s weighted"
          note={weightTotal ? `${weightTotal}% of 100% assigned` : 'Check your syllabus. No weights = every point counts the same.'}
          action={{ label: editWeights ? 'Done' : 'Edit', onPress: () => setEditWeights((v) => !v) }}
        >
          {editWeights ? (
            <Card>
              {GRADE_CATEGORIES.map((c) => (
                <View key={c} style={styles.weightRow}>
                  <Text style={styles.weightLabel}>{c}</Text>
                  <Stepper value={`${weights[c] ?? 0}%`} onDecrement={() => setWeight(c, -5)} onIncrement={() => setWeight(c, 5)} label={`${c} weight`} minWidth={50} />
                </View>
              ))}
              {weightTotal !== 100 && weightTotal > 0 ? <Text style={styles.warn}>These add up to {weightTotal}%. Most syllabi add to 100%.</Text> : null}
            </Card>
          ) : weightTotal ? (
            <ChipRow>
              {Object.entries(weights).map(([k, v]) => (
                <Chip key={k} label={`${k} ${v}%`} />
              ))}
            </ChipRow>
          ) : null}
        </Section>
      </Reveal>

      {avg != null ? (
        <Reveal index={4}>
          <Section title="What do I need on the final?">
            <Card>
              <Text style={styles.calcLabel}>I want to end with at least</Text>
              <ChipRow>
                {[90, 80, 70, 60].map((t) => (
                  <Chip key={t} label={`${t}% (${letterFor(t)})`} selected={target === t} onPress={() => setTarget(t)} />
                ))}
              </ChipRow>
              <View style={styles.weightRow}>
                <Text style={styles.weightLabel}>The final is worth</Text>
                <Stepper value={`${finalWeight}%`} onDecrement={() => setFinalWeight(Math.max(5, finalWeight - 5))} onIncrement={() => setFinalWeight(Math.min(60, finalWeight + 5))} label="final weight" minWidth={50} />
              </View>
              {needed != null ? (
                <View style={[styles.answer, { borderColor: alpha(needed > 100 ? colors.unlocked : needed <= 0 ? colors.secured : colors.flame, 0.5) }]}>
                  <Text style={[styles.answerNum, { color: needed > 100 ? colors.unlocked : needed <= 0 ? colors.secured : colors.flame }]}>
                    {needed <= 0 ? 'Already there' : `${Math.ceil(needed)}%`}
                  </Text>
                  <Text style={styles.answerText}>
                    {needed <= 0
                      ? `Even a zero on the final keeps you at ${target}%. Still worth showing up.`
                      : needed > 100
                        ? `More than 100%, so out of reach this time. Aim for the next line down, and ask about extra credit.`
                        : `on the final to finish at ${target}%.`}
                  </Text>
                </View>
              ) : null}
              {needed != null && needed > 0 && needed <= 100 && !aiOff ? (
                <Button
                  label="Plan for it with Sage"
                  icon="sparkle"
                  variant="ghost"
                  size="sm"
                  onPress={() =>
                    router.push({
                      pathname: '/helper/[id]',
                      params: {
                        id: 'sage',
                        ask: `I need about ${Math.ceil(needed)}% on my ${cls.name} final (it's worth ${finalWeight}%) to end with ${target}%. Help me plan how to study for it. Ask me what the final covers first.`,
                      },
                    })
                  }
                  style={styles.sageBtn}
                />
              ) : null}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      {avg != null ? (
        <Reveal index={4}>
          <Section title="What if…" note="Try a score without saving it.">
            <Card>
              <View style={styles.scoreRow}>
                <Field placeholder="Score" value={wiScore} onChangeText={setWiScore} keyboardType="decimal-pad" containerStyle={styles.flex} accessibilityLabel="What-if score" />
                <Text style={styles.outOf}>out of</Text>
                <Field placeholder="100" value={wiOutOf} onChangeText={setWiOutOf} keyboardType="decimal-pad" containerStyle={styles.flex} accessibilityLabel="What-if out of" />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow} style={styles.catScroll}>
                {GRADE_CATEGORIES.map((c) => (
                  <Chip key={c} label={c} selected={wiCat === c} color={cls.color} onPress={() => setWiCat(c)} />
                ))}
              </ScrollView>
              {whatIf != null ? (
                <Text style={[styles.whatIf, { color: whatIf >= avg ? colors.secured : colors.unlocked }]}>
                  You’d be at {whatIf.toFixed(1)}% ({letterFor(whatIf)}), {whatIf >= avg ? 'up' : 'down'} {Math.abs(whatIf - avg).toFixed(1)} from {avg.toFixed(1)}%.
                </Text>
              ) : null}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      {mine.length ? (
        <Reveal index={5}>
          <Section title="All grades">
            <View style={styles.list}>
              {mine.map((g) => {
                const pct = (g.score / g.outOf) * 100;
                return (
                  <Animated.View key={g.id} entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
                    <Card style={styles.gradeRow}>
                      <View style={styles.flex}>
                        <Text style={styles.gradeTitle} numberOfLines={1}>
                          {g.title}
                        </Text>
                        <Text style={styles.sub}>
                          {g.category}, {g.score}/{g.outOf}
                        </Text>
                      </View>
                      <Text style={[styles.gradePct, { color: gradeColor(pct) }]}>{pct.toFixed(0)}%</Text>
                      <Pressy
                        onPress={() => {
                          const before = useSchoolStore.getState().grades;
                          deleteGrade(g.id);
                          offerUndo(`Removed “${g.title}”`, () => useSchoolStore.getState().putBack({ grades: before }), 'trash');
                        }}
                        hitSlop={10}
                        accessibilityLabel={`Delete ${g.title}`}
                      >
                        <Icon name="trash" size={16} color={alpha(colors.danger, 0.7)} />
                      </Pressy>
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          </Section>
        </Reveal>
      ) : null}

      <Reveal index={6}>
        <ScienceNote fact="Students who track their own grades as they go — instead of waiting for the report card — catch slipping classes weeks earlier, while there's still time to ask for help or retake something." />
      </Reveal>
    </>
  );
}

const styles = StyleSheet.create({
  sageBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  goalBox: {
    marginTop: 12,
    gap: 8,
  },
  goalText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  scanBtn: {
    alignSelf: 'center',
    marginTop: 8,
  },
  scanned: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  scanTitle: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  scanMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  whatIf: {
    marginTop: 12,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: 14,
  },
  classScroll: {
    marginTop: 14,
    marginHorizontal: -20,
  },
  classRow: {
    gap: 8,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  list: {
    gap: 10,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bar: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 3,
  },
  className: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  letterSmall: {
    width: 36,
    textAlign: 'right',
    fontFamily: fonts.display,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  hero: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  letterBig: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBigText: {
    fontFamily: fonts.display,
    fontSize: 32,
  },
  pct: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  catScroll: {
    marginTop: 12,
    marginHorizontal: -18,
  },
  catRow: {
    gap: 8,
    paddingHorizontal: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  outOf: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
  },
  preview: {
    marginTop: 8,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.flame,
    textAlign: 'center',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  weightLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  warn: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.flame,
  },
  calcLabel: {
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  answer: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  answerNum: {
    fontFamily: fonts.display,
    fontSize: 34,
    fontVariant: ['tabular-nums'],
  },
  answerText: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  gradeTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  gradePct: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
});
