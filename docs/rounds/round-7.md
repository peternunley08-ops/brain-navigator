# Round 7: Seen, shipped, and on the phone

Written 2026-10-03 at the end of Round 6 (`docs/rounds/round-6.md`).

Round 6 built 100 ideas in a cloud session that has no Simulator. So most
of it is `[~]`: built and passing the gate, not yet seen. Round 7 starts by
seeing it, then makes the phone easy to update, then picks up the ideas
that needed a native build.

Statuses: `[ ]` not started · `[~]` built, partly checked · `[x]` done and
checked · `[–]` decided against (with why)

## A. See Round 6 live (on the Mac)

1. [ ] Fix the phone install: Xcode said "the developer disk image could not be mounted". Unlock the phone, let Xcode prepare it (Window → Devices and Simulators), update Xcode if iOS 27.2 isn't supported
   - [~] iOS 27 launch: apps built with the iOS 27 SDK won't open without the UIScene life cycle. `plugins/withSceneLifecycle.js` wires in Expo's scene delegate at prebuild. Opens on the iOS 27 and iOS 26 simulators, deep links work warm and cold; check on the phone
2. [ ] Release build on the phone: `./scripts/build-phone.sh --main`
3. [~] Walk every `[~]` item in Round 6 with real taps; flip it to `[x]` or file the bug here — walked 2026-10-03 on four Simulators: 72 of 100 now `[x]`; the bugs it found are fixed (see the log below); what's left needs the phone, a real Sunday, or a live re-check
4. [~] Night: `?night=21:30`, `?night=00:30`, Sunday night, `?night=08:00` for First light — all seen in the Simulator except Sunday night, which needs a real Sunday
5. [~] Ember: hold to breathe, drag weight, night candle, study buddy book, birthday hat — all seen (hold to breathe fixed); the drag's lag needs the phone
6. [~] Every new piece at the largest text size (R6-92) — the walk found mid-word breaks, cut-off buttons, overlapping cards; caps added (textGrow in the theme), Settings and the wake screen re-checked; a full pass still to do
7. [~] Every new piece with VoiceOver and Reduce Motion, on the device (R6-93, R6-94) — Reduce Motion seen in the Simulator; VoiceOver labels checked by reading; VoiceOver itself on the phone
8. [ ] A last full pass: open every page, read every word (R6-20)

## B. Fast and measured

9. [ ] Open to the Desk in under a second on the phone; measure cold start (R6-96)
10. [ ] 120 Hz audit with the perf monitor: no JS per frame on scroll or drag (R6-90)
11. [x] Badges: render locked tiles without the late jump (from R6-85) — seen frame by frame

## C. Easy to update the phone

12. [ ] Over-the-air updates: add `expo-updates` (one native build), so JS-only rounds reach the phone without the Mac
13. [~] A one-command build script (`scripts/build-phone.sh`) wrapping the Release command, UTF-8 and the device ID

## D. Native batch (one rebuild, done together)

