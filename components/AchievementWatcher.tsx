import { useEffect } from 'react';
import { checkAchievements } from '../core/achievements';
import { useHubStore } from '../core/hubStore';
import { useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { isShowing } from '../core/showMode';
import { celebrate } from '../core/celebrateStore';
import { nextFirst, rememberFirst } from '../core/firsts';
import { emberSay } from './ember/EmberBuddy';

// The badges that take real time get the whole-screen moment.
const RARE = new Set(['done_50', 'showed_30', 'focus_600', 'cards_100', 'quiz_whiz']);

// Watches the local stores and hands out quiet badges. The first pass after
// launch awards silently (so nobody gets a pile of old badges at once);
// after that, Ember announces each new one.
export function AchievementWatcher() {
  useEffect(() => {
    let ready = false;
    let saidFirst = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      if (!useSchoolStore.getState().loaded || !useLifeStore.getState().loaded || !useHubStore.getState().loaded) return;
      const earned = checkAchievements();
      // A sample student's badges (while showing someone the app) stay quiet.
      if (ready && earned.length && !isShowing()) {
        const a = earned[earned.length - 1];
        if (RARE.has(a.key)) celebrate(a.title, a.body, a.color, { key: `badge-${a.key}` });
        else emberSay(`New badge: ${a.title}. ${a.body}`, 'cheer');
      }
      // One quiet first per app session, in Ember's voice, remembered forever.
      if (ready && !earned.length && !saidFirst && !isShowing()) {
        const f = nextFirst();
        if (f) {
          saidFirst = true;
          rememberFirst(f.key);
          emberSay(f.line, 'happy');
        }
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
