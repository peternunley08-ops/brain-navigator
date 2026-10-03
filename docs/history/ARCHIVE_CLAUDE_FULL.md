@AGENTS.md

# Brain Navigator — Architecture

Expo Router (SDK 57) + React Native. Single-user MVP: **no Supabase Auth
anywhere** — every table uses wide-open `anon` RLS policies. Never introduce
`auth.users` or per-user RLS.

## Layout

- `app/` — Expo Router file-based routes (screens). Nested dynamic
  routes: `app/entry/[id].tsx`, `app/assignment/[id].tsx`,
  `app/note/[id].tsx`, `app/class/[id].tsx`, `app/deck/[id].tsx`.
- `core/` — flat lib layer: one Zustand store per domain (`healthStore.ts`,
  `tasksStore.ts`, `wellnessStore.ts`, …), `theme.ts` (design tokens —
  "Candlelight", the night palette, see "Design system" below),
  `ember.ts` + `emberStore.ts` + `emberAI.ts` (the mascot's advice, state,
  and AI), `schoolStore.ts` + `hubStore.ts` + `lifeStore.ts` (school,
  hub, and student-life data, stored on the phone — see "High school hub"
  and "The Masterpiece"), `achievements.ts` (quiet badges + warmth),
  `emberLook.ts` (Ember's color themes and accessories), `undoStore.ts`,
  `dayLines.ts`, `dates.ts`, `scanParser.ts`,
  `canvas.ts`, `supabase.ts` (client), `schema.sql` (source of truth for
  the DB — append-only phase log, run live via the Supabase SQL editor).
- `modules/text-recognition/` — a **local native Expo module** (Swift,
  Apple Vision) that reads text from an image on-device. Autolinked by
  `pod install`; needs a native rebuild to take effect. JS side uses
  `requireOptionalNativeModule`, so older builds degrade to paste-text.
- `components/school/` — `AssignmentRow`, `NowCard`.
- `components/desk/` — `CountdownChips`, `OneThing`, `WhatsNew`.
- `components/` root also has `AchievementWatcher` (awards badges, mounted
  in `_layout`), `UndoBar` (the 5-second "Undo" pill), and `ErrorScreen`
  (exported as `ErrorBoundary` from `app/_layout.tsx`).
- `components/ui/` — the design kit: `Screen` (the frame every screen is
  built in: it says whether the page wants the nav, draws the compact
  glass top bar once the title scrolls away (`barTitle` for pages without
  a `title`), tucks the nav while reading, and takes "tap the tab to go
  up"), `Backdrop`, `Reveal` (settles a page only the first time it opens
  in a session), `Pressy`, `Button`, `Card`, `Chip`,
  `Field`, `IconButton`, `Icon` (the app's own line icons), `Section`,
  `Stepper`, `StatTile`, `Ring`, `EmptyState`, `Candle`/`CandleGlyph`,
  `TrackSlider`, `HoldToConfirm`, `MoodPicker`, `ProgressBar`,
  `Segmented`, `Sparkline`, `TimeField` (takes an `hours` list —
  `EVENING_HOURS`/`MORNING_HOURS`), charts and meters.
- `components/ember/` — Ember the mascot: `useEmberRig`, `EmberSprite`
  (+ still `EmberGlyph`), `EmberBuddy` (the overlay on every screen),
  `EmberBubble`, `Sparks`.
- `components/` (root) — one-off feature components (`BottomNav.tsx`,
  drawn **once** in `app/_layout.tsx` above every page, never inside a
  page; a page hides it with `<Screen nav={false}>` or `wantNav(false)`,
  `BreathInstrument.tsx`, `EntryThreshold.tsx`, `AmbientAudioEngine.tsx` —
  the last one is **no longer mounted**, see "Current state").
- `core/chrome.ts` — the frame's shared UI-thread values (`navWanted`,
  `navTucked`, `scrolling`), `wantNav`, scroll-to-top, `firstOpen`, and
  `goBack()` (use it instead of `router.back()`: a page opened straight
  from a link has nothing behind it, and it lands on the Desk instead of
  erroring) and `goHome()` (holding any Back).
  `core/tools.ts` — every Drawer tool (the Drawer reads it;
  `components/OpenWatcher.tsx` counts opens for "Recently opened" and
  "Most used").
  `core/motion.ts` — every spring and timing (`springs`, `timings`).
- `core/about.ts`, `core/learned.ts`, `app/about.tsx`,
  `components/about/` — About you (Round 5, `docs/rounds/round-5.md`):
  what the student tells the app and what it notices, kept on the phone
  in `life.json` under `about`; goes to the AI only if `about.shareWithAI`.
- `core/hooks/` — shared hooks: `useClearOnSend` (chat boxes), `useRealtimeRefetch`, `useOpenLoops`
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

## Current state (as of 2026-09-30 — check `git log` for anything newer)

### The Masterpiece (2026-09-30)

The user asked for "100 plus ideas, execute all of them." The plan and
per-idea status live in **`docs/rounds/round-1.md`** (120 ideas, all built;
most verified live). What that added:

- **Data** — `schoolStore`: assignment `starred`, `subtasks` (with `on`
  days from `planBackward()`), `repeat: 'weekly'` (finishing one creates
  next week's), `grades` with `classAverage()`/`letterFor()`/`gpa()`/
  `finalNeeded()`, class `level` (regular/honors/ap) + `credits` +
  category `weights`, focus-session `rating`, `workloadByDay()`,
  `duplicateAssignment`, `restoreAssignment`. `hubStore`: college `tier`
  + visit rating/notes, `scholarships`, `recs`, `activities` (Common App
  limits 50/100/150), `aid` checklist, more note templates (Cornell, lab,
  reading, club), block types `numbered`/`quote`/`divider`,
  `restoreNote`. New `lifeStore` (`life.json`): wins, gratitude, hours
  (service/driving/work), countdowns (+`createdAt`), people, pack list,
  wind-down routine, worry box, flashcard decks (Leitner boxes 1–5,
  `parseCards()` for "front :: back"), weekly reviews, distractions,
  "one thing" per day, achievements, settings (birthday, wind-down, wake,
  goals, Ember theme/accessory, `whatsNewSeen`).
- **Screens** — settings, achievements, year, triage, week, class/[id],
  grades, search, absent, flashcards, deck/[id], techniques, sleep, wins,
  moods, toolkit, worry, people, scholarships, recs, activities, aid,
  hours, countdowns, review. All reachable from the regrouped Drawer.
- **Ember** — five color themes and accessories (cap on College,
  glasses on study screens, headphones on Deep focus, scarf at night)
  unlocked by *warmth* (`core/achievements.ts`); double-tap to pet; new
  tips (birthday, wind-down, flashcards due, a class under ~72%, Sunday
  review, countdown today) and an `ABOUT` line for every new route.
- **Desk** — countdown chips, today's "one thing", all-clear card,
  weekly-review prompt, tonight's load bar, a line for the day, a glow
  that follows the time of day, search in the header, one-time What's New.

**Round 2 (2026-09-30, `docs/rounds/round-2.md`):** the helper crew
(`core/helpers.ts`, `core/helperOffline.ts`, `app/helpers.tsx`,
`app/helper/[id].tsx`, `components/helpers/*`), the AI allowance and Plus
(`core/aiQuota.ts`, `app/plus.tsx` — 20 AI replies/week free, 250/month
Plus; `purchasePlus()` returns `not_configured` until StoreKit is set up;
`askEmber`/`askHelper` check `canUseAI()` and only count successful
replies), multi-screenshot scan (`mergeScans` in `core/scanParser.ts`),
quick capture (`core/quickParse.ts`), Desk cards (`components/desk/*`),
`Skeleton`, `Screen onRefresh`, swipe rows in `AssignmentRow`, and
`add-assignment`/`class-edit`/`new-entry` presented as modal sheets in
`app/_layout.tsx`. The Edge Function `ember` takes an `agent` id for the
helpers' personas (still not deployed).

**Round 3 (2026-09-30 → 10-01, `docs/rounds/round-3.md`):** improvements on
rounds 1 and 2. New pieces: `core/celebrateStore.ts` + `components/Celebration.tsx`
(`celebrate(title, body, color, { key, win })`: once per key, optional
wins-jar entry, "Just Ember" setting), `core/haptics.ts` (every vibration goes
through it; Full / Light / Off in Settings; import it instead of
expo-haptics), `core/words.ts` (essay word counts skip headings),
`core/saveAside.ts`, `components/desk/PinnedNotes.tsx`, `app/ai.tsx`,
`app/privacy.tsx`, `app/whats-new.tsx`. Life settings gained many optional
fields (deskOrder, celebrated, dailyFocusGoal, combo, classAliases,
breathDays, haptics, …); all optional, so older life.json files load as-is.
Committed and pushed 2026-10-01 (A–F in c454311, G–J right after).

Gotchas found while verifying:

- **`alpha()` in `core/theme.ts` is a worklet** (`'worklet'` directive)
  because animated styles call it on the UI thread. `HoldToConfirm`
  crashed ("Tried to synchronously call a Remote Function… alpha") on
  every screen that used it (Settings, and the candle detail since the
  redesign) until this was added. Any helper called inside
  `useAnimatedStyle`/`useAnimatedProps` must be a worklet.
- **The note editor's block inputs are uncontrolled** (`defaultValue`,
  keyed by block type). A controlled `value` lost keystrokes because every
  keystroke re-renders the whole note; converting a block ("# ", "- ",
  "[] ", "> ", "1. ", "---") remounts its field and refocuses it
  immediately from the ref callback.
- **Dev-only crash after hot reloads**: `ExpoFabricView.injectInitializer`
  → `AppContextLost` when an Expo native view (e.g. `LinearGradient` in a
  primary `Button`) mounts after Fast Refresh. Not a production bug —
  relaunch the app after edits before testing flows. Release builds are
  unaffected.
- **The local stores never save before they've loaded** (`commit` returns
  early while `loaded` is false), and a data file that won't parse is kept
  as `<name>.unreadable-<time>` before starting fresh (`core/saveAside.ts`).
  Before this, editing a store file while the dev app ran re-created the
  store empty via Fast Refresh, and the next save wrote that empty state
  over `life.json`, wiping decks, wins, hours, and countdowns in the
  Simulator. Still relaunch after editing a store: the re-created store
  shows empty until it loads again.
