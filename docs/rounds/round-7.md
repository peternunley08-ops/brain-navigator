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
15. [ ] Home screen widget: tonight's first class and what's due
16. [x] A speaker icon in the kit for Fire crackle (drawn in code, no rebuild needed) — seen on and off
28. [~] The Canvas token moves into the iPhone keychain (`expo-secure-store`); an existing connection carries over on first launch

## E. Show it well

17. [ ] Screenshots script for the hero pages into `docs/screens/` (R6-53), in show mode only
18. [ ] Put the screenshots in `docs/WHAT-THIS-IS.md` and the README
19. [x] The show tour's lines checked against Riley's sample data — two were wrong (the dentist, Steady's habits) and Focus's never showed; fixed and seen

## F. From the idea bank

20. [x] Picked 2026-10-05, by delight per hour (small first, nothing that needs AI or a new native module). Already built, so skipped: X032 what-if grades, X047 smart start
    1. [~] X065 Halloween Ember: a tiny pumpkin hat on October 31 and one hello line (birthday hat wins). Check by setting the phone's date to Oct 31
    2. [–] X019 One-tap mood: already built (the Desk's mood faces call `quickMood`, with Undo)
    3. [~] X122 Label every icon button for VoiceOver. Audit: IconButton already requires a label; one bare control found (Your day's color swatches, now named); text fields now keep their label after they're filled. Listen with VoiceOver on the phone
    4. [x] X174 Tests for the core helpers: `npm test` (Node's built-in runner, no new packages), 16 tests over dates, plural, the night clock, classAverage, letterFor, planBackward. Part of the gate now
    5. [x] X038 Turned in: homework, projects and essays marked done show "Done, not turned in yet" and a Mark turned in chip on their page (`turnedIn`, optional) — seen 2026-10-05 (Simulator): Mark done → "Done, not turned in yet", Mark turned in → "Done and turned in" (bug found: 41)
    6. [ ] X013 Snooze a Desk card to tonight or tomorrow (optional field). A swipe on the Desk: build it where it can be felt (desktop session, Simulator)
    7. [–] X057 Calm kit: already built (Steady orders its doors and tools by About you's calmers and what you said helped)
    8. [–] X003 Brain dump before bed: covered by Put the day down ("Anything still on your mind?" into the worry box, "Tomorrow starts with" into First light's one thing)
    9. [ ] X125 Increase Contrast: muted text gets stronger when the iPhone setting is on. Bigger than it looked: theme colors are plain strings used by SVG and alpha(), so iOS's DynamicColorIOS can't drop in; needs a theme that re-renders on the setting
    10. [~] X084 Shake the jar: on Wins, a shake has Ember read out a past win or gratitude (never a sealed letter early). Shared `core/hooks/useShake.ts`; the pocket worry stays quiet on Wins

## G. From the live walk (2026-10-03)

21. [x] Supabase: `.env` points at project `cvkx…`, but Ember and Notion are deployed on `jmjd…` (the session log's project); use that project's key, or deploy the functions to `cvkx…` — fixed 2026-10-05: ember and notion redeployed to `jmjd…`; Ember replies in chat (Simulator)
22. [ ] Weather loads only from Check-in's "Show conditions", so the window's weather (R6-61) and the real sunset sky (R6-30) are gone after every cold start. Loading it at launch sends your location to the weather service on each open: decide first (privacy)
23. [ ] Defaults: lights out (9:30 PM, from wake and sleep goal) comes before wind-down (10 PM), so the night card always says "Lights out was", never "Lights out by"
24. [ ] Exam season (R6-67) is a lead card with rings, not a whole-Desk study view: decide whether that's enough
25. [ ] Ember perched on the left covers the first letters of some headings, the end of the Goodnight button, and the Undo button's edge — also the x on Ember's note on the Desk (seen 2026-10-05)
26. [ ] What's New's October entry could name the later surprises (sparks, firsts, weather, the shelf)
27. [ ] Riley's sample data: today's focus session and a finished task are later than the clock at 2 PM; every badge is dated today
37. [ ] Short freezes (0.4–0.9 s) after tab taps and opening Badges in the dev build: measure in Release on the phone (with B9, B10)

From the Part 1 walk (2026-10-05, Simulator):

38. [ ] Habits: the flame icon wraps onto a line of its own under "Kept N of the last 14 days" (`app/habits.tsx`, the meta row)
39. [ ] Wording: the drawer's Habits tool says "Streaks you keep" (`core/tools.ts`), against the no-streak framing; after every habit is done, Habits' subtitle still says "Tap a habit's circle…"
40. [ ] Habits' title scrolls away with the list; other pages keep a small header on scroll
41. [ ] Homework marked done with no steps shows an empty Steps box on its page (`app/assignment/[id].tsx`)
42. [ ] Open-source licenses: the five `@expo-google-fonts` entries open only Expo's MIT text; the fonts' own OFL-1.1 text (and Material Symbols' Apache-2.0) is missing, and the OFL asks for it to travel with the fonts (`assets/licenses.json`)
43. [ ] Desk: mid-scroll, the header's search and grid buttons sit over the status bar icons
44. [ ] Show mode: Riley's "Take the tour / Not now" card overlaps the Today rows
45. [ ] `brainnavigator://school` doesn't open School (settings, drawer, habits, about, licenses, companion and ai do)
46. [ ] At 10 AM on a Monday the Desk said "School's done for today": check the schedule state behind it (`app/index.tsx:130`)
47. [ ] The Simulator app is slow even on a production bundle: taps and typing land seconds late, 33–80% CPU at idle (with 9, 10 and 37)

## H. Ready to release (legal), from `docs/legal/RELEASE-COMPLIANCE.md`

29. [ ] B1 Per-user data on Supabase (or phone-only): every user can read every user's data today. Peter: decide later (until then, single-user only)
30. [~] B2 Entry photos: signed links (built); then run schema Phase 20 to make the bucket private
31. [ ] B3 Notion: bring your own (OAuth per student); until then off in release builds
32. [ ] B4 Privacy policy and terms: drafts in `docs/legal/`; lawyer review, host, link in the app
33. [x] B5 Explicit OK before anything goes to the AI (`app/ai-consent.tsx`), revocable in How AI works here — seen 2026-10-05 (Simulator): the sheet opens on the first AI request; Not now sends nothing; Allow, then Ember answers (that same message too, since PR #42); How AI works here takes the OK back
34. [ ] B6 Age 13+ (decided): Declared Age Range API (native), under-13 gate, honest App Store age rating
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
