import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon, type IconName } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { useHubStore } from '../core/hubStore';
import { useLifeStore, isSealed } from '../core/lifeStore';
import { dueLabel, dueWords, KIND_LABEL, useSchoolStore } from '../core/schoolStore';
import { plural } from '../core/words';
import { colors, fonts } from '../core/theme';

const NONE: string[] = [];

interface Hit {
  key: string;
  title: string;
  sub: string;
  icon: IconName;
  color: string;
  href: string;
}

// One box that finds anything: homework, classes, notes, flashcards,
// colleges, wins.
export default function SearchScreen() {
  // The Drawer's "Find anything" can open this with what was typed.
  const { q: initial } = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(typeof initial === 'string' ? initial : '');
  const [open, setOpen] = useState<string[]>([]);
  // Select the stored array itself; a fallback inside the selector would be a new array every render.
  const recent = useLifeStore((s) => s.settings.recentSearches) ?? NONE;
  // Remember what found something, so it's one tap next time.
  const remember = () => {
    const t = q.trim();
    if (t.length < 2) return;
    useLifeStore.getState().setSettings({ recentSearches: [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6) });
  };
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const notes = useHubStore((s) => s.notes);
  const colleges = useHubStore((s) => s.colleges);
  const decks = useLifeStore((s) => s.decks);
  const wins = useLifeStore((s) => s.wins);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (...xs: (string | undefined | null)[]) => xs.some((x) => x?.toLowerCase().includes(term));
    const className = (id: string | null) => classes.find((c) => c.id === id)?.name;
    const out: { title: string; hits: Hit[] }[] = [
      {
        title: 'Schoolwork',
        hits: assignments
          .filter((a) => has(a.title, a.notes, className(a.classId), ...(a.subtasks ?? []).map((t) => t.text)))
          .sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due))
          .map((a) => ({
            key: a.id,
            title: a.title,
            sub: `${KIND_LABEL[a.kind]}${className(a.classId) ? `, ${className(a.classId)}` : ''}, ${a.done ? 'done' : `due ${dueWords(a.due)}`}`,
            icon: a.done ? 'check' : 'book',
            color: classes.find((c) => c.id === a.classId)?.color ?? colors.flame,
            href: `/assignment/${a.id}`,
          })),
      },
      {
        title: 'Classes',
        hits: classes
          .filter((c) => has(c.name, c.teacher, c.room))
          .map((c) => ({ key: c.id, title: c.name, sub: [c.teacher, c.room && `Room ${c.room}`].filter(Boolean).join(', ') || 'Class', icon: 'book', color: c.color, href: `/class/${c.id}` })),
      },
      {
        title: 'Notes',
        hits: notes
          .filter((n) => has(n.title, ...n.blocks.map((b) => b.text)))
          .map((n) => {
            const match = n.blocks.find((b) => b.text.toLowerCase().includes(term))?.text;
            return { key: n.id, title: n.title || 'Untitled', sub: match ? `…${match.slice(0, 60)}` : 'Note', icon: 'pen', color: n.color, href: `/note/${n.id}` };
          }),
      },
      {
        title: 'Flashcards',
        hits: decks
          .filter((d) => has(d.name, ...d.cards.flatMap((c) => [c.front, c.back])))
          .map((d) => ({ key: d.id, title: d.name, sub: plural(d.cards.length, 'card'), icon: 'cards', color: d.color, href: `/deck/${d.id}` })),
      },
      {
        title: 'Colleges',
        hits: colleges
          .filter((c) => has(c.name, c.notes, c.visitNotes))
          .map((c) => ({ key: c.id, title: c.name, sub: `${c.plan}${c.deadline ? `, ${dueLabel(c.deadline)}` : ''}`, icon: 'cap', color: '#8FB4E8', href: '/college' })),
      },
      {
        title: 'Wins',
        hits: wins
          .filter((w) => !isSealed(w))
          .filter((w) => has(w.text))
          .map((w) => ({ key: w.id, title: w.text, sub: new Date(w.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), icon: 'jar', color: '#E6C46A', href: '/wins' })),
      },
    ];
    return out.filter((g) => g.hits.length);
  }, [q, classes, assignments, notes, colleges, decks, wins]);

  const total = groups.reduce((s, g) => s + g.hits.length, 0);

  return (
    <Screen title="Search">
      <Reveal index={0}>
        <Field autoFocus value={q} onChangeText={setQ} placeholder="Homework, notes, classes, cards…" returnKeyType="search" onSubmitEditing={remember} clearButtonMode="while-editing" autoCapitalize="none" autoCorrect={false} containerStyle={styles.field} />
      </Reveal>
      {q.trim().length < 2 && recent.length ? (
        <Reveal index={1}>
          <Section title="Recent" action={{ label: 'Clear', onPress: () => useLifeStore.getState().setSettings({ recentSearches: [] }) }}>
            <ChipRow>
              {recent.map((r) => (
                <Chip key={r} label={r} icon="search" onPress={() => setQ(r)} />
              ))}
            </ChipRow>
          </Section>
        </Reveal>
      ) : null}
      {q.trim().length >= 2 && total === 0 ? <EmptyState title="Nothing matches." body="Try a shorter word, or a class name." /> : null}
      {groups.map((g, gi) => (
        <Reveal key={g.title} index={gi + 1}>
          <Section title={g.title} note={`${g.hits.length}`}>
            <View style={styles.list}>
              {g.hits.slice(0, open.includes(g.title) ? g.hits.length : 12).map((h, i) => (
                // Results slide in as you type, and the list reshapes smoothly.
                <Animated.View key={h.key} entering={FadeInDown.delay(Math.min(i, 6) * 25).duration(200)} exiting={FadeOut.duration(120)} layout={LinearTransition.duration(200)}>
                  <Card
                    onPress={() => {
                      remember();
                      router.push(h.href as never);
                    }}
                    style={styles.row}
                  >
                    <Icon name={h.icon} size={18} color={h.color} />
                    <View style={styles.flex}>
                      <Text style={styles.title} numberOfLines={1}>
                        {h.title}
                      </Text>
                      <Text style={styles.sub} numberOfLines={1}>
                        {h.sub}
                      </Text>
                    </View>
                    <Icon name="chevron" size={16} color={colors.textFaint} />
                  </Card>
                </Animated.View>
              ))}
              {g.hits.length > 12 && !open.includes(g.title) ? (
                <Button label={`Show all ${g.hits.length}`} variant="ghost" size="sm" onPress={() => setOpen((o) => [...o, g.title])} />
              ) : null}
            </View>
          </Section>
        </Reveal>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 14,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  sub: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
