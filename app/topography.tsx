import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { useRealtimeRefetch } from '../core/hooks/useRealtimeRefetch';
import { CognitiveStateLabel, STATE_LABEL, useBrainNavigatorStore } from '../core/store';
import { supabase } from '../core/supabase';
import { alpha, colors, fonts, layout, stateColor } from '../core/theme';

type Filter = CognitiveStateLabel | 'all';

const FILTERS: Filter[] = ['all', 'unlocked', 'secured', 'shelved'];
const PERSON = '#E6C46A';

interface CatalystLink {
  cognitive_state_id: string;
  entities: { id: string; name: string } | null;
}

// A fixed scatter of faint background stars, so the sky has depth.
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: ((i * 73) % 100) / 100,
  y: ((i * 41 + 17) % 100) / 100,
  r: 0.5 + ((i * 13) % 10) / 12,
  o: 0.12 + ((i * 7) % 10) / 40,
}));

export default function TopographyScreen() {
  const { width } = useWindowDimensions();
  const history = useBrainNavigatorStore((s) => s.history);
  const fetchHistory = useBrainNavigatorStore((s) => s.fetchHistory);
  const loading = useBrainNavigatorStore((s) => s.isLoadingHistory);

  // The Map is the one tab that reads the full entry history, so it loads
  // it itself, each time it comes into view.
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );
  const [filter, setFilter] = useState<Filter>('all');
  const [focus, setFocus] = useState<string | null>(null);
  const [links, setLinks] = useState<CatalystLink[]>([]);

  const fetchLinks = useCallback(() => {
    supabase
      .from('catalysts')
      .select('cognitive_state_id, entities(id, name)')
      .then(({ data, error }) => {
        if (error || !data) return;
        setLinks(data as unknown as CatalystLink[]);
      });
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks, history.length]);

  // Catalysts (and the entities they link to) can be edited from the entry
  // detail screen, which doesn't change history.length — so without this,
  // an already-open Map would show stale links until navigated away and back.
  useRealtimeRefetch(['entities', 'catalysts'], fetchLinks);

  const filtered = useMemo(
    () => (filter === 'all' ? history : history.filter((e) => e.state === filter)),
    [history, filter]
  );

  const CANVAS = Math.min(width, layout.maxWidth) - layout.gutter * 2;
  const C = CANVAS / 2;
  const OUTER = CANVAS * 0.4;
  const INNER = CANVAS * 0.2;

  const graph = useMemo(() => {
    const ring = (i: number, count: number, radius: number, turn = 0) => {
      const angle = (i / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2 + turn;
      return { x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) };
    };
    const filteredIds = new Set(filtered.map((e) => e.id));
    const entityMap = new Map<string, { id: string; name: string; count: number }>();
    const entryToEntities = new Map<string, string[]>();

    // One entry can name the same person in several catalysts; count and
    // draw each entry–entity pair once.
    for (const link of links) {
      if (!filteredIds.has(link.cognitive_state_id) || !link.entities) continue;
      const list = entryToEntities.get(link.cognitive_state_id) ?? [];
      if (list.includes(link.entities.id)) continue;
      list.push(link.entities.id);
      entryToEntities.set(link.cognitive_state_id, list);
      const known = entityMap.get(link.entities.id);
      entityMap.set(link.entities.id, { ...link.entities, count: (known?.count ?? 0) + 1 });
    }

    const entities = Array.from(entityMap.values());
    const entityPos = new Map(entities.map((e, i) => [e.id, ring(i, entities.length, OUTER)]));
    // A single entry sits in the middle; several spread on the inner ring.
    const entryPos = new Map(
      filtered.map((e, i) => [e.id, filtered.length === 1 ? { x: C, y: C } : ring(i, filtered.length, INNER, 0.4)])
    );

    const edges: { entry: string; entity: string; from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
    for (const [entryId, entityIds] of entryToEntities) {
      const from = entryPos.get(entryId);
      if (!from) continue;
      for (const entityId of entityIds) {
        const to = entityPos.get(entityId);
        if (to) edges.push({ entry: entryId, entity: entityId, from, to });
      }
    }

    const ranked = [...entities].sort((a, b) => b.count - a.count);
    return { entities, entityPos, entryPos, edges, ranked, entryToEntities };
  }, [filtered, links, C, OUTER, INNER]);

  const focusedEntries = useMemo(() => {
    if (!focus) return null;
    return new Set(graph.edges.filter((e) => e.entity === focus).map((e) => e.entry));
  }, [focus, graph.edges]);

  const dim = (on: boolean) => (focus ? (on ? 1 : 0.18) : 1);

  return (
    <Screen
      tone="dusk"
      glowColor="#AFA2DE"
      title="The Map"
      subtitle={
        history.length === 0
          ? loading
            ? 'Looking up at the sky…'
            : 'Nothing set down yet.'
          : `${filtered.length} of ${history.length} entries, and what connects them.`
      }
    >
      <Reveal index={0}>
        <ChipRow style={styles.filters}>
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={f === 'all' ? 'All' : STATE_LABEL[f]}
              selected={filter === f}
              color={f === 'all' ? colors.flame : stateColor(f)}
              dot={f !== 'all'}
              onPress={() => {
                setFilter(f);
                setFocus(null);
              }}
            />
          ))}
        </ChipRow>
      </Reveal>

      <Reveal index={1}>
        {filtered.length > 0 ? (
          <Card padded={false} style={[styles.sky, { height: CANVAS }]}>
            <Svg width={CANVAS} height={CANVAS}>
              <Defs>
                <RadialGradient id="skyGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#AFA2DE" stopOpacity={0.14} />
                  <Stop offset="1" stopColor="#AFA2DE" stopOpacity={0} />
                </RadialGradient>
                {(['unlocked', 'secured', 'shelved'] as const).map((s) => (
                  <RadialGradient key={s} id={`star-${s}`} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={stateColor(s)} stopOpacity={0.55} />
                    <Stop offset="1" stopColor={stateColor(s)} stopOpacity={0} />
                  </RadialGradient>
                ))}
              </Defs>

              <Circle cx={C} cy={C} r={C} fill="url(#skyGlow)" />
              {STARS.map((s, i) => (
                <Circle key={i} cx={s.x * CANVAS} cy={s.y * CANVAS} r={s.r} fill="#FFF3DC" opacity={s.o} />
              ))}
              <Circle cx={C} cy={C} r={OUTER} stroke={alpha('#FFF3DC', 0.06)} strokeWidth={1} fill="none" strokeDasharray="2 6" />
              <Circle cx={C} cy={C} r={INNER} stroke={alpha('#FFF3DC', 0.05)} strokeWidth={1} fill="none" strokeDasharray="2 6" />

              {/* Threads bow gently toward the middle of the sky. */}
              {graph.edges.map((edge, i) => {
                const mx = (edge.from.x + edge.to.x) / 2;
                const my = (edge.from.y + edge.to.y) / 2;
                const qx = mx + (C - mx) * 0.35;
                const qy = my + (C - my) * 0.35;
                const on = !focus || edge.entity === focus;
                return (
                  <Path
                    key={i}
                    d={`M${edge.from.x},${edge.from.y} Q${qx},${qy} ${edge.to.x},${edge.to.y}`}
                    stroke={on && focus ? PERSON : colors.unlocked}
                    strokeWidth={on && focus ? 1.6 : 1}
                    strokeOpacity={focus ? (on ? 0.85 : 0.08) : 0.4}
                    fill="none"
                  />
                );
              })}

              {graph.entities.map((entity) => {
                const pos = graph.entityPos.get(entity.id)!;
                const on = !focus || focus === entity.id;
                const r = 7 + Math.min(6, entity.count * 1.5);
                const below = pos.y > C;
                return (
                  <G key={entity.id} opacity={dim(on)} onPress={() => setFocus(focus === entity.id ? null : entity.id)}>
                    <Circle cx={pos.x} cy={pos.y} r={r + 10} fill="transparent" />
                    <Circle cx={pos.x} cy={pos.y} r={r} fill={alpha(PERSON, 0.2)} stroke={PERSON} strokeWidth={1.5} />
                    <SvgText
                      x={pos.x}
                      y={below ? pos.y + r + 14 : pos.y - r - 7}
                      fontSize={11}
                      fontFamily={fonts.bodyMedium}
                      fill={colors.textMuted}
                      textAnchor="middle"
                    >
                      {entity.name.length > 16 ? `${entity.name.slice(0, 15)}…` : entity.name}
                    </SvgText>
                  </G>
                );
              })}

              {filtered.map((entry) => {
                const pos = graph.entryPos.get(entry.id)!;
                const on = !focusedEntries || focusedEntries.has(entry.id);
                const r = 5 + ((entry.intensity ?? 5) / 10) * 6;
                const label = entry.mood || 'Untitled';
                return (
                  <G key={entry.id} opacity={dim(on)} onPress={() => router.push(`/entry/${entry.id}`)}>
                    <Circle cx={pos.x} cy={pos.y} r={r * 3.2} fill={`url(#star-${entry.state})`} />
                    <Circle cx={pos.x} cy={pos.y} r={r} fill={stateColor(entry.state)} />
                    <Circle cx={pos.x - r * 0.3} cy={pos.y - r * 0.3} r={r * 0.35} fill="#FFFFFF" opacity={0.55} />
                    <SvgText
                      x={pos.x}
                      y={pos.y + r + 15}
                      fontSize={12}
                      fontFamily={fonts.displaySoft}
                      fill={colors.text}
                      textAnchor="middle"
                    >
                      {label.length > 18 ? `${label.slice(0, 17)}…` : label}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </Card>
        ) : loading && history.length === 0 ? null : (
          <EmptyState
            title={history.length === 0 ? 'The sky’s still empty.' : 'Nothing matches this filter.'}
            body={history.length === 0 ? 'Each thing you set down becomes a star here.' : undefined}
          />
        )}
      </Reveal>

      <Reveal index={2}>
        <View style={styles.legend}>
          <Legend color={colors.unlocked} label={STATE_LABEL.unlocked} />
          <Legend color={colors.secured} label={STATE_LABEL.secured} />
          <Legend color={colors.shelved} label={STATE_LABEL.shelved} />
          <Legend color={PERSON} label="Person or thing" ring />
        </View>
      </Reveal>

      {graph.ranked.length > 0 ? (
        <Reveal index={3}>
          <Section title="Who keeps showing up" note="Tap one to light up its threads on the map.">
            <Card padded={false}>
              {graph.ranked.slice(0, 8).map((e, i) => {
                const on = focus === e.id;
                return (
                  <Pressy
                    key={e.id}
                    onPress={() => setFocus(on ? null : e.id)}
                    style={[styles.row, i > 0 && styles.rowBorder, on && { backgroundColor: alpha(PERSON, 0.1) }]}
                    accessibilityState={{ selected: on }}
                  >
                    <View style={[styles.rank, on && { backgroundColor: PERSON }]}>
                      <Text style={[styles.rankText, on && { color: colors.flameInk }]}>{e.name.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={styles.rowCount}>
                      {e.count} {e.count === 1 ? 'entry' : 'entries'}
                    </Text>
                  </Pressy>
                );
              })}
            </Card>
          </Section>
        </Reveal>
      ) : null}
    </Screen>
  );
}

function Legend({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, ring ? { borderWidth: 1.5, borderColor: color, backgroundColor: alpha(color, 0.2) } : { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    marginTop: 16,
  },
  sky: {
    marginTop: 16,
    backgroundColor: '#130F1A',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 16,
    rowGap: 8,
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
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(PERSON, 0.16),
  },
  rankText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: PERSON,
  },
  rowName: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  rowCount: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
});
