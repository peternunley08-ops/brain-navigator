@AGENTS.md

# Brain Navigator — Architecture

Expo Router (SDK 57) + React Native. Single-user MVP: **no Supabase Auth
anywhere** — every table uses wide-open `anon` RLS policies. Never introduce
`auth.users` or per-user RLS.

## Layout

- `app/` — Expo Router file-based routes (screens). One nested dynamic
  route: `app/entry/[id].tsx`.
- `core/` — flat lib layer: one Zustand store per domain (`healthStore.ts`,
  `tasksStore.ts`, `wellnessStore.ts`, …), `theme.ts` (design tokens —
  "Candlelight", the night palette, see "Design system" below),
  `ember.ts` + `emberStore.ts` (the mascot's advice and state),
  `supabase.ts` (client), `schema.sql` (source of truth for the DB —
  append-only phase log, run live via the Supabase SQL editor).
- `components/ui/` — the design kit: `Screen` (the frame every screen is
  built in), `Backdrop`, `Reveal`, `Pressy`, `Button`, `Card`, `Chip`,
  `Field`, `IconButton`, `Icon` (the app's own line icons), `Section`,
  `Stepper`, `StatTile`, `Ring`, `EmptyState`, `Candle`/`CandleGlyph`,
  `TrackSlider`, `HoldToConfirm`, `MoodPicker`, charts and meters.
- `components/ember/` — Ember the mascot: `useEmberRig`, `EmberSprite`
  (+ still `EmberGlyph`), `EmberBuddy` (the overlay on every screen),
  `EmberBubble`, `Sparks`.
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

## Current state (as of 2026-09-29 — check `git log` for anything newer)

### Ember, the mascot (added 2026-09-29)

A small living flame with a face that floats over every screen
(`components/ember/EmberBuddy.tsx`, mounted in `app/_layout.tsx` after the
launch gate). It replaced the old bear, which was also called Ember.

- **Tap** it: a speech bubble with the most useful thing to say right now
  plus buttons that take you there, "This screen" (a plain explanation of
  the current route), "Something else", and "Nap".
- **Drag** it anywhere; it springs to the nearest side edge (flame trails
  and stretches with the motion). Position is saved to `ember.json` in the
  app's documents folder. **Hold** it for a kind line. **Shake** it and it
  gets dizzy. **Nap** tucks it into a small ember at the edge; tap to wake.
- A glowing dot on its head means it has something worth saying
  (priority ≥ 2 tip not yet opened this session).
- Hidden on `/companion` and `/breathe`, and while the keyboard is up.
- **What it says** is in `core/ember.ts` (`adviseFor(pathname)`): no AI,
  rules over data already in the stores — no check-in yet, stress ≥ 7,
  sleep < 6h, a candle open 7+ days, 4+ open, plate over cap, an unlogged
  daily habit, late night — plus the per-route explanations (`ABOUT`).
- Screens make it react with `emberSay(text, mood)` (exported from
  `EmberBuddy.tsx`) after real events: an entry saved, resolved or let go,
  a check-in, the plate cleared, all habits done, a vent released,
  grounding finished, mindful minutes logged.
- The launch gate (`components/EntryThreshold.tsx`) is Ember asleep: hold
  it to wake it and come in.

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
  `/open-loops` (badge = open count) · centre gold "+" button = "Set
  something down" → `/new-entry` · Map `/topography` · Steady `/steady`.
  Tabs pop back to an existing copy (`router.dismissTo`) instead of
  stacking a new one.
- **Steady** (`app/steady.tsx`): Breathe, Let it out (`/vent`), Ember
  (`/companion`), and an inline 5-4-3-2-1 grounding exercise — the
  in-the-moment tools.
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
phone has the build from commit 136ba1e** (night redesign, Ember, audit
fixes), installed and launched 2026-09-29 — free signing means it needs a
rebuild by about 2026-10-06.

### Talking it through with Ember (`app/companion.tsx`)

A conversation with Ember on stage (its own rig — it talks while a line
appears, listens while you type, thinks while waiting, cheers when you
finish). Opens with a question from `core/companionPrompts.ts`; after that
it's AI when available (see "Ember's AI brain" below) and the original
fixed two-question flow when not. Reachable from Steady, the Desk's "Talk
it through" link, and "Talk to me" in Ember's tips. Saves into
`vent_entries` (same table as Let It Out), `input_mode = 'companion'`,
only after the save succeeds.

### Ember's AI brain (built 2026-09-29, waiting on Anthropic credit)

The user asked for the mascot to run on AI. There is **no AI key in
`.env`** (only Supabase, Google, Notion). The only AI key is the Anthropic
key in the Supabase Edge Function secret **`brain-navigator-v2`** (not
`ANTHROPIC_API_KEY` — accidental naming, left as-is), and every call still
returns Anthropic 400 **"credit balance is too low"** — checked 2026-09-29.
Adding credits in the Anthropic Console is the user's step, never ours.

- `supabase/functions/ember/index.ts` — Ember's persona + safety rules
  (not a therapist; crisis → 988), receives `{ messages, context }`,
  calls `claude-sonnet-5-5` (max 300 tokens), returns `{ reply, action }`
  where `action` is one optional next step (breathe, vent, ground,
  checkin, setdown, loops, tasks, habits, map, trends). Errors come back as
  a short `code` (`no_credit`, `busy`, `upstream`) — never the raw body.
  **Not deployed yet**: deploy it from the Supabase dashboard (Edge
  Functions → Deploy new function → via editor → name `ember` → paste →
  Deploy). CLI login doesn't work here.
- `core/emberAI.ts` — `askEmber(turns, screen)` tries `ember`, falls back
  to the older `chat` function (persona folded into the first message) if
  `ember` returns 404, and reports `no_credit | offline | unavailable`
  otherwise. `emberContext()` builds the short factual note sent along:
  time, open candle titles/weights/ages, today's check-in numbers, plate
  and habit counts.
- `app/companion.tsx` — the conversation: Ember opens with a fixed
  question, then answers with AI, shows a typing indicator, and can offer
  one action button. Tap Done to save the conversation (vent_entries,
  `input_mode = 'companion'`, only after the save succeeds). Without AI,
  Ember says why in a dashed aside and falls back to the original
  follow-up question → closing. A line under the input says replies are
  written by Claude and what's typed is sent to Anthropic.
- Every tip in the floating bubble ends with a "Talk to me" button that
  opens this conversation. The tips themselves stay rule-based (instant,
  free).
- The old `chat` function still has a TEMP DEBUG branch returning the
  upstream error body, and model `claude-sonnet-5` (unverified). Deploying
  `ember` makes both moot for Ember.
- "Recent Insight" (Phase 22 addendum) is still not approved or built.

### Known open items

- `core/schema.sql` Phase 26 (add `cognitive_state` to the
  `supabase_realtime` publication) is **written but not run** in the
  Supabase SQL editor. The app doesn't depend on it (it refetches on
  focus); running it makes changes from another device appear live.
- iOS Simulator tip for this project: the simulator tool's screenshots
  are ~2.29× device points (x and y); `inspect` isn't available, so
  calibrate taps against a known target. Deep links
  (`brainnavigator://<route>`) are the reliable way to reach a screen —
  except when the Mac is under heavy load, when they can stall; real taps
  are more reliable then. In development builds a "Open debugger to view
  warnings" toast shows at the bottom; it predates the redesign and the
  debugger socket needs auth, so its text hasn't been read yet.

## Design system

**"Candlelight"** (2026-09-29; replaced the vellum "Glasshouse Study"),
tokens in `core/theme.ts`. A warm night room lit by the candles:
`night`/`surface`/`surfaceHigh`/`surfaceSunk` backgrounds, parchment
`text`/`textMuted`/`textFaint`, hairline `line`/`lineStrong` edges.
**Candle gold (`flame`) is the only action color** — primary buttons are
a gold gradient with dark `flameInk` text. Entry states: ember
`unlocked` (Open), sage `secured` (Resolved), lavender `shelved` (Let
go). `dimensionColor` gives each wellness area its own color; `alpha()`
makes tints. Backgrounds come from `gradients.room | ember | dusk` via
`Backdrop`. The old token names (`ink`, `leather`, `background`, …) are
gone. Fonts: Fraunces (display; its italic is Ember's voice and the
reflective lines) and Figtree (everything else; `fonts.mono` is Figtree
semibold for numbers). Lora and Courier Prime are no longer loaded.

Build every screen with `Screen` + the kit in `components/ui/` rather than
hand-rolled layout. Rules to keep:

- No uppercase / tracked eyebrow labels; section headings are Fraunces,
  sentence case (`Section`). Labels over numbers are small Figtree.
- No "A · B · C" middle-dot copy joins, no "WORD — fragment" labels.
- Every tappable thing uses `Pressy` (spring press + haptic) or a kit
  component built on it.
- Motion should answer a person's action (ignite, snuff, float, a press,
  a drag) or bring content in once (`Reveal`); respect Reduce Motion
  (Reanimated layout animations and the rigs already do).
- Don't claim privacy the app doesn't have: entries, vents, and
  check-ins are stored in Supabase; only speech-to-text is on-device.

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
