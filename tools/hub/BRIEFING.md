# Team briefing

You are one agent on a team building **Brain Navigator**, an iOS app (Expo SDK 57,
React Native 0.86, Reanimated 4.7, Gesture Handler 3.3, Zustand 5) for one high
school student: a calm, candlelit school-and-wellbeing hub with a flame mascot
named Ember. **Atlas** (the orchestrator) gave you a mission and a list of ideas.
You work in your own git worktree. Atlas merges your branch, checks it live in the
iOS Simulator with real taps, and ships. The user watches all of it on a live
dashboard (the Work Hub), so report as you go.

## 1. Before you write code

1. Read `CLAUDE.md` (at least Layout, Round 5, Design system, Conventions) and
   `docs/masterpiece-6.md` (the plan most ideas come from). Read every file you
   will change in full, and the neighbors it imports.
2. `AGENTS.md`: Expo has changed. If you use an Expo API you're not sure of, read
   https://docs.expo.dev/versions/v57.0.0/ first.
3. Your worktree has no `node_modules`; the gate links the main checkout's for
   you. Never run `npm install`, never add packages.
4. Look at two or three existing screens that resemble what you're building and
   match them exactly (spacing, type, cards, copy voice).

## 2. Report to the hub

`node /Users/peternunley/Desktop/brain-navigator/tools/hub/hub.mjs <you> <type> [flags] "message"`

| When | Command |
|---|---|
| First thing | `hello --state reading --branch "$(git branch --show-current)" --path "$(pwd)" "what you're starting"` |
| Starting an idea | `claim --idea R6-21 "your plan in one sentence"` |
| Every meaningful step (at least every ~10 min of work) | `step --idea R6-21 --pct 40 --state building --file path/to/file.tsx "what you just did"` |
| After committing an idea | `done --idea R6-21 "what it does; how to see it"` |
| Decided against | `dropped --idea R6-24 "why, in a sentence"` |
| Stuck | `blocked --idea R6-30 "what's in the way"` |
| A new idea you noticed | `idea --area <key> --size S\|M\|L --impact 1-3 --title "Short title" "what and why, one sentence"` |
| The very end | `bye --state done "one-line summary"` |

Area keys: night desk school focus steady ember about journal future notes motion
polish a11y show privacy ai perf data connect platform delight craft.
Messages are plain, calm sentences; the user reads them. Keep them short.

## 3. The gate (before every commit)

From your worktree root:
`node /Users/peternunley/Desktop/brain-navigator/tools/hub/check.mjs --agent <you> --idea <ID>`

It checks the house rules on every line you added and runs the type-check, and
reports the result to the hub itself. Fix every ERROR. Read every warning and fix
the ones that apply (some are false positives; say so in your report).

## 4. Commit

One commit per idea (or a small group of related ideas), on your worktree's
branch: `git add <exact files>` (never `git add -A` or `.`; never add
`node_modules`), then

```
git commit -m "<Short title>: <what it does>

Ideas: R6-21, R6-22

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Never push. Never commit to main. Never merge, rebase, or reset other branches.

## 5. House rules (the user has relied on these for six rounds)

**Design**
- Build every screen with `Screen` and the kit in `components/ui` (Card, Section,
  Button, Chip, IconButton, Icon, EmptyState, StatTile, Ring, …). Every tappable
  thing uses `Pressy` or a kit component built on it.
- Candlelight only, from `core/theme.ts`: `colors.*`, `alpha()`, `fonts.*`. Gold
  (`colors.flame`) is the only action color. Fraunces for voice and headings,
  Figtree for everything else.
- Copy: calm, plain, short, sentence case. No uppercase or tracked labels, no
  "A · B · C" joins, no exclamation marks, no guilt, no streak pressure, no
  numbers-as-judgment. Counts through `plural()` (core/words.ts); due words
  through the existing helpers.
- Motion answers a person's action or brings content in once. Every animation
  has a Reduce Motion path. Springs and timings come from `core/motion.ts`.
- Accessibility: every icon-only control has an `accessibilityLabel`; headings
  are headers; text survives the largest Dynamic Type sizes (cap only tight
  chrome like pills and badges with `maxFontSizeMultiplier`).

**Code**
- `goBack()` / `goHome()` from `core/chrome`, never `router.back()`. Haptics only
  through `core/haptics`.
- Zustand 5 selectors return stable references: select the array, filter in
  render or `useMemo`. A selector that builds a new array loops forever.
- Reanimated 4: anything called inside `useAnimatedStyle` / `useAnimatedProps`
  is a worklet; no dependency arrays on Reanimated hooks; hop to JS with
  `scheduleOnRN` (react-native-worklets). Gesture Handler 3 hook API, like the
  existing code.
- Stores (`schoolStore`, `hubStore`, `lifeStore`): add only OPTIONAL fields so
  old files load; never save before loaded; nothing saves while showing the
  sample student (`isShowing()` in core/showMode.ts). Anything you store should
  look right for Riley, the sample student (core/sampleData.ts); if it needs a
  sample value and you don't own that file, say so in your report.
- Privacy: nothing new goes to the AI or any server. Crisis words always surface
  help lines. AI proposes, the student taps, and it can be undone. Every delete
  offers Undo (`putBack` / undoStore pattern).
- No native code, no new packages, no app.json plugin changes (no rebuild this
  wave). If an idea needs one, drop it with the reason or file the native part as
  an idea.
- Don't edit files another agent owns this wave (tools/hub/data/team.json lists
  them). If you need a change there, make your piece self-contained (a component,
  hook, or helper) and write the exact wiring under "Wiring for Atlas" in your
  report.
- Don't touch `docs/` except files you own; Atlas writes CLAUDE.md, the session
  log, and masterpiece-6.md.
- Never touch the iOS Simulator, Metro, Xcode, or the app's data files. Atlas
  verifies live. Never claim anything was checked live.

## 6. Quality bar

Fewer ideas finished well beat many half-done. Each idea is complete, matches
the app, handles its edge states (no data yet, the sample student, the largest
text, night and day), and passes the gate. Reuse existing helpers (search
`core/` first) instead of writing new ones. Write down each decision with its
reason.

## 7. Final report (your last message; Atlas merges and verifies from it)

1. Branch name, worktree path, and commits (hash, title, ideas).
2. Per idea: built or dropped (and why), the files, and **How to check it
   live**: exact Simulator steps (deep link `brainnavigator://<route>`, what to
   tap, what you should see), including any time of day or setting it needs.
3. Wiring for Atlas: changes needed in files you don't own, with exact code.
4. Sample data the sample student needs, if any.
5. Ideas you filed, risks, and anything you're unsure of.
