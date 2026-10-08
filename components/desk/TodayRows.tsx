import { router } from 'expo-router';
import type { ReactNode, RefObject } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { tonightLine } from '../../core/litCard';
import { tonightsLoad, useSchoolStore } from '../../core/schoolStore';
import { colors, fonts } from '../../core/theme';
import { useWellnessStore } from '../../core/wellnessStore';
import { plural } from '../../core/words';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { MoodPicker } from '../ui/MoodPicker';
import { Pressy } from '../ui/Pressy';
import { Section } from '../ui/Section';

const MOOD_WORDS = ['Rough', 'Low', 'Okay', 'Good', 'Great'];
const DOTS = 5;

// Today, in three short rows: tonight's homework against the cap, what's on
// your mind, and how you're doing. Each opens its full page.
export function TodayRows({
  open,
  show,
  onMood,
  candleRow,
}: {
  /** Candles on the desk (open loops). */
  open: number;
  show: (key: string) => boolean;
  onMood: (v: number) => void;
  /** Where sparks earned elsewhere land. */
  candleRow: RefObject<View | null>;
}) {
  const assignments = useSchoolStore((s) => s.assignments);
  const cap = useSchoolStore((s) => s.profile.nightlyCap);
  const checkin = useWellnessStore((s) => s.todaysCheckin());
  const load = tonightsLoad(assignments);
  const over = load.minutes > cap;
  const rows = [show('due'), show('mind'), show('checkin')];
  // At the largest text sizes a value beside its label breaks words in half; stack them.
  const stack = useWindowDimensions().fontScale > 1.5;
  const value = [styles.value, stack && styles.valueStack];
  if (!rows.some(Boolean)) return null;

  return (
    <Section title="Today">
      <Card padded={false}>
        {show('due') ? (
          <Row label="Tonight" onPress={() => router.push(load.items.length ? '/school' : '/add-assignment')} hint={load.items.length ? 'Opens School' : 'Adds homework'} stack={stack}>
            <Text style={[value, over && { color: colors.unlocked }]} maxFontSizeMultiplier={2}>{tonightLine(load.minutes, cap, load.items.length)}</Text>
          </Row>
        ) : null}
        {show('mind') ? (
          <Row label="On your mind" onPress={() => router.push(open ? '/open-loops' : '/new-entry')} hint={open ? 'Opens everything on your mind' : 'Sets something down'} line={show('due')} stack={stack}>
            <View ref={candleRow} style={styles.dots}>
              {Array.from({ length: Math.min(open, DOTS) }, (_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
            <Text style={value} maxFontSizeMultiplier={2}>{open ? plural(open, 'candle') : 'Nothing open'}</Text>
          </Row>
        ) : null}
        {show('checkin') ? (
          checkin?.mood != null ? (
            <Row label="How you’re doing" onPress={() => router.push('/checkin')} hint="Opens today’s check-in" line={show('due') || show('mind')} stack={stack}>
              <Text style={value} maxFontSizeMultiplier={2}>
                {[MOOD_WORDS[checkin.mood - 1], checkin.sleep_hours != null ? `${plural(checkin.sleep_hours, 'hour')} of sleep` : null].filter(Boolean).join(', ')}
              </Text>
            </Row>
          ) : (
            <View style={[styles.mood, (show('due') || show('mind')) && styles.line]}>
              <Text style={styles.label} maxFontSizeMultiplier={2}>How you’re doing</Text>
              <Text style={styles.hint} maxFontSizeMultiplier={2}>Tap a face. Hold one for the full check-in.</Text>
              <View style={styles.picker}>
                <MoodPicker value={null} onChange={onMood} onLongPress={() => router.push('/checkin')} />
              </View>
            </View>
          )
        ) : null}
      </Card>
    </Section>
  );
}

function Row({ label, onPress, hint, line, stack, children }: { label: string; onPress: () => void; hint: string; line?: boolean; stack?: boolean; children: ReactNode }) {
  return (
    <Pressy onPress={onPress} style={[styles.row, stack && styles.rowStack, line && styles.line]} depth={0.98} accessibilityRole="button" accessibilityHint={hint}>
      <Text style={styles.label} maxFontSizeMultiplier={2}>{label}</Text>
      <View style={[styles.right, stack && styles.rightStack]}>{children}</View>
      {stack ? null : <Icon name="chevron" size={16} color={colors.textFaint} />}
    </Pressy>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  line: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  value: {
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'right',
  },
  rowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 4,
  },
  rightStack: {
    flex: 0,
    justifyContent: 'flex-start',
  },
  valueStack: {
    textAlign: 'left',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.flame,
    shadowColor: colors.flame,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  mood: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  hint: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  picker: {
    marginTop: 10,
  },
});

