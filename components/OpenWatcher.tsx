import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useLifeStore } from '../core/lifeStore';
import { toolFor } from '../core/tools';

// Notes which Drawer tools get opened, for "Recently opened" and "Most
// used" in the Drawer. Stays on the phone, and stops when "Learn from how I
// use the app" is off in About you.
export function OpenWatcher() {
  const path = usePathname();
  useEffect(() => {
    const life = useLifeStore.getState();
    if (life.loaded && toolFor(path)) life.noteOpen(path);
  }, [path]);
  return null;
}
