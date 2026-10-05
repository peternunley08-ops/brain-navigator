/// <reference types="node" />
// A release build never talks to the developer's Notion.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('release build', () => {
  it('turns Notion sync off', async () => {
    process.env.EXPO_PUBLIC_RELEASE = '1';
    process.env.EXPO_PUBLIC_NOTION_CHECKINS_DB_ID = '3e238967cd5681f1aec2c3ff80536b65';
    const notion = await import('../core/notion');
    assert.deepEqual(notion.NOTION_DB, { tasks: undefined, checkins: undefined, entries: undefined });
    assert.equal(await notion.createNotionPage('3e238967cd5681f1aec2c3ff80536b65', {}), null);
    assert.equal(await notion.updateNotionPage('3e238967cd5681f1aec2c3ff80536b65', {}), false);
  });
});
