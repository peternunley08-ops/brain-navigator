import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { craftCatalog, elevation, layers, material } from '../core/craft';
import { colors } from '../core/theme';

describe('craft', () => {
  it('counts the material, elevation, radius, state, tone, contrast, and motion product', () => {
    const { count } = craftCatalog();
    assert.ok(count >= 1000);
    assert.equal(count, 4 * 4 * 5 * 4 * 8 * 2 * 2);
  });

  it('keeps toast above the sheet and the sheet above chrome', () => {
    assert.ok(layers.toast > layers.sheet && layers.sheet > layers.chrome);
  });

  it('leaves rest unshadowed and lifts a raised surface', () => {
    assert.equal('shadowOpacity' in elevation('rest'), false);
    assert.equal(elevation('raised').shadowOpacity, 0.28);
  });

  it('paints sunk material with the sunk surface token', () => {
    assert.equal(material('sunk').backgroundColor, colors.surfaceSunk);
  });
});
