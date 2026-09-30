import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AssignmentRow } from '../components/school/AssignmentRow';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { clock, dueLabel, isoDay, useSchoolStore, workloadByDay } from '../core/schoolStore';
import { alpha, colors, fonts, layout, radii } from '../core/theme';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PX_PER_MIN = 0.95;

function hm(minutes: number) {
  if (!minutes) return '–';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h${m}` : `${h}h`) : `${m}m`;
}

// The shape of a school week: every class on a timetable, and how heavy
// each of the next two weeks' days is compared with what a night can hold.
export default function WeekScreen() {
  const { width } = useWindowDimensions();
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const cap = useSchoolStore((s) => s.profile.nightlyCap);
  const [pick, setPick] = useState<string | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const scheduled = classes.filter((c) => c.days.length > 0);
  const weekend = scheduled.some((c) => c.days.includes(6) || c.days.includes(7));
  const days = weekend ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
  const startMin = scheduled.length ? Math.floor(Math.min(...scheduled.map((c) => c.start)) / 60) * 60 : 8 * 60;
  const endMin = scheduled.length ? Math.ceil(Math.max(...scheduled.map((c) => c.end)) / 60) * 60 : 15 * 60;
  const gridH = (endMin - startMin) * PX_PER_MIN;
  const contentW = Math.min(width, layout.maxWidth) - layout.gutter * 2;
  const gutterW = 34;
  const colW = (contentW - gutterW - 24) / days.length;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = isoDay(now);

  const load = useMemo(() => workloadByDay(assignments, 14), [assignments]);
  const picked = pick ? assignments.filter((a) => !a.done && (a.due === pick || (pick === load[0].key && a.due < pick))) : [];
  const heavy = load.filter((d) => d.minutes > cap).length;

  return (
    <Screen title="Your week" subtitle="Classes on a timetable, and how heavy each day is.">
      <Reveal index={0}>
        <Section title="Timetable" action={{ label: 'Edit', onPress: () => router.push('/classes') }}>
          {scheduled.length === 0 ? (
            <Card>
              <EmptyState title="No class times yet." body="Add days and times to your classes and they’ll show up here.">
                <Button label="Your schedule" icon="book" variant="secondary" onPress={() => router.push('/classes')} />
              </EmptyState>
            </Card>
          ) : (
            <Card padded={false} style={styles.gridCard}>
              <View style={styles.headRow}>
                <View style={{ width: gutterW }} />
                {days.map((d) => (
                  <Text key={d} style={[styles.dayHead, { width: colW }, d === today && styles.today]}>
                    {DAY_NAMES[d - 1]}
                  </Text>
                ))}
              </View>
              <View style={[styles.grid, { height: gridH }]}>
                {Array.from({ length: (endMin - startMin) / 60 + 1 }, (_, i) => {
                  const m = startMin + i * 60;
                  return (
                    <View key={m} style={[styles.hourLine, { top: (m - startMin) * PX_PER_MIN }]}>
                      <Text style={[styles.hourText, { width: gutterW }]}>{clock(m).replace(':00', '').replace(' ', '')}</Text>
                      <View style={styles.hourRule} />
                    </View>
                  );
                })}
                {days.map((d, col) =>
                  scheduled
                    .filter((c) => c.days.includes(d))
                    .map((c) => {
                      const top = (c.start - startMin) * PX_PER_MIN;
                      const h = Math.max(18, (c.end - c.start) * PX_PER_MIN - 2);
                      return (
                        <Pressy
                          key={`${c.id}-${d}`}
                          onPress={() => router.push(`/class/${c.id}`)}
                          depth={0.94}
                          accessibilityRole="button"
                          accessibilityLabel={`${c.name}, ${DAY_NAMES[d - 1]} ${clock(c.start)} to ${clock(c.end)}`}
                          style={[
                            styles.block,
                            {
                              top,
                              height: h,
                              left: gutterW + col * colW + 2,
                              width: colW - 4,
                              backgroundColor: alpha(c.color, 0.22),
                              borderColor: alpha(c.color, 0.6),
                            },
                          ]}
                        >
                          <Text style={[styles.blockText, { color: c.color }]} numberOfLines={h > 34 ? 2 : 1}>
                            {c.name}
                          </Text>
                        </Pressy>
                      );
                    })
                )}
                {days.includes(today) && nowMin >= startMin && nowMin <= endMin ? (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.now,
                      { top: (nowMin - startMin) * PX_PER_MIN, left: gutterW + days.indexOf(today) * colW, width: colW },
                    ]}
                  >
                    <View style={styles.nowDot} />
                  </View>
                ) : null}
              </View>
            </Card>
          )}
        </Section>
      </Reveal>

      <Reveal index={1}>
        <Section
          title="The next two weeks"
          note={heavy ? `${heavy} day${heavy === 1 ? '' : 's'} over your ${hm(cap)} cap. Move something earlier?` : `Every day fits under your ${hm(cap)} cap.`}
        >
          <Card>
            <View style={styles.heatRow}>
              {load.map((d, i) => {
                const r = d.minutes / Math.max(1, cap);
                const color = d.minutes === 0 ? colors.surfaceSunk : r > 1 ? colors.unlocked : r > 0.5 ? colors.flame : colors.secured;
                const [y, m, dd] = d.key.split('-').map(Number);
                const date = new Date(y, m - 1, dd);
                const on = pick === d.key;
                return (
                  <Pressy
                    key={d.key}
                    onPress={() => setPick(on ? null : d.key)}
                    depth={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={`${dueLabel(d.key)}, ${d.count} due, ${hm(d.minutes)}`}
                    accessibilityState={{ selected: on }}
                    style={[
                      styles.heat,
                      { backgroundColor: d.minutes === 0 ? color : alpha(color, 0.25 + Math.min(0.6, r * 0.45)) },
                      on && styles.heatOn,
                      i === 7 && styles.heatBreak,
                    ]}
                  >
                    <Text style={styles.heatDay}>{i === 0 ? 'Now' : date.toLocaleDateString('en-US', { weekday: 'narrow' })}</Text>
                    <Text style={styles.heatNum}>{dd}</Text>
                    <Text style={styles.heatMin}>{hm(d.minutes)}</Text>
                  </Pressy>
                );
              })}
            </View>
            <View style={styles.legend}>
              <Legend color={colors.secured} label="Light" />
              <Legend color={colors.flame} label="Full" />
              <Legend color={colors.unlocked} label="Over cap" />
            </View>
          </Card>
          {pick ? (
            <View style={styles.list}>
              {picked.length ? (
                picked.map((a, i) => <AssignmentRow key={a.id} a={a} index={i} />)
              ) : (
                <Text style={styles.empty}>Nothing due {dueLabel(pick).toLowerCase()}.</Text>
              )}
            </View>
          ) : null}
        </Section>
      </Reveal>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  headRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHead: {
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textFaint,
  },
  today: {
    color: colors.flame,
  },
  grid: {
    position: 'relative',
    marginBottom: 6,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -7,
  },
  hourText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },
  hourRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  block: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  blockText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    lineHeight: 12,
  },
  now: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.danger,
    borderRadius: 1,
  },
  nowDot: {
    position: 'absolute',
    left: -4,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  heatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heat: {
    width: '12.4%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  heatOn: {
    borderColor: colors.text,
  },
  heatBreak: {},
  heatDay: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textMuted,
  },
  heatNum: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.text,
  },
  heatMin: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    color: colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  list: {
    marginTop: 12,
    gap: 10,
  },
  empty: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
