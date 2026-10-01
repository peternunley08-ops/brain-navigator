import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
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
    name: 'School',
    tools: [
      { title: 'Your day', body: 'A timeline of today', path: '/today', icon: 'clock', color: '#F5B45C' },
      { title: 'Your week', body: 'Timetable and workload', path: '/week', icon: 'calendar', color: '#8FB4E8' },
      { title: 'Your schedule', body: 'Classes and activities', path: '/classes', icon: 'book', color: '#8FB4E8' },
      { title: 'Grades', body: 'Averages, GPA, the final', path: '/grades', icon: 'grade', color: '#9FD08A' },
      { title: 'Sort out what’s late', body: 'One decision each', path: '/triage', icon: 'flag', color: '#F0845A' },
      { title: 'I was out', body: 'Catch up after an absence', path: '/absent', icon: 'message', color: '#D99A6C' },
      { title: 'Connections', body: 'Canvas, Classroom, more', path: '/connections', icon: 'sparkle', color: '#AFA2DE' },
      { title: 'Scan a screenshot', body: 'Import from Classroom', path: '/scan', icon: 'image', color: '#D99A6C' },
    ],
  },
  {
    name: 'Study',
    tools: [
      { title: 'Helpers', body: 'Ember’s crew, on call', path: '/helpers', icon: 'people', color: '#B79AF0' },
      { title: 'Flashcards', body: 'Spaced repetition decks', path: '/flashcards', icon: 'cards', color: '#E89AB8' },
      { title: 'How to study', body: 'Methods that work', path: '/techniques', icon: 'flask', color: '#AFA2DE' },
      { title: 'Notebook', body: 'Notes and study guides', path: '/notes', icon: 'pen', color: '#E6C46A' },
      { title: 'Search', body: 'Find anything', path: '/search', icon: 'search', color: '#8FB4E8' },
    ],
  },
  {
    name: 'College',
    tools: [
      { title: 'Applications', body: 'Deadlines and checklists', path: '/college', icon: 'cap', color: '#8FB4E8' },
      { title: 'Activities list', body: 'Common App, with limits', path: '/activities', icon: 'list', color: '#8FB4E8' },
      { title: 'Scholarships', body: 'Money for school', path: '/scholarships', icon: 'gift', color: '#E6C46A' },
      { title: 'Rec letters', body: 'Ask, track, thank', path: '/recs', icon: 'message', color: '#E89AB8' },
      { title: 'Financial aid', body: 'FAFSA step by step', path: '/aid', icon: 'check', color: '#9FD08A' },
    ],
  },
  {
    name: 'Feeling okay',
    tools: [
      { title: 'Check-in', body: 'Mood, sleep, stress', path: '/checkin', icon: 'sun', color: '#F5B45C' },
      { title: 'Mood map', body: 'A month at a glance', path: '/moods', icon: 'heart', color: '#F08A8A' },
      { title: 'Sleep', body: 'Tonight’s plan', path: '/sleep', icon: 'bed', color: '#8FB4E8' },
      { title: 'Toolkit', body: 'For hard moments', path: '/toolkit', icon: 'sparkle', color: '#AFA2DE' },
      { title: 'Worry box', body: 'Put it down for later', path: '/worry', icon: 'feather', color: '#AFA2DE' },
      { title: 'Your people', body: 'Text someone you trust', path: '/people', icon: 'people', color: '#E89AB8' },
      { title: 'Wins', body: 'The jar and good things', path: '/wins', icon: 'jar', color: '#E6C46A' },
      { title: 'Weekly review', body: 'Five minutes on Sunday', path: '/review', icon: 'star', color: '#F5B45C' },
    ],
  },
  {
    name: 'Your days',
    tools: [
      { title: 'To-dos', body: 'Everything not school', path: '/tasks', icon: 'plate', color: '#E6C46A' },
      { title: 'Habits', body: 'Streaks you keep', path: '/habits', icon: 'repeat', color: '#8CC0A8' },
      { title: 'Countdowns', body: 'Things to look forward to', path: '/countdowns', icon: 'gift', color: '#E89AB8' },
      { title: 'Hours', body: 'Service, driving, work', path: '/hours', icon: 'hands', color: '#9FD08A' },
      { title: 'Calendar', body: 'Today’s schedule', path: '/calendar', icon: 'calendar', color: '#D99A6C' },
      { title: 'Kept', body: 'Entries you saved', path: '/trove', icon: 'jar', color: '#E89AB8' },
    ],
  },
  {
    name: 'Your body',
    tools: [
      { title: 'Health', body: 'From Apple Health', path: '/health', icon: 'heart', color: '#F08A8A' },
      { title: 'Trends', body: 'The last two weeks', path: '/trends', icon: 'trend', color: '#8FB4E8' },
      { title: 'Food', body: 'Meals and macros', path: '/nutrition', icon: 'bowl', color: '#9FD08A' },
    ],
  },
  {
    name: 'Looking closer',
    tools: [
      { title: 'Loops', body: 'Everything still open', path: '/open-loops', icon: 'loops', color: '#F0845A' },
      { title: 'The Map', body: 'What keeps coming up', path: '/topography', icon: 'map', color: '#AFA2DE' },
      { title: 'Wellness wheel', body: 'Eight parts of a life', path: '/wellness', icon: 'wheel', color: '#AFA2DE' },
      { title: 'The science', body: 'Why the numbers move', path: '/science', icon: 'flask', color: '#8FB4E8' },
    ],
  },
  {
    name: 'You',
    tools: [
      { title: 'Badges', body: 'Quiet ones, never lost', path: '/achievements', icon: 'trophy', color: '#F5B45C' },
      { title: 'Your year', body: 'Everything, added up', path: '/year', icon: 'star', color: '#F5B45C' },
      { title: 'Plus', body: 'More AI for the crew', path: '/plus', icon: 'sparkle', color: '#F5B45C' },
      { title: 'Settings', body: 'You, Ember, your data', path: '/settings', icon: 'settings', color: '#C3B3A0' },
      { title: 'Need help now', body: 'Real people, any time', path: '/help', icon: 'phone', color: '#F07060' },
    ],
  },
];

export default function DrawerScreen() {
  let n = 0;
  return (
    <Screen
      title="The Drawer"
      subtitle="Everything else the app can do."
      right={<IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />}
    >
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
