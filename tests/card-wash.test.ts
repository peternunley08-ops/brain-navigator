/// <reference types="node" />
// Faint captions on a tinted card. The wash is read from Card.tsx, then
// composited the way the anti-slop audit did: sRGB alpha over surface,
// then WCAG 2 contrast. No second contrast library.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { colors, dimensionColor } from '../core/theme';

function channels(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lin(c: number) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function lum(rgb: number[]) {
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

function composite(tint: string, alpha: number) {
  const fg = channels(tint);
  const bg = channels(colors.surface);
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
}

function ratio(foreground: string, background: number[]) {
  const L1 = lum(channels(foreground));
  const L2 = lum(background);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

function washStops() {
  const src = readFileSync('components/ui/Card.tsx', 'utf8');
  const m = src.match(/alpha\(tint, pressed \? ([0-9.]+) : ([0-9.]+)\), alpha\(tint, pressed \? ([0-9.]+) : ([0-9.]+)\)/);
  assert.ok(m, 'Card wash stops');
  return {
    topPressed: Number(m[1]),
    top: Number(m[2]),
    bottomPressed: Number(m[3]),
    bottom: Number(m[4]),
  };
}

describe('tinted card wash', () => {
  it('keeps faint text tuned for a flat card, and names the existing sky blue', () => {
    const flat = ratio(colors.textFaint, channels(colors.surface));
    // The theme comment is 5.2:1. A lighter faint token (chasing the wash) jumps past this.
    assert.ok(flat > 5 && flat < 5.4, `flat faint contrast ${flat}`);
    assert.equal(colors.sky, dimensionColor.intellectual);
  });

  it('keeps textFaint at 4.5:1 on the top of a tinted card, including while pressed', () => {
    const stops = washStops();
    // The audit's old top stop fails this same composite. Locks the math.
    assert.ok(ratio(colors.textFaint, composite(colors.flame, 0.11)) < 4.5);
    const tints = [colors.flame, colors.unlocked, colors.secured, colors.shelved, colors.sky, colors.danger];
    for (const tint of tints) {
      assert.ok(ratio(colors.textFaint, composite(tint, stops.top)) >= 4.5);
      assert.ok(ratio(colors.textFaint, composite(tint, stops.topPressed)) >= 4.5);
    }
    assert.ok(stops.top <= stops.topPressed);
    assert.ok(stops.topPressed <= 0.06);
    assert.ok(stops.bottom < stops.top);
    assert.ok(stops.bottomPressed < stops.topPressed);
  });
});
