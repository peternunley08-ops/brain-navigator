# Apple Watch Companion — Plan (Phase 6.1)

Not built this session. A real watchOS target needs Xcode, a paired
simulator or physical Watch, and (for haptic/notification entitlements)
Apple Developer signing — none of which exist in an unattended CLI session.
Writing code that can't be run or seen would just be an unverified guess, so
this is a plan for a future session that *does* have that environment.

## What it's for

The original framing (from early design discussion): the watch is a
**haptic-only intake** surface — the fastest possible way to register "I'm
carrying something right now" without opening the phone, typing, or even
looking at a screen. It is not a reading surface. It does one thing.

## Why it can't be a plain Expo screen

Managed Expo does not support a watchOS companion target — watchOS apps are a
genuinely separate app target (their own bundle, their own lifecycle, running
on watchOS not iOS) that talks to the phone app over `WatchConnectivity`, not
just another React Native screen. This means:

- The project would need to move (at least partially) to **bare workflow** or
  add a **native watchOS target via a config plugin** — not a pure
  `npx expo install` situation.
- The watch UI itself would most reasonably be **native SwiftUI**, not React
  Native — RN doesn't run on watchOS. This is a different skill/tooling track
  from the rest of this codebase, not an extension of it.

## Proposed interaction (single screen)

- One large tappable complication/button on the watch face or app: a single
  haptic buzz on tap, confirming intake was logged.
- Optionally, a short (2–3 option) crown-scroll picker for intensity — no
  keyboard, no free text. Mood/notes/catalysts stay phone-only.
- On tap: writes a minimal `cognitive_state` row (`state: 'unlocked'`,
  `intensity`, `mood: null`) — either directly to Supabase from the watch (if
  it has its own network path) or relayed to the phone app via
  `WatchConnectivity` and inserted from there, whichever proves more reliable
  in testing.

## What a future session needs before starting

1. Xcode installed, a watchOS simulator (or a paired physical Watch) available.
2. A decision on bare workflow vs. a native watchOS target added via a
   development-build config plugin — research both against the current Expo
   SDK 57 setup before picking.
3. An Apple Developer account for real device testing (simulator-only testing
   can proceed without one).

## Out of scope for the watch, on purpose

Reading history, closing loops (Closure Ring), shelving, the Trove, the
Entry Threshold quote gate — all of that stays phone-only. The watch's whole
value is being faster and lower-friction than the phone, not a smaller
version of it.
