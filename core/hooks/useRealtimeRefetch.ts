import { useEffect } from 'react';
import { supabase } from '../supabase';

// Subscribes to postgres_changes on the given tables (wide-open anon
// realtime, matching the app's existing anon RLS policies — no auth) and
// calls onChange whenever any of them mutate, so callers can refetch a
// derived query instead of polling.
export function useRealtimeRefetch(tables: string[], onChange: () => void) {
  const tableKey = tables.join(',');

  useEffect(() => {
    const channel = supabase.channel(`realtime:${tableKey}`);
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
