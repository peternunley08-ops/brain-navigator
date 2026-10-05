/// <reference types="node" />
// The AI allowance: what counts, when it resets, and the spend log.
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { FREE_PER_WEEK, PLUS_PER_MONTH, aiBreakdown, aiSpend, aiStatus, canUseAI, recordAIUse } from '../core/aiQuota';
import { useLifeStore, weekOf } from '../core/lifeStore';

const reset = (plus = false) => {
  const st = useLifeStore.getState();
  useLifeStore.setState({ ai: { week: '', weekUsed: 0, month: '', monthUsed: 0 }, settings: { ...st.settings, plus } });
};

describe('AI allowance', () => {
  beforeEach(() => reset());

  it('free: counts replies against the week, not background jobs', () => {
    recordAIUse('ember', 0.6);
    recordAIUse('ember', 0.1, false);
    const s = aiStatus();
    assert.equal(s.used, 1);
    assert.equal(s.left, FREE_PER_WEEK - 1);
    assert.equal(s.limit, FREE_PER_WEEK);
  });

  it('free: runs out at the weekly limit', () => {
    for (let i = 0; i < FREE_PER_WEEK; i++) recordAIUse();
    assert.equal(canUseAI(), false);
    assert.equal(aiStatus().left, 0);
  });

  it('a new week starts fresh', () => {
    useLifeStore.setState({ ai: { week: '2020-01-06', weekUsed: FREE_PER_WEEK, month: '2020-01', monthUsed: 5 } });
    assert.equal(aiStatus().used, 0);
    assert.equal(canUseAI(), true);
    recordAIUse();
    assert.equal(useLifeStore.getState().ai.week, weekOf());
    assert.equal(useLifeStore.getState().ai.weekUsed, 1);
  });

  it('plus: counts against the month', () => {
    reset(true);
    recordAIUse();
    const s = aiStatus();
    assert.equal(s.limit, PLUS_PER_MONTH);
    assert.equal(s.used, 1);
    assert.ok(s.resetsIn >= 1 && s.resetsIn <= 31);
  });

  it('spend: total cents, counted replies, and the typical (median) wait', () => {
    useLifeStore.setState({ ai: { week: '', weekUsed: 0, month: '', monthUsed: 0, log: [] } });
    recordAIUse('ember', 1, true, 1000);
    recordAIUse('ember', 1, true, 2000);
    recordAIUse('ember', 1, true, 30000);
    recordAIUse('memory', 0.5, false, 9000);
    const s = aiSpend();
    assert.equal(s.cents, 3.5);
    assert.equal(s.replies, 3);
    assert.equal(s.typicalMs, 2000);
  });

  it('breakdown groups counted replies by what they were for', () => {
    useLifeStore.setState({ ai: { week: '', weekUsed: 0, month: '', monthUsed: 0, log: [] } });
    recordAIUse('steps');
    recordAIUse('steps');
    recordAIUse('ember');
    recordAIUse('memory', 0, false);
    assert.deepEqual(aiBreakdown().map((r) => [r.label, r.count]), [
      ['Study steps', 2],
      ['Ember', 1],
    ]);
  });
});
