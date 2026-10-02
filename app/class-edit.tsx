import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { TimeField } from '../components/ui/TimeField';
import { goBack } from '../core/chrome';
import { type ClassLevel, CLASS_COLORS, clock, useSchoolStore } from '../core/schoolStore';
import { offerUndo } from '../core/undoStore';
import { colors, fonts } from '../core/theme';

const DAYS = [
  { n: 1, label: 'Mon' },
  { n: 2, label: 'Tue' },
  { n: 3, label: 'Wed' },
  { n: 4, label: 'Thu' },
  { n: 5, label: 'Fri' },
  { n: 6, label: 'Sat' },
  { n: 7, label: 'Sun' },
];

export default function ClassEditScreen() {
  const { id, kind: kindParam } = useLocalSearchParams<{ id?: string; kind?: string }>();
  const classes = useSchoolStore((s) => s.classes);
  const saveClass = useSchoolStore((s) => s.saveClass);
  const deleteClass = useSchoolStore((s) => s.deleteClass);
  const existing = classes.find((c) => c.id === id);

  // A new class starts right after the last one ends, in the next unused color.
  const defaults = useMemo(() => {
    const lastEnd = classes.filter((c) => c.kind === 'class').reduce((max, c) => Math.max(max, c.end), 0);
    const start = lastEnd ? lastEnd + 5 : 8 * 60;
    const used = new Set(classes.map((c) => c.color));
    const color = CLASS_COLORS.find((c) => !used.has(c)) ?? CLASS_COLORS[classes.length % CLASS_COLORS.length];
    return { start, end: start + 50, color };
  }, [classes]);

  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<'class' | 'activity'>(existing?.kind ?? (kindParam === 'activity' ? 'activity' : 'class'));
  const [color, setColor] = useState(existing?.color ?? defaults.color);
  const [teacher, setTeacher] = useState(existing?.teacher ?? '');
  const [room, setRoom] = useState(existing?.room ?? '');
  const [level, setLevel] = useState<ClassLevel | null>(existing?.level ?? null);
  // "AP Chemistry" is AP unless you say otherwise.
  const guessed: ClassLevel = /\bAP\b|\bIB\b/.test(name) ? 'ap' : /honou?rs|\bH\b/i.test(name) ? 'honors' : 'regular';
  const effectiveLevel = level ?? guessed;
  // A class imported from a screenshot has no schedule yet.
  const scheduled = !!existing && existing.days.length > 0;
  const [days, setDays] = useState<number[]>(scheduled ? existing!.days : [1, 2, 3, 4, 5]);
  const [start, setStart] = useState(scheduled ? existing!.start : defaults.start);
  const [end, setEnd] = useState(scheduled ? existing!.end : defaults.end);

  const toggleDay = (n: number) => setDays((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n].sort()));

  const valid = name.trim().length > 0 && days.length > 0 && end > start;

  const save = () => {
    if (!valid) return;
    saveClass({
      id: existing?.id,
      name: name.trim(),
      kind,
      color,
      teacher: teacher.trim(),
      room: room.trim(),
      days,
      start,
      end,
      ...(kind === 'class' ? { level: effectiveLevel } : {}),
    });
    goBack();
    if (!existing) emberSay(`${name.trim()} is on your schedule. I’ll tell you when it’s next.`, 'happy');
  };

  return (
    <Screen
      sheet
      nav={false}
      backIcon="close"
      title={existing ? 'Edit class' : kind === 'activity' ? 'Add an activity' : 'Add a class'}
      subtitle={kind === 'activity' ? 'Practice, club, job, lessons — anything on your weekly schedule.' : 'So Ember knows what’s next, and homework can belong to it.'}
    >
      <Reveal index={0}>
        <ChipRow style={styles.block}>
          <Chip label="Class" icon="book" selected={kind === 'class'} onPress={() => setKind('class')} />
          <Chip label="Activity" icon="flag" selected={kind === 'activity'} onPress={() => setKind('activity')} />
        </ChipRow>
        <Field big containerStyle={styles.block} placeholder={kind === 'class' ? 'e.g. AP Chemistry' : 'e.g. Soccer practice'} value={name} onChangeText={setName} />
      </Reveal>

      <Reveal index={1}>
        <Section title="Color">
          <View style={styles.swatches}>
            {CLASS_COLORS.map((c) => (
              <Pressy
                key={c}
                onPress={() => setColor(c)}
                depth={0.85}
                style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]}
                accessibilityLabel={`Color ${c}`}
                accessibilityState={{ selected: color === c }}
              >
                {color === c ? <Icon name="check" size={18} color={colors.flameInk} strokeWidth={2.6} /> : null}
              </Pressy>
            ))}
          </View>
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title="When">
          <ChipRow>
            {DAYS.map((d) => (
              <Chip key={d.n} label={d.label} selected={days.includes(d.n)} color={color} onPress={() => toggleDay(d.n)} />
            ))}
          </ChipRow>
          <View style={styles.times}>
            <TimeField label="Starts" value={start} onChange={(v) => { setStart(v); if (end <= v) setEnd(v + 50); }} />
            <TimeField label="Ends" value={end} onChange={setEnd} />
          </View>
          {end <= start ? <Text style={styles.warn}>It has to end after it starts.</Text> : null}
        </Section>
      </Reveal>

      <Reveal index={3}>
        <Section title="Details" note="Optional.">
          <View style={styles.pair}>
            <Field containerStyle={styles.flex} label={kind === 'class' ? 'Teacher' : 'Coach or lead'} placeholder="Ms. Rivera" value={teacher} onChangeText={setTeacher} />
            <Field containerStyle={styles.room} label="Room" placeholder="214" value={room} onChangeText={setRoom} />
          </View>
          {kind === 'class' ? (
            <>
              <Text style={styles.levelLabel}>Level, for weighted GPA</Text>
              <ChipRow>
                <Chip label="Regular" selected={effectiveLevel === 'regular'} onPress={() => setLevel('regular')} />
                <Chip label="Honors" selected={effectiveLevel === 'honors'} onPress={() => setLevel('honors')} />
                <Chip label="AP / IB" selected={effectiveLevel === 'ap'} onPress={() => setLevel('ap')} />
              </ChipRow>
            </>
          ) : null}
        </Section>
      </Reveal>

      <Reveal index={4}>
        <Card tint={color} style={styles.preview}>
          <View style={[styles.previewBar, { backgroundColor: color }]} />
          <View style={styles.flex}>
            <Text style={styles.previewName}>{name.trim() || (kind === 'class' ? 'Your class' : 'Your activity')}</Text>
            <Text style={styles.previewMeta}>
              {clock(start)} – {clock(end)}
              {room.trim() ? `, room ${room.trim()}` : ''}
            </Text>
          </View>
        </Card>
        <Button label={existing ? 'Save changes' : 'Add to my schedule'} icon="check" onPress={save} disabled={!valid} style={styles.save} />
        {existing ? (
          <Button
            label="Remove from schedule"
            variant="ghost"
            size="sm"
            icon="trash"
            tint={colors.danger}
            onPress={() => {
              const { classes, assignments } = useSchoolStore.getState();
              deleteClass(existing.id);
              offerUndo(`Removed ${existing.name}`, () => useSchoolStore.getState().putBack({ classes, assignments }), 'trash');
              goBack();
            }}
            style={styles.remove}
          />
        ) : null}
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  block: {
    marginTop: 14,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchOn: {
    borderColor: colors.text,
  },
  times: {
    gap: 10,
    marginTop: 14,
  },
  warn: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
  },
  pair: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  room: {
    width: 100,
  },
  preview: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewBar: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 3,
  },
  previewName: {
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    color: colors.text,
  },
  previewMeta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  save: {
    marginTop: 16,
  },
  remove: {
    marginTop: 8,
    alignSelf: 'center',
  },
});

