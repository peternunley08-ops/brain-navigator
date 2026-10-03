import type { ReactElement } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { alpha, colors } from '../../core/theme';

// Small line illustrations for the + sheet, keyed by the option's href.
// Candlelight colours, 1.6 strokes, drawn on a 48 grid.
const S = { strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

const gold = colors.flame;
const glow = alpha(colors.flame, 0.18);
const soft = colors.textMuted;

const ART: Record<string, () => ReactElement> = {
  // Homework: a page with a check.
  '/add-assignment': () => (
    <>
      <Rect x={11} y={7} width={26} height={34} rx={4} stroke={soft} {...S} />
      <Path d="M17 16h14M17 22h9" stroke={soft} {...S} />
      <Path d="M19 33l4 4 8-9" stroke={gold} {...S} strokeWidth={2} />
    </>
  ),
  // Something on my mind: folded paper.
  '/new-entry': () => (
    <>
      <Path d="M10 12h20l8 8v18a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2z" stroke={soft} {...S} fill={glow} />
      <Path d="M30 12v8h8" stroke={gold} {...S} />
      <Path d="M16 28h16M16 34h10" stroke={soft} {...S} />
    </>
  ),
  // Focus: a candle.
  '/focus': () => (
    <>
      <Circle cx={24} cy={14} r={11} fill={glow} />
      <Path d="M24 6c3 3 4 6 0 10c-4-4-3-7 0-10z" stroke={gold} {...S} />
      <Rect x={18} y={21} width={12} height={19} rx={2} stroke={soft} {...S} />
      <Path d="M24 17v4M14 42h20" stroke={soft} {...S} />
    </>
  ),
  // Scan: a frame with a small picture.
  '/scan': () => (
    <>
      <Path d="M8 17V11a3 3 0 0 1 3-3h6M31 8h6a3 3 0 0 1 3 3v6M40 31v6a3 3 0 0 1-3 3h-6M17 40h-6a3 3 0 0 1-3-3v-6" stroke={soft} {...S} />
      <Path d="M15 32l6-7 4 4 3-3 5 6z" stroke={gold} {...S} />
      <Circle cx={29} cy={19} r={2} stroke={gold} {...S} />
    </>
  ),
  // A win: a jar with a spark.
  '/wins': () => (
    <>
      <Path d="M17 10h14M18 10v4c-4 2-6 5-6 9v14a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3V23c0-4-2-7-6-9v-4" stroke={soft} {...S} />
      <Path d="M24 22l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" stroke={gold} {...S} />
    </>
  ),
  // Flashcards: two cards.
  '/flashcards': () => (
    <>
      <Rect x={9} y={14} width={26} height={20} rx={3} stroke={soft} {...S} />
      <Rect x={15} y={10} width={26} height={20} rx={3} stroke={gold} {...S} fill={glow} />
    </>
  ),
};

export function hasPlusArt(href: string) {
  return href in ART;
}

export function PlusArt({ href, size = 44 }: { href: string; size?: number }) {
  const art = ART[href];
  if (!art) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {art()}
    </Svg>
  );
}
