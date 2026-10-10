import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// The privacy policy says "no tracking or analytics" (docs/legal/PRIVACY-POLICY.md),
// and under California law an ad pixel or reusable analytics can count as selling
// data (docs/legal/RELEASE-COMPLIANCE.md, T1). Adding one of these means rewriting
// the policy, the App Privacy label, and an under-16 opt-in first.
const TRACKERS = [
  /analytics/i,
  /firebase/i,
  /sentry/i,
  /amplitude/i,
  /mixpanel/i,
  /^@segment\//i,
  /posthog/i,
  /facebook|fbsdk|meta-pixel/i,
  /appsflyer/i,
  /^@adjust\/|react-native-adjust/i,
  /react-native-branch/i,
  /bugsnag/i,
  /datadog/i,
  /tracking-transparency/i,
  /google-mobile-ads|admob/i,
];

describe('no trackers (privacy policy)', () => {
  it('ships no analytics, ads, crash or tracking packages', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    const found = names.filter((n) => TRACKERS.some((t) => t.test(n)));
    assert.deepEqual(found, [], `Tracking packages found: ${found.join(', ')}. Update the privacy policy first.`);
  });
});
