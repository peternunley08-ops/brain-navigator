import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { CandleGlyph } from './ui/CandleGlyph';
import { useLifeStore } from '../core/lifeStore';
import { alpha, colors } from '../core/theme';

// While the app is inactive or in the background (the app switcher), a calm
// candle covers the screen so private pages never show in the preview.
export function PrivacyVeil() {
  const off = useLifeStore((s) => !!s.settings.veilOff);
  const [away, setAway] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setAway(state !== 'active'));
    return () => sub.remove();
  }, []);

  if (off || !away) return null;
  return (
    <View style={styles.veil} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.glow} />
      <CandleGlyph size={96} intensity={0.55} />
    </View>
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: alpha(colors.flame, 0.07),
  },
});
