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
import { useLifeStore } from '../core/lifeStore';
import { findClass } from '../core/quickParse';
import { attachTimes, type FoundAssignment, type FoundClass, linesFromText, mergeScans, parseSchedule, parseScan, type ScanResult } from '../core/scanParser';
import { clock } from '../core/schoolStore';
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
  // Every screenshot read so far (across "add more" rounds), and how far
  // through the current batch the phone is.
  const [shots, setShots] = useState<string[]>([]);
  const [parts, setParts] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [pasted, setPasted] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pickedClasses, setPickedClasses] = useState<Set<string>>(new Set());
  const [pickedWork, setPickedWork] = useState<Set<string>>(new Set());
  const [dates, setDates] = useState<Record<string, string | null>>({});
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Found items whose title is already on the list with a different date: shown, but unchecked.
  const [already, setAlready] = useState<Record<string, string>>({});
  // A scanned class name → one of your classes: exact name, a name you've matched before, or a close match.
  const aliases = useLifeStore((s) => s.settings.classAliases);
  const mapClass = (name: string | null | undefined) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    const exact = classes.find((c) => c.name.toLowerCase() === lower);
    if (exact) return exact;
    const known = aliases?.[lower] ? classes.find((c) => c.id === aliases[lower]) : undefined;
    return known ?? findClass(name, classes.filter((c) => c.kind === 'class'))?.cls ?? null;
  };

  useEffect(() => {
    rig.setMood(stage === 'reading' ? 'listening' : stage === 'review' ? 'happy' : 'curious');
    if (stage === 'reading') rig.holdGaze(true);
    else rig.holdGaze(false);
  }, [stage, rig]);

  // Show what was found across every screenshot so far. New finds come in
  // checked; anything the student already unchecked stays unchecked.
  const review = (allParts: ScanResult[], fresh = false) => {
    const r = mergeScans(allParts);
    const knownTitles = new Set(assignments.map((a) => `${a.title.toLowerCase()}|${a.due}`));
    r.assignments = r.assignments.filter((a) => !knownTitles.has(`${a.title.toLowerCase()}|${a.due}`));
    const byTitle = new Map(assignments.filter((a) => !a.done).map((a) => [a.title.toLowerCase(), a.due]));
    const dup = Object.fromEntries(r.assignments.filter((a) => byTitle.has(a.title.toLowerCase())).map((a) => [a.key, byTitle.get(a.title.toLowerCase())!]));
    setAlready(dup);
    const seenBefore = fresh
      ? new Set<string>()
      : new Set([...(result?.classes ?? []).map((c) => c.key), ...(result?.assignments ?? []).map((a) => a.key)]);
    setResult(r);
    setPickedClasses(new Set(r.classes.filter((c) => (seenBefore.has(c.key) ? pickedClasses.has(c.key) : c.likely)).map((c) => c.key)));
    setPickedWork(new Set(r.assignments.filter((a) => !dup[a.key] && (!seenBefore.has(a.key) || pickedWork.has(a.key))).map((a) => a.key)));
    setDates(Object.fromEntries(r.assignments.map((a) => [a.key, fresh ? a.due : dates[a.key] ?? a.due])));
    setStage('review');
    if (r.assignments.length + r.classes.length > 0) {
      rig.hopUp(12);
      rig.talk(true);
      setTimeout(() => rig.talk(false), 900);
    } else {
      rig.setMood('concerned');
    }
  };

  // Pick one or many screenshots. With `more`, they're added to what's
  // already been found instead of starting over.
  const choose = async (more = false) => {
    setError(null);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: 10,
      orderedSelection: true,
      quality: 1,
    });
    if (res.canceled || !res.assets?.length) return;
    const uris = res.assets.map((a) => a.uri);
    const base = more ? parts : [];
    setShots(more ? [...shots, ...uris] : uris);
    if (!more) {
      setResult(null);
      setPickedClasses(new Set());
      setPickedWork(new Set());
      setDates({});
    }
    setStage('reading');
    const found: ScanResult[] = [];
    const failed: number[] = [];
    for (const [i, uri] of uris.entries()) {
      setPreview(uri);
      setProgress({ done: i, total: uris.length });
      try {
        const lines = (await recognizeText(uri)).map((l) => ({ text: l.text, x: l.x, y: l.y }));
        // A schedule screenshot also brings its class times.
        found.push(attachTimes(parseScan(lines, useSchoolStore.getState().classes), parseSchedule(lines), `t${i}-`));
      } catch {
        failed.push(i + 1);
      }
    }
    setProgress({ done: uris.length, total: uris.length });
    if (failed.length === uris.length) {
      setError('Couldn’t read those screenshots. Try clearer ones, zoomed in on the text.');
      setStage(more ? 'review' : 'intro');
      return;
    }
    if (failed.length) setError(`Couldn’t read screenshot ${failed.join(', ')} — the rest are below.`);
    const all = [...base, ...found];
    setParts(all);
    // Let the scan line pass at least once — it reads as "looking".
    setTimeout(() => review(all, !more), 700);
  };

  const importPicked = () => {
    if (!result) return;
    const nameToId = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));
    let colorIndex = classes.length;
    let addedClasses = 0;
    let timed = 0;
    for (const c of result.classes) {
      if (!pickedClasses.has(c.key)) continue;
      const hasTimes = c.start != null && c.end != null;
      const existingId = nameToId.get(c.name.toLowerCase());
      if (existingId) {
        // An existing class without a schedule picks up the times it was found with.
        const ex = classes.find((k) => k.id === existingId);
        if (ex && hasTimes && ex.days.length === 0) {
          saveClass({ ...ex, days: [1, 2, 3, 4, 5], start: c.start!, end: c.end!, room: ex.room || c.room || '' });
          timed++;
        }
        continue;
      }
      saveClass({
        name: c.name,
        teacher: c.teacher,
        room: c.room ?? '',
        color: CLASS_COLORS[colorIndex++ % CLASS_COLORS.length],
        kind: 'class',
        // A schedule screenshot gives times (weekdays assumed); a to-do or
        // class-card screenshot doesn't — add those later.
        days: hasTimes ? [1, 2, 3, 4, 5] : [],
        start: c.start ?? 0,
        end: c.end ?? 0,
      });
      addedClasses++;
      if (hasTimes) timed++;
    }
    const fresh = useSchoolStore.getState().classes;
    for (const c of fresh) nameToId.set(c.name.toLowerCase(), c.id);

    let addedWork = 0;
    for (const a of result.assignments) {
      if (!pickedWork.has(a.key)) continue;
      addAssignment({
        title: a.title,
        kind: a.kind,
        classId: a.className ? nameToId.get(a.className.toLowerCase()) ?? mapClass(a.className)?.id ?? null : null,
        due: dates[a.key] ?? addDays(dateKey(), 1),
        minutes: null,
        notes: '',
      });
      addedWork++;
    }
    // Remember close matches, so next time this scanned name goes straight to the same class.
    const learned: Record<string, string> = { ...(aliases ?? {}) };
    for (const a of result.assignments) {
      if (!pickedWork.has(a.key) || !a.className || nameToId.has(a.className.toLowerCase())) continue;
      const m = mapClass(a.className);
      if (m) learned[a.className.toLowerCase()] = m.id;
    }
    useLifeStore.getState().setSettings({ classAliases: learned });
    router.back();
    const parts = [
      addedClasses ? `${addedClasses} class${addedClasses === 1 ? '' : 'es'}` : '',
      addedWork ? `${addedWork} thing${addedWork === 1 ? '' : 's'} due` : '',
      timed ? `times for ${timed} class${timed === 1 ? '' : 'es'}` : '',
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
            <Tip icon="clock" text="Your schedule page (Aeries or your school’s app) — for when each class meets." />
            <Tip icon="sparkle" text="Pick as many as you need — up to 10 at a time. Long list? Scroll, screenshot again, pick them all." />
          </Card>
          <Text style={styles.privacy}>Your phone reads the text itself. Nothing is uploaded.</Text>
          <Button label="Choose screenshots" icon="image" onPress={() => choose(false)} style={styles.primary} />
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
          <Button
            label="Read it"
            icon="sparkle"
            onPress={() => {
              const pastedLines = linesFromText(pasted);
              const all = [...parts, attachTimes(parseScan(pastedLines, classes), parseSchedule(pastedLines))];
              setParts(all);
              setPasted('');
              review(all);
            }}
            disabled={!pasted.trim()}
            style={styles.primary}
          />
          {textRecognitionAvailable ? <Button label="Use a screenshot instead" variant="ghost" size="sm" onPress={() => setStage('intro')} style={styles.alt} /> : null}
        </Animated.View>
      ) : null}

      {stage === 'reading' ? (
        <Animated.View entering={FadeIn}>
          <Text style={styles.reading}>
            {progress.total > 1 ? `Reading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : 'Reading it…'}
          </Text>
          <Shots uris={shots} readUpTo={shots.length - progress.total + progress.done} />
        </Animated.View>
      ) : null}

      {stage === 'review' && result ? (
        result.assignments.length + result.classes.length === 0 ? (
          <EmptyState title="I couldn’t find classes or due dates in that one." body="Try your Classroom home screen or To-do list, zoomed so the text is clear.">
            <Button label="Try another" icon="image" variant="secondary" onPress={() => setStage(textRecognitionAvailable ? 'intro' : 'paste')} />
          </EmptyState>
        ) : (
          <Animated.View entering={FadeInDown.duration(360)}>
            {shots.length > 1 ? <Shots uris={shots} readUpTo={shots.length} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.found}>
              {shots.length > 1 ? `From ${shots.length} screenshots. ` : ''}Here’s what I found. Uncheck anything that’s wrong{result.assignments.some((a) => !a.due) ? ', and pick dates where I couldn’t read one' : ''}.
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
                      needsTimes={c.start != null && classes.some((k) => k.name.toLowerCase() === c.name.toLowerCase() && k.days.length === 0)}
                      onToggle={() => setPickedClasses(toggle(pickedClasses, c.key))}
                    />
                  ))}
                </View>
              </Section>
            ) : null}

            {result.assignments.length ? (
              <Section
                title="Due"
                action={{
                  label: pickedWork.size === result.assignments.length ? 'Pick none' : 'Pick all',
                  onPress: () => setPickedWork(pickedWork.size === result.assignments.length ? new Set() : new Set(result.assignments.map((a) => a.key))),
                }}
              >
                <View style={styles.list}>
                  {result.assignments.map((a) => (
                    <WorkPick
                      key={a.key}
                      a={a}
                      due={dates[a.key]}
                      already={already[a.key]}
                      mappedTo={a.className && !classes.some((c) => c.name.toLowerCase() === a.className!.toLowerCase()) ? mapClass(a.className)?.name : undefined}
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
            {textRecognitionAvailable ? (
              <Button label="Add more screenshots" icon="plus" variant="secondary" onPress={() => choose(true)} style={styles.more} />
            ) : (
              <Button label="Paste more text" icon="plus" variant="secondary" onPress={() => setStage('paste')} style={styles.more} />
            )}
          </Animated.View>
        )
      ) : null}
    </Screen>
  );
}

// A row of every screenshot picked, the ones already read marked with a check.
function Shots({ uris, readUpTo }: { uris: string[]; readUpTo: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shots} style={styles.shotsScroll}>
      {uris.map((u, i) => (
        <View key={`${u}-${i}`} style={[styles.shot, i < readUpTo && styles.shotDone]}>
          <Image source={{ uri: u }} style={styles.shotImg} resizeMode="cover" />
          {i < readUpTo ? (
            <View style={styles.shotCheck}>
              <Icon name="check" size={11} color={colors.flameInk} strokeWidth={3} />
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

function toggle(set: Set<string>, key: string) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

function Tip({ icon, text }: { icon: 'book' | 'flag' | 'sparkle' | 'clock'; text: string }) {
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

function ClassPick({ c, on, exists, needsTimes, onToggle }: { c: FoundClass; on: boolean; exists: boolean; needsTimes: boolean; onToggle: () => void }) {
  // An existing class can still be picked if this scan found the times it's missing.
  const locked = exists && !needsTimes;
  const times = c.start != null && c.end != null ? `${clock(c.start)} – ${clock(c.end)}${c.room ? `, room ${c.room}` : ''}` : '';
  return (
    <Pressy onPress={locked ? undefined : onToggle} style={[styles.pick, locked && styles.pickDim]} accessibilityRole="checkbox" accessibilityState={{ checked: on && !locked }}>
      <Check on={on && !locked} />
      <View style={styles.flex}>
        <Text style={styles.pickTitle}>{c.name}</Text>
        <Text style={styles.pickMeta}>
          {locked ? 'Already on your schedule' : exists ? `Adds its times: ${times}` : [c.teacher, times].filter(Boolean).join(', ') || 'New class'}
        </Text>
      </View>
    </Pressy>
  );
}

function WorkPick({
  a,
  due,
  already,
  mappedTo,
  on,
  editing,
  onToggle,
  onEditDate,
  onPickDate,
}: {
  a: FoundAssignment;
  due: string | null | undefined;
  /** It's already on the list, due this day. */
  already?: string;
  /** The class it'll go under when the scanned name differs. */
  mappedTo?: string;
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
            {mappedTo ? `, goes under ${mappedTo}` : a.className ? `, ${a.className}` : ''}
          </Text>
          {already ? <Text style={[styles.pickMeta, { color: colors.flame }]}>Already on your list, due {dueLabel(already).toLowerCase()}</Text> : null}
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
  more: {
    marginTop: 10,
  },
  shotsScroll: {
    marginTop: 12,
    marginHorizontal: -20,
  },
  shots: {
    gap: 8,
    paddingHorizontal: 20,
  },
  shot: {
    width: 46,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    opacity: 0.5,
  },
  shotDone: {
    opacity: 1,
    borderColor: alpha('#AFA2DE', 0.7),
  },
  shotImg: {
    width: '100%',
    height: '100%',
  },
  shotCheck: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secured,
    alignItems: 'center',
    justifyContent: 'center',
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
