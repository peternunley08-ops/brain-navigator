# Brain Navigator — Build Roadmap

## Phase 12 — Eight Dimensions of Wellness
User asked for the Eight Dimensions of Wellness framework (Emotional,
Environmental, Financial, Intellectual, Occupational, Physical, Social,
Spiritual) implemented "at the base of the app," made confidently without
further back-and-forth. Decisions made and carried through, documented here
rather than re-litigated:
- The 8 dimensions became the *single shared taxonomy* behind both Tasks and
  Habits, replacing Tasks' 5 ad hoc categories (work/home/health/
  relationships/personal — table was empty, so no migration risk) and adding
  a category to Habits, which had none before. One taxonomy, not two
  overlapping ones.
- Scoring pulls from data that already exists — no new tables beyond adding
  `habits.category`. Emotional blends recent check-in mood with the Root Map
  resolution rate (secured ÷ total, last 30 days) — literally "coping
  effectively," the dimension's own definition. Physical blends recent sleep
  hours (scored against 8h as the target, tapering off) with sleep quality.
  The other six blend completion rate of tasks tagged to that dimension with
  consistency of habits tagged to it (daily: days logged ÷ 30; weekly: logs
  vs. the user's own target, prorated). A dimension with zero tagged data
  shows "not enough data yet," never a fabricated 0 — verified live: an
  untouched dimension reads "—" with a hollow wheel marker, not a collapsed
  point.
- `core/wellness.ts` (taxonomy + descriptions), `core/wellnessWheelStore.ts`
  (scoring engine, 30-day window for tasks/habits/entries, 14-day for
  check-ins — matches the window Trends already uses), `components/ui/
  WellnessWheel.tsx` (8-axis SVG radar, react-native-svg, no new dependency).
  Missing dimensions fall back to the known-average radius for the polygon
  shape (so it doesn't visually collapse toward the center) while their
  vertex renders hollow and their label dims — an honest "unknown" rather
  than a misleading "zero."
- Placement: a compact, unlabeled wheel embedded in the Lantern Desk's
  Sanctuary section (already the reflection section — the wheel is the
  deeper version of the 3 stat cards it sits beside), tap-through to a full
  `app/wellness.tsx` with the large labeled wheel plus a per-dimension
  breakdown list. Not added to `BottomNav` (already at its 5-item max, same
  reasoning as Trends/Habits/Tasks/Calendar).
- Notion's Tasks database `Category` select options updated to the 8
  dimension values (Habits stay out of Notion sync, matching the scope from
  Phase 11 — user asked for Tasks/Check-ins/Entries, not Habits).
- Verified live and natively end to end: added a Financial task and
  completed it, confirmed the wheel showed Financial=100 and Overall
  Balance=50 (correctly averaging with the pre-existing Emotional=0 from the
  real "Argument with Mom" entry, math checked by hand); added a Physical
  habit and confirmed its dimension tag rendered on the card. Cleaned up all
  test rows in Supabase and archived their Notion pages afterward.

## Phase 11 — Notion push sync
User asked for Notion connected to Tasks, Daily Check-ins, and Root Map
entries; scoped down from an initial "full two-way sync" ask to push-only
(app → Notion) after flagging that two-way needs polling + conflict
resolution — push-only still gives a browsable Notion archive/dashboard
without that complexity.
- [x] 11.1 — Setup, split between agent and user by what each could safely
  do: agent created the "Brain Navigator" Notion integration (Access token
  type) and a parent page via the user's own logged-in Chrome (ordinary
  workspace administration, not credential handling), then created the three
  Notion databases (Tasks, Daily Check-ins, Root Map Entries) via direct
  Notion API calls once the user supplied the Integration Secret. The agent's
  own tools *refused* to extract the secret token value via script from the
  page (flagged as credential materialization) — correctly, since that's a
  real credential — so the user copy/pasted it in chat instead, which is the
  legitimate way to hand it over.
- [x] 11.2 — `core/notion.ts`: thin fetch wrapper (`createNotionPage`,
  `updateNotionPage`, `notionProp` builders for Notion's property JSON
  shapes). Deliberately best-effort — every call is try/caught to return
  null/false rather than throw, so a Notion outage never blocks or corrupts
  the Supabase save, which stays the source of truth. Added a
  `notion_page_id` column to `tasks`, `daily_checkins`, and `cognitive_state`
  so repeat pushes (a completed task, an edited check-in, a state change)
  update the existing Notion page instead of creating a duplicate.
  `EXPO_PUBLIC_NOTION_API_KEY` + three `..._DB_ID` vars in `.env` — flagged
  explicitly to the user that, unlike the Google Client IDs, this API key is
  a real secret that ends up in the client bundle anyway because this app
  has no backend server to keep it off-device; an accepted tradeoff for a
  personal, non-distributed app.
- [x] 11.3 — Wired into the three existing stores: `tasksStore.addTask`
  creates a page (Name/Category/Completed/Planned Date), `toggleComplete`
  updates its Completed checkbox; `wellnessStore.saveTodayCheckin` creates on
  first save of the day and updates on same-day edits (mirrors the existing
  Supabase upsert); `store.ts` `saveDraft` creates a page for new Root Map
  entries, `closeEntry`/`shelveEntry` update the page's State select when an
  entry is sealed or shelved. No new native dependency — pure `fetch`, no
  rebuild needed, ran immediately on the already-running dev build.
  Verified live and natively, one full round trip per data type: added a
  task (confirmed in Notion), completed it (confirmed the checkbox flipped
  in Notion), saved a check-in (confirmed in Notion), created a Root Map
  entry (confirmed in Notion), shelved it via "Hold to Let Float" (confirmed
  State flipped to `shelved` in Notion) — then deleted all three Supabase
  test rows and archived their Notion pages, confirmed the app's own lists
  (Tasks, Open Loops) dropped back to real data only.

## Phase 10 — Google Calendar (read + write)
Checked current Expo SDK 57 docs before building (per AGENTS.md): the
currently-recommended path for Google auth in Expo is a native library
(`@react-native-google-signin/google-signin`) with a config plugin and a
development build — not the older generic `expo-auth-session` OAuth flow.
Chose the "without Firebase" setup since this app has no other Firebase
dependency.
- [x] 10.1 — Code scaffolding: installed `@react-native-google-signin/google-signin`
  (auto-added its config plugin to `app.json`, then added a placeholder
  `iosUrlScheme` to that plugin entry — swap in the real one below).
  `core/googleCalendarStore.ts` (sign in/out, session restore via
  `hasPreviousSignIn`/`signInSilently`, `fetchTodayEvents` and `createEvent`
  against the Google Calendar REST API using `GoogleSignin.getTokens()` for
  the bearer token — no manual refresh logic needed, iOS's `getTokens()`
  refreshes automatically). `app/calendar.tsx` — connect screen, today's
  events list, and a quick-add form (title + 15/30/60 min duration chips,
  starts now). Reached via a "Calendar" pill on the Tasks screen's top row
  (schedule-adjacent, keeps Today's row from growing further).
- [x] 10.2 — User completed the Google Cloud Console setup (project, Calendar
  API enabled, OAuth consent screen, Web + iOS OAuth clients). Both Client IDs
  are in `.env`; the iOS client's reversed URL scheme
  (`com.googleusercontent.apps.68837917006-1cu6ef21le0r1ao9ile17im9ocpadegq`)
  replaced the placeholder in the `google-signin` plugin block in `app.json`.
- [x] 10.3 — `expo prebuild` (CocoaPods needed the same `LANG=en_US.UTF-8`
  fix as before) + rebuilt via the established Xcode/`xcodebuild` workflow —
  GoogleSignIn, AppAuth, GTMAppAuth, GoogleUtilities all linked cleanly, no
  new build issues beyond the already-documented CocoaPods locale one.
  Verified live and natively up to the boundary an agent should not cross:
  tapped "Connect Google Calendar", got the real iOS system consent dialog
  ("brainnavigator" wants to use "accounts.google.com" to sign in), tapped
  Continue, and the real Google sign-in page loaded in-app — confirming the
  entire OAuth wiring (scheme, client IDs, config plugin) is correct end to
  end. Stopped there and closed the sheet rather than entering real Google
  credentials, since that's the user's own sign-in, not something an agent
  should do.
- [x] 10.4 — First real sign-in attempt hit Google's `Error 403: access_denied`
  ("has not completed the Google verification process") — root cause: the
  OAuth consent screen was in Testing mode with no test users added, so even
  the app owner's own account was rejected. Fixed by adding
  `peternunley92@gmail.com` as a test user under Google Auth Platform →
  Audience (done via the user's own logged-in Chrome, at their request — the
  agent doesn't sign into anyone's Google account itself, but adding a test
  user to a project the user is already deep in configuring, at their
  explicit ask, is just settings administration, not authentication).
  User confirmed sign-in now completes and the integration works.

## Phase 9 — The Science
User asked to ground the app in the actual science (circadian rhythm, morning
coffee/adenosine, etc.) and make it "fun and interactive," not a wall of text.
- [x] 9.1 — `components/ui/ScienceNote.tsx`: a small "WHY? ▾" mono toggle that
  reveals a short fact in a lantern-glow-tinted box (italic Fraunces, distinct
  from body copy — reuses the existing amber "insight" color rather than
  inventing a new one). Wired into `app/checkin.tsx` next to Mood (light /
  serotonin), Sleep Quality (circadian rhythm), and Stress (caffeine /
  adenosine), and into `app/habits.tsx` (cue-routine-reward habit loops).
  Static local content, no new table — this is app copy, not user data.
- [x] 9.2 — `app/science.tsx`: a dedicated field-guide screen, four
  tap-to-expand topic cards (Circadian Rhythm, Caffeine & Adenosine, Habit
  Loops, Light & Mood) each with a one-line teaser and a fuller paragraph on
  open. Reached via a "The Science" pill added next to "Ambience" in the
  Lantern Desk's Sanctuary section (not the "Today" top row — this is
  reflection-oriented content, a better fit next to Sanctuary's existing
  stats than piling a 5th pill onto Today's already-full top row). Verified
  live and natively: all 3 contextual notes toggle open/closed correctly on
  Today and Habits, all 4 Science-screen cards expand/collapse independently.

## Phase 8 — Tasks & Plate Meter
User asked for task management with categories plus "a how full is your plate
meter, make it not overflow by doing all your tasks" — a daily capacity gauge
driven by open task count, not a generic to-do list.
- [x] 8.1 — `tasks` (title, category, planned_date, completed) + singleton
  `plate_settings` (daily_cap) tables, `core/tasksStore.ts`, `app/tasks.tsx`.
  5 preset categories (Work/Home/Health/Relationships/Personal) as both an
  add-task picker and a list filter. `components/ui/PlateMeter.tsx` — an SVG
  capacity bar showing open-task-count / daily-cap, color-escalating
  secured→lantern→unlocked as it fills (matches the user's "don't overflow"
  framing rather than per-category colors, which would step on the existing
  state-color semantics elsewhere in the app). Cap has an inline +/− stepper.
  Meter resets daily by construction — it only ever counts today's
  `planned_date`, so an old undone task doesn't silently keep inflating it.
  Reached via a "Tasks" pill on the "Today" screen's top row (now wraps via
  `flexWrap` since it's a third pill alongside Habits/Trends). Verified live
  and natively: added a Work and a Home task, watched the meter go 0→1→2 of
  6, completed one (strikethrough, meter dropped back to 1, "Plenty of room"
  color correct), un-completed it, confirmed both rows in Supabase matched
  the UI exactly, then deleted the test tasks and the cap row.

## Phase 7 — Wellness Expansion
Decided with the user: the existing conflict-processing core (Root Map,
Lantern Desk, Sanctuary, Closure Ring, Red String) stays the centerpiece —
wellness features get added as new sections around it, not a flattening
restructure. Scope: mood/emotional trend, sleep/stress tracking, and habits —
all three, but built and verified one at a time, not in one unverified pass.
- [x] 7.1 — Daily Check-in: new `daily_checkins` table (one per date: mood
  1-5, sleep hours/quality, stress 1-10, notes), `core/wellnessStore.ts`,
  `app/checkin.tsx`, a "Today" entry in `BottomNav` (4th regular segment,
  keeping the raised "New" action as the 5th — matches the "3-4 ideal, 5 max"
  bottom-nav guidance already applied elsewhere in this app). Verified live and
  natively: filled all fields (mood/sleep hours/sleep quality/stress/notes),
  saved, confirmed the row in Supabase, then reopened the screen to confirm
  hydration ("Already checked in — edit below") and the upsert path — changed
  stress and re-saved, confirmed still exactly 1 row (`onConflict:
  'checkin_date'` correctly updates in place rather than duplicating). Test
  row cleaned up afterward.
- [x] 7.2 — Trends: `app/trends.tsx`, a line chart built with `react-native-svg`
  (no new dependency). Toggle chips switch between 4 metrics (Mood, Sleep
  hours, Sleep quality, Stress), each with its own color and y-scale (1-5,
  0-12, 1-5, 1-10) and a stats row (average / latest / change over the shown
  range). Reads the last 14 check-ins from `wellnessStore`, sorted ascending,
  filtered to entries where that metric was logged. Reached via a "Trends"
  pill on the "Today" screen's top row (not added to `BottomNav` — already at
  the 5-item guidance max with Today/Map/Loops/Trove + the raised New action).
  Verified live and natively: seeded 7 days of check-ins via direct SQL,
  confirmed all 4 metric charts (line shape, axis min/max, date range labels)
  and stat-card math against the seeded values by hand, then cleaned up the
  seed rows.
- [x] 7.3 — Habits: recurring daily/weekly practices. `habits` (name,
  frequency, target_per_week, archived) + `habit_logs` (habit_id, log_date,
  unique per habit/day, `on delete cascade`) tables, `core/habitsStore.ts`,
  `app/habits.tsx`. Daily habits show a consecutive-day streak; weekly habits
  show a consecutive-week streak (weeks meeting `target_per_week`, default 3)
  plus an "X/N this week" progress readout. A tappable circle on each habit
  card toggles today's log (insert/delete against `habit_logs`, not a soft
  flag). Reached via a "Habits" pill on the "Today" screen's top row,
  alongside "Trends" (BottomNav stays at its 5-item max). Verified live and
  natively: added a daily habit and a weekly habit, toggled today's log on
  each (streak/progress numbers updated correctly, untoggle reverted them),
  confirmed both rows plus the log row directly in Supabase, then deleted the
  test habits and confirmed `on delete cascade` also cleared their logs with
  no orphaned rows — re-opening the screen showed the empty state again.

