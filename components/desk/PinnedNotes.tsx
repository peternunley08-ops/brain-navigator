import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useHubStore } from '../../core/hubStore';
import type { IconName } from '../ui/Icon';
import { Chip } from '../ui/Chip';

// Pinned pages, one tap from the Desk.
export function PinnedNotes() {
  const notes = useHubStore((s) => s.notes);
  const pinned = notes.filter((n) => n.pinned).slice(0, 6);
  if (!pinned.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {pinned.map((n) => (
        <Chip key={n.id} label={n.title || 'Untitled'} icon={n.icon as IconName} color={n.color} onPress={() => router.push(`/note/${n.id}`)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: 12,
    marginHorizontal: -20,
  },
  row: {
    gap: 8,
    paddingHorizontal: 20,
  },
});
