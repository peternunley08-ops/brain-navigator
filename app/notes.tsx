import { Link, useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { plural } from '../core/words';
import { useEffect, useState } from 'react';
import { InteractionManager, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from '../components/ui/Chip';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Field } from '../components/ui/Field';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon, type IconName } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { NOTE_TEMPLATES, type Note, useHubStore } from '../core/hubStore';
import { useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts, radii } from '../core/theme';
import { essayWords, wordGoalFor } from '../core/words';

function ago(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export default function NotesScreen() {
  const notes = useHubStore((s) => s.notes);
  const createNote = useHubStore((s) => s.createNote);
  const classes = useSchoolStore((s) => s.classes);
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const [q, setQ] = useState('');
  const [cls, setCls] = useState<string | null>(classId ?? null);
  const [fromHelpers, setFromHelpers] = useState(false);
  // Replies saved from a helper chat are kept as notes with the sparkle icon.
  const helperNotes = notes.filter((n) => n.icon === 'sparkle').length;
  const withNotes = classes.filter((c) => notes.some((n) => n.classId === c.id));

  const term = q.trim().toLowerCase();
  const sorted = [...notes]
    .filter((n) => !cls || n.classId === cls)
    .filter((n) => !fromHelpers || n.icon === 'sparkle')
    .filter((n) => !term || n.title.toLowerCase().includes(term) || n.blocks.some((b) => b.text.toLowerCase().includes(term)))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));

  // Long notebooks paint the first screenful at once and the rest once the
  // page has settled, so opening it stays quick.
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setShowAll(true));
    return () => task.cancel();
  }, []);
  const visible = showAll ? sorted : sorted.slice(0, 30);

  const start = (key: string) => {
    const t = NOTE_TEMPLATES.find((x) => x.key === key)!;
    const note = createNote({ title: key === 'blank' ? '' : t.title, icon: t.icon, color: t.color, blocks: t.blocks(), classId: cls });
    router.push(`/note/${note.id}`);
  };

  return (
    <Screen title="Notebook" subtitle="Notes, study guides, and plans. Your own pages.">
      <Reveal index={0}>
        <Section title="New page">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templates}>
            {NOTE_TEMPLATES.map((t) => (
              <Pressy key={t.key} onPress={() => start(t.key)} style={[styles.template, { borderColor: alpha(t.color, 0.35) }]} accessibilityRole="button" accessibilityLabel={`New ${t.title}`}>
                <View style={[styles.tIcon, { backgroundColor: alpha(t.color, 0.16) }]}>
                  <Icon name={t.icon as IconName} size={20} color={t.color} />
                </View>
                <Text style={styles.tTitle}>{t.title}</Text>
              </Pressy>
            ))}
          </ScrollView>
        </Section>
      </Reveal>

      {notes.length > 3 || withNotes.length || helperNotes ? (
        <Reveal index={1}>
          <Field value={q} onChangeText={setQ} placeholder="Search your notes" returnKeyType="search" autoCapitalize="none" clearButtonMode="while-editing" containerStyle={styles.search} />
          {withNotes.length || helperNotes ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterScroll}>
              <Chip
                label="All"
                selected={!cls && !fromHelpers}
                onPress={() => {
                  setCls(null);
                  setFromHelpers(false);
                }}
              />
              {helperNotes ? <Chip label="From helpers" icon="sparkle" selected={fromHelpers} onPress={() => setFromHelpers((v) => !v)} /> : null}
              {withNotes.map((c) => (
                <Chip key={c.id} label={c.name} dot color={c.color} selected={cls === c.id} onPress={() => setCls(cls === c.id ? null : c.id)} />
              ))}
            </ScrollView>
          ) : null}
        </Reveal>
      ) : null}

      <Reveal index={1}>
        <Section title="Pages" note={notes.length ? `${sorted.length === notes.length ? '' : `${sorted.length} of `}${plural(notes.length, 'page')}` : undefined}>
          {sorted.length === 0 ? (
            notes.length ? (
              <EmptyState title="Nothing matches." body="Try another word or class." />
            ) : (
              <EmptyState gear="glasses" title="A blank notebook." body="Start with a template above. Class notes and study guides come with the headings already in." />
            )
          ) : (
            <View style={styles.list}>
              {visible.map((n, i) => (
                <NoteCard key={n.id} n={n} i={i} className={classes.find((c) => c.id === n.classId)?.name} />
              ))}
            </View>
          )}
        </Section>
      </Reveal>
    </Screen>
  );
}

function NoteCard({ n, i, className }: { n: Note; i: number; className?: string }) {
  const preview = n.blocks.find((b) => b.type !== 'heading' && b.text.trim())?.text ?? n.blocks.find((b) => b.text.trim())?.text ?? '';
  const todos = n.blocks.filter((b) => b.type === 'todo' && b.text.trim());
  const done = todos.filter((b) => b.checked).length;
  const goal = wordGoalFor(n);
  const words = goal ? essayWords(n.blocks) : 0;
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(i, 8) * 40).duration(320)}>
      <Link href={`/note/${n.id}`} asChild>
        <Link.AppleZoom>
          <Card style={styles.card}>
        <View style={[styles.icon, { backgroundColor: alpha(n.color, 0.16), borderColor: alpha(n.color, 0.3) }]}>
          <Icon name={n.icon as IconName} size={20} color={n.color} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {n.title || 'Untitled'}
            </Text>
            {n.pinned ? <Icon name="pin" size={13} color={colors.flame} /> : null}
          </View>
          {preview ? (
            <Text style={styles.preview} numberOfLines={1}>
              {preview}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {className ? `${className}, ` : ''}
            {todos.length ? `${done}/${todos.length} checked, ` : ''}
            {goal ? `${words} of ${goal} words, ` : ''}
            {ago(n.updatedAt)}
          </Text>
          {goal ? <ProgressBar value={Math.min(1, words / goal)} color={words > goal ? colors.danger : n.color} height={3} style={styles.wordBar} /> : null}
        </View>
          </Card>
        </Link.AppleZoom>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wordBar: {
    marginTop: 6,
  },
  search: {
    marginTop: 20,
  },
  filterScroll: {
    marginTop: 10,
    marginHorizontal: -20,
  },
  filters: {
    gap: 8,
    paddingHorizontal: 20,
  },
  templates: {
    gap: 10,
    paddingRight: 8,
  },
  template: {
    width: 118,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    gap: 12,
  },
  tIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  preview: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  meta: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
