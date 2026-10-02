# Context pack (read this instead of CLAUDE.md)

Brain Navigator: an Expo Router (SDK 57) + React Native 0.86 app for one high
school student. Calm, candlelit night room; Ember is a flame mascot. Reanimated
4.7, Gesture Handler 3.3 (hook API: `usePanGesture`), Zustand 5,
react-native-svg, react-native-worklets (`scheduleOnRN`). iOS only.

## Where things are
- `app/` routes. Desk `/` = `app/index.tsx`. Tabs: Desk, School, +, Focus,
  Steady. Everything else is in the Drawer (`app/drawer.tsx`, list in
  `core/tools.ts`). Deep links: `brainnavigator://<route>`.
- `components/ui/` the kit: `Screen` (every page; props: title, subtitle,
  barTitle, back, right, tone 'room'|'ember'|'dusk', nav, scroll, onRefresh,
  sheet, scrollRef, overlay, contentStyle), `Card` (tint, onPress, padded),
  `Section` (title, note, action, icon, folded, onToggleFold), `Button`,
  `Chip`/`ChipRow`, `IconButton` (icon, label = a11y label), `Icon`,
  `Pressy` (every tap), `EmptyState` (title, body, art, children), `StatTile`,
  `Ring`, `Candle`/`CandleGlyph`, `Skeleton`, `Backdrop`, `Reveal`.
- `components/desk/` Desk cards (`AboutCards`, `DayCards` with
  `useClosedToday(id)`, `OneThing`, `CountdownChips`, `PinnedNotes`).
- `components/ember/` Ember: `EmberBuddy` (overlay; `emberSay(text, mood)`),
  `EmberSprite`, `Sparks`. `core/emberStore.ts`: `setNapping(bool)`.
- `core/` stores and helpers:
  - `schoolStore.ts` (`school.json`): classes (days, start/end minutes),
    assignments (kind, due 'YYYY-MM-DD', done, minutes, subtasks, starred),
    focus sessions, grades, profile (name, sleepGoal hours, cap).
  - `hubStore.ts` (`hub.json`): notes, colleges, plan blocks.
  - `lifeStore.ts` (`life.json`): wins, worries (worry box), pack /
    windDownItems lists + `packDone`/`windDownDone` keyed by night,
    `toggleListItem(which, date, id)`, countdowns, people, decks, about
    (About you), settings (windDown & wake = minutes after midnight, birthday,
    deskFolded, deskClosed, aiOff, …). Every store has `putBack(patch)` for Undo.
  - `dates.ts`: `dateKey()`, `addDays(key, n)`, `daysUntil(key)`,
    `dueLabel(key)`, `clock(minutes)`.
  - `words.ts`: `plural(n, word, many?)`. `haptics.ts`: `impactAsync`,
    `selectionAsync`, `notificationAsync` (never import expo-haptics).
  - `chrome.ts`: `goBack()`, `goHome()`, `wantNav()`, `emberHop`.
  - `motion.ts`: `springs.press|release|snappy|gentle`,
    `timings.quick|base|calm`.
  - `theme.ts`: `colors` (night, surface, surfaceHigh, surfaceSunk, line,
    lineStrong, text, textMuted, textFaint, flame (the only action color),
    flameHot, flameDeep, flameInk, unlocked, secured, shelved, danger),
    `alpha(color, a)` (a worklet), `fonts` (display Fraunces semibold,
    displaySoft Fraunces italic = Ember's voice, body/bodyMedium/bodySemi/
    bodyBold Figtree, mono = numbers), `type`, `layout.gutter`.
  - `about.ts` (This-or-that picks, `cheerLine`, `callName`), `learned.ts`
    (what the app noticed), `ember.ts` (`adviseFor(path)` tips, rules only).
  - `showMode.ts` `isShowing()`: showing Riley, a sample student
    (`sampleData.ts`); nothing saves while showing.
  - `celebrateStore.ts` `celebrate(title, body, color, { key, win })` once per key.
  - `undoStore.ts` the 5-second Undo pill.

## House rules (the gate checks most of these)
- Build with `Screen` + the kit; every tap through `Pressy` or a kit piece.
- Colors from `colors`/`alpha`, fonts from `fonts`. Gold is the only action
  color. Fraunces for headings and Ember's voice, Figtree for the rest.
- Copy: calm, plain, sentence case. No uppercase labels, no "A · B" joins, no
  exclamation marks, no guilt or streak pressure. Counts via `plural()`.
- `goBack()` not `router.back()`; haptics via `core/haptics`.
- Zustand: select the raw array/object, filter in render or `useMemo` (a
  selector returning a new array loops forever).
- Reanimated: worklets for anything inside `useAnimatedStyle`; no dependency
  arrays on Reanimated hooks; `useReducedMotion()` path for every animation.
- Stores: only add OPTIONAL fields (at the end of the type and defaults).
- Every delete offers Undo. Nothing new goes to AI or any server.
- No new packages, no native code. No edits outside your packet's files.
- Accessibility: icon-only controls get `accessibilityLabel`; headings are
  headers; tight chrome (pills, badges) caps `maxFontSizeMultiplier`.
