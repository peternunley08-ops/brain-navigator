import { router } from 'expo-router';
import { useState } from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { alpha, colors, fonts } from '../core/theme';
import { useLifeStore } from '../core/lifeStore';
import { GROUPS, type Tool, toolFor, TOOLS } from '../core/tools';

// Tools shown per group before "All N".
const PER_GROUP = 4;

// A soft glow behind the icon in its own colour. Static.
function IconGlow({ color, id }: { color: string; id: string }) {
  const gid = `glow${id.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <Svg width={44} height={44} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.25} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={22} cy={22} r={22} fill={`url(#${gid})`} />
    </Svg>
  );
}

export default function DrawerScreen() {
  const opened = useLifeStore((s) => s.about.opened);
  const recentPaths = useLifeStore((s) => s.about.recent);
  const learnOff = useLifeStore((s) => s.about.learnOff);
  const seenNew = useLifeStore((s) => s.settings.seenNew);
  // Opening clears a "new" dot (OpenWatcher), wherever it's opened from.
  const open = (tool: Tool) => router.push(tool.path as never);
  // Learned from what you open, so it follows the About you switch, and
  // only shows once a tool has been opened a few times.
  const most = learnOff
    ? []
    : TOOLS.filter((t) => (opened[t.path] ?? 0) >= 3)
        .sort((a, b) => (opened[b.path] ?? 0) - (opened[a.path] ?? 0))
        .slice(0, 4);
  const recent = learnOff ? [] : recentPaths.map(toolFor).filter((t): t is Tool => !!t).slice(0, 5);
  // Each group opens on four tools (the ones you open most first, if learning
  // is on); "All N" shows the rest. Typing filters every tool at once.
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  // At the largest text sizes two tiles a row break words in half; stack them.
  const oneColumn = useWindowDimensions().fontScale > 1.5;
  const term = q.trim().toLowerCase();
  const found = term ? TOOLS.filter((t) => t.title.toLowerCase().includes(term) || t.body.toLowerCase().includes(term)) : [];
  const byUse = (tools: Tool[]) => (learnOff ? tools : [...tools].sort((a, b) => (opened[b.path] ?? 0) - (opened[a.path] ?? 0)));
  const groups = term
    ? [{ name: found.length ? 'Matches' : 'No tool matches', tools: found }]
    : most.length >= 2
      ? [{ name: 'Your most used', tools: most }, ...GROUPS.map((g) => ({ ...g, tools: byUse(g.tools) }))]
      : GROUPS.map((g) => ({ ...g, tools: byUse(g.tools) }));
  const help = toolFor('/help');

  let n = 0;
  return (
    <Screen
      title="The Drawer"
      subtitle="Everything else, one search away."
      right={<IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />}
    >
      <Field value={q} onChangeText={setQ} placeholder="Find anything" returnKeyType="search" autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" />
      {term ? (
        <Pressy onPress={() => router.push({ pathname: '/search', params: { q: q.trim() } })} style={styles.searchAll} accessibilityRole="button">
          <Icon name="search" size={16} color={colors.flame} />
          <Text style={styles.searchAllText}>Search your homework, notes and cards for “{q.trim()}”</Text>
        </Pressy>
      ) : null}
      {!term && recent.length >= 2 ? (
        <Reveal index={n++}>
          <Text style={styles.recentLabel}>Recently opened</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recent}>
            {recent.map((t) => (
              <Chip key={t.path} label={t.title} icon={t.icon} color={t.color} onPress={() => router.push(t.path as never)} />
            ))}
          </ScrollView>
        </Reveal>
      ) : null}
      {groups.map((group) => (
        <View key={group.name} style={styles.group}>
          <Reveal index={n++}>
            <Text style={styles.groupName}>{group.name}</Text>
          </Reveal>
          <View style={styles.grid}>
            {(term || group.name === 'Your most used' || expanded.includes(group.name) ? group.tools : group.tools.slice(0, PER_GROUP)).map((tool) => (
              <Reveal key={tool.path} index={n++} style={oneColumn ? styles.cellWide : styles.cell}>
                <Card
                  onPress={() => open(tool)}
                  accessibilityLabel={tool.isNew && !(seenNew ?? []).includes(tool.path) ? `${tool.title}, new` : tool.title}
                  accessibilityHint={tool.body}
                  style={styles.tile}
                >
                  <View style={[styles.icon, { backgroundColor: alpha(tool.color, 0.14), borderColor: alpha(tool.color, 0.3) }]}>
                    <IconGlow color={tool.color} id={tool.path} />
                    <Icon name={tool.icon} size={22} color={tool.color} />
                  </View>
                  {tool.isNew && !(seenNew ?? []).includes(tool.path) ? <View style={styles.dot} /> : null}
                  <Text style={styles.title} maxFontSizeMultiplier={2.6}>{tool.title}</Text>
                  <Text style={styles.body}>{tool.body}</Text>
                </Card>
              </Reveal>
            ))}
          </View>
          {!term && group.tools.length > PER_GROUP && group.name !== 'Your most used' ? (
            <Pressy
              onPress={() => setExpanded((e) => (e.includes(group.name) ? e.filter((x) => x !== group.name) : [...e, group.name]))}
              haptic="none"
              accessibilityRole="button"
              style={styles.all}
            >
              <Text style={styles.allText}>{expanded.includes(group.name) ? 'Show fewer' : `All ${group.tools.length}`}</Text>
            </Pressy>
          ) : null}
          {group.name === 'Your most used' ? <Text style={styles.why}>From what you open most. Turn this off in About you.</Text> : null}
        </View>
      ))}
      {help && !term ? (
        <Card onPress={() => open(help)} accessibilityLabel={help.title} accessibilityHint={help.body} style={styles.help}>
          <Icon name={help.icon} size={20} color={help.color} />
          <View style={styles.helpText}>
            <Text style={styles.title} maxFontSizeMultiplier={2.6}>{help.title}</Text>
            <Text style={styles.body}>{help.body}</Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 8,
  },
  searchAllText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.flame,
  },
  all: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
  },
  allText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.flame,
  },
  help: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  helpText: {
    flex: 1,
  },
  group: {
    marginTop: 24,
  },
  recentLabel: {
    marginTop: 8,
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textFaint,
  },
  recent: {
    gap: 8,
    paddingRight: 16,
  },
  why: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  groupName: {
    marginBottom: 12,
    fontFamily: fonts.displaySoft,
    fontSize: 19,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
  },
  cellWide: {
    width: '100%',
  },
  tile: {
    minHeight: 132,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.flame,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
});
