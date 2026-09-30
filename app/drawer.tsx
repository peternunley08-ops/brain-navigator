import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { alpha, colors, fonts } from '../core/theme';

interface Tool {
  title: string;
  body: string;
  path: string;
  icon: IconName;
  color: string;
}

// Everything that supports the core loop rather than being it. Nothing was
// removed in the redesign; it lives here instead of in the main navigation.
const GROUPS: { name: string; tools: Tool[] }[] = [
  {
    name: 'Your body',
    tools: [
      { title: 'Check-in', body: 'Mood, sleep, stress', path: '/checkin', icon: 'sun', color: '#F5B45C' },
      { title: 'Health', body: 'From Apple Health', path: '/health', icon: 'heart', color: '#F08A8A' },
      { title: 'Trends', body: 'The last two weeks', path: '/trends', icon: 'trend', color: '#8FB4E8' },
      { title: 'Food', body: 'Meals and macros', path: '/nutrition', icon: 'bowl', color: '#9FD08A' },
    ],
  },
  {
    name: 'Your days',
    tools: [
      { title: 'Your plate', body: 'Today’s tasks', path: '/tasks', icon: 'plate', color: '#E6C46A' },
      { title: 'Habits', body: 'Streaks you keep', path: '/habits', icon: 'repeat', color: '#8CC0A8' },
      { title: 'Calendar', body: 'Today’s schedule', path: '/calendar', icon: 'calendar', color: '#D99A6C' },
      { title: 'Kept', body: 'Entries you saved', path: '/trove', icon: 'jar', color: '#E89AB8' },
    ],
  },
  {
    name: 'Looking closer',
    tools: [
      { title: 'Wellness wheel', body: 'Eight parts of a life', path: '/wellness', icon: 'wheel', color: '#AFA2DE' },
      { title: 'The science', body: 'Why the numbers move', path: '/science', icon: 'flask', color: '#8FB4E8' },
    ],
  },
];

export default function DrawerScreen() {
  let n = 0;
  return (
    <Screen title="The Drawer" subtitle="Everything else the app can do.">
      {GROUPS.map((group) => (
        <View key={group.name} style={styles.group}>
          <Reveal index={n++}>
            <Text style={styles.groupName}>{group.name}</Text>
          </Reveal>
          <View style={styles.grid}>
            {group.tools.map((tool) => (
              <Reveal key={tool.path} index={n++} style={styles.cell}>
                <Card
                  onPress={() => router.push(tool.path as never)}
                  accessibilityLabel={tool.title}
                  accessibilityHint={tool.body}
                  style={styles.tile}
                >
                  <View style={[styles.icon, { backgroundColor: alpha(tool.color, 0.14), borderColor: alpha(tool.color, 0.3) }]}>
                    <Icon name={tool.icon} size={22} color={tool.color} />
                  </View>
                  <Text style={styles.title}>{tool.title}</Text>
                  <Text style={styles.body}>{tool.body}</Text>
                </Card>
              </Reveal>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: 24,
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
