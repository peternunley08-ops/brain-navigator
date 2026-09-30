import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { recognizeText, textRecognitionAvailable } from '../modules/text-recognition';
import { emberSay } from '../components/ember/EmberBuddy';
import { EmberSprite } from '../components/ember/EmberSprite';
import { useEmberRig } from '../components/ember/useEmberRig';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { addDays, dateKey, dueLabel } from '../core/dates';
import { type FoundAssignment, type FoundClass, linesFromText, parseScan, type ScanLine, type ScanResult } from '../core/scanParser';
import { CLASS_COLORS, KIND_LABEL, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts, radii } from '../core/theme';

type Stage = 'intro' | 'paste' | 'reading' | 'review';

// Import classes and due dates from a screenshot of Google Classroom or
// Canvas. The phone reads the text itself (Apple's Vision framework, in
// modules/text-recognition) — nothing is uploaded — and the student checks
// what was found before anything is saved.
export default function ScanScreen() {
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const saveClass = useSchoolStore((s) => s.saveClass);
  const addAssignment = useSchoolStore((s) => s.addAssignment);
  const rig = useEmberRig();

  const [stage, setStage] = useState<Stage>(textRecognitionAvailable ? 'intro' : 'paste');
  const [preview, setPreview] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pickedClasses, setPickedClasses] = useState<Set<string>>(new Set());
  const [pickedWork, setPickedWork] = useState<Set<string>>(new Set());
  const [dates, setDates] = useState<Record<string, string | null>>({});
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    rig.setMood(stage === 'reading' ? 'listening' : stage === 'review' ? 'happy' : 'curious');
    if (stage === 'reading') rig.holdGaze(true);
    else rig.holdGaze(false);
  }, [stage, rig]);

  const review = (lines: ScanLine[]) => {
    const r = parseScan(lines, classes);
    const knownTitles = new Set(assignments.map((a) => `${a.title.toLowerCase()}|${a.due}`));
    r.assignments = r.assignments.filter((a) => !knownTitles.has(`${a.title.toLowerCase()}|${a.due}`));
    setResult(r);
    setPickedClasses(new Set(r.classes.filter((c) => c.likely).map((c) => c.key)));
    setPickedWork(new Set(r.assignments.map((a) => a.key)));
    setDates(Object.fromEntries(r.assignments.map((a) => [a.key, a.due])));
    setStage('review');
    if (r.assignments.length + r.classes.length > 0) {
      rig.hopUp(12);
      rig.talk(true);
      setTimeout(() => rig.talk(false), 900);
    } else {
      rig.setMood('concerned');
    }
  };

  const choose = async () => {
    setError(null);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: true, selectionLimit: 4, quality: 1 });
    if (res.canceled || !res.assets?.length) return;
    setPreview(res.assets[0].uri);
    setStage('reading');
    try {
      const all: ScanLine[] = [];
      for (const [i, asset] of res.assets.entries()) {
        const lines = await recognizeText(asset.uri);
        // Stack multiple screenshots top to bottom, in the order picked.
        for (const l of lines) all.push({ text: l.text, x: l.x, y: i + l.y });
      }
      // Let the scan line pass at least once — it reads as "looking".
      setTimeout(() => review(all), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t read that image.');
      setStage('intro');
    }
  };

  const importPicked = () => {
    if (!result) return;
    const nameToId = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));
    let colorIndex = classes.length;
    let addedClasses = 0;
    for (const c of result.classes) {
      if (!pickedClasses.has(c.key) || nameToId.has(c.name.toLowerCase())) continue;
      saveClass({
        name: c.name,
        teacher: c.teacher,
        room: '',
        color: CLASS_COLORS[colorIndex++ % CLASS_COLORS.length],
        kind: 'class',
        // A screenshot doesn't say when a class meets — add times later.
        days: [],
        start: 0,
        end: 0,
      });
      addedClasses++;
    }
    const fresh = useSchoolStore.getState().classes;
    for (const c of fresh) nameToId.set(c.name.toLowerCase(), c.id);

    let addedWork = 0;
    for (const a of result.assignments) {
      if (!pickedWork.has(a.key)) continue;
      addAssignment({
        title: a.title,
        kind: a.kind,
        classId: a.className ? nameToId.get(a.className.toLowerCase()) ?? null : null,
        due: dates[a.key] ?? addDays(dateKey(), 1),
        minutes: null,
        notes: '',
      });
      addedWork++;
    }
    router.back();
    const parts = [
      addedClasses ? `${addedClasses} class${addedClasses === 1 ? '' : 'es'}` : '',
      addedWork ? `${addedWork} thing${addedWork === 1 ? '' : 's'} due` : '',
    ].filter(Boolean);
    emberSay(parts.length ? `Brought in ${parts.join(' and ')}. Check the dates look right.` : 'Nothing new to bring in.', parts.length ? 'cheer' : 'idle');
  };

  const count = (pickedClasses.size || 0) + (pickedWork.size || 0);

  return (
    <Screen nav={false} backIcon="close" glowColor="#AFA2DE" title="Scan a screenshot" subtitle="Bring your classes and due dates in from Google Classroom or Canvas.">
      <View style={styles.stage}>
        {stage === 'reading' && preview ? (
          <ScanPreview uri={preview} />
        ) : (
          <EmberSprite rig={rig} size={96} glasses={stage === 'review'} seed={6.1} />
        )}
      </View>

      {stage === 'intro' ? (
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>What to screenshot</Text>
            <Tip icon="book" text="Your Classroom home screen — every class card, for your schedule." />
            <Tip icon="flag" text="Your Classroom To-do list, or Canvas To Do — for what’s due." />
            <Tip icon="sparkle" text="Pick up to four at once. Scroll and screenshot again for long lists." />
          </Card>
          <Text style={styles.privacy}>Your phone reads the text itself. Nothing is uploaded.</Text>
          <Button label="Choose screenshots" icon="image" onPress={choose} style={styles.primary} />
          <Button label="Paste text instead" variant="ghost" size="sm" icon="pen" onPress={() => setStage('paste')} style={styles.alt} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Animated.View>
      ) : null}

      {stage === 'paste' ? (
        <Animated.View entering={FadeInDown.duration(360)}>
          {!textRecognitionAvailable ? (
            <Card tint={colors.flame} style={styles.card}>
              <Text style={styles.cardBody}>
                Reading screenshots needs the newest build of the app. Until then: open your screenshot in Photos, press and hold
                on the text, tap Select All, then Copy — and paste it here.
              </Text>
            </Card>
          ) : (
            <Text style={styles.cardBody}>In Photos, press and hold on the text in your screenshot, tap Select All, Copy, and paste it here.</Text>
          )}
          <Field multiline placeholder="Paste your Classroom or Canvas text" value={pasted} onChangeText={setPasted} containerStyle={styles.card} style={styles.paste} />
          <Button label="Read it" icon="sparkle" onPress={() => review(linesFromText(pasted))} disabled={!pasted.trim()} style={styles.primary} />
          {textRecognitionAvailable ? <Button label="Use a screenshot instead" variant="ghost" size="sm" onPress={() => setStage('intro')} style={styles.alt} /> : null}
        </Animated.View>
      ) : null}

      {stage === 'reading' ? (
        <Animated.Text entering={FadeIn} style={styles.reading}>
          Reading it…
        </Animated.Text>
      ) : null}

      {stage === 'review' && result ? (
        result.assignments.length + result.classes.length === 0 ? (
          <EmptyState title="I couldn’t find classes or due dates in that one." body="Try your Classroom home screen or To-do list, zoomed so the text is clear.">
            <Button label="Try another" icon="image" variant="secondary" onPress={() => setStage(textRecognitionAvailable ? 'intro' : 'paste')} />
          </EmptyState>
        ) : (
          <Animated.View entering={FadeInDown.duration(360)}>
            <Text style={styles.found}>
              Here’s what I found. Uncheck anything that’s wrong{result.assignments.some((a) => !a.due) ? ', and pick dates where I couldn’t read one' : ''}.
            </Text>

            {result.classes.length ? (
              <Section title="Classes" note="Add days and times later so I know what’s next.">
                <View style={styles.list}>
                  {result.classes.map((c) => (
                    <ClassPick
                      key={c.key}
                      c={c}
                      on={pickedClasses.has(c.key)}
                      exists={classes.some((k) => k.name.toLowerCase() === c.name.toLowerCase())}
                      onToggle={() => setPickedClasses(toggle(pickedClasses, c.key))}
                    />
                  ))}
                </View>
              </Section>
            ) : null}

            {result.assignments.length ? (
              <Section title="Due">
                <View style={styles.list}>
                  {result.assignments.map((a) => (
                    <WorkPick
                      key={a.key}
                      a={a}
                      due={dates[a.key]}
                      on={pickedWork.has(a.key)}
                      editing={editingDate === a.key}
                      onToggle={() => setPickedWork(toggle(pickedWork, a.key))}
                      onEditDate={() => setEditingDate(editingDate === a.key ? null : a.key)}
                      onPickDate={(d) => {
                        setDates({ ...dates, [a.key]: d });
                        setEditingDate(null);
                      }}
                    />
                  ))}
                </View>
              </Section>
            ) : null}

            <Button label={count ? `Bring in ${count} thing${count === 1 ? '' : 's'}` : 'Nothing picked'} icon="check" onPress={importPicked} disabled={!count} style={styles.primary} />
            <Button label="Scan another" variant="ghost" size="sm" onPress={() => setStage(textRecognitionAvailable ? 'intro' : 'paste')} style={styles.alt} />
          </Animated.View>
        )
      ) : null}
    </Screen>
  );
}

