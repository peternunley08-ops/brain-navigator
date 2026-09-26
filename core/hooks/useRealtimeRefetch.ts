import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';

// Subscribes to postgres_changes on the given tables (wide-open anon
// realtime, matching the app's existing anon RLS policies — no auth) and
// calls onChange whenever any of them mutate, so callers can refetch a
// derived query instead of polling.
export function useRealtimeRefetch(tables: string[], onChange: () => void) {
  const tableKey = tables.join(',');
  // Supabase channel topics must be unique per active subscription — two
  // screens watching the same table (e.g. Trove and Open Loops both on
  // `cognitive_state`) can be mounted at once in a stack navigator, and a
  // shared `realtime:<tables>` topic would throw "cannot add
  // postgres_changes callbacks... after subscribe()" on the second one.
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;

  useEffect(() => {
    const channel = supabase.channel(`realtime:${tableKey}:${instanceId}`);
    for (const table of tables) {
      channel.on('postgres_changes' as any, { event: '*', schema: 'public', table }, onChange);
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, onChange]);
}