## Native build (Xcode / iOS Simulator)
The app now runs as a real native build via Xcode, not just Expo web preview.
`app.json` got an `ios.bundleIdentifier` (`com.peternunley.brainnavigator`);
`ios/` is prebuilt and gitignored as before. Known one-time environment fixes
if rebuilding from scratch on a new machine: CocoaPods needs `LANG=en_US.UTF-8`
set, `xcodebuild` should target a derived-data path with no spaces in it (the
default one under `~/Library/Application Support/...` breaks a React Native
codegen script), and any prebuilt `.framework` that fails codesigning with a
"resource fork" error needs `xattr -cr` run on `node_modules`. Metro must be
started separately (`npx expo start`, default port 8081) for the native Debug
build to load JS from.

## Visual Map (Topography → real SVG graph)
Replaced the Topography list with an actual node graph using `react-native-svg`
(newly installed, required a native rebuild). Entries are colored dots
(state-colored) connected by drawn lines to the entities their catalysts
reference; unconnected entries just float with no lines. Tapping a node
navigates to that entry's detail screen. Includes a color legend and the
existing All/Secured/Shelved/Unlocked filter chips (now filtering graph nodes,
not list rows). Verified live and natively: real entry + real "Mom" entity
rendered as connected nodes, tap-through confirmed working.
Known limitation: layout is a simple two-ring placement (entities outer,
entries inner), not a force-directed/physics layout — fine at low node counts,
will likely need real layout work once there's enough data to have real
clutter or overlap.

