import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useLifeStore } from '../core/lifeStore';
import { toolFor } from '../core/tools';

// Notes which Drawer tools get opened, for "Recently opened" and "Most
// used" in the Drawer. Stays on the phone, and stops when "Learn from how I
// use the app" is off in About you. A tool's gold "new" dot clears the
// first time it opens, from the Drawer or anywhere else.
export function OpenWatcher() {
  const path = usePathname();
  useEffect(() => {
    const life = useLifeStore.getState();
    const tool = toolFor(path);
    if (!life.loaded || !tool) return;
    life.noteOpen(path);
    const seen = life.settings.seenNew ?? [];
    if (tool.isNew && !seen.includes(tool.path)) life.setSettings({ seenNew: [...seen, tool.path] });
  }, [path]);
  return null;
}
