import { createClient } from '@supabase/supabase-js';
import { sampleChannel, sampleFrom } from './sampleDb';
import { isShowing } from './showMode';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — check .env'
  );
}

const real = createClient(supabaseUrl, supabaseAnonKey);

// While "Show someone the app" is on, every query goes to the in-memory
// sample database instead, so nothing real is read or written; AI calls,
// realtime, and uploads are switched off. Otherwise this is the real client.
const failed = { data: null, error: { message: 'Showing sample data' } };
export const supabase = new Proxy(real, {
  get(target, prop, receiver) {
    // A stand-in channel made while showing may be removed after showing ends.
    if (prop === 'removeChannel') {
      return (ch: unknown) => (ch === sampleChannel ? Promise.resolve('ok') : target.removeChannel(ch as Parameters<typeof target.removeChannel>[0]));
    }
    if (isShowing()) {
      if (prop === 'from') return (table: string) => sampleFrom(table);
      if (prop === 'channel') return () => sampleChannel;
      if (prop === 'functions') return { invoke: async () => ({ data: null, error: new Error('Showing sample data') }) };
      if (prop === 'storage') return { from: () => ({ upload: async () => failed, getPublicUrl: () => ({ data: { publicUrl: '' } }) }) };
    }
    const v = Reflect.get(target, prop, receiver);
    return typeof v === 'function' ? v.bind(target) : v;
  },
}) as typeof real;
