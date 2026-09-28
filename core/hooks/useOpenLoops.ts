import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useBrainNavigatorStore } from '../store';
import { useRealtimeRefetch } from './useRealtimeRefetch';

// Everything still open, kept current: refetched every time the screen
// comes into view (the Desk stays mounted underneath pushed screens, so a
// mount-only fetch would go stale) and on realtime changes once
// cognitive_state is in the realtime publication — see schema.sql Phase 26.
// For screens that show the list itself; the nav badge just reads
// `openLoops` from the store.
export function useOpenLoops() {
  const openLoops = useBrainNavigatorStore((s) => s.openLoops);
  const fetchOpenLoops = useBrainNavigatorStore((s) => s.fetchOpenLoops);

  useFocusEffect(
    useCallback(() => {
      fetchOpenLoops();
    }, [fetchOpenLoops])
  );

  useRealtimeRefetch(['cognitive_state'], fetchOpenLoops);

  return openLoops;
}
