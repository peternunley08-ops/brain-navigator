import { router } from 'expo-router';
import { makeMutable, withTiming } from 'react-native-reanimated';
import { timings } from './motion';

// The app's frame, shared by every page: the one bottom nav, and how it and
// Ember behave while a page scrolls. These are UI-thread values, so the nav
// and Ember follow a scroll without any JavaScript running per frame.

/** 1 when the page in front wants the nav, 0 when it doesn't. */
export const navWanted = makeMutable(1);
/** 1 while the nav is tucked away for reading (scrolling down a long page). */
export const navTucked = makeMutable(0);
/** 1 while a page is being dragged or is gliding; Ember steps aside. */
export const scrolling = makeMutable(0);

/** The page in front says whether it wants the nav. */
export function wantNav(want: boolean) {
  navWanted.value = withTiming(want ? 1 : 0, timings.base);
  navTucked.value = withTiming(0, timings.base);
  scrolling.value = 0;
}

// Tapping the tab you're already on sends the page in front to the top.
let toTop: (() => void) | null = null;
export function setScrollToTop(fn: (() => void) | null) {
  toTop = fn;
}
export function clearScrollToTop(fn: () => void) {
  if (toTop === fn) toTop = null;
}
export function scrollFocusedToTop() {
  toTop?.();
}

// Pages open with a short staggered settle the first time they're opened in
// a session; after that they're simply there.
const opened = new Set<string>();
export function firstOpen(path: string) {
  if (opened.has(path)) return false;
  opened.add(path);
  return true;
}

/**
 * Back, or the Desk when there's nothing to go back to (a page opened
 * straight from a link or a notification is the only one in the stack).
 */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Holding Back: straight home to the Desk, closing everything on the way. */
export function goHome() {
  if (router.canDismiss()) router.dismissAll();
  router.navigate('/');
}