function toggle(set: Set<string>, key: string) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

function Tip({ icon, text }: { icon: 'book' | 'flag' | 'sparkle'; text: string }) {
  return (
    <View style={styles.tip}>
      <Icon name={icon} size={16} color="#AFA2DE" />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <View style={[styles.check, on && styles.checkOn]}>{on ? <Icon name="check" size={14} color={colors.flameInk} strokeWidth={2.8} /> : null}</View>
  );
}

function ClassPick({ c, on, exists, onToggle }: { c: FoundClass; on: boolean; exists: boolean; onToggle: () => void }) {
  return (
    <Pressy onPress={exists ? undefined : onToggle} style={[styles.pick, exists && styles.pickDim]} accessibilityRole="checkbox" accessibilityState={{ checked: on && !exists }}>
      <Check on={on && !exists} />
      <View style={styles.flex}>
        <Text style={styles.pickTitle}>{c.name}</Text>
        <Text style={styles.pickMeta}>{exists ? 'Already on your schedule' : c.teacher || 'New class'}</Text>
      </View>
    </Pressy>
  );
}

function WorkPick({
  a,
  due,
  on,
  editing,
  onToggle,
  onEditDate,
  onPickDate,
}: {
  a: FoundAssignment;
  due: string | null | undefined;
  on: boolean;
  editing: boolean;
  onToggle: () => void;
  onEditDate: () => void;
  onPickDate: (d: string) => void;
}) {
  const today = dateKey();
  return (
    <View style={styles.workWrap}>
      <Pressy onPress={onToggle} style={styles.pick} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
        <Check on={on} />
        <View style={styles.flex}>
          <Text style={styles.pickTitle}>{a.title}</Text>
          <Text style={styles.pickMeta}>
            {KIND_LABEL[a.kind]}
            {a.className ? `, ${a.className}` : ''}
          </Text>
        </View>
        <Pressy onPress={onEditDate} style={[styles.dateBtn, !due && styles.dateMissing]} hitSlop={6} accessibilityLabel="Change due date">
          <Text style={[styles.dateText, !due && { color: colors.flame }]}>{due ? dueLabel(due) : 'Pick date'}</Text>
        </Pressy>
      </Pressy>
      {editing ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {Array.from({ length: 14 }, (_, i) => addDays(today, i)).map((d) => (
            <Chip key={d} label={dueLabel(d)} selected={d === due} onPress={() => onPickDate(d)} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

// The picked screenshot with a glowing line sweeping down it while the
// phone reads.
function ScanPreview({ uri }: { uri: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [p]);
  const line = useAnimatedStyle(() => ({ top: `${p.value * 96}%` }));
  return (
    <View style={styles.preview}>
      <Image source={{ uri }} style={styles.previewImg} resizeMode="cover" />
      <View style={styles.previewTint} />
      <Animated.View style={[styles.scanLine, line]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    marginTop: 6,
    minHeight: 120,
    justifyContent: 'center',
  },
  card: {
    marginTop: 14,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    marginBottom: 6,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 8,
  },
  tip: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 10,
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  privacy: {
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
  primary: {
    marginTop: 18,
  },
  alt: {
    marginTop: 6,
    alignSelf: 'center',
  },
  error: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  paste: {
    minHeight: 180,
  },
  reading: {
    marginTop: 16,
    fontFamily: fonts.displaySoft,
    fontSize: 19,
    color: colors.text,
    textAlign: 'center',
  },
  found: {
    marginTop: 8,
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
  list: {
    gap: 8,
  },
  workWrap: {
    gap: 8,
  },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pickDim: {
    opacity: 0.55,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.flame,
    borderColor: colors.flame,
  },
  flex: {
    flex: 1,
  },
  pickTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  pickMeta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  dateBtn: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  dateMissing: {
    backgroundColor: alpha(colors.flame, 0.14),
  },
  dateText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textMuted,
  },
  dateRow: {
    gap: 6,
    paddingRight: 8,
  },
  preview: {
    width: 150,
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: alpha('#AFA2DE', 0.5),
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  previewTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 15, 20, 0.35)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFE2B0',
    shadowColor: '#F5B45C',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
