// Which build this is. A release build (EXPO_PUBLIC_RELEASE=1 in the build's
// environment) is the one other students install: anything wired to the
// developer's own accounts stays off in it (docs/legal/RELEASE-COMPLIANCE.md).
export const IS_RELEASE = process.env.EXPO_PUBLIC_RELEASE === '1';
