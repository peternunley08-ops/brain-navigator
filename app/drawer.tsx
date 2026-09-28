import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { colors, fonts, spacing } from '../core/theme';

interface Tool {
  title: string;
  body: string;
  path: string;
}

// Everything that supports the core loop rather than being it. Nothing was
// removed in the redesign; it lives here instead of in the main navigation.
const GROUPS: { name: string; tools: Tool[] }[] = [
  {
    name: 'Your body',
    tools: [
      { title: 'Check-in', body: "Today's mood, sleep, and stress.", path: '/checkin' },
      { title: 'Health', body: 'Steps, resting heart rate, and sleep from Apple Health.', path: '/health' },
      { title: 'Trends', body: 'How your check-ins have moved over the last two weeks.', path: '/trends' },
    ],
  },
  {
    name: 'Your days',
    tools: [
      { title: 'Tasks', body: 'What is on your plate today, with time boxes.', path: '/tasks' },
      { title: 'Habits', body: 'Daily and weekly habits, with streaks.', path: '/habits' },
      { title: 'Nutrition', body: 'Meals and macros for today.', path: '/nutrition' },
      { title: 'Calendar', body: "Today's events from Google Calendar.", path: '/calendar' },
    ],
  },
  {
    name: 'Looking back',
    tools: [
      { title: 'Kept', body: 'Entries you chose to keep.', path: '/trove' },
      { title: 'Wellness wheel', body: 'Balance across eight areas of life.', path: '/wellness' },
      { title: 'The science', body: 'What is behind the numbers you log.', path: '/science' },
    ],
  },
];

export default function DrawerScreen() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />
        <Text style={styles.title}>Drawer</Text>
        <Text style={styles.subtitle}>Everything else the app can do.</Text>

        {GROUPS.map((group) => (
          <View key={group.name} style={styles.group}>
            <Text style={styles.groupName}>{group.name}</Text>
            {group.tools.map((tool, i) => (
              <Pressable
                key={tool.path}
                onPress={() => router.push(tool.path as never)}
                accessibilityRole="button"
                accessibilityLabel={tool.title}
                accessibilityHint={tool.body}
                style={({ pressed }) => [
                  styles.row,
                  i < group.tools.length - 1 && styles.rowRule,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.rowTitle}>{tool.title}</Text>
                <Text style={styles.rowBody}>{tool.body}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 130,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
  },
  group: {
    marginTop: spacing.xl,
  },
  groupName: {
    marginBottom: spacing.xs,
    fontFamily: fonts.displaySoft,
    fontSize: 19,
    color: colors.inkMuted,
  },
  row: {
    paddingVertical: spacing.md,
  },
  rowRule: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  pressed: {
    opacity: 0.55,
  },
  rowTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  rowBody: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.inkFaint,
  },
});
