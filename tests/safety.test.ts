/// <reference types="node" />
// The crisis protocol: what counts as "sounds like danger", and that the app
// and the server agree on it (docs/legal/CRISIS-PROTOCOL.md).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { redact, soundsLikeCrisis } from '../core/emberAI';

describe('crisis detection', () => {
  it('catches the ways teens say it', () => {
    for (const s of ['I want to die', 'i wanna die lol', 'thinking about suicide', 'I keep cutting myself', 'everyone would be better off without me', 'I dont want to be here anymore', 'my dad hits me', 'I am not safe at home', 'took an overdose', 'self-harm again']) {
      assert.equal(soundsLikeCrisis(s), true, s);
    }
  });

  it('leaves everyday school stress alone', () => {
    for (const s of ['this test is killing me', 'I could die of embarrassment', 'cut the essay down to 500 words', 'hit me with a quiz', 'I hate chemistry']) {
      assert.equal(soundsLikeCrisis(s), false, s);
    }
  });

  it('the server uses the same word list as the app', () => {
    const app = readFileSync('core/emberAI.ts', 'utf8').match(/const CRISIS =\s*\n\s*(\/.+\/i);/)?.[1];
    const server = readFileSync('supabase/functions/ember/index.ts', 'utf8').match(/const CRISIS =\s*\n\s*(\/.+\/i);/)?.[1];
    assert.ok(app && server);
    assert.equal(server, app);
  });
});

describe('redact', () => {
  it('blanks phone numbers, emails and street addresses before anything is sent', () => {
    assert.equal(redact('text me at 555-123-4567'), 'text me at [phone]');
    assert.equal(redact('my email is sam.lee@gmail.com'), 'my email is [email]');
    assert.equal(redact('I live at 42 Maple Street'), 'I live at [address]');
    assert.equal(redact('chapter 12 is due'), 'chapter 12 is due');
  });
});
