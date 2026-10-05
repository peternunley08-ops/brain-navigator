/// <reference types="node" />
// Entry photos live in a private bucket; old rows hold public URLs.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { imagePath } from '../core/imageUpload';

describe('imagePath', () => {
  it('keeps a stored path', () => {
    assert.equal(imagePath('entries/abc/1.jpg'), 'entries/abc/1.jpg');
  });

  it('reads the path out of an older public or signed URL', () => {
    assert.equal(imagePath('https://x.supabase.co/storage/v1/object/public/snapshot-images/entries/abc/1.jpg'), 'entries/abc/1.jpg');
    assert.equal(imagePath('https://x.supabase.co/storage/v1/object/sign/snapshot-images/entries/abc/1.jpg?token=t'), 'entries/abc/1.jpg');
  });

  it('refuses links it does not recognize', () => {
    assert.equal(imagePath('https://example.com/cat.jpg'), null);
    assert.equal(imagePath(''), null);
  });
});
