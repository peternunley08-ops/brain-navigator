# MASTER PROMPT — Autonomous Build Session: Brain Navigator

## SYSTEM DIRECTIVE — READ THIS FIRST

You are operating in full autonomy mode on an **existing, working codebase** at
`~/Desktop/brain-navigator`. You have **[fill in: e.g. 3 hours]** to take the
open items below from not-started to done, verified against the real Supabase
project, and reflected in `todo.md`. These rules are absolute:

**Rule 1 — Never ask for permission.** Phases 1 through 12 in `todo.md` are
done and their decisions (tech stack, data model, "Glasshouse Study"
aesthetic, navigation pattern, the Eight Dimensions of Wellness taxonomy,
push-only Notion sync, native build workflow) are locked — do not revisit or
re-litigate them. For anything the items below don't specify, make the call
yourself using the established patterns in this codebase and move on. I am
unavailable for this session.

**Rule 2 — Never stop until finished.** You are not done until every item you
take on is implemented, verified live (not just "should work"), and `todo.md`
is updated. No partial updates, no "here's what I've done so far" — that's
what `todo.md` itself is for, not a chat message.

**Rule 3 — If blocked, pivot immediately (max 5 minutes per blocker).** This
project's actual, tested pivots — use these, not generic web-deploy advice:

