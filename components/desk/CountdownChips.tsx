import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { dateKey } from '../../core/dates';
import { daysUntil } from '../../core/dates';
import { useHubStore } from '../../core/hubStore';
import { useLifeStore } from '../../core/lifeStore';
import { useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts, radii, textGrow } from '../../core/theme';
import { Icon, type IconName } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

interface ChipData {
  key: string;
  days: number;
  label: string;
  icon: IconName;
  color: string;
  href: string;
  /** 0–1 of the wait already behind you, for countdowns you set. */
  progress?: number;
}

// A tiny ring that fills as the day gets closer.
function MiniRing({ value, color }: { value: number; color: string }) {
  const r = 6;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={16} height={16} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={8} cy={8} r={r} stroke={color} strokeOpacity={0.25} strokeWidth={2.5} fill="none" />
      <Circle cx={8} cy={8} r={r} stroke={color} strokeWidth={2.5} fill="none" strokeDasharray={`${c * Math.max(0.04, value)} ${c}`} strokeLinecap="round" />
    </Svg>
  );
}

function inDays(n: number) {
  return n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`;
}

// A row of "how long until": the next test, the next college deadline, the
// weekend, and anything you're counting down to.
export function CountdownChips() {
  const assignments = useSchoolStore((s) => s.assignments);
  const colleges = useHubStore((s) => s.colleges);
  const countdowns = useLifeStore((s) => s.countdowns);

  const chips: ChipData[] = [];
  const test = assignments
    .filter((a) => !a.done && (a.kind === 'test' || a.kind === 'quiz') && daysUntil(a.due) >= 0)
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  if (test) chips.push({ key: 'test', days: daysUntil(test.due), label: `${test.title} ${inDays(daysUntil(test.due))}`, icon: 'flag', color: colors.unlocked, href: `/assignment/${test.id}` });

  const college = colleges
    .filter((c) => c.deadline && daysUntil(c.deadline) >= 0 && (c.status === 'applying' || c.status === 'researching'))
    .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))[0];
  if (college?.deadline) chips.push({ key: 'college', days: daysUntil(college.deadline), label: `${college.name} ${inDays(daysUntil(college.deadline))}`, icon: 'cap', color: '#8FB4E8', href: '/college' });

  const dow = new Date().getDay();
  const toSat = (6 - dow + 7) % 7;
  chips.push(
    dow === 0 || dow === 6
      ? { key: 'weekend', days: 0, label: 'It’s the weekend', icon: 'sun', color: colors.secured, href: '/countdowns' }
      : { key: 'weekend', days: toSat, label: `Weekend ${inDays(toSat)}`, icon: 'sun', color: colors.secured, href: '/countdowns' }
  );

  for (const c of countdowns.filter((x) => daysUntil(x.date) >= 0)) {
    const left = daysUntil(c.date);
    const since = c.createdAt ? -daysUntil(dateKey(new Date(c.createdAt))) : 0;
    chips.push({
      key: c.id,
      days: left,
      label: `${c.title} ${inDays(left)}`,
      icon: c.icon ?? (c.kind === 'birthday' ? 'gift' : c.kind === 'finals' ? 'grade' : 'sparkle'),
      color: c.color,
      href: '/countdowns',
      progress: since / Math.max(1, since + left),
    });
  }
  chips.sort((a, b) => a.days - b.days);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {chips.map((c) => (
        <Pressy key={c.key} onPress={() => router.push(c.href as never)} depth={0.95} style={[styles.chip, { borderColor: alpha(c.color, 0.4), backgroundColor: alpha(c.color, 0.08) }]} accessibilityRole="button" accessibilityLabel={c.label}>
          {c.progress != null ? <MiniRing value={c.progress} color={c.color} /> : <Icon name={c.icon} size={14} color={c.color} strokeWidth={2} />}
          <Text style={styles.text} numberOfLines={1} maxFontSizeMultiplier={textGrow.control}>
            {c.label.length > 34 ? `${c.label.slice(0, 32)}…` : c.label}
          </Text>
        </Pressy>
      ))}
      <Pressy onPress={() => router.push('/countdowns')} style={[styles.chip, styles.add]} accessibilityRole="button" accessibilityLabel="Add a countdown">
        <Icon name="plus" size={14} color={colors.textFaint} strokeWidth={2} />
      </Pressy>
      <View style={styles.end} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: 14,
    marginHorizontal: -20,
  },
  row: {
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  add: {
    borderColor: colors.line,
    paddingHorizontal: 10,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },
  end: {
    width: 4,
  },
});
