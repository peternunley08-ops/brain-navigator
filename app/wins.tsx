import * as Haptics from '../core/haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedProps, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { ScienceNote } from '../components/ui/ScienceNote';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { addDays, dateKey } from '../core/dates';
import { useLifeStore } from '../core/lifeStore';
import { colors, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';

// Quick seal dates: a week, a month, and the next end of semester (Dec 20 or May 30).
function sealChoices(today: string) {
  const y = Number(today.slice(0, 4));
  const sem = [`${y}-05-30`, `${y}-12-20`, `${y + 1}-05-30`].find((k) => k > today) as string;
  return [
    { id: 'week', label: 'In a week', key: addDays(today, 7) },
    { id: 'month', label: 'In a month', key: addDays(today, 30) },
    { id: 'sem', label: 'End of semester', key: sem },
  ];
}

function inWords(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const GOLD = '#E6C46A';
const MARBLES = ['#F5B45C', '#F0845A', '#8CC0A8', '#8FB4E8', '#AFA2DE', '#E89AB8', '#9FD08A', '#E6C46A'];
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Small wins and good things. Brains remember the bad day by default;
// this is where the other stuff gets kept.
const PROMPTS = [
  ['Something that made you smile', 'Someone you’re glad exists', 'Something you did well'],
  ['A small thing that went right', 'Someone who helped you, even a little', 'Something you’re looking forward to'],
  ['Something good you ate', 'Someone you laughed with', 'Something your body let you do'],
  ['Something you noticed outside', 'A message you were glad to get', 'Something you learned'],
  ['A comfort: a song, a hoodie, a place', 'Someone who’d be proud of you', 'Something hard you got through'],
  ['Something you’re lucky to have', 'A friend’s best quality', 'A choice you’re glad you made'],
  ['A quiet moment', 'Someone you could text right now', 'Something you’re getting better at'],
];

export default function WinsScreen() {
  const reduced = useReducedMotion();
  const wins = useLifeStore((s) => s.wins);
  const addWin = useLifeStore((s) => s.addWin);
  const deleteWin = useLifeStore((s) => s.deleteWin);
  const gratitude = useLifeStore((s) => s.gratitude);
  const setGratitude = useLifeStore((s) => s.setGratitude);
  const [text, setText] = useState('');
  const [seal, setSeal] = useState<string | null>(null);
  const openWin = useLifeStore((s) => s.openWin);

  const today = dateKey();
  const three = gratitude[today] ?? ['', '', ''];
  // A different set of prompts each day, so it doesn't turn into the same three answers.
  const [py, pm, pd] = today.split('-').map(Number);
  const [shuffle, setShuffle] = useState(0);
  const prompts = PROMPTS[(Math.floor(Date.UTC(py, pm - 1, pd) / 86400000) + shuffle) % PROMPTS.length];
  const [draft, setDraft] = useState<string[]>([...three, '', '', ''].slice(0, 3));

  const add = () => {
    if (!text.trim()) return;
    addWin(text, seal ?? undefined);
    setText('');
    setSeal(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const n = useLifeStore.getState().wins.length;
    emberSay(n === 1 ? 'First one in the jar. They add up.' : n % 10 === 0 ? `${n} wins. Look at that jar.` : 'In the jar.', 'cheer');
  };

  // The first time a sealed note's day arrives and it is on screen, Ember says one line.
  useEffect(() => {
    const ready = wins.find((w) => w.sealedUntil && w.sealedUntil <= today && !w.openedAt);
    if (!ready) return;
    openWin(ready.id);
    emberSay('A letter from you just opened. Past you was thinking of you.', 'happy');
  }, [wins, today, openWin]);

  const saveThree = (i: number, v: string) => {
    const next = [...draft];
    next[i] = v;
    setDraft(next);
    setGratitude(today, next);
  };

  const pastDays = Object.entries(gratitude)
    .filter(([k, v]) => k !== today && v.some((x) => x.trim()))
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5);

  return (
    <Screen title="Wins" subtitle="The good stuff, kept where you can see it.">
      <Reveal index={0}>
        <View style={styles.jarWrap}>
          <Jar count={wins.length} reduced={reduced} />
          <Text style={styles.jarCount}>{wins.length}</Text>
          <Text style={styles.jarLabel}>{wins.length === 1 ? 'win in the jar' : 'wins in the jar'}</Text>
        </View>
      </Reveal>

      <Reveal index={1}>
        <Card>
          <Field value={text} onChangeText={setText} placeholder="Something that went right, any size" returnKeyType="done" onSubmitEditing={add} />
          <Text style={[styles.hint, styles.left]}>Seal it until…</Text>
          <ChipRow>
            {sealChoices(today).map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                selected={seal === c.key}
                onPress={() => setSeal(seal === c.key ? null : c.key)}
                accessibilityLabel={seal === c.key ? `Sealed until ${inWords(c.key)}, tap to unseal` : `Seal it ${c.label.toLowerCase()}`}
              />
            ))}
          </ChipRow>
          <Button label="Drop it in the jar" icon="jar" onPress={add} disabled={!text.trim()} style={styles.gap} />
          <Text style={styles.hint}>Turned something in. Asked for help. Got out of bed on a hard day. All count.</Text>
        </Card>
      </Reveal>

      <Reveal index={2}>
        <Section
          title="Three good things"
          note="Today. Small is fine; small is the point."
          action={{ label: 'Other prompts', onPress: () => setShuffle((n) => n + 1) }}
        >
          <Card>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.goodRow}>
                <Text style={styles.goodNum}>{i + 1}</Text>
                <Field
                  value={draft[i]}
                  onChangeText={(v) => saveThree(i, v)}
                  placeholder={prompts[i]}
                  containerStyle={styles.flex}
                  onBlur={() => {
                    if (i === 2 && draft.every((x) => x.trim())) emberSay('Three good things. That’s a real practice, and you did it.', 'happy');
                  }}
                />
              </View>
            ))}
          </Card>
        </Section>
      </Reveal>

      {pastDays.length ? (
        <Reveal index={3}>
          <Section title="Other days">
            <Card>
              {pastDays.map(([k, v]) => {
                const [y, m, d] = k.split('-').map(Number);
                return (
                  <View key={k} style={styles.past}>
                    <Text style={styles.pastDate}>{new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    {v
                      .filter((x) => x.trim())
                      .map((x, i) => (
                        <Text key={i} style={styles.pastItem}>
                          • {x}
                        </Text>
                      ))}
                  </View>
                );
              })}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      {wins.length ? (
        <Reveal index={4}>
          <Section title="In the jar">
            <View style={styles.list}>
              {wins.slice(0, 30).map((w, i) => (
                <Animated.View key={w.id} entering={reduced ? undefined : FadeInDown.duration(220)} exiting={reduced ? undefined : FadeOut.duration(150)} layout={reduced ? undefined : LinearTransition}>
                  <Card style={styles.winRow}>
                    {w.sealedUntil && w.sealedUntil > today ? (
                      <Icon name="message" size={16} color={GOLD} />
                    ) : (
                      <View style={[styles.marble, { backgroundColor: MARBLES[(wins.length - 1 - i) % MARBLES.length] }]} />
                    )}
                    <View style={styles.flex}>
                      <Text style={styles.winText}>{w.sealedUntil && w.sealedUntil > today ? `A letter to you, opens on ${inWords(w.sealedUntil)}` : w.text}</Text>
                      <Text style={styles.winDate}>{new Date(w.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <Pressy
                      onPress={() => {
                        const snap = w;
                        deleteWin(w.id);
                        offerUndo('Took a win out', () => useLifeStore.getState().restoreWin(snap));
                      }}
                      hitSlop={10}
                      accessibilityLabel={w.sealedUntil && w.sealedUntil > today ? 'Remove sealed letter' : `Remove ${w.text}`}
                    >
                      <Icon name="close" size={15} color={colors.textFaint} />
                    </Pressy>
                  </Card>
                </Animated.View>
              ))}
            </View>
          </Section>
        </Reveal>
      ) : null}

      <Reveal index={5}>
        <ScienceNote fact="Writing down three good things a day for a week measurably raised happiness and lowered depressive symptoms for months afterward in Seligman's studies. It works by training attention toward what went right — which the brain otherwise skips." />
      </Reveal>
    </Screen>
  );
}

// A glass jar that fills with colored marbles, one per win. The newest one
// drops in with a little bounce.
function Jar({ count, reduced }: { count: number; reduced: boolean }) {
  const shown = Math.min(count, 48);
  const drop = useSharedValue(0);
  useEffect(() => {
    drop.value = -60;
    drop.value = reduced ? 0 : withSpring(0, { damping: 9, stiffness: 140 });
  }, [count, drop, reduced]);

  // Pack marbles in rows from the bottom of the jar.
  const R = 7;
  const perRow = 7;
  // Each row is centered in the jar, so the first marble lands in the middle.
  const marbles = Array.from({ length: shown }, (_, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const inRow = Math.min(perRow, shown - row * perRow);
    const step = R * 2 + 1;
    return { cx: 90 - ((inRow - 1) * step) / 2 + col * step, cy: 186 - R - row * (R * 1.8), color: MARBLES[i % MARBLES.length] };
  });
  const last = marbles[marbles.length - 1];
  const lastProps = useAnimatedProps(() => ({ cy: (last?.cy ?? 0) + drop.value }));

  return (
    <Svg width={180} height={200} viewBox="0 0 180 200" accessibilityLabel={`A jar holding ${count} wins`}>
      <Defs>
        <LinearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.1} />
          <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.02} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.08} />
        </LinearGradient>
      </Defs>
      {marbles.slice(0, -1).map((m, i) => (
        <Circle key={i} cx={m.cx} cy={m.cy} r={R} fill={m.color} opacity={0.92} />
      ))}
      {last ? <AnimatedCircle cx={last.cx} r={R} fill={last.color} animatedProps={lastProps} /> : null}
      <Path d="M52 18h76M58 18v14c-18 8-30 22-30 44v100a12 12 0 0 0 12 12h100a12 12 0 0 0 12-12V76c0-22-12-36-30-44V18" fill="url(#glass)" stroke={GOLD} strokeOpacity={0.55} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M40 90v70" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: 12,
  },
  jarWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  jarCount: {
    marginTop: -4,
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.text,
  },
  jarLabel: {
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    color: colors.textMuted,
  },
  left: {
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'left',
  },
  hint: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
    textAlign: 'center',
  },
  goodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  goodNum: {
    width: 18,
    fontFamily: fonts.display,
    fontSize: 18,
    color: GOLD,
    textAlign: 'center',
  },
  past: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pastDate: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  pastItem: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  list: {
    gap: 8,
  },
  winRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  marble: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  winText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  winDate: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
