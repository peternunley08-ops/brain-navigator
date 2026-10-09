import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { useLifeStore } from '../core/lifeStore';
import { sprung } from '../core/motion';
import { alpha, colors, fonts } from '../core/theme';
import { GROUPS, type Tool, toolFor } from '../core/tools';
import { Chip } from './ui/Chip';
import { Field } from './ui/Field';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { Pressy } from './ui/Pressy';
import { Sheet } from './ui/Sheet';

type Group = (typeof GROUPS)[number];

const useDrawer = create<{ open: boolean }>(() => ({ open: false }));

/** Slides the Drawer up over whatever page you're on. */
export const openDrawer = () => useDrawer.setState({ open: true });
const closeDrawer = () => useDrawer.setState({ open: false });

/** Follows a link; the Drawer is a sheet, not a page, so it opens in place. */
export function goTo(href: string) {
  if (href === '/drawer') openDrawer();
  else router.push(href as never);
}

// The Drawer: everything that isn't a tab, sorted into six compartments that
// all fit on one screen. Tap one and it slides open to show what's inside;
// typing searches every tool at once. It rises over the page you're on, so
// putting it away puts you back where you were.
export function DrawerSheet() {
  const open = useDrawer((s) => s.open);
  const opened = useLifeStore((s) => s.about.opened);
  const recentPaths = useLifeStore((s) => s.about.recent);
  const learnOff = useLifeStore((s) => s.about.learnOff);
  const seenNew = useLifeStore((s) => s.settings.seenNew);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [tray, setTray] = useState<Group | null>(null);
  const [moved, setMoved] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!open) return;
    setTray(null);
    setMoved(false);
    setQ('');
  }, [open]);

  const go = (path: string) => {
    closeDrawer();
    router.push(path as never);
  };
  const pick = (g: Group | null) => {
    setMoved(true);
    setTray(g);
  };
  const isNew = (t: Tool) => !!t.isNew && !(seenNew ?? []).includes(t.path);
  // The ones you open most come first, if the app is allowed to learn.
  const byUse = (tools: Tool[]) => (learnOff ? tools : [...tools].sort((a, b) => (opened[b.path] ?? 0) - (opened[a.path] ?? 0)));
  const recent = learnOff ? [] : recentPaths.map(toolFor).filter((t): t is Tool => !!t).slice(0, 5);
  const term = q.trim().toLowerCase();
  const found = term ? GROUPS.flatMap((g) => g.tools).filter((t) => t.title.toLowerCase().includes(term) || t.body.toLowerCase().includes(term)) : [];
  const help = toolFor('/help');

  const head = (
    <View style={styles.head}>
      {tray ? <IconButton icon="back" label="Back to the Drawer" size={36} onPress={() => pick(null)} /> : null}
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {tray ? tray.name : 'The Drawer'}
      </Text>
      <IconButton icon="settings" label="Settings" size={36} onPress={() => go('/settings')} />
    </View>
  );

  const row = (t: Tool) => (
    <Pressy
      key={t.path}
      style={styles.row}
      onPress={() => go(t.path)}
      accessibilityRole="button"
      accessibilityLabel={isNew(t) ? `${t.title}, new` : t.title}
      accessibilityHint={t.body}
    >
      <View style={[styles.rowIcon, { backgroundColor: alpha(t.color, 0.14), borderColor: alpha(t.color, 0.3) }]}>
        <Icon name={t.icon} size={20} color={t.color} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1} maxFontSizeMultiplier={2}>{t.title}</Text>
        <Text style={styles.rowBody} numberOfLines={1} maxFontSizeMultiplier={2}>{t.body}</Text>
      </View>
      {isNew(t) ? <View style={styles.dot} /> : null}
      <Icon name="chevron" size={16} color={colors.textFaint} />
    </Pressy>
  );

  const box = (g: Group) => {
    const tools = byUse(g.tools);
    const fresh = tools.some(isNew);
    return (
      <Pressy
        key={g.name}
        style={styles.box}
        onPress={() => pick(g)}
        accessibilityRole="button"
        accessibilityLabel={`${g.name}, ${g.tools.length} tools${fresh ? ', something new' : ''}`}
        accessibilityHint="Opens this part of the Drawer"
      >
        <View style={styles.minis}>
          {tools.slice(0, 4).map((t) => (
            <View key={t.path} style={[styles.mini, { backgroundColor: alpha(t.color, 0.14), borderColor: alpha(t.color, 0.3) }]}>
              <Icon name={t.icon} size={16} color={t.color} />
            </View>
          ))}
        </View>
        {fresh ? <View style={[styles.dot, styles.boxDot]} /> : null}
        <View>
          <View style={styles.boxName}>
            <Text style={styles.boxTitle} numberOfLines={2} maxFontSizeMultiplier={1.6}>{g.name}</Text>
          </View>
          <Text style={styles.boxCount} maxFontSizeMultiplier={1.6}>{g.tools.length} tools</Text>
        </View>
      </Pressy>
    );
  };

  // Help gets its own compartment, so it is never more than one tap away.
  const helpBox = help ? (
    <Pressy
      key="help"
      style={[styles.box, styles.helpBox]}
      onPress={() => go(help.path)}
      accessibilityRole="button"
      accessibilityLabel={help.title}
      accessibilityHint={help.body}
    >
      <View style={[styles.mini, { backgroundColor: alpha(help.color, 0.16), borderColor: alpha(help.color, 0.35) }]}>
        <Icon name={help.icon} size={16} color={help.color} />
      </View>
      <View>
        <View style={styles.boxName}>
          <Text style={styles.boxTitle} numberOfLines={2} maxFontSizeMultiplier={1.6}>{help.title}</Text>
        </View>
        <Text style={styles.boxCount} maxFontSizeMultiplier={1.6}>{help.body}</Text>
      </View>
    </Pressy>
  ) : null;

  const boxes = [...GROUPS.map(box), helpBox];
  const rows = [boxes.slice(0, 2), boxes.slice(2, 4), boxes.slice(4, 6)];

  let body;
  if (tray) {
    body = (
      <ScrollView style={styles.flex} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {byUse(tray.tools).map(row)}
      </ScrollView>
    );
  } else {
    body = (
      <View style={styles.flex}>
        <Field
          value={q}
          onChangeText={setQ}
          placeholder="Find a tool"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          containerStyle={styles.field}
        />
        {term ? (
          <ScrollView style={styles.flex} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Pressy onPress={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} style={styles.searchAll} accessibilityRole="button">
              <Icon name="search" size={16} color={colors.flame} />
              <Text style={styles.searchAllText}>Search your homework, notes and cards for “{q.trim()}”</Text>
            </Pressy>
            {found.length ? found.map(row) : <Text style={styles.none}>No tool by that name.</Text>}
          </ScrollView>
        ) : (
          <ScrollView style={styles.flex} contentContainerStyle={styles.gridWrap} showsVerticalScrollIndicator={false}>
            {recent.length >= 2 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentRow} contentContainerStyle={styles.recent}>
                {recent.map((t) => (
                  <Chip key={t.path} label={t.title} icon={t.icon} color={t.color} onPress={() => go(t.path)} />
                ))}
              </ScrollView>
            ) : null}
            {rows.map((r, i) => (
              <View key={i} style={styles.gridRow}>
                {r}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <Sheet open={open} onClose={closeDrawer} head={head} style={{ height: Math.min(height - insets.top - 8, 780) }}>
      <Animated.View key={tray?.name ?? 'grid'} style={styles.flex} entering={moved ? sprung(tray ? FadeInRight : FadeInLeft) : undefined}>
        {body}
      </Animated.View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.3,
    color: colors.text,
  },
  field: {
    marginBottom: 14,
  },
  gridWrap: {
    flexGrow: 1,
    gap: 12,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 150,
  },
  box: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    // Sunk a little into the sheet, like a compartment.
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  helpBox: {
    borderColor: alpha(colors.danger, 0.3),
    backgroundColor: alpha(colors.danger, 0.08),
  },
  minis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: 2 * 34 + 6,
  },
  mini: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDot: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  // Room for two lines, set from the bottom, so every name and count lines up
  // across the grid whether the name wraps or not.
  boxName: {
    minHeight: 40,
    justifyContent: 'flex-end',
  },
  boxTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  boxCount: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  recentRow: {
    flexGrow: 0,
  },
  recent: {
    gap: 8,
  },
  list: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingVertical: 8,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  rowBody: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.flame,
  },
  searchAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  searchAllText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.flame,
  },
  none: {
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
  },
});
