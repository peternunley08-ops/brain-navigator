import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { BottomNav } from '../components/BottomNav';
import { Bear } from '../components/ui/Bear';
import { Candle } from '../components/ui/Candle';
import { useFlameClock } from '../core/hooks/useFlameClock';
import { colors, fonts, spacing } from '../core/theme';

const ART = 76;

export default function SteadyScreen() {
  const time = useFlameClock();
  const reducedMotion = useReducedMotion();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Steady</Text>
        <Text style={styles.subtitle}>For when it's a lot, right now.</Text>

        <View style={styles.list}>
          <Door
            title="Breathe"
            body="Slow your breathing with a guided pattern. Box, 4-7-8, or even."
            onPress={() => router.push('/breathe')}
            art={
              <Candle
                width={ART / 1.42}
                time={time}
                intensity={0.55}
                remaining={0.8}
                seed={4.2}
                state="lit"
                reducedMotion={reducedMotion}
                igniteDelay={180}
              />
            }
          />
          <Door
            title="Let it out"
            body="Say it or type it, then let it go. Nothing here is graded."
            onPress={() => router.push('/vent')}
            art={
              <Svg width={ART} height={ART}>
                <Circle cx={ART / 2} cy={ART / 2} r={ART / 2 - 8} fill="none" stroke={colors.divider} strokeWidth={3} />
                <Circle
                  cx={ART / 2}
                  cy={ART / 2}
                  r={ART / 2 - 8}
                  fill="none"
                  stroke={colors.leather}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={[2 * Math.PI * (ART / 2 - 8) * 0.78, 999]}
                  rotation={-90}
                  origin={`${ART / 2}, ${ART / 2}`}
                />
              </Svg>
            }
          />
          <Door
            title="Talk it through with Ember"
            body="A few gentle questions, for when you don't know where to start."
            onPress={() => router.push('/companion')}
            art={<Bear size={ART - 10} />}
            last
          />
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function Door({
  title,
  body,
  art,
  onPress,
  last,
}: {
  title: string;
  body: string;
  art: ReactNode;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={body}
      style={({ pressed }) => [styles.door, !last && styles.doorRule, pressed && styles.pressed]}
    >
      <View style={styles.art}>{art}</View>
      <View style={styles.doorText}>
        <Text style={styles.doorTitle}>{title}</Text>
        <Text style={styles.doorBody}>{body}</Text>
      </View>
    </Pressable>
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
    paddingTop: 72,
    paddingBottom: 130,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.inkMuted,
  },
  list: {
    marginTop: spacing.xl,
  },
  door: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  doorRule: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  pressed: {
    opacity: 0.6,
  },
  art: {
    width: ART,
    height: ART,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  doorText: {
    flex: 1,
  },
  doorTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.ink,
  },
  doorBody: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