- The simulator's `text` action types at ~1 ms/char and drops a trailing
  space; fast-typing races there aren't real-world bugs, but they did
  expose the two real ones above.

### Round 5: smooth, and knows you (2026-10-01 → 10-02, `docs/rounds/round-5.md`)

**The frame** (`components/ui/Screen.tsx`, `core/chrome.ts`, `core/motion.ts`):
one BottomNav drawn in `app/_layout.tsx` that tucks while reading down and
returns on any move up; tap your tab to go up; hold a tab and a label says
what the hold does; a glass compact bar (Back + title, tap to go up) once
the big title scrolls away; full-page swipe back; hold Back for the Desk
(`goHome`); `goBack()` everywhere (a page opened from a link has nothing
behind it); pull past the top brightens the light; the backdrop drifts
slower than the page; a gold reading line under the bar on long pages;
School, Focus, and Steady keep their scroll for 10 minutes; Reveal,
count-ups (`core/hooks/useCountUp`), and chart draw-ins
(`core/hooks/useDrawIn`) play only the first time a page opens in a
session and never under Reduce Motion. Every spring and duration lives in
`core/motion.ts`. Quick-add pages (add-assignment, class-edit, new-entry)
are iOS form sheets with a grabber (`SHEET` in `_layout.tsx`); pass
`sheet` to `Screen` there so it drops the status-bar gap when it is one.
`Section` takes `folded`/`onToggleFold` (Desk sections remember it in
`settings.deskFolded`).

