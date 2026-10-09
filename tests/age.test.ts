import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ageAllowed, bandFromApple, canPick, sourceFromApple } from '../core/age';

describe('age range (B6)', () => {
  it('reads Apple’s ranges, split at 13, 16, and 18', () => {
    const d = 'selfDeclared';
    assert.equal(bandFromApple({ lowerBound: null, upperBound: 12, ageRangeDeclaration: d }), 'under13');
    assert.equal(bandFromApple({ lowerBound: 13, upperBound: 15, ageRangeDeclaration: d }), '13-15');
    assert.equal(bandFromApple({ lowerBound: 16, upperBound: 17, ageRangeDeclaration: d }), '16-17');
    assert.equal(bandFromApple({ lowerBound: 18, upperBound: null, ageRangeDeclaration: d }), '18+');
  });

  it('doesn’t count the adult stand-in from before iOS 26 as an answer', () => {
    assert.equal(bandFromApple({ lowerBound: 18, upperBound: null }), null);
    assert.equal(bandFromApple({ lowerBound: 18, upperBound: null, ageRangeDeclaration: null }), null);
  });

  it('has no band when Apple gives no bounds', () => {
    assert.equal(bandFromApple({ lowerBound: null, upperBound: null, ageRangeDeclaration: 'selfDeclared' }), null);
  });

  it('keeps who declared it', () => {
    assert.equal(sourceFromApple('selfDeclared'), 'self');
    assert.equal(sourceFromApple('guardianDeclared'), 'guardian');
    assert.equal(sourceFromApple('confirmed'), 'confirmed');
  });

  it('lets in 13 and up, and nobody unasked', () => {
    const at = '2026-10-09T12:00:00.000Z';
    assert.equal(ageAllowed(undefined), false);
    assert.equal(ageAllowed(null), false);
    assert.equal(ageAllowed({ band: 'under13', source: 'picked', at }), false);
    assert.equal(ageAllowed({ band: '13-15', source: 'guardian', at }), true);
    assert.equal(ageAllowed({ band: '18+', source: 'picked', at }), true);
  });

  it('only offers a pick where no age law needs Apple’s answer', () => {
    assert.equal(canPick(null, null), true);
    assert.equal(canPick(false, []), true);
    assert.equal(canPick(true, null), false);
    assert.equal(canPick(null, ['declaredAgeRangeRequired']), false);
    assert.equal(canPick(null, ['significantAppChangeRequiresParentalConsent']), true);
    // Apple's own "no law here" outranks the feature list.
    assert.equal(canPick(false, ['declaredAgeRangeRequired']), true);
    assert.equal(canPick(true, []), false);
  });
});