| Blocker | Pivot |
|---|---|
| `npx expo install <pkg>` fails with ERESOLVE | `npm install <pkg> --legacy-peer-deps` (matches `expo`'s existing `react`/`react-dom` pin) |
| `pod install` fails with a Unicode/encoding error | Run it with `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` explicitly set |
| `xcodebuild` fails with a React Native codegen "module not found" error | The default DerivedData path under `~/Library/Application Support/...` has a space in it and breaks some CocoaPods scripts — build with an explicit `-derivedDataPath` under `/tmp` instead |
| Codesign fails with "resource fork, Finder information, or similar detritus not allowed" | `xattr -cr` on `node_modules` and `ios` |
| MCP Simulator `launch` action fails repeatedly (`disclaimer exited with code 143`) | Bypass it: `xcrun simctl install <udid> <path-to-.app>` then `xcrun simctl launch <udid> <bundle-id>` directly |
| A feature needs a real Apple Watch, physical device, real Apple Developer paid signing, or copyrighted audio assets | Cannot be done headlessly. Stub it as a documented plan (see `docs/plans/apple-watch.md` for the pattern) instead of attempting a real build. Note it as a limitation. |
| A feature needs a third-party account/API key you don't have (Google Cloud OAuth client, Notion integration secret, etc.) | Stop and hand back to the user with exact numbered setup steps — this project's pattern all session has been: agent does everything that doesn't require the user's own login, user does the few clicks that do, agent resumes once given the resulting (non-secret) values. Do not try to work around this by skipping the feature. |
| Any Supabase or Notion write during testing | Must be cleaned up afterward — delete test rows in Supabase, archive test pages in Notion — with a final check confirming the touched tables are back to their pre-session real-data-only state. This has been done after every single phase this session; do not break the streak. |
| Dev server / Metro port in use, or app shows a stale/blank screen | Check `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/status`; if Metro's alive but the simulator's blank, it's usually just idle-timeout back at the Entry Threshold hold-to-enter gate — pass through it, don't restart anything |

**Rule 4 — Work in phases, log your progress.** This project already uses
`todo.md` as its build log, phase by phase, each phase explaining not just
what was built but *why* (the decisions made, the tradeoffs accepted). Keep
using that exact format — do not start a separate log file, and do not write
a shallower entry than the existing ones.

**Rule 5 — Quality over speed.** Budget roughly: planning 5%, implementation
60%, live verification 25%, `todo.md` writeup 10%.

**Rule 6 — Test everything before declaring done — live, not "should work."**
Every feature must be:
- Functionally verified against the real Supabase project and (where
  applicable) the real Notion/Google Calendar APIs, using the native iOS
  Simulator build (`xcrun simctl` + the Metro dev server already running on
  port 8081) — not the web preview, which several native-only features
  (Google Sign-In, HealthKit) cannot run in at all.
- Checked for crashes/red-screens in the simulator and for errors in
  `xcrun simctl spawn <udid> log show --predicate 'process == "brainnavigator"'`.
- Free of leftover test data in Supabase or Notion afterward.
- If the change touches native dependencies (new native module, new Info.plist
  key, new entitlement), it needs a real `expo prebuild` + `xcodebuild`
  rebuild before it can be tested — do not assume Fast Refresh is enough.

**Rule 7 — One final message only.** No progress pings. When everything is
done, tested, and `todo.md` reflects reality, send one summary covering: what
was built, what was verified and how, what was descoped/mocked and why (with
a `docs/*.md` plan written for anything that needed real hardware/accounts
you didn't have), and what a next session should tackle first.

---

## PROJECT CONTEXT (do not rebuild any of this — it already exists)

**What Brain Navigator is:** a personal, local-first-leaning wellness app
built around a mental-model/conflict-processing core (Root Map, Lantern Desk,
Sanctuary, Closure Ring, Red String) with a full Wellness Expansion layered
around it: Daily Check-in, Trends, Habits, Tasks & Plate Meter, the Eight
Dimensions of Wellness Wheel, Google Calendar, and Notion push sync. Personal,
single-user, runs on the owner's own device via a native Xcode/Simulator
build — never distributed, no App Store submission planned.

**Tech stack (locked):** Expo SDK 57 (managed workflow, `expo prebuild`'d to
a real native iOS project for Xcode builds), TypeScript, expo-router
(file-based routing), Zustand (one store per domain in `core/`), Supabase
(Postgres + supabase-js, RLS wide-open on the anon key — a documented,
accepted single-user MVP tradeoff, see `docs/plans/encryption.md`),
react-native-svg for all custom visualizations (no charting library),
`@react-native-google-signin/google-signin` for Calendar OAuth,
`@kingstinct/react-native-healthkit` + `react-native-nitro-modules` for
HealthKit. Read `AGENTS.md` — Expo has changed since training data; check
`docs.expo.dev/versions/v57.0.0/` before writing code that touches an Expo
API you're not certain about.

**Design system — "The Glasshouse Study":** warm editorial aesthetic (cream
`#F4EEE0` / leather `#5B4636` / lantern-glow amber), Fraunces display serif +
Lora body + Courier Prime mono accents, defined in `core/theme.ts`. Explicitly
**not** the generic pink/purple/blue AI-wellness-app palette — this was a
deliberate, repeated user correction earlier in the project. `BottomNav` is
capped at 5 items (4 regular + 1 raised center action) by the project's own
mobile-UI-design principles; every screen added since has been reached via a
pill button on a related screen instead of growing the nav bar.

**Where things live:**
- `app/*.tsx` — one file per route (expo-router), `app/entry/[id].tsx` for
  entry detail.
- `core/*.ts` — one Zustand store per domain (`store.ts` for Root Map/
  cognitive_state, `wellnessStore.ts` for check-ins, `habitsStore.ts`,
  `tasksStore.ts`, `wellnessWheelStore.ts`, `googleCalendarStore.ts`), plus
  `theme.ts`, `wellness.ts` (the 8-dimension taxonomy), `notion.ts` (push
  helper), `supabase.ts` (client), `schema.sql` (running log of every
  migration — always appended to, always also run live, never assumed).
- `components/ui/*.tsx` — shared primitives (Button, Card, Divider,
  TrackSlider, PlateMeter, WellnessWheel, ScienceNote).
- `docs/*.md` — plans for things that couldn't be built headlessly
  (Apple Watch, encryption).
- `todo.md` — the real roadmap and build log; read it in full before starting
  anything, it is more current than this prompt will ever be.

**Native build, already solved once — reuse it, don't rediscover it:**
`app.json` → `ios.bundleIdentifier: com.peternunley.brainnavigator`, scheme
`brainnavigator`. Simulator device UDID and Metro port (8081) are whatever
the current session's `todo.md`/recent shell history show — check before
assuming. The full rebuild sequence, every time a native dependency changes:
`npx expo prebuild` → `pod install` (with the UTF-8 fix) → `xcodebuild` (with
the space-free derived-data-path fix) → `xcrun simctl install` +
`xcrun simctl launch` (bypassing the flaky MCP `launch` action) → confirm
Metro is serving on 8081 → screenshot to confirm it loaded past the Entry
Threshold.

---

## OPEN ITEMS

Pull the next item from whichever list makes sense given the time budget;
each is independently schedulable. Update `todo.md` with a new phase number
for whichever you take on, following the existing entries' depth and honesty
about tradeoffs — including "known limitation" callouts, not just successes.

### In progress
1. **Finish HealthKit** (`@kingstinct/react-native-healthkit` is installed,
   config plugin is set with custom usage descriptions — pick up from there):
   read Sleep Analysis, Heart Rate, Steps; write Mindful Minutes sessions; a
   `/health` screen mirroring the `/calendar` screen's connect/dashboard
   pattern; wire a one-tap "Import from Health" on the Today check-in's Sleep
   Hours field; `expo prebuild` + full native rebuild required; verify via
   the Simulator's own Health app (manually add sample data there — real
   sensor data doesn't exist in Simulator) for read paths, and verify the
   write path (Log Mindful Minutes) fully round-trip since that doesn't
   depend on pre-existing Health data at all.

### Real gaps flagged during the build, never actioned
2. **Nothing has been committed to git** beyond the very first bare-scaffold
   commit — `app/`, `components/`, `core/`, `docs/`, essentially the entire
   app, is still untracked. This is the single biggest real risk in the
   project right now (no history, no rollback point). Commit it — ask the
   user first per their own git-safety rules, but flag this at the top of
   your first message if you're not actually cleared to commit autonomously.
3. There's a stray `Brain Navigator/` folder at the project root (its own
   nested `.git` and an `.xcodeproj`) — debris from an early native-build
   attempt before the real `expo prebuild` flow was worked out. Confirm
   what's in it, then clean it up (with the user's confirmation, not
   unilaterally — it was flagged once already and never resolved).
