import { create } from 'zustand';

// Whether "Show someone the app" is on. A tiny module on its own, so the
// database client and every store can check it without import loops.
let on = false;

export const isShowing = () => on;

export const useShowMode = create<{ on: boolean }>(() => ({ on: false }));

export function setShowing(v: boolean) {
  on = v;
  useShowMode.setState({ on: v });
}