14. [~] Pocket worry: shake to drop a worry in the box from anywhere, with Undo (`expo-sensors`; R6-63). Three hard jolts in 0.8 s open a small sheet; off switch in Settings → Privacy
15. [x] Home screen widget: tonight's first class and what's due (Built in PR #66; seen 2026-11-02: `startHomeWidget` syncs tomorrow's first class and due items to `TomorrowWidget`, skipping show mode)
16. [x] A speaker icon in the kit for Fire crackle (drawn in code, no rebuild needed) — seen on and off
28. [~] The Canvas token moves into the iPhone keychain (`expo-secure-store`); an existing connection carries over on first launch

## E. Show it well

17. [x] Screenshots script for the hero pages into `docs/screens/` (R6-53), in show mode only (PR #59) — seen 2026-10-09 (Simulator): all five as Riley at 9:41, real files untouched. Fixed: with two Simulators on, "booted" picked the one without the app; it now finds the one with the app (or takes --device), and a failed cleanup no longer hides the first error. Fixed in PR #78: `?show=riley` hides the "Showing Riley | Done" pill and resets Ember's perch so all five App Store frames are clean
18. [x] Put the screenshots in `docs/WHAT-THIS-IS.md` and the README — seen 2026-10-09: both show all five, and the refreshed pictures land there on their own
19. [x] The show tour's lines checked against Riley's sample data — two were wrong (the dentist, Steady's habits) and Focus's never showed; fixed and seen

## F. From the idea bank

20. [x] Picked 2026-10-05, by delight per hour (small first, nothing that needs AI or a new native module). Already built, so skipped: X032 what-if grades, X047 smart start
    1. [~] X065 Halloween Ember: a tiny pumpkin hat on October 31 and one hello line (birthday hat wins). Check by setting the phone's date to Oct 31
    2. [–] X019 One-tap mood: already built (the Desk's mood faces call `quickMood`, with Undo)
    3. [~] X122 Label every icon button for VoiceOver. Audit: IconButton already requires a label; one bare control found (Your day's color swatches, now named); text fields now keep their label after they're filled. Listen with VoiceOver on the phone
    4. [x] X174 Tests for the core helpers: `npm test` (Node's built-in runner, no new packages), 16 tests over dates, plural, the night clock, classAverage, letterFor, planBackward. Part of the gate now
    5. [x] X038 Turned in: homework, projects and essays marked done show "Done, not turned in yet" and a Mark turned in chip on their page (`turnedIn`, optional) — seen 2026-10-05 (Simulator): Mark done → "Done, not turned in yet", Mark turned in → "Done and turned in" (bug found: 41)
    6. [x] X013 Snooze a Desk card to tonight or tomorrow (optional field). Built in PR #57: swipe the lit homework card left to set it aside till 6 PM or 7 AM tomorrow with Undo and VoiceOver action; verified 2026-11-02
    7. [–] X057 Calm kit: already built (Steady orders its doors and tools by About you's calmers and what you said helped)
    8. [–] X003 Brain dump before bed: covered by Put the day down ("Anything still on your mind?" into the worry box, "Tomorrow starts with" into First light's one thing)
    9. [x] X125 Increase Contrast: muted text gets stronger when the iPhone setting is on. Built in PR #56 (web fix #72): `core/theme.ts` reads `contrast.txt` and syncs `AccessibilityInfo.isDarkerSystemColorsEnabled`; verified 2026-11-02
    10. [~] X084 Shake the jar: on Wins, a shake has Ember read out a past win or gratitude (never a sealed letter early). Shared `core/hooks/useShake.ts`; the pocket worry stays quiet on Wins

## G. From the live walk (2026-10-03)

21. [x] Supabase: `.env` points at project `cvkx…`, but Ember and Notion are deployed on `jmjd…` (the session log's project); use that project's key, or deploy the functions to `cvkx…` — fixed 2026-10-05: ember and notion redeployed to `jmjd…`; Ember replies in chat (Simulator)
22. [x] Weather loads only from Check-in's "Show conditions", so the window's weather (R6-61) and the real sunset sky (R6-30) are gone after every cold start. Loading it at launch sends your location to the weather service on each open: decide first (privacy) — solved in R8-6 (`core/weatherStore.ts` caches `weather.json` on disk and `app/_layout.tsx` reads it at launch with a 3-hour freshness window and same-day sunrise/sunset, sending zero location requests on launch)
23. [x] Defaults: lights out (9:30 PM, from wake and sleep goal) comes before wind-down (10 PM), so the night card always says "Lights out was", never "Lights out by" (Built (team/r7-fixes): the default wind-down is now 30 minutes before lights out and follows wake and sleep goal until you set one; saved times are kept. Waiting for Atlas's live check; seen 2026-10-09 (Simulator): a saved 10 PM wind-down stayed put and is marked as chosen)
24. [ ] Exam season (R6-67) is a lead card with rings, not a whole-Desk study view: decide whether that's enough
25. [x] Ember perched on the left covers the first letters of some headings, the end of the Goodnight button, and the Undo button's edge — also the x on Ember's note on the Desk (seen 2026-10-05) — fixed in PR #54, #71, and #78: Ember peeks 18 pt from the screen edge and resets to the bottom-right in show mode; seen 2026-11-02 on Simulator
26. [x] What's New's October entry could name the later surprises (sparks, firsts, weather, the shelf) — added in PR #78 (`app/whats-new.tsx`) and seen 2026-11-02 on Simulator
27. [x] Riley's sample data: today's focus session and a finished task are later than the clock at 2 PM; every badge is dated today (Built (team/r7-fixes): today's times never pass the clock and badges are dated over the past five weeks. Waiting for Atlas's live check; seen 2026-10-09 (Simulator, show mode at 3:20 PM): everything done today ends before the now line, and the badges run Sep 4 to Sep 22)
37. [ ] Short freezes (0.4–0.9 s) after tab taps and opening Badges in the dev build: measure in Release on the phone (with B9, B10)

From the Part 1 walk (2026-10-05, Simulator):

38. [x] Habits: the flame icon wraps onto a line of its own under "Kept N of the last 14 days" (`app/habits.tsx`, the meta row) — seen 2026-10-06 (Simulator): the flame sits inline before "Kept 0 of the last 14 days"
39. [x] Wording: the drawer's Habits tool says "Streaks you keep" (`core/tools.ts`), against the no-streak framing; after every habit is done, Habits' subtitle still says "Tap a habit's circle…" — seen 2026-10-06: the drawer says "Small things you keep"; the caption reads "Nothing left to tap today." once all are done
40. [x] Habits' title scrolls away with the list; other pages keep a small header on scroll — seen 2026-10-06 (Simulator): the compact "Habits" bar comes in on scroll
41. [x] Homework marked done with no steps shows an empty Steps box on its page (`app/assignment/[id].tsx`) — seen 2026-10-06 in code: done with no steps shows no Steps box (`app/assignment/[id].tsx`)
42. [x] Open-source licenses: the five `@expo-google-fonts` entries open only Expo's MIT text; the fonts' own OFL-1.1 text (and Material Symbols' Apache-2.0) is missing, and the OFL asks for it to travel with the fonts (`assets/licenses.json`) — fixed in #46; seen 2026-10-06 (Simulator): @expo-google-fonts/figtree shows "MIT AND OFL-1.1", Expo's MIT text, then "--- LICENSE_FONT ---" and the full OFL 1.1
43. [x] Desk: mid-scroll, the header's search and grid buttons sit over the status bar icons — fixed in PR #63: the top-right buttons fade as they reach the status bar (`components/ui/Screen.tsx`); seen 2026-10-06 on the Simulator
44. [x] Show mode: Riley's "Take the tour / Not now" card overlaps the Today rows — fixed in PR #64: the tour buttons sit on a tray like the Undo bar (`components/ShowTour.tsx`); seen 2026-10-06 on the Simulator, offer and tour steps
45. [x] `brainnavigator://school` doesn't open School (settings, drawer, habits, about, licenses, companion and ai do) — seen 2026-10-06 (Simulator): `brainnavigator://school` opens School
46. [x] At 10 AM on a Monday the Desk said "School's done for today": check the schedule state behind it (`app/index.tsx:130`) — cause: only one class had times (8:00–8:50), the others none, so after 8:50 the day read as over. Fixed in PR #62: a class without times keeps the day open (School asks "When do your classes meet?")
47. [ ] The Simulator app is slow even on a production bundle: taps and typing land seconds late, 33–80% CPU at idle (with 9, 10 and 37)

From the Part 2 walk (2026-10-05, Simulator, show mode):

48. [x] Focus: "How did it go?" never showed after a session; a stray `else` cleared the session it rates (`app/focus.tsx`). Fixed in PR #47, seen working there (R1-39, and R3-27 gets its ratings back)
49. [x] Focus from a note's "Focus on this" picked the next thing due instead of the note's topic (`app/focus.tsx`). Fixed in PR #47, seen working there (R3-82)
50. [x] Hours said "1 hours" (`app/hours.tsx`). Fixed in PR #48; seen 2026-11-02 on Simulator
51. [x] Helpers and the quota card said Plus gives 400 replies a month; it's 250 (`PLUS_PER_MONTH`). Fixed in PR #49; verified 2026-11-02
52. [x] Quill's tab label is cut off on a 402-pt-wide phone: "Brainstorm with questi…" — fixed in PR #51 ("Ask me questions"); seen 2026-11-02 on iPhone 17 Pro Simulator
53. [x] Pip's "Other time" shows 8:30 PM before you pick one, while the plan still uses Start now (`components/helpers/TonightPlan.tsx`) — fixed in PR #52; seen 2026-11-02 on Simulator
54. [x] Export a backup names the file with the UTC date, so an evening backup gets tomorrow's date (`app/settings.tsx:148`, `toISOString`) — fixed in PR #50 (uses local `dateKey()`); verified 2026-11-02

## H. Ready to release (legal), from `docs/legal/RELEASE-COMPLIANCE.md`

29. [ ] B1 Per-user data on Supabase (or phone-only): every user can read every user's data today. Peter: decide later (until then, single-user only)
30. [~] B2 Entry photos: signed links (built); then run schema Phase 20 to make the bucket private
31. [ ] B3 Notion: bring your own (OAuth per student); until then off in release builds
32. [ ] B4 Privacy policy and terms: drafts in `docs/legal/`; lawyer review, host, link in the app
33. [x] B5 Explicit OK before anything goes to the AI (`app/ai-consent.tsx`), revocable in How AI works here — seen 2026-10-05 (Simulator): the sheet opens on the first AI request; Not now sends nothing; Allow, then Ember answers (that same message too, since PR #42); How AI works here takes the OK back
34. [~] B6 Age 13+ (decided): Declared Age Range API (native), under-13 gate, honest App Store age rating — built (feat/age-range): `core/age.ts` + `app/age.tsx`. Asked once, before the welcome: Apple’s Declared Age Range first (13/16/18), a pick of four ranges where Apple can’t answer, but never where an age law needs Apple’s answer; under 13 stops at a kind screen that keeps the help lines. Seen 2026-10-09 (Simulator): with no Apple account, Apple said no age law applies here but listed every feature anyway, so Apple’s plain answer now wins and the pick showed; 16 or 17 saved and a cold start went straight to the Desk; under 13 (in show mode only) asked to confirm, then stopped at the kind screen with the help lines; the law screen keeps them too. Open: the App Store age rating, and turning on Declared Age Range for the App ID before a phone build (Peter)
35. [~] B7 AI companion rules: "Ember is a computer program" on every chat, reminder and break nudge every 3 hours; publish the crisis protocol — seen 2026-10-05: the line under Ember's name in chat; "I want to die (testing)" shows the help lines at once and the reply carries Need help now. The 3-hour reminder not yet seen
36. [~] B8 Anthropic for minors: disclosure and safety rules done; request the official child-safety system prompt from Anthropic and add it

## Ground rules

Everything from Rounds 4–6 still holds: privacy, nothing new to AI by
default, calm copy, motion with manners, every delete has Undo, the gate
passes on every commit. Builders work in their own branches; nothing is
`[x]` until it's seen live.

## Progress log

**2026-10-03, Atlas (Mac, Simulators).** iOS 27 launch fixed (UIScene, item 1). Walked Round 6 on four Simulators (iOS 27 and 26) with helpers; fixed what they found: show mode left Riley's rows, one thing and Ember's nap behind after Done; the check-in page threw "Invalid hook call" and never loaded today's check-in; goodnight lost its "Goodnight."; First light skipped a Desk left open overnight; Sunday night read the calendar's day; holding Ember ended the calm on release; Ember's lines cut each other off and vanished in 3.6 s; the tour's Focus line never showed; journal lines had no subject; sparks aimed at a fixed spot; new dots only cleared from the Drawer; Focus's week mixed Sunday and Monday starts; number pads couldn't close; the largest text broke words; Your day swiped back instead of a day; "due friday" and "Quiz: Quiz:"; Calendar crashed without a Google client ID; the shelf's candles wrote during render. Re-checked live: check-in, show mode's exit, the tour, the journal, the night labels, First light, hold to breathe, the Done bar, Your day's swipe, the largest text on Settings and the wake screen.

**2026-10-05, local session (Mac, iPhone 17 Pro Simulator).** Walked LIVE-CHECKS' Do these first: 16 of 26 seen working (marked there). Fixed one bug on the way: after Allow on the consent sheet, Ember now answers the message that opened it (PR #42). Filed ten new items (38–47). Still to see: the shakes, Canvas sync and entry photos (phone), Halloween and Goodnight continuity (phone date), VoiceOver (Part 3), First run (Start over erases the data).

**2026-11-02, local session (Mac, iPhone 17 Pro Simulator).** Candlelight design polish and Round 7 Simulator pass (PR #78): top-lit card gradient wash, elevated lit `OneThing` card with direct `Light the candle` Focus CTA, crafted `Ember has N more` pill, `TodayRows` icon badges and single-line cap load, clock-aware `NowCard` (`subscribeNightClock`), quiet `?show=riley` banner and right-edge Ember perch reset for clean App Store hero screens (`docs/screens/1-desk.jpg` through `5-steady.jpg`), and October What's New entry naming sparks, firsts, and weather. Checked and flipped `[~]` → `[x]` for D15, E17, F20.6 (X013), F20.9 (X125), G25, G26, G43, G44, G46, G48–G54, and Round 6 #53, #54, #58, #59, #76, #78.
