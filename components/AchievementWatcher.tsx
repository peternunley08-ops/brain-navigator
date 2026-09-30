import { useEffect } from 'react';
import { checkAchievements } from '../core/achievements';
import { useHubStore } from '../core/hubStore';
import { useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { emberSay } from './ember/EmberBuddy';

// Watches the local stores and hands out quiet badges. The first pass after
// launch awards silently (so nobody gets a pile of old badges at once);
// after that, Ember announces each new one.
export function AchievementWatcher() {
  useEffect(() => {
    let ready = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      if (!useSchoolStore.getState().loaded || !useLifeStore.getState().loaded || !useHubStore.getState().loaded) return;
      const earned = checkAchievements();
      if (ready && earned.length) {
        const a = earned[earned.length - 1];
        emberSay(`New badge: ${a.title}. ${a.body}`, 'cheer');
      }
      ready = true;
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, 700);
    };

    const subs = [useSchoolStore.subscribe(schedule), useLifeStore.subscribe(schedule), useHubStore.subscribe(schedule)];
    schedule();
    return () => {
      subs.forEach((u) => u());
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}
