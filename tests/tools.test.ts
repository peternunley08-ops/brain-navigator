/// <reference types="node" />
// The Drawer's regrouping keeps every tool (docs/design/DIRECTION.md, phase 3).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GROUPS, TOOLS, toolFor } from '../core/tools';

describe('Drawer tools', () => {
  it('has all 45 tools in five groups, none twice', () => {
    assert.equal(GROUPS.length, 5);
    assert.equal(TOOLS.length, 45);
    assert.equal(new Set(TOOLS.map((t) => t.path)).size, 45);
  });

  it('keeps the help page and search reachable', () => {
    assert.ok(toolFor('/help'));
    assert.ok(toolFor('/search'));
    assert.ok(toolFor('/aid'));
  });
});