**About you** (`app/about.tsx`, `core/about.ts`, `core/learned.ts`,
`components/about/`, `components/desk/AboutCards.tsx`): what the student
tells the app (This-or-that cards, interests, subjects, study ways,
calmers, cheer style, nickname, goals, daily answers, weekly sentences)
and what it notices from use (focus hour and length, check-in hour, sleep
and mood, what helped), kept in `life.json` under `about`. Rules: it stays
on the phone; every learned thing says what it's based on, needs 5+
examples, and has "Not right"; "Learn from how I use the app" off stops
all of it (including Drawer most-used/recent via `components/OpenWatcher`);
only `aboutForAI()` (told, never learned, never answers or weeks) joins
the AI note, and only when `about.shareWithAI` is on, so "What did Ember
see?" shows it. It shapes the app: Steady's order (`calmOrder`), the
check-in offer on a hard day (`bestCalmer`), Focus's starting length,
the greeting (nickname, night owl / morning person), Ember's cheers
(`cheerLine`), helper chips (`helperChips`). Erase everything has Undo.

### High school hub (2026-09-29)

The user redirected the app toward **high school wellness and student
organization** — "one central hub." Built for one student on their own
phone. **If other students will ever use it, it needs accounts and locked
data first** (today's wide-open RLS would let anyone read every entry) —
that's the user's call; don't build auth without it.

- **Navigation**: Desk `/` · School `/school` (badge = overdue + due
  today) · centre "+" opens a quick-add sheet (homework/test, something on
  your mind, focus session, scan a screenshot) · Focus `/focus` · Steady
  `/steady`. Loops and the Map moved to the Drawer.
- **School data is local**, not Supabase: `core/schoolStore.ts` →
  `school.json` (classes with days/times, assignments with kind/due/
  minutes/`sourceId`, focus sessions, profile: name, grade, sleep goal
  default 9h, nightly homework cap default 2h, stress tags per day).
  `core/hubStore.ts` → `hub.json` (notes, colleges, plan blocks, Canvas
  config, Aeries link). Both load in `app/_layout.tsx`. Selectors must
  return stable references (select the array, filter in render) —
  zustand 5 loops forever on a new array per call.
- **Screens**: `welcome` (first run, Ember onboarding; Desk redirects
  there until `profile.onboarded`), `school` (now card, tonight's load vs
  cap, week strip, grouped due list, done), `add-assignment`,
  `assignment/[id]`, `classes`, `class-edit` (TimeField pickers),
  `focus` (candle burns down as a study timer, Ember in glasses, breaks,
  week bars), `help` (988 call/text, Crisis Text Line HOME to 741741,
  Trevor Project, 911 — opens the phone's own dialer/messages), `scan`,
  `today` (Structured-style timeline: classes, Google Calendar events,
  plan blocks, focus), `notes` + `note/[id]` (Notion-style blocks:
  text/heading/todo/bullet, templates), `college` (deadline + 8-step
  checklist per school, next-deadline ring), `connections`.
- **Integrations, honestly**: Google Calendar (existing sign-in) and
  **Canvas** (personal access token → `/api/v1/planner/items`, dedupes by
  `sourceId`, auto-creates classes; not tested against a real account)
  truly connect. **Google Classroom** comes in by **screenshot** (works
  even when a school blocks outside apps) — the user asked to get around
  school admin blocks; that was declined, and `connections` offers a
  pre-written request to the school's IT instead. Aeries, ParentSquare,
  Common App, Gmail, Drive, Notion, Claude are shortcuts — those services
  don't let other apps read student data.
- **Screenshot import** (`app/scan.tsx`): pick up to 4 screenshots →
  on-device OCR (`modules/text-recognition`) → `core/scanParser.ts`
  (handles Classroom To-do, Classroom class cards with teachers, Canvas
  To Do; tested with sample text) → review with checkboxes and date
  fixes → import. Imported classes have no days/times yet (`days: []`) and
  say "Tap to add days and times."
- **Ember** knows school: overdue work, tests within 3 days (study tips;
  sleep over cramming late at night), tonight's load over cap, college
  deadlines within 14 days, no classes yet, class starting in ≤10 min, teen
  sleep target. The AI prompt/context include classes and what's due and
  forbid doing assignments for them.

### Native rebuild gotcha (prebuilt React Native core)

RN 0.86 here uses a **prebuilt React core** that a build phase swaps
between Debug and Release flavors, remembered in
`ios/Pods/React-Core-prebuilt/.last_build_configuration`. After a
`pod install` the file can be missing while the **release** flavor is
still in place (e.g. after a phone Release build), and a Debug simulator
build then fails to link (`facebook::react::Sealable` undefined) — or
links and **crashes at launch in `Props::Props()`**. Fix: in `ios/Pods`,
`printf Release > React-Core-prebuilt/.last_build_configuration && node
../../node_modules/react-native/scripts/replace-rncore-version.js -c Debug
-r 0.86.3 -p "$PWD"`, then **delete `/tmp/bn-derived`** and rebuild clean.

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

- **Navigation**: see "High school hub" above (Desk · School · + ·
  Focus · Steady). Tabs pop back to an existing copy (`router.dismissTo`)
  instead of stacking a new one.
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
rebuild by about 2026-10-06. **Update 2026-09-30:** the phone got a fresh
Release build of commit a8b798d (high school hub + screenshot scanner),
good until about 2026-10-07. The Masterpiece work is not on the phone
yet — rebuild with the recipe above after it's committed.

### Talking it through with Ember (`app/companion.tsx`)

A conversation with Ember on stage (its own rig — it talks while a line
appears, listens while you type, thinks while waiting, cheers when you
finish). Opens with a question from `core/companionPrompts.ts`; after that
it's AI when available (see "Ember's AI brain" below) and the original
fixed two-question flow when not. Reachable from Steady, the Desk's "Talk
it through" link, and "Talk to me" in Ember's tips. Saves into
`vent_entries` (same table as Let It Out), `input_mode = 'companion'`,
only after the save succeeds.

### Ember's AI brain (built 2026-09-29, live since 2026-10-01)

**Round 4 (2026-10-01, `docs/rounds/round-4.md`): the AI design.** The
`ember` function is now a job router (prompt v4.1, now v4.4): `kind` = talk, helper,
summary, title, steps, plan, scan, cards, points, practice, pick, reflect,
ping. Sonnet 5.5 (adaptive thinking, effort per job) for most, Haiku 4.5
for summary/title. The system prompt is cached; the app note rides on the
newest message. Replies end in `[[tags]]` (action ×2, chips, todo,
setdown, focus, helper, open a1/d1, remember, score, plan) that the
function parses into fields. Structured jobs use JSON schema output and
return `{ data }`. Every response carries `usage` and `ms`; the app turns
that into cents (`centsFor`) and logs it. App side: `askEmber`,
`askHelper`, `askJob` in core/emberAI.ts; `redact()` blanks phone numbers,
emails, and addresses; `soundsLikeCrisis()` pins `HelpCard` before any AI
is asked; memory (`emberMemory`, `lastEmberChat` in lifeStore) is kept
only when the student says yes, and `settings.memoryOff` / `aiOff` turn
things off. Redeploys: open the function's Code tab in the dashboard
(user signs in to the browser pane), set the Monaco model with
`executeEdits`, compare SHA-256 with the repo file, Deploy updates.
The user asked to "work within Xcode": run the app from Xcode
(`ios/brainnavigator.xcworkspace`, scheme brainnavigator, iPhone 17 Pro)
and verify in its Simulator.
Live prompt is v4.4 (2026-10-01): `summary` also returns a chat `title`,
`steps` turns a test or quiz into study sessions without day labels (the
app spreads them with `spreadSteps` in schoolStore), and `pick` gives one
short reason. Things kept only on the phone: chat titles (`chatTitles`,
keyed by `entryKey()` of the journal text, since `vent_entries` has no
title column), reply ratings (`replyFeedback`, "Good reply" / "This reply
was off" from holding an Ember reply, reviewed under Settings → AI).
Chat boxes clear through `core/hooks/useClearOnSend` (iOS autocorrect
otherwise puts a sent message back). Testing past the 20 free replies:
the developer-only "pretend I bought Plus" button at the bottom of /plus
(turn it off after). The Simulator can't do on-device speech
recognition, so the mic in Ember's chat and "Let it out" need a real
phone; the Simulator also can't go offline on its own.

The user asked for the mascot to run on AI. There is **no AI key in
`.env`** (only Supabase, Google, Notion). The only AI key is the Anthropic
key in the Supabase Edge Function secret **`brain-navigator-v2`** (not
`ANTHROPIC_API_KEY` — accidental naming, left as-is), and every call still
returned Anthropic 400 **"credit balance is too low"** until the user added
credit on 2026-10-01. Adding credits in the Anthropic Console is the user's
step, never ours.

- `supabase/functions/ember/index.ts` — Ember's persona + safety rules
  (not a therapist; crisis → 988), receives `{ messages, context }`,
  calls `claude-sonnet-5-5` with **deep thinking** (user's choice
  2026-10-01: `thinking: {type:'adaptive'}`, `output_config.effort: 'high'`,
  `max_tokens: 16000` because thinking counts toward it, plus server-side
  fallbacks via header `server-side-fallback-2026-07-01` + `fallbacks:
  'default'`). A `stop_reason: 'refusal'` gets a gentle reply with the
  `help` action; an empty text block returns `upstream`. Roughly 1–3 cents
  a reply (thinking bills as output at $10/M). Returns `{ reply, action }`
  where `action` is one optional next step (breathe, vent, ground,
  checkin, setdown, loops, tasks, habits, map, trends). Errors come back as
  a short `code` (`no_credit`, `busy`, `upstream`) — never the raw body.
  **Deployed 2026-10-01** from the Supabase dashboard (Edge Functions →
  Deploy new function → Via Editor → name `ember` → Deploy function); CLI
  login doesn't work here. To redeploy: open the function → Code, replace
  the contents, deploy. The user signs in to Supabase in the browser pane
  themselves. Pasting from the clipboard doesn't reach that editor and
  typing re-indents; setting the Monaco model with `executeEdits` and
  comparing a SHA-256 of the result with the local file worked.
  Verified live: replies in about 3–5 s, the app's Ember conversation
  answered using planner context, and Quizzo works through `agent`.
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
