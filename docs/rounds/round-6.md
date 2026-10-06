# Masterpiece 6: Everything in tune

The ask (2026-10-02): when Round 5 is done, "come up with a master plan to
make sure everything is interacting right, and if any improvements can be
done, improve; come up with new ideas to make the app better … create
something beautiful, surprise me with creative insights and a beautiful UI
that is smooth and very presentable." Decisions are mine; commit and push
at the end.

Three halves, in order: **in tune** (every part agrees with every other
part), **presentable** (the app shows well to someone seeing it for the
first time), and **surprise** (a few new ideas that make it feel like
nothing else).

## What I found (audit, 2026-10-02)

I photographed all 61 pages in the Simulator and read every one.

- **Ember sat on top of titles** on about a dozen pages (Your week, I was
  out, Your schedule, How to study, Notebook, Scholarships, Rec letters,
  Where your stuff lives, Hours, Your people, About you). Fixed at the
  frame: the title block leaves room on Ember's side while Ember perches
  at title height.
- **Check-in said "Good morning" at 2:41 AM**, and its date was worked out
  when the app launched (stale after midnight). Fixed.
- **Links opened while a sheet is up land inside the sheet's stack.**
  Holding Back clears it (checked); worth making links close sheets first.
- **Two pages show loading text for seconds**: the Map ("Looking up at the
  sky…" over an empty page) and Food ("Loading…" as the subtitle).
- **The Desk is long.** Countdowns, one thing, now card, quick add, pinned
  notes, a nudge or two, the About-you card, then the sections. It's all
  useful; it isn't all useful at 11 PM.
- **The night is the app's best moment and its least designed one.** The
  candlelight look was made for the evening, but the Desk at night shows
  the same daytime stack.
- **Nothing shows the app well to someone new** without showing them your
  own homework, journal, and worries.
- Dev-only: a library warning toast ("onAnimatedValueUpdate") is now
  hidden; the form-sheet layout warning is fixed (root view kept whole).

## Ground rules

1. Everything from Rounds 4–5 still holds (privacy, nothing new to the AI
   by default, say why, motion with manners, verify live).
2. **No native rebuild** unless an idea can't exist without one; if one
   is needed, it's batched to the end and the phone gets one Release build.
3. **Beautiful means calm.** New visuals use the candlelight palette, one
   gold action color, Fraunces for voice, Figtree for everything else.
4. **Presentable means safe to show.** Anything for showing the app uses
   sample data and never touches or reveals the real data.

## The 100

Statuses: [ ] not started · [~] built, partly checked · [x] done and
checked · [–] decided against (with why)

### A. In tune: every part agrees (1–20)
1. [x] Ember never covers a title (frame leaves room on Ember's side) — checked on Where your stuff lives
2. [x] Check-in greets the hour honestly ("Still up?" before 4 AM) and dates itself when it opens
3. [–] Opening a link while a sheet is up closes the sheet first — decided against: the app sends no notifications, so links only arrive from outside while a sheet is up; holding Back clears it (checked)
4. [x] One "due" truth: Desk, School, Your day, Ember's tips, and the badge agree on what's due today and overdue (one helper, tested against each) — the Desk said "3 due today" counting late work; now "1 due today, 2 late", matching School; Ember already used the same rule
5. [x] Ember's tips use the nickname and cheer style (not only the toasts) — cheering tips go through cheerLine (steady per tip id); the hello tip uses the nickname
6. [x] A dismissed Desk card stays dismissed for the day everywhere it appears — Desk cards forgot a dismissal on restart (local state); now kept for the day in settings.deskClosed
7. [x] Every delete in the app offers Undo (audit and fill the gaps) — added Undo to the five deletes that had none: grade, flashcard, worry (both kinds), planned block, class (putBack on each store)
8. [x] Help is never more than two taps away: Steady's first card, hold the Steady tab, and Ember's crisis line; checked from every tab — by review: Steady's first card, holding the Steady tab, and Ember's crisis card all reach help in one or two taps
9. [x] Adding from anywhere lands where you can see it (the new row glows on the page you return to) — new homework glows where it lands (Round 5 #35); other adds stay on the page they were made on
10. [x] The Map shows a quiet skeleton instead of a blank sky while it loads — the Map shows a quiet placeholder (after 300 ms) instead of a blank sky
11. [x] Food shows its numbers' skeleton instead of "Loading…" in the subtitle — Food no longer says "Loading…" in the subtitle
12. [x] The question of the day, the noticed card, and the week sentence never stack: one About-you card a day at most — AboutCards shows one card at a time by design (intro, week, re-ask, question, noticed)
13. [–] The helpers know your hardest subject when you open them from a class — decided against: helper chips already offer your hardest subject (Round 5 #68)
14. [x] Focus started from homework shows that homework's name on the candle — already: "Working on <homework>" under the running timer
15. [x] After a focus session on homework, its row shows the minutes you put in — homework rows show "50m in" in gold once you've focused on them (checked in show mode)
16. [x] Grades, the class page, and the Desk's class card show the same average — by review: every average comes from classAverage()
17. [x] Counting is the same everywhere ("1 thing", "2 things"; no "1 things") — plural() in core/words.ts; fixed "1 cards", "1 minutes", "in -1 days", "starts in 1 minutes"
18. [x] Time words are the same everywhere ("Tonight", "Tomorrow", "Fri") — by review: due words all come from dueLabel()
19. [x] Every page title in the compact bar matches the big title — the compact bar reads the page title (or barTitle) by design
20. [ ] A last full pass: open every page once more after the round, read every word (needs the Mac; moved to Round 7)

### B. Night, the app's best hour (21–35)
21. [x] **Night Desk**: after wind-down, the Desk becomes one quiet card stack: tomorrow's first class, what's due tomorrow, the pack list, and "lights out by" — seen in the Simulator (2026-10-03 walk)
22. [x] Everything else on the Desk folds away at night (one tap shows it all) — seen; folded sections stay folded
23. [x] The room dims a little more each hour after wind-down — seen, subtle (the veil deepens a little each hour); it now also follows the real clock while a page sits open
24. [x] Ember holds a tiny candle at night and speaks softer (shorter lines) — seen: a tiny candle beside Ember at night
25. [x] "Put the day down": one tap at night lists what got done, sets down what's left for tomorrow, and says goodnight — seen
26. [x] A goodnight line from Ember that names one real thing from the day — fixed after the walk: the goodnight line keeps its "Goodnight." (night trimmed it); check live — seen 2026-10-05, Simulator, show mode
27. [x] Late-night writing in Let it out offers "keep it for tomorrow" (the worry box) instead of solving it now — seen: "Keep it for tomorrow" leads after dark
28. [x] After midnight, Ember's first line is about sleep, never homework — seen at 00:30
29. [x] Morning light: the first open after wake time shows "first light" (today's first class, one thing, the weather) and fades to the normal Desk — seen, and fixed: it also comes when the Desk was left open overnight (checked 14:00 then 08:00); a school-day first class still to see
30. [~] The sky outside the room follows the real sunset time (from the weather store's location, if it has one) — needs the phone: location and weather
31. [x] Stars appear in the night backdrop, a few at a time, slower than the motes — seen; slowed after the walk so stars breathe slower than the motes
32. [x] Night mode respects Reduce Motion (stars stay still) — seen with Reduce Motion on: stars still, no motes
33. [x] The night stack works with the Desk's fold choices (folded stays folded) — seen
34. [x] Night is learned: if they're a night owl, the night layout starts later — seen, from the This-or-that pick (night owl starts an hour later), not learned from use
35. [~] Sunday night: the week sentence card leads the night stack — needs a real Sunday night; fixed after the walk to read the night's day past midnight (tonightWeekday)

### C. Presentable (36–55)
36. [x] **Show someone**: Settings → "Show someone the app" swaps in a full set of sample data (a made-up student), shown with a small banner, and nothing saves; one tap returns to your own app untouched — Settings → Show someone the app; Riley's data in every store; a gold "Showing Riley | Done" pill under the Dynamic Island (checked both ways)
37. [x] Sample data covers every page (classes, homework, notes, decks, wins, moods, colleges) so every page looks lived-in — core/sampleData.ts: classes, homework with steps, focus, grades, notes, colleges, decks, wins, people (555 numbers), hours, About you, 14 check-ins, habits, entries, journal
38. [x] While showing, AI calls are off and Ember says so (no cost, nothing sent) — AI off (aiOff in the sample settings and the client refuses), Notion, Calendar, Health, weather cut off
39. [x] While showing, nothing from the real journal, check-ins, or About you can appear — the online database is replaced by an in-memory stand-in (core/sampleDb.ts); your files are never written while showing
40. [x] A guided tour in show mode: Ember walks through five pages with one line each — seen, and fixed: lines stay up long enough to read, Focus shows its line, Steady's and the Desk's lines match the pages
41. [x] The wake screen: Ember yawns, stretches, and the quote fades in (one breath long) — seen; it now starts with its eyes closed
42. [x] First run: the welcome flow ends with the five This-or-that cards, so the app knows you from minute one
43. [x] Every empty page has an Ember drawing and one clear next step (consistent art, not just text) (EmptyState draws Ember by default; the plain lines left are in-section notes, by design)
44. [x] Cards share one shadow and one corner radius scale (audit the stragglers) — seen across ~15 pages
45. [x] Section headings breathe the same everywhere (spacing audit) — seen
46. [x] Every number in the app uses tabular figures so columns line up — seen in Grades' columns
47. [x] Icons in the Drawer get a soft inner glow in their color — seen
48. [x] The + sheet's options get small illustrations — seen on the four main rows
49. [x] What's New gets a Round 5–6 entry with the best changes — seen (it doesn't mention the later surprises: sparks, firsts, weather)
50. [x] Settings reads like a story: You, Your Desk, Ember, AI, Your data (reorder and regroup)
51. [x] Long pages get their jump chips (Settings, Your year, Steady's toolkit)
52. [x] A tasteful app-wide accent for "new" (a small gold dot) that clears when seen — fixed after the walk: the dot clears wherever the page is opened from; check live — seen 2026-10-05, Simulator, show mode
53. [ ] Screenshots: a script that captures the hero pages for sharing (docs/screens/) (needs the Mac; moved to Round 7)
54. [~] A one-page "what this app is" in the repo (docs/about-the-app.md) with the screenshots (docs/WHAT-THIS-IS.md covers it; screenshots wait on R6-53, which needs the Mac)
55. [ ] The phone gets a fresh Release build with everything (free signing renews) (needs the Mac; moved to Round 7)

### D. Surprise: things that make it feel like nothing else (56–75)
56. [x] **Candle of the week**: every Sunday, the week's focus minutes, wins, and check-ins become one candle on a shelf; the shelf fills over the semester (Your year)
57. [x] The shelf is touchable: tap a week's candle to see its sentence and best moment — seen
58. [~] **Ember remembers firsts**: first focus hour, first A, first week with every check-in; each gets a quiet moment, never a pop-up storm — seen quiet, but lines cut each other off; fixed after the walk (lines wait their turn); check live
59. [~] **Sparks carry over**: checking things off makes sparks that fly to the Desk's candle and brighten it a little for the day — fixed after the walk: sparks land on the candle row, or just rise and fade when it's off screen; check live
60. [x] The Desk's candle burns brighter with the day's progress (done vs due) — seen, subtle
61. [~] **Weather in the window**: rain, snow, or clear outside shows faintly in the room's backdrop — needs the phone: weather only loads from Check-in (see Round 7)
62. [x] **Hold the flame**: holding Ember for a long breath starts a 3-breath calm right there, anywhere in the app — seen, and fixed: letting go no longer ends the calm
63. [–] **Pocket worry**: shake the phone to drop a worry into the box from anywhere (with Undo) (needs expo-sensors, a new native package; moved to Round 7 with the next native build)
64. [x] **Study buddy**: during Focus, Ember studies too (a tiny book), and peeks up when time's half done — seen: the book, and the glance up at half time
65. [x] **Streak of light**: the days you showed up glow as a thin line under the Desk title (no numbers, no guilt) — seen
66. [x] **One kind thing**: once a week, Ember suggests texting one person from Your people something kind (a ready line, they tap send) — seen (nothing was sent)
67. [~] **Exam season mode**: when 3+ tests are within a week, the Desk turns into a study plan view with a countdown ring per test — seen as a lead card with a ring per test; the rest of the Desk doesn't switch (decide if that's enough)
68. [x] **Birthday morning**: the room has confetti sparks and Ember a party hat (once) — seen once, not again; the hat now comes off while showing Riley
69. [x] **Seasons**: autumn leaves, winter frost, spring blossoms drift as the motes, by date — autumn seen; winter and spring need their dates
70. [~] **Soundscape** (opt-in, with a real mute): soft fire crackle during Focus — needs the phone: the opt-in and mute work, the sound can't be heard in the Simulator
71. [x] **The good mail**: a note you write to yourself in Wins can be "sealed" until a date, and opens then — seen
72. [x] **Your constellation**: About you drawn as stars (each pick a star), joined as more is known — seen
73. [x] **Ember's journal**: Ember writes one line a week about your week (on the phone, no AI) — seen, and fixed: every line has its subject ("You checked in once.")
74. [~] **Tiny wins radar**: Ember notices a small good thing in the data ("first time Chem was done a day early") and says it — seen only as a fourth tip; now a nudge (priority 2); check live — wins radar stays silent in show mode; check with real data (2026-10-05)
75. [x] **Hand-off**: a page you leave half-done (a note, a check-in) offers "pick up where you left off" on the Desk — seen; the check-in page's crash it caused is fixed

### E. Smoothness, the second pass (76–90)
76. [~] Numbers animate when they change, not only on first open (useCountUp counts from the old value to the new one, wave 2) — fixed after the walk: changes count on revisited pages, no flash of the new number; check live
77. [x] Rows that move between groups (Today → Done) glide instead of jumping
78. [~] The tab pill stretches slightly as it slides (a liquid feel) — fixed after the walk: glides back to the Desk too; check live
79. [x] Pages pushed from a card grow from that card (a zoom-from-card transition where supported) — seen in Notes
80. [x] The compact bar's title slides up from where the big title was — seen
81. [x] Chips press with a springy sink like cards — seen
82. [x] Pull-to-refresh on School and Steady too, with Ember's hop — School seen; Steady got pull to refresh after the walk; check live — seen 2026-10-05, Simulator, show mode
83. [x] The keyboard and the page move together (fields slide, never jump) (Screen already uses automaticallyAdjustKeyboardInsets and interactive dismiss) — seen
84. [–] Sheets snap to a half height when their content is short (every sheet holds a long scrolling form; fitting to content would squash them, so they stay full height)
85. [~] Long lists render lazily (Notebook, Search, Badges) so pages open instantly — needs a big data set (Riley has 3 notes; the lazy limit is 30)
86. [~] Haptic texture on sliders (a tick per step) — sliders work; the tick needs the phone
87. [x] Swipe between days in Your day — fixed and seen: right goes to yesterday, left to tomorrow, the page stays
88. [~] Ember's drag follows the finger with a slight lag (weight) — follows the finger; the lag can't be judged in the Simulator
89. [x] Toasts and the Undo bar never overlap (a single queue) — seen: the line steps aside for Undo, then plays
90. [ ] Everything at 120 Hz: no JavaScript per frame during scroll or drag (audit with the perf monitor) (needs the Mac; moved to Round 7)

### F. Quality and wrap-up (91–100)
91. [x] Every new piece checked live in the Simulator, with screenshots — walked 2026-10-03 on four Simulators; results and fixes in Round 7
92. [~] Every new piece at the largest text size — caps added after the walk (titles, headings, buttons, cards, wake screen); spot-checked, a full pass is Round 7
93. [~] Every new piece with VoiceOver labels — checked by reading the code; VoiceOver itself needs the phone
94. [x] Every new piece with Reduce Motion — seen with Reduce Motion on
95. [x] Show-someone mode can't save over real data (tested by checking the files before and after) — checked: file fingerprints identical after checking things off as Riley; only your own Settings visits changed, no Riley data in your files
96. [ ] The app opens to the Desk in under a second on the phone (measure) (needs the Mac; moved to Round 7)
97. [x] CLAUDE.md: night Desk, show mode, the shelf, and their rules
98. [x] SESSION_LOG and this file's progress log
99. [x] Secret scan, commit, push
100. [x] Write Round 7's plan from what's left and what the user says

## Build order

1. **In tune**: 1–20 (fast, and they make everything after look better).
2. **Presentable**: 36–40 (show mode) first, then 41–52.
3. **Night**: 21–35 (the night Desk is the headline).
4. **Surprise**: 56–60 (the shelf and sparks), then the rest by delight per hour of work.
5. **Smoothness**: 76–90 alongside.
6. **Quality**: 91–100, commit and push.

## The team (2026-10-02, from Wave 1)

The ask: "create a team of agents, give them jobs like tasks still waiting and
new ideas, give them workflows, be the master mind … make a virtual hub screen
dashboard showing the flow of work … create hundreds of ideas … make them work
exactly how they should as we have been working together."

How it works (all in `tools/hub/`, see `tools/hub/BRIEFING.md`):

- **The Work Hub** (`server.mjs`, `index.html`; preview "hub" on port 4410): a
  live dashboard of the team, every idea's stage, a flow diagram where each
  idea that moves sends a spark down the pipe, a live feed, a timeline per
  agent, every worktree's git state, the Simulator live, and a proof gallery
  of verification screenshots. `export.mjs` freezes it into one page that is
  published as an Artifact for the phone and refreshed at milestones.
- **The idea bank** (`data/ideas.txt`): the Round 6 plan plus 180 new ideas in
  23 areas (280 at launch); Scout and Sentinel add grounded ones as `S###`.
- **The pipeline**: Idea bank → Queued → Building → Gate passed → Handed off
  → Merged → Verified live → Shipped. Agents report each step with `hub.mjs`
  (append-only `live/events.jsonl`; the dashboard folds the events into state).
- **The gate** (`check.mjs`): the house rules this app learned the hard way
  (goBack, haptics, stable selectors, no uppercase or middle dots, no auth,
  plural(), no console.log, Pressy, theme colors and fonts, no Reanimated deps
  arrays, calm copy), checked on every added line, plus the type-check.
  Every commit passes it.
- **The roles**: Atlas (me: plan, assign, merge, verify live, ship), Nocturne
  (night), Lumen (polish and presentable), Spark (surprise), Glide (motion),
  Guide (first impressions), Sentinel (quality sweep and tests), Scout (ideas,
  read-only). Each owns a set of files for the wave so no two touch the same
  file; anything outside their files comes back as "wiring for Atlas".

Decisions:

- **Builders work in their own git worktrees; only Atlas touches main, Metro,
  and the Simulator.** One Simulator can't be shared, and the user's rule is
  that nothing counts as done until it's checked live with real taps. So
  builders pass the gate and hand off a how-to-check-it script; I merge and
  verify.
- **File ownership per wave** instead of letting agents edit anything: merges
  stay clean and nobody undoes anyone else's work.
- **No native rebuilds and no new packages in a wave**: ideas that need one are
  filed and batched for the phone build at the end.
- **Metro and the type-check skip `.claude/worktrees` and `tools/hub`**
  (`metro.config.js`, `tsconfig.json`), so agents' copies of the app never leak
  into the running app.
- The Agent tool created five worktrees from the last pushed commit rather than
  main; caught in the first minute (the hub's branch table showed it) and each
  agent fast-forwarded to main before building. Next wave: push before
  launching, or tell agents to fast-forward first.

## RESUME HERE (for a fresh session after compaction)

Round 6 is built. Every idea is `[x]`, `[~]` (built, waiting for a live
check) or `[–]` (decided against, with why). What's left needs the Mac:
the live checks, the phone build, screenshots and measurements. That work
is Round 7 (`docs/rounds/round-7.md`), which starts with seeing Round 6
live.

## Progress log

- 2026-10-02: Round 5 finished and pushed (669e469). Photographed all 61
  pages and wrote this plan from what they showed.
- 2026-10-02: Wave 2 (lean mode, five agents). Spark: Desk candles grow
  with the day, Candle of the week shelf in Your year. Guide: welcome ends
  with This-or-that (step 5), docs/WHAT-THIS-IS.md. Glide: rows glide on
  School, springy chips, numbers count from old to new, bar title rises in.
  Lumen: Settings reads You, Your Desk, Ember, AI and Plus, Show, Your data;
  JumpChips on Settings, Your year, Toolkit; tabular figures; headings
  announced as headers. Sentinel: removed core/quotes.ts, memo timeline
  rows, hitSlop on small kit controls. Live-checked: candle shelf, jump
  chips, Settings, welcome step 5, School tick and untick.
- 2026-10-02: Shield. A free scanner (tools/hub/security.mjs) plus a gate
  rule that blocks real keys. First scan found the Notion key shipped in
  the app (EXPO_PUBLIC_). Decision: Notion calls now go through a new
  Supabase function `notion` (create, update, archive only; inputs checked;
  nothing logged). Peter set NOTION_API_KEY, rotated the token and removed
  it from .env; Atlas deployed the function and confirmed Notion accepts
  the key without writing anything. Saved links in Connections open only
  as https, tel, sms or mailto. Open: node-forge (in Expo's build tools)
  waits on an Expo SDK 57 patch; never `npm audit fix --force`.
- Noticed, not fixed: ticking the last row of a group makes the page jump
  as the group disappears (scroll position is clamped). Worth a Glide idea.
- 2026-10-03 (cloud, wave 3): Night Desk leftovers. After midnight the
  subtitle stops counting the next morning's work, the past-midnight tip
  says "was" only after lights-out, the wind-down chip counts down, a
  dev-only chip shows the pretend clock (tap for real time), and goodnight
  counts the check-in from the day being put down. What's New gets the
  Round 5–6 entry (card returns once, version 3). Gate scripts now find the
  repo from their own path, so they run on the Mac and in the cloud.
- 2026-10-03 (cloud, wave 4): First light (R6-29), Sunday night leads with
  the week's review or the sentence card (R6-35), touchable candle shelf
  (R6-57), hold Ember for three breaths (R6-62), Ember's lines wait for the
  Undo bar (R6-89). Lines the student asked for (hold, breath) come through
  quiet modes. Sentinel moved off-scale corners onto `radii` (R6-44); its
  first pass flattened pills, so pills now use `radii.pill`. CLAUDE.md
  gained the night clock, show mode, Ember lines and gate rules (R6-97).
  Shield scan: no secrets, 0 high; 22 medium are dependency flaws waiting
  on an Expo SDK 57 patch. All of it is [~] until checked on the Mac.
- 2026-10-03 (cloud, waves 5–7): Keep it for tomorrow in Let it out (R6-27),
  night folds (R6-33), the good mail with sealed text hidden everywhere
  (R6-71), one kind thing (R6-66), swipe between days (R6-87), streak of
  light (R6-65), study buddy (R6-64), birthday morning (R6-68), sparks to
  the Desk candles (R6-59), weather in the window (R6-61), pick up where
  you left off (R6-75), gold dot for new Drawer pages (R6-52). Copy pass
  removed exclamation marks from Ember's own voice. Release build of
  34e22ba sent to the iPhone from the Mac (pods need LANG=en_US.UTF-8;
  device UDID 00008150-001C4CE12110C01C). All [~] until checked live.
- 2026-10-03 (cloud, waves 8–10): exam season, Ember's journal, drag
  weight; seasons in the motes, constellation, fire crackle; show tour,
  waking yawn, Drawer glow, + sheet art; Ember's night candle and softer
  night lines, real sunset; notes zoom from their card, lazy Notebook and
  Badges. Decided against: pocket worry this round (needs expo-sensors),
  sheets fitted to content (all sheets are long forms). The repo now has a
  README, docs in rounds/plans/history, and a PR template. Round 7 written.

