@AGENTS.md

# Brain Navigator — Architecture

Expo Router (SDK 57) + React Native. Single-user MVP: **no Supabase Auth
anywhere** — every table uses wide-open `anon` RLS policies. Never introduce
`auth.users` or per-user RLS.

## Layout

- `app/` — Expo Router file-based routes (screens). One nested dynamic
  route: `app/entry/[id].tsx`.
- `core/` — flat lib layer: one Zustand store per domain (`healthStore.ts`,
  `tasksStore.ts`, `wellnessStore.ts`, …), `theme.ts` (design tokens — "The
  Glasshouse Study", revised 2026-09-23 to aged vellum + near-black ink +
  brass/verdigris instrument accents, rust reserved as the one deliberately
  saturated color for the `unlocked` state — see "Design system" below),
  `supabase.ts` (client), `schema.sql` (source of truth for the DB —
  append-only phase log, run live via the Supabase SQL editor).
- `components/ui/` — reusable design-system primitives (Button, Card,
  gauges, charts, meters).
- `components/` (root) — one-off feature components (`BottomNav.tsx`,
  `BreathInstrument.tsx`, `EntryThreshold.tsx`, `AmbientAudioEngine.tsx` —
  the last one is **no longer mounted**, see "Current state").
- `core/hooks/` — shared hooks: `useRealtimeRefetch`, `useOpenLoops`
  (the one live list of everything open), `useFlameClock` (one UI-thread
  clock per screen that every flame reads).
