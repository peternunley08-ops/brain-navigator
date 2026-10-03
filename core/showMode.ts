import { create } from 'zustand';

// Whether "Show someone the app" is on. A tiny module on its own, so the
// database client and every store can check it without import loops.
let on = false;

export const isShowing = () => on;

export const useShowMode = create<{ on: boolean }>(() => ({ on: false }));

export function setShowing(v: boolean) {
  on = v;
  useShowMode.setState({ on: v });
  if (!v) useTour.setState({ step: -1, dismissed: false });
}

// The guided tour of Riley's pages. step -1 = not touring; offered = the
// "Take the tour" chip has been answered (taken or dismissed) this show.
export const TOUR_PATHS = ['/', '/school', '/focus', '/steady', '/year'] as const;
export const useTour = create<{ step: number; dismissed: boolean }>(() => ({ step: -1, dismissed: false }));
export const setTourStep = (step: number) => useTour.setState({ step, dismissed: true });
export const dismissTour = () => useTour.setState({ step: -1, dismissed: true });
