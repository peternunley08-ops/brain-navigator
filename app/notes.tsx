import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

  const sorted = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));

  const start = (key: string) => {
    const t = NOTE_TEMPLATES.find((x) => x.key === key)!;
    const note = createNote({ title: key === 'blank' ? '' : t.title, icon: t.icon, color: t.color, blocks: t.blocks() });
    router.push(`/note/${note.id}`);
  };

  return (
    <Screen title="Notebook" subtitle="Notes, study guides, plans — your own pages.">
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

      <Reveal index={1}>
        <Section title="Pages" note={notes.length ? `${notes.length} page${notes.length === 1 ? '' : 's'}` : undefined}>
          {sorted.length === 0 ? (
            <EmptyState title="A blank notebook." body="Start with a template above — class notes and study guides come with the headings already in." />
          ) : (
            <View style={styles.list}>
              {sorted.map((n, i) => (
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
  return (
    <Animated.View entering={FadeInDown.delay(i * 40).duration(320)}>
      <Card onPress={() => router.push(`/note/${n.id}`)} style={styles.card}>
        <View style={[styles.icon, { backgroundColor: alpha(n.color, 0.16), borderColor: alpha(n.color, 0.3) }]}>
          <Icon name={n.icon as IconName} size={20} color={n.color} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {n.title || 'Untitled'}
            </Text>
            {n.pinned ? <Icon name="flag" size={13} color={colors.flame} /> : null}
          </View>
          {preview ? (
            <Text style={styles.preview} numberOfLines={1}>
              {preview}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {className ? `${className}, ` : ''}
            {todos.length ? `${done}/${todos.length} checked, ` : ''}
            {ago(n.updatedAt)}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