- `assets/` — images and audio.
- `scripts/` — one-off build/generation scripts.
- `supabase/functions/` — Edge Functions (Deno runtime — excluded from the
  app's `tsconfig.json`, different globals than React Native). Currently
  just `chat/` (AI chat proxy, see "Current state" below). Deployed via the
  Supabase dashboard's browser code editor, not the CLI — CLI login is
  broken in this environment (non-interactive, no TTY for the OAuth flow).
- `docs/` — project memory and planning:
  - `todo.md` — permanent build roadmap/log.
  - `SESSION_LOG.md` — full narrative session history; read this first if
    detail is missing after a conversation summary/compaction.
  - `AUTONOMOUS_BUILD_PROMPT.md` — forward-looking autonomous-build
    instructions.
  - `apple-watch-plan.md`, `encryption-plan.md` — feature planning docs.

## Current state (as of 2026-09-27 — check `git log` for anything newer)

### The app's purpose (redesigned 2026-09-27)

**A place to set down what's weighing on you, and watch each thing close.**
Every open `cognitive_state` entry (`state = 'unlocked'`) is a lit candle on
**The Desk** (`app/index.tsx`, the home route `/`). Closing one plays out on
its candle: **resolve** (`secured`) snuffs the flame, smoke curls off the
wick, a verdigris seal presses into the wax; **let go** (`shelved`) lifts
the flame off the wick and floats it away like a sky lantern. Candle
flame size = the entry's intensity; candle height = how long it's been
open (burns lower over ~21 days). All other features still exist — they
moved into the Drawer rather than being removed.

- **Navigation** (`components/BottomNav.tsx`): Desk `/` · Loops
  `/open-loops` (badge = open count) · centre flame button = "Set
  something down" → `/new-entry` · Map `/topography` · Steady `/steady`.
- **Steady** (`app/steady.tsx`): Breathe, Let it out (`/vent`), Ember
  (`/companion`) — the in-the-moment tools.
- **Drawer** (`app/drawer.tsx`, from the Desk's top-right button): every
  other screen — Check-in, Health, Trends, Tasks, Habits, Nutrition,
  Calendar, Kept (`/trove`), Wellness wheel, The science.
- **User-facing state names** live in `STATE_LABEL` in `core/store.ts`:
  `unlocked` → **Open**, `secured` → **Resolved**, `shelved` → **Let go**.
  The DB values are unchanged; never show the raw ones. "Trove" is shown
  as **Kept**.
- **Open entries** come from one place: `openLoops` in the store (uncapped,
  unlike `history` which is the 50 most recent), kept fresh by
  `useOpenLoops()` — refetches on screen focus *and* on realtime. The nav
  badge reads the store directly. The Map (`topography.tsx`) loads
  `history` itself on focus — the old home screen used to load it at
  launch, and nothing else does now.
- **The flame** is one shared worklet, `flamePath` in `core/flame.ts`,
  used by the Breathe instrument, every candle (`components/ui/Candle.tsx`,
  states `lit | snuffed | floated | unlit`), and the nav icon. Change the
  flame in one place.

### Breathe (`app/breathe.tsx`, `components/BreathInstrument.tsx`, `core/breathPatterns.ts`)

Interactive guided breathing: hold the flame to begin, turn the brass
bezel to pick Box / 4-7-8 / Even (haptic detents, flick momentum, locked
mid-session), tap the flame to pause. All timing runs in one
`useFrameCallback` on the UI thread; React state only carries the words.
Built on Reanimated 4.7 + Gesture Handler 3.3 (**hook API**:
`usePanGesture`, not the old `Gesture.Pan()` builder) + react-native-svg;
JS hops use `scheduleOnRN` from `react-native-worklets`. Reduce Motion
drops dust/flicker/spin but keeps the breathing guide.

### Ambient audio is disabled

`AmbientAudioEngine` looped two audio tracks from the moment the app
launched, with no mute. Its mount was removed from `app/_layout.tsx`
(2026-09-26). The component and `core/audioStore.ts` still exist;
`transitionToMood()` calls are now harmless no-ops. Re-enable only with a
real mute control.

### Running on the user's iPhone

Installed on the user's **iPhone 17 Pro** (devicectl id
`DD1C8E3C-1DC6-598F-BC83-415F2AAFDD09`, UDID `00008150-001C4CE12110C01C`,
iOS 26.7), signed with the free **Personal Team `PQLSGT6XTP`**. Free
signing expires after **7 days** — rebuild + reinstall to refresh. It's a
Release build with the JS bundled in, so it runs without Metro. HealthKit
entitlements signed fine on the free team. Recipe (phone plugged in,
unlocked):

```
cd ios && xcodebuild -workspace brainnavigator.xcworkspace -scheme brainnavigator \
  -configuration Release -destination 'id=00008150-001C4CE12110C01C' \
  -derivedDataPath /tmp/bn-derived-device -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration DEVELOPMENT_TEAM=PQLSGT6XTP \
  CODE_SIGN_STYLE=Automatic build
xcrun devicectl device install app --device DD1C8E3C-1DC6-598F-BC83-415F2AAFDD09 \
  /tmp/bn-derived-device/Build/Products/Release-iphoneos/brainnavigator.app
xcrun devicectl device process launch --device DD1C8E3C-1DC6-598F-BC83-415F2AAFDD09 \
  com.peternunley.brainnavigator
```

If the phone isn't detected: the Mac's "Allow accessory to connect?"
prompt must be accepted, then `xcrun devicectl manage pair --device …`
triggers the phone's Trust prompt. Developer Mode is already on. **The
phone currently has the pre-redesign build** (Breathe included, Desk not).

### Ember

`app/companion.tsx`, `components/ui/Bear.tsx`, `core/companionPrompts.ts`
— a guided, no-AI check-in companion (fixed prompt pool, no language
model). Reachable from Steady and from the Desk's "Talk it through with
Ember" link. Saves into `vent_entries` (same table as Let It Out),
`input_mode = 'companion'`.

### AI chat is scaffolded but paused, unfunded (`supabase/functions/chat/`)

A real Anthropic-API-backed chat, deliberately kept separate from Ember
(Ember's whole value is that nothing leaves the device). The Edge Function
is deployed and reads its key from the **`brain-navigator-v2`** Supabase
secret (not `ANTHROPIC_API_KEY` — accidental naming, left as-is because it
works). Every call returns Anthropic 400 (insufficient credit balance) —
the user's Anthropic account has no billing. No chat UI yet. A proposed
first step, "Recent Insight" (one read-only AI summary card over the last
7 days of data), was recommended and **not approved yet** — see
docs/todo.md Phase 22.

### Known open items

- `core/schema.sql` Phase 26 (add `cognitive_state` to the
  `supabase_realtime` publication) is **written but not run** in the
  Supabase SQL editor. The app doesn't depend on it (it refetches on
  focus); running it makes changes from another device appear live.
- iOS Simulator tip for this project: the simulator tool's screenshots
  are ~2.29× device points (x and y); `inspect` isn't available, so
  calibrate taps against a known target. Deep links
  (`brainnavigator://<route>`) are the reliable way to reach a screen.

## Design system

"The Glasshouse Study" field journal, tokens in `core/theme.ts`: aged
vellum background, near-black ink, brass (`leather`) and verdigris
instrument accents, rust (`unlocked`) as the one deliberately saturated
color. Fonts: Fraunces (display, and an italic for soft headings), Lora
(body), Courier Prime (mono). Every screen was audited (2026-09-24)
against generic-AI design tells. The rule applied throughout, and to apply
to anything new:

- Mono / uppercase / tracked type **only** for a genuine instrument
  readout paired with a number or gauge (stat-card labels over a value,
  RadialGauge captions, chart axis text, legend captions next to a colored
  dot) — never as a decorative section eyebrow or a form-field prompt.
- No "A · B · C" middle-dot copy joins, no "WORD — fragment" labels.
- Headings are serif (Fraunces), sentence case.
- Motion should answer a person's action (ignite, snuff, float, dial
  detent) rather than decorate; respect Reduce Motion.

## Conventions

- Components: PascalCase (`Button.tsx`). Stores/modules: camelCase
  (`healthStore.ts`).
- Native rebuild cycle: `npx expo prebuild --platform ios` →
  `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install` →
  `xcodebuild -derivedDataPath /tmp/bn-derived` (space-free path) →
  `xcrun simctl install`/`launch`.
- `ios/` and `android/` are gitignored, generated by `expo prebuild` — never
  hand-edit.

## Not part of this project

`~/Desktop/Brain Navigator/` is an orphaned, unrelated native SwiftUI/Xcode
scaffold (its own separate git repo) moved out of this directory during a
2026-09-22 cleanup. It predates the real Expo/RN stack and is not referenced
anywhere here.