4. `.claude/launch.json` was never wired up for a one-command native
   Simulator preview via the Browser pane's `preview_start`. Would remove a
   lot of the manual `xcrun simctl` dance every session.
5. Habits and Tasks can be created but not archived or deleted — no UI path
   to remove a mistake or a habit you've stopped doing. Root Map entries
   likewise can't be edited after creation (mood/notes are write-once).

### Backlog items already named as future work in `todo.md`
6. Real Supabase Auth, to replace the wide-open anon-key RLS policies —
   `docs/plans/encryption.md` explicitly says this should land before any
   real encryption work.
7. Local-first encryption (blocked on #6).
8. Apple Watch companion — `docs/plans/apple-watch.md` has the plan; needs
   real Xcode/signing/a paired device done together with the user, not
   headlessly.
9. Topography's graph layout is a simple two-ring placement, not
   force-directed — fine at current data volume, will need real layout work
   once there's enough entries to overlap.
10. Topography (and the Wellness Wheel's task/habit scoring) still reads
    through `fetchHistory`'s 50-row cap / fixed 30-day windows — not truly
    unbounded. Low priority until real data volume makes it matter.

### Polish and robustness (no product decision needed, just execution)
11. Google Calendar: currently read-today + quick-add only. Could support
    editing or deleting an event from the app, or a multi-day view.
12. Notion push sync has no retry — if a push silently fails (offline,
    Notion API hiccup), the row's `notion_page_id` just stays null forever
    with no visible indicator or manual "resync" path.
13. The Wellness Wheel's "no data yet" dimension cards say "add one from
    Tasks or Habits" as plain text — could deep-link straight into
    Tasks/Habits pre-filtered to that dimension instead.
14. No app-wide error-toast/snackbar pattern — every screen currently
    renders its own inline error `<Text>`, which is consistent but easy to
    miss (e.g. below the fold). Consider a shared component if this keeps
    growing screen by screen.
15. Zero automated tests anywhere in the codebase. `wellnessWheelStore.ts`'s
    scoring math and `habitsStore.ts`'s streak logic are the two most
    complex, least-visually-obvious-when-wrong pieces in the app — prime
    first candidates if testing infrastructure gets added.
16. `tsc --noEmit` has never been explicitly run as a standalone check this
    session (only implicit via Metro's bundler) — worth confirming it's
    clean.
17. Accessibility labels (`accessibilityLabel`/`accessibilityRole`) are only
    present on a handful of elements (e.g. `BottomNav`'s center button) —
    an audit pass would likely find real gaps.
18. `supportsTablet: true` is set in `app.json` but no screen has actually
    been visually checked on an iPad simulator — the `maxWidth: 480`
    centering pattern used on several screens should handle it reasonably,
    but this is an assumption, not a verified fact.
19. Dark mode isn't supported (`userInterfaceStyle: "light"` is a deliberate
    choice, not an oversight) — only revisit if the user actually asks for
    it, don't add it speculatively.
20. Consider whether Acoustic Sanctuary usage (the breathing-glow session)
    should feed the Wellness Wheel's Emotional score as a stress-management
    signal, now that HealthKit gives a second, richer physiological signal
    to potentially cross-reference against.

---

## QUALITY BAR (carried over from every phase already built — keep matching it)

- Every new Supabase table/column goes through `core/schema.sql` (appended,
  never rewritten) *and* is run live against the real project before any code
  that depends on it is written.
- Every new screen matches the existing visual language exactly — reuse
  `Button`/`Card`/`Divider`/theme tokens, never introduce a new color or type
  scale ad hoc.
- Every new integration (native or third-party API) gets a real live
  round-trip test, not a "the code looks right" sign-off — this project's
  entire credibility this session rests on that discipline.
- Every piece of test data, in every system (Supabase, Notion, Google
  Calendar), gets cleaned up in the same turn it was created.
- `todo.md` is the deliverable as much as the code is. A phase that isn't
  written up with its real decisions and tradeoffs isn't actually done.
