# Plan for the local session (Mac, phone, Simulator)

> **For Peter:** when your usage resets, open Claude Code in
> `~/Desktop/brain-navigator` on the Mac, plug in the phone, and paste:
>
> *"Read docs/LOCAL-SESSION-PLAN.md and do it, part by part. Work token-efficiently.
> Stop and ask me before anything that changes signing, deletes the app from the
> phone, or touches the database."*

You are the **local** Claude for Brain Navigator. The cloud session (which can't
see the app) built a lot since the last phone build: see "What's new" below.
Your job is what only a session with the phone and Simulator can do: see it,
fix what's broken, and build the device-only items. Follow `CLAUDE.md`. Every
commit passes `node tools/hub/check.mjs --agent local`. Work on branches, open
PRs, merge them yourself (main is guarded by `.githooks/pre-push`).

Token rules: read files by line range with `grep -n` / `sed -n`; never read
`package-lock.json` or `docs/history/`; check one thing at a time; don't
re-explain what this plan already says.

## Part 0. Set up (about 20 minutes, mostly waiting)

```bash
cd ~/Desktop/brain-navigator && git checkout main && git pull && npm install
npx supabase functions deploy ember notion --project-ref jmjdiudekhkrxxontvhc --use-api
npx expo prebuild -p ios && ./scripts/build-phone.sh
```

- If the build fails on signing, the script prints the fix. Never delete the app
  from the phone (its data goes with it). Signing team is PQLSGT6XTP
  (thenunleyboys@icloud.com); ask Peter before changing it.
- After the app is on the phone and photos still show, ask Peter to run in the
  Supabase SQL editor: `update storage.buckets set public = false where id = 'snapshot-images';`
  Then check photos again.
- Optional, Peter's call: `npx supabase secrets set NOTION_DATABASES=<the three IDs in .env> --project-ref jmjdiudekhkrxxontvhc`

## Part 1. Walk the new work (highest value)

Open `docs/LIVE-CHECKS.md`, section **Do these first**. For each line: do it on
the phone (or Simulator for night and dates: `brainnavigator://?night=23:30`,
`?night=off`), then in the round file it came from:

- works: `[~]` → `[x]` with "— seen 2026-10-xx"
- broken: fix it if it's small (one PR per fix, gate passes), else add it to
  Round 7 section G as a bug with what you saw
- gone or not worth it: `[–]` with why

Pay special attention to:
- **AI consent sheet** (first AI request), **"Ember is a computer program"**
  line, and the **crisis help** card ("I want to die" as a test message: help
  lines at once, reply carries Need help now). These are legal requirements.
- **Canvas** still syncing after the keychain move (token migrated).
- **Shake** to drop a worry (and not while walking); **shake on Wins**.
- **Drawer** (search, five groups, All N), **+ sheet** order by time,
  **School** (Tonight first, one menu), **Focus** (target preselected),
  **Habits** (no streaks), **Goodnight** continuity line.
- **Desk "One Lit Thing"** (Muse's phases 1, 2, 7), if merged: one Ember note
  at a time with "Ember has N more", the lit card, Today rows, "More on your
  desk", Settings switch back to the classic Desk, the 3-step first run
  (Settings → reset the welcome). If anything is off, prefer fixing over
  reverting; the classic switch is the safety net.

Commit the status flips and regenerate: `node tools/hub/live-checks.mjs`.

## Part 2. The rest of the live list

Then the older `[~]` items in `docs/LIVE-CHECKS.md`, newest round first. Batch
by screen (open a page, check every item about it at once). Riley's show mode
(Settings → Show) covers most of it without real data.

## Part 3. Device-only building (Round 7)

In this order, one PR each, live-checked before merging:

1. **Speed (B9, B10, G37):** Release build on the phone; measure cold start to
   the Desk (target under 1 s) and the short freezes after tab taps and opening
   Badges. Use the React Native perf monitor; fix what's measurable.
2. **Largest text and VoiceOver (A6, A7):** every new piece (Drawer, + sheet,
   consent sheet, licenses, Desk changes) at the largest Dynamic Type and with
   VoiceOver. Fix clipping and missing labels.
3. **Ember overlap (G25):** Ember perched on the left covers heading letters and
   button edges; find a resting spot that never covers content.
4. **Quiet the floating Ember (design phase 8, last part):** once per screen,
   silent on the Desk and after Goodnight (`components/ember/EmberBuddy.tsx`).
5. **Snooze a Desk card (F20 #6, X013):** swipe a day card to tonight or
   tomorrow, with Undo. Needs to be felt, so build it here.
6. **Increase Contrast (F20 #9, X125):** muted text stronger when the iPhone
   setting is on; theme colors are strings used by SVG, so re-render on
   `AccessibilityInfo` darker-colors changes rather than DynamicColorIOS.
7. **Screenshots (E17, E18):** a script that captures the hero pages in show
   mode into `docs/screens/`, then put them in `docs/WHAT-THIS-IS.md` and the
   README. These double as App Store screenshots (see
   `docs/design/DIRECTION.md` §7 for the five frames).
8. **Age range (legal B6):** Apple's Declared Age Range API (native), 13+ gate,
   respecting parental consent (Texas, Utah, Louisiana). Needs a native module;
   ask Peter before adding packages.
9. **Home screen widget (D15):** tonight's first class and what's due. Native
   extension target; biggest item, do last.

## Not for this session (decisions or cloud)

- Legal blockers B1 (per-user data), B4 (lawyer, hosting the policy), B8
  (Anthropic child-safety prompt): wait for Peter (reminder set for Oct 11).
- Over-the-air updates (C12) need an Expo `projectId` from Peter.
- Expo SDK 58: after Round 7 is checked.

## What's new since the last phone build (for orientation)

Keychain for the Canvas token; shake to drop a worry and shake the jar; turned
in; Halloween Ember; unit tests in the gate (97); short weekday fix in quick
add; scan fixes (dates beside grades, classes across noon); flashcard
separators; learning switch honored everywhere; AI consent sheet; AI companion
disclosure and 3-hour reminder; minor-safety AI rules; server crisis
guarantee; private photo links; release builds skip Notion; open-source
licenses page; Drawer regrouped with search; + sheet by time of day; School
and Focus focal points; no streak pressure; goodnight continuity; and Muse's
Desk phases if merged. Details: `git log --oneline -40`, `docs/rounds/round-7.md`,
`docs/design/DIRECTION.md`, `docs/legal/RELEASE-COMPLIANCE.md`.
