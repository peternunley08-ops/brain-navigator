import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { supabase } from '../core/supabase';
import { CognitiveStateLabel, useBrainNavigatorStore } from '../core/store';
import { useRealtimeRefetch } from '../core/hooks/useRealtimeRefetch';
import { colors, fonts, spacing, stateColor } from '../core/theme';

type Filter = CognitiveStateLabel | 'all';

const FILTERS: Filter[] = ['all', 'secured', 'shelved', 'unlocked'];

interface CatalystLink {
  cognitive_state_id: string;
  entities: { id: string; name: string } | null;
}

const CANVAS = 320;
const CENTER = CANVAS / 2;
const ENTITY_RING_RADIUS = CANVAS * 0.42;
const ENTRY_RING_RADIUS = CANVAS * 0.2;
const ENTITY_NODE_RADIUS = 9;
const ENTRY_NODE_RADIUS = 13;

function ringPosition(index: number, count: number, radius: number) {
  const angle = (index / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2;
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

export default function TopographyScreen() {
  const history = useBrainNavigatorStore((s) => s.history);
  const [filter, setFilter] = useState<Filter>('all');
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
  // an already-open Topography screen would show stale links until
  // navigated away and back.
  useRealtimeRefetch(['entities', 'catalysts'], fetchLinks);

  const filtered = useMemo(
    () => (filter === 'all' ? history : history.filter((e) => e.state === filter)),
    [history, filter]
  );

  const graph = useMemo(() => {
    const filteredIds = new Set(filtered.map((e) => e.id));

    const entityMap = new Map<string, { id: string; name: string }>();
    const entryToEntities = new Map<string, string[]>();

    for (const link of links) {
      if (!filteredIds.has(link.cognitive_state_id) || !link.entities) continue;
      entityMap.set(link.entities.id, link.entities);
      const list = entryToEntities.get(link.cognitive_state_id) ?? [];
      list.push(link.entities.id);
      entryToEntities.set(link.cognitive_state_id, list);
    }

    const entities = Array.from(entityMap.values());
    const entityPositions = new Map(
      entities.map((entity, i) => [entity.id, ringPosition(i, entities.length, ENTITY_RING_RADIUS)])
    );
    const entryPositions = new Map(
      filtered.map((entry, i) => [entry.id, ringPosition(i, filtered.length, ENTRY_RING_RADIUS)])
    );

    const edges: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
    for (const [entryId, entityIds] of entryToEntities) {
      const from = entryPositions.get(entryId);
      if (!from) continue;
      for (const entityId of entityIds) {
        const to = entityPositions.get(entityId);
        if (to) edges.push({ from, to });
      }
    }

    return { entities, entityPositions, entryPositions, edges };
  }, [filtered, links]);

  return (
    <View style={styles.outer}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

        <Text style={styles.title}>Topography</Text>
        <Text style={styles.subtitle}>
          {history.length === 0
            ? 'Nothing logged yet'
            : `${filtered.length} of ${history.length} entries`}
        </Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {filtered.length > 0 ? (
          <ScrollView
            style={styles.canvasScroll}
            contentContainerStyle={styles.canvasContent}
            minimumZoomScale={1}
            maximumZoomScale={2.5}
            horizontal={false}
          >
            <Svg width={CANVAS} height={CANVAS} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
              {graph.edges.map((edge, i) => (
                <Line
                  key={i}
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke={colors.unlocked}
                  strokeWidth={1}
                  strokeOpacity={0.55}
                />
              ))}

              {graph.entities.map((entity) => {
                const pos = graph.entityPositions.get(entity.id)!;
                return (
                  <G key={entity.id}>
                    <Circle
                      cx={pos.x}
                      cy={pos.y}
                      r={ENTITY_NODE_RADIUS}
                      fill={colors.leather}
                    />
                    <SvgText
                      x={pos.x}
                      y={pos.y + ENTITY_NODE_RADIUS + 12}
                      fontSize={9}
                      fontFamily={fonts.mono}
                      fill={colors.inkFaint}
                      textAnchor="middle"
                    >
                      {entity.name}
                    </SvgText>
                  </G>
                );
              })}

              {filtered.map((entry) => {
                const pos = graph.entryPositions.get(entry.id)!;
                const label = (entry.mood || 'Untitled').slice(0, 14);
                return (
                  <G key={entry.id}>
                    <Circle
                      cx={pos.x}
                      cy={pos.y}
                      r={ENTRY_NODE_RADIUS}
                      fill={stateColor(entry.state)}
                      stroke={colors.background}
                      strokeWidth={2}
                      onPress={() => router.push(`/entry/${entry.id}`)}
                    />
                    <SvgText
                      x={pos.x}
                      y={pos.y - ENTRY_NODE_RADIUS - 6}
                      fontSize={10}
                      fontFamily={fonts.body}
                      fill={colors.ink}
                      textAnchor="middle"
                    >
                      {label}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </ScrollView>
        ) : (
          <Text style={styles.hint}>Nothing matches this filter.</Text>
        )}

        <View style={styles.legend}>
          <LegendItem color={colors.secured} label="Secured" />
          <LegendItem color={colors.shelved} label="Shelved" />
          <LegendItem color={colors.unlocked} label="Unlocked" />
          <LegendItem color={colors.leather} label="Person / thing" />
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 100,
    alignItems: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    alignSelf: 'flex-start',
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    alignSelf: 'flex-start',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.backgroundAlt,
  },
  filterChipActive: {
    backgroundColor: colors.leather,
    borderColor: colors.leather,
  },
  filterChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  filterChipTextActive: {
    color: colors.background,
  },
  canvasScroll: {
    marginTop: spacing.xl,
    width: CANVAS,
    height: CANVAS,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
  },
  canvasContent: {
    width: CANVAS,
    height: CANVAS,
  },
  hint: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.hint,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkFaint,
    textTransform: 'uppercase',
  },
});
