import { useEffect } from 'react';
import { openDrawer } from '../components/Drawer';
import { goBack } from '../core/chrome';

// The Drawer is a sheet now (components/Drawer.tsx) that rises over the page
// you're on. An old link to /drawer steps back and slides it up instead.
export default function DrawerRoute() {
  useEffect(() => {
    goBack();
    openDrawer();
  }, []);
  return null;
}
