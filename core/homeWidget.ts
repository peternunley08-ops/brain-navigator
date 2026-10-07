import { AppState } from 'react-native';
import { nightNow, subscribeNightClock } from './night';
import { useSchoolStore } from './schoolStore';
import { isShowing } from './showMode';
import { colors } from './theme';
import { type WidgetDay, widgetTimeline } from './widgetData';

// The Home Screen widget (widgets/TomorrowWidget.tsx) gets tomorrow's first
// class and what's due whenever school data changes, and again as the app
// goes to the background. Never Riley's: nothing is sent in show mode.

/** What the widget gets: the day, plus the theme colors it can't import. */
export type WidgetProps = WidgetDay & { ink: typeof INK };
const INK = { room: colors.nightHigh, gold: colors.flame, text: colors.text, muted: colors.textMuted, faint: colors.textFaint };

type HomeWidget = { updateTimeline(entries: { date: Date; props: WidgetProps }[]): void };

let widget: Promise<HomeWidget | null> | null = null;
// A build without the widget's native module (an older install) just skips it.
const load = () => (widget ??= import('../widgets/TomorrowWidget').then((m) => m.default as HomeWidget).catch(() => null));

export async function syncHomeWidget() {
  const s = useSchoolStore.getState();
  if (!s.loaded || isShowing()) return;
  const w = await load();
  if (!w) return;
  // What it says follows the app clock, so the dev clock shows it; when the
  // widget moves on stays on the real clock.
  const now = nightNow();
  const shift = Date.now() - now.getTime();
  try {
    w.updateTimeline(widgetTimeline(s.classes, s.assignments, now).map((e) => ({ date: new Date(e.date.getTime() + shift), props: { ...e.props, ink: INK } })));
  } catch {}
}

let timer: ReturnType<typeof setTimeout> | undefined;
const soon = () => {
  clearTimeout(timer);
  timer = setTimeout(syncHomeWidget, 1000);
};

/** Once, at launch. */
export function startHomeWidget() {
  const offStore = useSchoolStore.subscribe((s, prev) => {
    if (s.loaded !== prev.loaded || s.classes !== prev.classes || s.assignments !== prev.assignments) soon();
  });
  const offClock = subscribeNightClock(soon);
  const offApp = AppState.addEventListener('change', (state) => {
    if (state === 'background') syncHomeWidget();
  });
  return () => {
    offStore();
    offClock();
    offApp.remove();
    clearTimeout(timer);
  };
}