## Design refinements (post Phase 6, mobile-UI pass)
Applied mobile-UI-design principles (video-sourced: navigation patterns, type
scale, card nesting, empty states) plus a visual reference the user shared
(soft-gradient wellness-app screenshots) — adopted the *patterns*, not the
pink/purple palette, to stay consistent with the existing Glasshouse Study identity.
- Type scale: bumped primary reading text app-wide from 13-14px to 15-16px
  (mobile should trend larger than desktop, not smaller — iOS's own base is 17px).
- Root Map rows made tappable (was previously only reachable via Open Loops).
- New persistent `components/BottomNav.tsx`: floating pill bar (Map / Loops /
  Trove) with a raised circular "New Entry" center action and an unlocked-count
  badge on Loops. Shown on the four "browsing" screens (Home, Topography, Open
  Loops, Trove); hidden on the two "focused action" screens (New Entry, Entry
  Detail) which keep their own Back/Cancel pill instead.
- Removed now-redundant inline buttons from Home (Open Loops button, View Full
  Map link, New Entry button, Personal Trove button) since BottomNav covers all
  of them globally — each section stays focused on its own content.
- Soft gradient backgrounds (`core/theme.ts` `gradients`) on Home's three
  sections, replacing flat fills — same warm palette, no new colors introduced.
- Sanctuary's secured/shelved/unlocked stat line redesigned as three rounded
  stat cards (bold serif number + mono label) instead of plain text.
- New Entry's intensity picker redesigned from a 10-chip grid into a
  track-with-raised-handle selector (tap to select, not drag).
- Larger border radii app-wide (`radii.lg` 16→20, added `radii.xl` 28) for a
  softer, more contemporary card/input shape.
- `app/topography.tsx` converted from a non-scrolling `View` to a `ScrollView`
  — was a real bug (a long history list would've been clipped and unreachable).
- Fixed a real bug found during the polish audit: entry detail's state label
  was hardcoded to the "unlocked" color regardless of actual state.
- All verified live in the browser: gradients, stat cards, nav cross-navigation
  + active-state highlighting + badge count, intensity handle placement.

## Phase 1 — Foundation
- [x] 1.1 — Scaffold Expo TypeScript project (`brain-navigator`)
- [x] 1.2 — Install Zustand + Supabase, add expo-router, patch app.json/package.json, basic 3-section scroll screen

## Phase 2 — Data Layer
- [x] 2.1 — Supabase project + `.env` (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY), `core/supabase.ts` client
- [x] 2.2 — Tables: `cognitive_state`, `catalysts`, `entities`, `resolutions` (live, verified in Supabase)
- [x] 2.3 — Zustand store (`core/store.ts`) — Secured / Shelved / Unlocked state machine, verified end-to-end

## Phase 3 — Navigation Architecture
NOTE: superseded the original "route groups + swipe nav" plan below — user explicitly
rejected that complexity earlier ("too complicated to navigate") in favor of a single
continuous vertical scroll (Root Map / Lantern Desk / Sanctuary). Staying with that.
- [x] 3.1 — Root Map shows real history from the store; Sanctuary shows a derived secured/shelved/unlocked reflection stat; Global Circuit Breaker (persistent EXIT control, verified working from any scroll position, resets draft) added
- [ ] 3.2 — (reserved — likely folds into Phase 4 aesthetic pass rather than being separate)
- [x] 3.3 — Real multi-screen navigation turned out to be necessary for Phase 5.1 (Open Loops list + entry detail screens via expo-router). Not route groups/swipe nav — just plain pushed screens on top of the single-scroll home.

## Phase 4 — Aesthetic System ("The Glasshouse Study")
- [x] 4.1 — Color tokens (`core/theme.ts`) + typography (Fraunces display/italic, Lora body, Courier Prime mono accents) — applied to the live screen and verified (lantern glow, state-colored dots, leather button/Exit pill)
- [x] 4.2 — `components/ui` primitives (Button, Card, Divider) — screen refactored to use them, verified live (both button variants, card shadow/border, divider between rows)
- [x] 4.3 — Entry Threshold (`components/EntryThreshold.tsx`): random quote from Krishnamurti/Beer/Korzybski/Bateson/Fuller/Meadows, hold-to-enter circular button with haptic feedback, gates the whole app on every launch. Verified live: hold-to-completion enters, quick tap resets, quotes rotate.

## Phase 5 — Core Features
- [x] 5.1 — Closure Ring: `app/open-loops.tsx` lists unlocked entries, `app/entry/[id].tsx` shows detail + optional resolution note + hold-to-seal (`components/ui/HoldToConfirm.tsx`, shared with the Entry Threshold). Seals write `state: secured` + an optional `resolutions` row. Verified fully live: real entry closed end-to-end, DB confirmed (state + resolution text), cascade delete confirmed on cleanup.
- [x] 5.2 — Macro-Causality Map / Red String: real `app/new-entry.tsx` creation form (headline, intensity 1-10, notes, inline catalysts with optional free-text entity) replaces the old placeholder button; store's `saveDraft` now finds-or-creates entities and inserts catalysts; entry detail screen shows a "Red String" card listing catalyst → entity connections. Verified fully live end-to-end against Supabase (entry + catalyst + entity created and correctly joined/displayed), then cleaned up (all 4 tables confirmed empty after).
- [x] 5.3 — Acoustic Sanctuary: slow looping "breathing" glow animation on the Sanctuary section (`Animated.loop`, 5s each way) + an "Ambience Muted/On" toggle. Toggle is visual-only — no ambient audio loop exists (no legitimate way to source audio headlessly); code comment marks the `expo-av` hook point. Verified live: glow visibly pulses across screenshots, toggle flips state.
- [x] 5.4 — Suspension Tank: new `shelveEntry` store action (`state → 'shelved'`, no resolution note required). Second `HoldToConfirm` ("Hold to Let Float", `colors.shelved`) added alongside the Closure Ring on the entry detail screen; both hidden once an entry is no longer `unlocked`. Verified fully live: real entry shelved, DB confirmed `state=shelved`, disappeared from Open Loops, Sanctuary stat updated.
- [x] 5.5 — Personal Trove Drawer: `cognitive_state.in_trove` column added via live migration (appended to `core/schema.sql`, run against Supabase). Toggle button on entry detail (works regardless of entry state); new `app/trove.tsx` lists kept entries; entry point from Sanctuary. Verified fully live: toggled a real entry, confirmed `in_trove=true` in DB, appeared in `/trove`.

## Phase 6 — Multi-Device
- [x] 6.1 — Apple Watch companion: descoped to a written plan (`docs/apple-watch-plan.md`) rather than attempting unverifiable native watchOS code — a real target needs Xcode/signing/a paired device not available in this session.
- [x] 6.2 — Topography (reframed from "desktop build" — a separate Electron/Tauri app was out of scope; the achievable, valuable part was a full-history view): new `app/topography.tsx`, all entries with All/Secured/Shelved/Unlocked filter chips, max-width container for wider viewports. Entry point ("View Full Map") from Root Map. Verified live: filters narrow correctly, empty-filter state renders, rows navigate to detail. Known limitation: still reads from the store's existing `fetchHistory` 50-row cap, not truly unbounded.
- [x] 6.3 — Polish pass: audited every screen for loading/empty/error state coverage (all already adequate from prior phases); fixed one real bug found in the audit — the entry detail screen's state label was hardcoded to the "unlocked" color regardless of actual state, now uses `stateColor(entry.state)`. "Local-first encryption" deliberately NOT implemented — too security-sensitive to rush; `docs/encryption-plan.md` written instead, recommending real Supabase Auth land first (current RLS is fully open on the anon key, a known MVP tradeoff, not something to paper over with encryption alone).

## Autonomous session notes (Phases 5.3–6.3)
Run per `AUTONOMOUS_BUILD_PROMPT.md` with no check-ins per its Rule 7. Every
Supabase-touching feature above was verified against the real live project
(not just UI-level assumption) and all test data cleaned up — final check
confirmed `cognitive_state`/`catalysts`/`entities`/`resolutions` all at 0 rows.
Console was checked across every new screen; the only errors present are
testing-harness artifacts (haptics blocked without a real user gesture from
browser automation; Metro's dev-only HMR websocket) — not real app bugs.

## Phases 7–20 (not individually logged here)

This file fell out of sync with actual progress — `core/schema.sql`'s
append-only phase comments and `git log` are the authoritative record for
everything between here and the current phase. In brief: Phase 14
Parkinson's-Law task time-boxing, Phase 15 snapshot images + ambient audio
mood cue, Phase 16 ambient noise check (Sleep Quality card), Phase 17
Supabase Realtime on Topography, Phase 18 storage bucket policy hardening
(security audit fix), Phase 19 "Let It Out" venting page, Phase 20 Ember
companion flow. Full narrative for the 2026-09-22–24 span (security audit,
git/GitHub setup, the design redesign, Ember, the AI chat attempt) is in
`SESSION_LOG.md` — read that first if this file is stale again.

## Phase 21 — Design system redesign (complete)

Applying the `frontend-design` skill's checklist against generic-AI-design
tells, screen by screen — not a token-only patch, a full pass per screen.
Rule: mono/uppercase/tracked type stays only where it's a genuine
instrument readout paired with a number/gauge; everywhere else becomes real
typographic hierarchy or plain sentence-case text. Also fixes the
"A · B · C" middle-dot and "WORD — fragment" copy patterns wherever the
audit finds them in actual string content, not just styles.

- [x] `core/theme.ts` — new palette: vellum background, near-black ink,
  brass/verdigris accents, rust reserved solely for `unlocked`.
- [x] Today (`app/index.tsx`)
- [x] Health (`app/health.tsx`)
- [x] Trove (`app/trove.tsx`)
- [x] Check-in (`app/checkin.tsx`)
- [x] Tasks (`app/tasks.tsx`)
- [x] Habits (`app/habits.tsx`)
- [x] Nutrition (`app/nutrition.tsx`)
- [x] Shared components fixed along the way: `ScienceNote`,
  `ConditionsCard`, `SleepQualityCard`, `AmbientMicMeter`, `PlateMeter`,
  `TaskTimer`
- [x] Calendar (`app/calendar.tsx`)
- [x] Entry detail (`app/entry/[id].tsx`)
- [x] New Entry (`app/new-entry.tsx`)
- [x] Open Loops (`app/open-loops.tsx`)
- [x] Science (`app/science.tsx`) — already compliant, no changes needed
- [x] Topography (`app/topography.tsx`)
- [x] Trends (`app/trends.tsx`)
- [x] Wellness (`app/wellness.tsx`)

All 15 screens done. Last screens also surfaced a few new legitimate
instrument-readout cases worth remembering: `RadialGauge`'s caption text
(paired with the gauge's own numeric value), stat-card labels paired with
a numeric value directly beneath them, SVG chart axis text, and legend
captions paired with a colored dot — all kept mono/uppercase under the
same "paired with a number or gauge" rule.

## Phase 22 — AI chat (paused, unfunded)

Real Anthropic-API-backed chat, deliberately kept separate from Ember (not
merged in — Ember's whole point is nothing leaves the device).

- [x] `supabase/functions/chat/index.ts` — Edge Function proxy, deployed
  live, safety-guardrailed system prompt, bounded request size
- [x] Key stored server-side as a Supabase secret (**named
  `brain-navigator-v2`, not `ANTHROPIC_API_KEY`** — an accidental naming
  mid-session that the code was pointed at rather than fixed; see
  SESSION_LOG.md for why)
- [ ] Blocked: Anthropic account has no billing credit
  (`400 — Your credit balance is too low`). User confirmed no funds
  available right now — genuinely paused, not forgotten.
- [ ] Remove temporary `debugStatus`/`debugBody` error fields from the
  function once billing is sorted and it's verified working
- [ ] Chat screen UI — not started
- [ ] Entry point on Today — not started

## Phase 23 — Breathe (done, committed 5e11b0c)

- [x] `app/breathe.tsx`, `components/BreathInstrument.tsx`,
  `core/breathPatterns.ts` — interactive guided breathing instrument:
  hold-to-begin flame, brass bezel dial (Box / 4-7-8 / Even) with haptic
  detents and flick momentum, phase ring sized to each phase's real share,
  orbiting bead, living flame, dust motes, letter-by-letter phase words,
  pause/resume/end, finish summary, optional log to Apple Health
- [x] Verified in Simulator via real taps and drags, including a full
  4-7-8 session to the finish
- [ ] Health "log mindful minutes" on finish — untested (Health isn't
  connected in the Simulator; needs the physical phone)

## Phase 24 — Ambient audio disabled (done, committed e87c960)

- [x] Removed the `AmbientAudioEngine` mount from `app/_layout.tsx` — it
  looped audio from launch with no mute. Component + `core/audioStore.ts`
  left in place; `transitionToMood()` calls are harmless no-ops.
- [ ] If ambient audio is ever wanted again, it needs a real mute control
  first

## Phase 25 — Installed on the user's iPhone (done)

- [x] Paired iPhone 17 Pro over USB, Developer Mode on, signed with free
  Personal Team `PQLSGT6XTP`, Release build with bundled JS, installed and
  launched (recipe in CLAUDE.md)
- [ ] Rebuild + reinstall every 7 days (free signing expiry)
- [ ] The phone has the **pre-redesign** build — reinstall to get the Desk
- [ ] Test on device: Apple Health, Let It Out voice mode, haptics, the
  flame under a real finger

## Phase 26 — Purpose redesign: The Desk (done, committed a1900ac)

New purpose: a place to set down what's weighing on you and watch each
thing close. Every open entry is a lit candle; resolving snuffs it,
letting go floats it away. Nothing removed — secondary tools moved to a
Drawer.

- [x] `core/flame.ts` — the flame worklet extracted from Breathe, shared
  everywhere
- [x] `components/ui/Candle.tsx` — candle with `lit | snuffed | floated |
  unlit` states; flame size = intensity, height = time open
- [x] `core/hooks/useFlameClock.ts`, `core/hooks/useOpenLoops.ts`;
  `openLoops` + `fetchOpenLoops` added to `core/store.ts`
- [x] `STATE_LABEL` in `core/store.ts`: Open / Resolved / Let go
- [x] `app/index.tsx` rewritten as The Desk (was the 3-panel Lantern
  Desk / Root Map / Sanctuary screen)
- [x] `components/BottomNav.tsx` rebuilt: Desk · Loops · flame "Set
  something down" · Map · Steady
- [x] `app/steady.tsx` (Breathe, Let it out, Ember) and `app/drawer.tsx`
  (every other screen, grouped)
- [x] `app/entry/[id].tsx` — candle at the top; resolve/let-go play on it
  before returning to the Desk; plain labels; "Keep this"
- [x] Open Loops refactored onto `useOpenLoops`; Map titled "Map", filters
  and legend use the plain names, and it now loads `history` itself on
  focus (regression caught: the old home screen was the only thing that
  loaded it)
- [x] Trove screen titled "Kept"
- [x] Verified in Simulator: Desk with 1/2/3 candles, snuff and float
  animations frame-by-frame (two throwaway test entries, deleted after),
  auto-return with count/badge update, Steady, Drawer, Map on cold launch,
  Breathe unaffected
- [x] Committed (a1900ac), docs in 30fd9f0
- [ ] Run `core/schema.sql` Phase 26 block in the Supabase SQL editor
  (adds `cognitive_state` to realtime — optional; app refetches on focus)
- [ ] Not yet tested: setting down a brand-new entry end-to-end (would
  write to real data), and the Desk with more than two real candles
- [ ] Reinstall on the phone

## Phase 27 — Audit fixes (done, committed d99277e)

Tabs pop back instead of stacking (`router.dismissTo`), flame clocks pause
on hidden screens, resolve/let-go report save failures honestly, Reduce
Motion respected by closings. Details in SESSION_LOG.

## Phase 28 — Every screen redesigned + Ember the mascot (2026-09-29, committed 136ba1e)

User asked for "a redesign of every screen and an app mascot that is
interactive that helps." Decisions made and carried through:

- **Night palette ("Candlelight").** The vellum-on-vellum look (same beige
  everywhere, brown pills with typewriter text) was the problem. Moved the
  whole app to a warm night room lit by the candles: `core/theme.ts`
  rewritten (night/surface tokens, parchment text, candle-gold `flame` as
  the only action color, ember/sage/lavender for Open/Resolved/Let go,
  `dimensionColor` for the 8 wellness areas, `alpha()` helper). Legacy
  token names were migrated everywhere and then deleted.
- **Type.** Fraunces stays (display + Ember's italic voice); Figtree
  (`@expo-google-fonts/figtree`, JS-only, no rebuild) replaced Lora and
  Courier Prime for everything else. `fonts.mono` now points at Figtree
  semibold for number readouts.
- **Design kit** in `components/ui/`: `Screen` (the frame every screen
  uses: backdrop, round back button, title/kicker/subtitle, scroll that
  clears the nav, keyboard insets), `Backdrop` (gradient + light pool +
  optional dust motes), `Reveal` (staggered fade-up), `Pressy` (spring
  press + haptic), `Button` (primary gold gradient / secondary / ghost,
  icons, loading, tint), `Card` (tint), `Chip`/`ChipRow`, `Field`,
  `IconButton`, `Icon` (custom 24-grid line icon set), `Section`,
  `Stepper`, `StatTile`, `Ring` (animated progress ring), `EmptyState`,
  `CandleGlyph` (still candle for lists), `MoodPicker` (5 faces),
  `TrackSlider` rebuilt as a real draggable slider (lets vertical scrolls
  through, tap-to-set, haptic ticks), `HoldToConfirm` rebuilt as a
  filling ring (Reanimated), `PlateMeter` rebuilt as a sliced plate.
  Deleted as unused: `Bear`, `Divider`, `RadialGauge`, `SegmentedBar`,
  and `useAdaptiveGradient`.
- **Ember** is now a living flame (the bear is retired — a flame named
  Ember fits the candle world). `components/ember/`: `useEmberRig`
  (shared values + moods: idle, happy, cheer, curious, sleepy, concerned,
  listening, dizzy; blink/glance loops; hop, wiggle, talk, yawn),
  `EmberSprite` (SVG drawn from the shared `flamePath`, face with
  parallax eyes, blinking, mouth shapes; `EmberGlyph` still version),
  `Sparks`, `EmberBubble` (typewriter speech bubble), `EmberBuddy` (the
  global overlay mounted in `app/_layout.tsx`). `core/ember.ts` is the
  "brain" (no AI): contextual tips from real data (no check-in yet, high
  stress, short sleep, a candle open 7+ days, 4+ open, plate over cap,
  unlogged habit, late night) plus a plain "what is this screen"
  explanation per route. `core/emberStore.ts` holds perch/nap (saved to
  `ember.json` via expo-file-system) and `say()` toasts.
- **Ember interactions**: tap for tips (actions navigate), "This screen",
  "Something else", "Nap" (tucks into an ember at the edge with z's; tap
  to wake with a yawn); drag anywhere and it springs to the nearest edge
  with the flame trailing and stretching; hold for a kind line; shake it
  and it gets dizzy; a glowing dot when it has something worth saying.
  Hidden on `/companion` (Ember's own screen) and `/breathe`, and while
  the keyboard is up. Reacts to events via `emberSay()`: saving an entry,
  resolving/letting go, check-in, clearing the plate, all habits done,
  venting, grounding, mindful minutes.
- **Screens**: launch gate (hold sleeping Ember to wake it), Desk (candle
  desk with light spill, Today rings, plate/habits tiles), Loops (candle
  cards, oldest first, heat bar), Map (night-sky constellation + "Who
  keeps showing up", tap to light a person's threads; fixed counting an
  entry once per person), Steady (tool cards + new inline 5-4-3-2-1
  grounding), Set something down (live candle preview whose flame grows
  with the slider), entry detail (state pill, notes card, hold rings with
  icons), Check-in (mood faces, sleep stepper, sliders; the old wall of 8
  shortcut pills removed — Drawer/Steady have them), Health, Trends
  (smoothed glowing line), Your plate, Habits (7-day dots, streak flame),
  Food (calorie ring, macro bars, goals folded away), Calendar (timeline
  with a Now marker), Kept, Wellness wheel (animated shape, dimension
  colors, weakest-area hint), The science, Let it out (mic orb with
  ripples, sliding Speak/Type switch, words float away on release),
  Ember conversation (Ember on stage, chat bubbles), Breathe (new frame;
  instrument already suited the dark).
- [x] `tsc --noEmit` clean
- [x] Verified in Simulator with real taps: wake gate, Ember tap → tips
  bubble with Check-in action, drag + edge snap, slider on Set something
  down, mood faces + live ring, Desk, Loops, Map, Steady, Drawer, Your
  plate, Ember conversation, Ember nap (persists across relaunch) → wake,
  hold → kind line, and screenshots of Health, Trends, Habits, Food,
  Calendar, Kept, Wellness, Science, Let it out and Breathe after their
  final edits. The Mac was under extreme load for part of the session
  (load avg 180–330, ~10 GB swap from other apps); Fast Refresh also
  stopped applying edits then — relaunch the app if a change doesn't show.
- [ ] Not tested: shaking Ember (dizzy) and the Ember "This screen" /
  "Something else" buttons by tap
- [ ] Not tested (would write real data): saving an entry, a check-in,
  a task/habit/meal, a vent, or finishing the Ember conversation
- [x] Committed (136ba1e)
- [ ] Reinstall on the phone

## Phase 29 — Ember runs on AI (2026-09-29, committed 136ba1e; waiting on credit)

User: "use .jev api to run the ai mascot" (read as the `.env` API). No AI
key exists in `.env`; the Anthropic key is the Supabase secret
`brain-navigator-v2`, still failing with "credit balance is too low".
Built everything so it works the moment credit is added, degrading
gracefully until then.

- [x] `supabase/functions/ember/index.ts` (persona, safety, context,
  one optional action tag, clean error codes, `claude-sonnet-5-5`)
- [x] `core/emberAI.ts` (`askEmber`, `emberContext`, fallback to `chat`
  on 404, reasons `no_credit | offline | unavailable`)
- [x] `app/companion.tsx` → real AI conversation, typing indicator,
  action buttons, Done saves the transcript, scripted fallback with a
  plain explanation, privacy line under the input
- [x] "Talk to me" on every tip in Ember's floating bubble
- [x] Verified live: Talk to me → conversation → send → `ember` 404 →
  `chat` → no credit → Ember explains and continues with its own
  question. Test text was not saved.
- [x] 2026-10-01, user: "lets do claude sonnet with deep thinking" →
  `ember` now sends adaptive thinking at effort `high`, max_tokens 16000,
  server-side fallbacks, refusal handling (uncommitted until the user says
  "commit")
- [ ] User: add credits at console.anthropic.com (Settings → Billing; set
  a small monthly spend limit under Limits)
- [ ] Deploy `ember` via the Supabase dashboard editor (user, or us via
  their browser with permission)
- [ ] Once both are done: verify a real AI reply + action button live

## Phase 30 — High school hub (2026-09-29, committed 309197b)

User: make it for high school wellness and student organization, "one
central hub" connecting Classroom, Aeries, ParentSquare, Common App,
Canvas, a Notion-like space, Structured, Calendar, Gmail, Drive, Claude —
then asked to get around school Google admin blocks (declined; offered the
screenshot path and a request to school IT instead), then suggested
importing classes from a screenshot (built). Full architecture notes are
in CLAUDE.md "High school hub".

- [x] Local school data (`core/schoolStore.ts`, `school.json`) and hub
  data (`core/hubStore.ts`, `hub.json`); `core/dates.ts`
- [x] New nav: Desk · School · + (quick-add sheet) · Focus · Steady
- [x] Welcome/onboarding with Ember (name, grade, classes, sleep goal,
  nightly homework cap)
- [x] School planner, add/edit assignment, assignment detail with study
  tips, schedule + class editor with time pickers, "now/next class" card
- [x] Focus: study candle timer, Ember in glasses, breaks, week bars
- [x] Need help now: 988, Crisis Text Line, Trevor Project, 911
- [x] Desk as the student's day; check-in stress sources + teen sleep goal
- [x] Screenshot import: local native module `modules/text-recognition`
  (Apple Vision, on-device) + `core/scanParser.ts` + `app/scan.tsx`;
  paste-text fallback when the module isn't in the build
- [x] Notebook (Notion-style blocks + templates), College tracker, Your
  day timeline (Structured-style), Connections (Canvas sync, Classroom
  via screenshot, shortcuts)
- [x] Ember: school/college tips, AI context + actions for school
- [x] Verified live in the Simulator: onboarding → scan a mock Classroom
  To-do screenshot → 3 classes + 3 assignments with correct dates and
  kinds imported → Desk "Due soon" → School (tonight's load, week strip)
  → check one off (Ember cheers) → Focus session running → quick-add
  sheet → Notebook template editing; every hub screen screenshotted
- [ ] Not tested: Canvas sync against a real account, Google Calendar
  inside "Your day", College add flow, typing a real class schedule
- [ ] Rebuild for the phone (needs the native module) — see the prebuilt
  core gotcha in CLAUDE.md
- [x] Committed (309197b)

## Phase 22 addendum — proposed next AI step (awaiting approval)

"Recent Insight": one read-only Edge Function endpoint that summarizes the
last 7 days of check-ins/tasks/habits/wellness scores into 2–3 grounded
sentences, shown in one card with a manual refresh. Reuses the existing
`chat` function's deployment pattern and secret; no chat UI, no writes,
no scheduling; clearly labeled AI and separate from Ember. Still blocked
on Anthropic billing. **Do not build until the user approves.**

## Phase 31 — The Masterpiece (2026-09-30)

120 ideas — plan, status, and where each lives: `docs/masterpiece.md`.

- [x] All 120 built (school, grades, study, Ember, wellness, notebook,
  college, student life, motivation, design, settings/data)
- [x] Verified live in the Simulator (see SESSION_LOG 2026-09-30)
- [ ] Not verified live yet: mood map with real check-ins, weekly review
  save, worry box, your people (Messages hand-off), scholarships / recs /
  activities / aid forms, triage with real overdue work, "I was out" note
  drafts, export backup share sheet, hold-to-erase (deliberately not run)
- [ ] Rebuild for the phone (2026-10-01 attempt stopped: the phone was locked, so the developer disk image couldn't mount; unlock it and rerun the recipe in CLAUDE.md)
- [x] Commit (da32a82, pushed 2026-10-01)

## Phase 32 — Masterpiece round 2 (2026-09-30)

Plan and status: `docs/masterpiece-2.md` (100 ideas, all built).
- [x] Helper crew, AI allowance + Plus screen, multi-screenshot scan
- [x] Committed and pushed as c454311 (2026-10-01)
- [ ] Ember's AI and the helpers' AI chat: needs Anthropic credit and the
  `ember` Edge Function deployed (the user's steps)
- [ ] Plus purchases: needs the paid Apple Developer Program, an App Store
  Connect subscription, and a StoreKit library

## Phase 33 — Masterpiece round 3 (2026-09-30 → 10-01)

Plan and status: `docs/masterpiece-3.md` (100 ideas, groups A–J).
- [x] A–F committed in c454311; G–J committed and pushed 2026-10-01

