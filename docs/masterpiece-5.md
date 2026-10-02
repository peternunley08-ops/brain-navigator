# Masterpiece 5: Smooth, and knows you

The ask (2026-10-01): "make the scrolling and navigation in the app more
smooth and better looking, with more interactive things that make the app
know the person better." The user left the orchestration and every decision
to me, then commit and push at the end.

Two halves. **Smooth:** the frame every page is built in, how it scrolls,
how you move between pages. **Knows you:** an "About you" that the student
fills in by playing, that the app quietly adds to from how they use it, and
that they can always see, change, and erase.

## What I found

- 64 pages use one frame (`components/ui/Screen.tsx`), so fixing the frame
  fixes the app.
- The bottom nav is drawn inside every page, so each push slides a new copy
  in with the page and the old one out: the nav never feels like it stays.
- The back button scrolls away with the content; on a long page you scroll
  to the top to leave (or know about the edge swipe).
- No collapsing header, no tap-the-tab-to-go-to-top, no full-screen swipe
  back, no form sheets: the iOS habits people's thumbs expect.
- `Reveal` replays its staggered fade on every open, so busy pages take
  about half a second to settle.
- Everything needed is already in the native build (Reanimated 4.7, Gesture
  Handler 3.3, react-native-screens 4.26, expo-glass-effect), so all of
  this is JavaScript: no rebuild.
- The app knows name, grade, sleep and homework goals, wake and wind-down
  times, birthday. It doesn't know what they like, how they study, what
  calms them, or when they work best, and it never shows them what it
  has noticed.

## Ground rules

1. **Yours, on the phone.** Everything "About you" lives on the phone, in
   one page, where each thing can be changed or forgotten, and all of it
   erased in one tap.
2. **Nothing new goes to the AI by default.** About you joins Ember's note
   only if the student turns on "Ember and the helpers can use this", and
   "What did Ember see?" shows it.
3. **Say why.** Anything the app learns from use says what it's based on,
   with "Not right" to drop it.
4. **Motion with manners.** Springs, not bounces; under 400 ms; Reduce
   Motion gets fades; nothing animates in JavaScript during a scroll.
5. **No native rebuild**, no new packages that need one.
6. **Verify live** in the Simulator (run from Xcode), with screenshots.

## The 100

Statuses: [ ] not started · [~] built, partly checked · [x] done and
checked · [–] decided against (with why)

### A. The frame (1–15)
1. [x] One bottom nav for the whole app, drawn once above the pages, so it holds still while pages slide — BottomNav drawn once in app/_layout.tsx; pages call wantNav via Screen
2. [x] The nav tucks away while you scroll down to read and comes back when you scroll up — core/chrome.ts navTucked, from the Screen scroll handler on the UI thread
3. [x] Tap the tab you're on to glide that page back to the top
4. [x] A compact top bar fades in once the big title scrolls away, with Back and the title, so leaving is always one tap — barTitle for pages that draw their own heading
5. [x] The compact bar is iOS 26 glass where the phone has it, a soft dark fill where it doesn't — GlassView on iOS 26, dark fill elsewhere
6. [x] Swipe back from anywhere on the page, not just the left edge — fullScreenGestureEnabled; row swipes still win (checked)
7. [ ] Quick-add pages (homework, class, candle) open as iOS sheets with a grabber
8. [x] The active tab's pill slides between tabs on a spring
9. [x] Tab icons give a small lift and a light haptic tick when chosen
10. [~] The School badge pops when its number changes — built; not seen live (needs the count to change)
11. [x] The + turns into an × while its sheet is open
12. [x] The + sheet follows your finger when you drag it down, and closes past halfway — drag past 140 pt or flick to close
13. [ ] Holding a tab shows what the hold will do before it goes
14. [ ] Coming back to a tab keeps where you were scrolled
15. [x] Sheets and pages agree: sheets close with ×, pages go back with ←

### B. Scrolling feel (16–35)
16. [x] The big title eases up and fades as it scrolls under the bar
17. [ ] Pulling past the top brightens the candlelight instead of showing a dead edge
18. [ ] The backdrop's glow drifts slower than the page (a little depth)
19. [x] Pages settle once: the staggered reveal plays the first time a page opens, quicker, and not on every visit — first open per session, 400 ms, capped stagger
20. [ ] A thin progress line on long pages (notes, journal entries)
21. [ ] School's day headers stay pinned while their day scrolls
22. [ ] Jump chips on long pages that glide to a section
23. [ ] A thin light scroll indicator on long pages, so you know where you are
24. [~] No heavy work while scrolling: tickers and clocks don't re-render whole pages — scroll work runs on the UI thread; other tickers not audited yet
25. [ ] Typing never hides the field: it slides into view
26. [ ] Pull to refresh on the Desk, with a hop from Ember
27. [ ] Rows slide into place when something is checked off or removed
28. [x] Swipe a homework row right to check it off — already there
29. [x] Swipe left to push it to tomorrow — already there
30. [x] A haptic detent when a swipe passes the point where it will act
31. [ ] One press feel everywhere (the same sink and spring)
32. [x] Motion tokens: one place for every spring and duration, so the app moves as one thing — core/motion.ts
33. [ ] Reduce Motion: every new movement becomes a fade
34. [ ] Loading shimmer only if loading takes over 300 ms (no flash)
35. [ ] Something you just added glows once where it lands

### C. Finding your way (36–50)
36. [x] The Drawer puts the tools you use most first — "Your most used" group at the top once a tool is opened 3+ times; follows the learning switch
37. [x] "Recently opened" in the Drawer — chips at the top of the Drawer from about.recent (checked)
38. [ ] Search opens ready to type, and results slide in as you type
39. [x] Holding Back jumps home to the Desk — hold any Back: straight to the Desk (core/chrome.ts goHome; checked from two pages deep)
40. [x] Deep links don't stack copies of a tab — every Back/Close goes through goBack(): with nothing behind (opened from a link) it lands on the Desk instead of erroring (checked with a cold link to the add sheet)
41. [ ] Every empty page has one clear next step
42. [ ] Desk sections fold with a tap and remember it
43. [x] The Undo bar and Ember's toasts ride above the nav, wherever it is — already rode above the nav; seen with "Erased About you"
44. [x] Ember steps aside while you scroll and comes back when you stop
45. [x] The compact bar's title is tappable to go to the top too
46. [ ] Pages with tabs (Notebook, Moods) slide between them with the finger
47. [ ] A gentle "end of the page" from Ember on very long pages
48. [ ] The nav and bars hold up at the largest text sizes
49. [ ] VoiceOver: the nav, bars, and sheets read in a sensible order
50. [ ] Landscape and iPad: the frame stays centered and the nav stays put

### D. About you (51–75)
51. [x] "About you": one page with everything the app knows about you, each piece editable or forgettable — checked live in the Simulator
52. [x] "This or that": swipe cards (morning or night, music or quiet, alone or with friends, plan ahead or wing it, talk it out or write it down…) — checked live in the Simulator
53. [x] Cards fly off with your swipe and tilt as you drag; buttons for people who'd rather tap — checked live in the Simulator
54. [x] A question of the day on the Desk: one small thing, a word or two, or skip — components/desk/AboutCards.tsx: answer or skip, saved to about.answers/askedOn, ring to About you (checked)
55. [x] Interests (chips): what you're into — checked live in the Simulator
56. [x] Your subjects: favorite and hardest (Round 4 #30's study profile) — checked live in the Simulator
57. [x] How you like to study: flashcards, practice problems, explaining it, drawing it out — checked live in the Simulator
58. [x] What calms you: pick from the Steady tools; Steady puts them first — core/about.ts calmOrder(); Steady orders its doors and tools, "Need help now" always first (checked)
59. [x] How you like to be cheered on: hype, calm, or straight talk; Ember's own lines match — cheerLine(): hype adds an opener, straight keeps the first sentence, calm as written; used at 14 "you finished" moments
60. [x] What Ember calls you (a nickname) — checked live in the Simulator
61. [~] This semester's goals, up to three, with a Sunday check-in from Ember — up to three, check off, remove (checked); the Sunday check-in from Ember is not built
62. [x] "Ember and the helpers can use this" (off by default): a short About-you line joins the AI note, shown in "What did Ember see?" — aboutForAI joins buildNote (core/emberAI.ts) only when sharing is on, so "What did Ember see?" shows it. No server change
63. [x] Share or erase everything About you in one tap — checked live in the Simulator
64. [x] A five-card "get to know you" for new students after setup (skippable) — first five This-or-that cards on the Desk for someone new; stays until finished or closed (checked)
65. [~] A gentle re-ask every couple of months: "Still a night owl?" — "Still a night owl?" when picks are 60+ days old (StillTrue in AboutCards); not seen live (needs old data)
66. [x] Answers shape the app: a night owl's Desk leads with the evening plan — the brief moves to the top of the Desk for a morning person in the morning or a night owl in the evening; greeting says "Night owl hours" / "Early start"
67. [x] "Write it down" people see journaling first in Steady; "talk it out" people see Ember — part of calmOrder: write-it-down puts Let it out first, talk-it-out puts Ember first (checked)
68. [x] Quizzo suggests quiz topics from your interests and hard subjects — helperChips(): "Quiz me on <hardest subject>", a fun round on an interest
69. [x] Sage and Quizzo lean toward how you like to study — Sage offers "Draw it out in words" / "Let me explain it back" from study ways; Pip a night-owl plan
70. [x] Ember's greeting uses your nickname, the time, and one thing it knows — Desk greeting uses the nickname (checked: "Evening, Navi"), and so does the birthday wish
71. [ ] Your top stress sources (from check-ins) show in About you
72. [ ] The people you trust show in About you
73. [ ] Your best wins show in About you
74. [ ] A "your week in a sentence" prompt on Sundays, kept as your story
75. [x] About you shows when each thing was added, and where it came from — checked live in the Simulator

### E. Learned from use, always explained (76–88)
76. [x] When you actually focus: "You do your best focus around 7 PM" from your sessions — core/learned.ts bestFocusHour (checked: "around 6 PM, from 4 of 10")
77. [x] Focus suggests that time and your usual length — Focus says "Right on time: you usually focus around …" within an hour of it
78. [x] Your usual focus length becomes the timer's first choice — Focus starts on the usual length: "Started on your usual 25 minutes." (checked)
79. [ ] Which tools you use most go first on the Drawer and the Desk tiles
80. [x] "Did that help?" after Breathe and Ground (one tap), so the app learns what works for you — components/about/DidItHelp.tsx after grounding and Breathe; "Not really" offers the next tool in their order (checked on grounding)
81. [ ] When your check-in is low, the tool that helped you last time is offered first
82. [ ] "Things I've noticed" card: one pattern at a time, with what it's based on and "Not right"
83. [ ] Sleep and mood together, from your own check-ins, said plainly
84. [ ] Quiet hours learned: if you never open the app after 11, nudges stop earlier
85. [ ] Days you check in most, so the check-in nudge comes then
86. [x] Every learned thing can be turned off in About you ("Don't learn from how I use the app") — the switch in About you; learnedNotes, Drawer most-used/recent, Focus defaults and noteOpen all respect it
87. [x] Learned things need enough evidence (at least 5 times) before they show — MIN = 5 in core/learned.ts; most-used needs 3 opens
88. [x] Nothing learned ever leaves the phone — all on the phone; only aboutForAI (told, not learned) can go to the AI, and only with sharing on

### F. Delight (89–96)
89. [ ] Checking something off: a springy check and a tiny spark
90. [ ] Numbers count up when they appear (stat tiles, streaks)
91. [ ] The room's light follows the time of day: dawn, day, dusk, night
92. [ ] Cards lift with a soft glow under your finger
93. [ ] Ember's eyes follow your scroll a little
94. [ ] Late at night the Desk dims and Ember yawns
95. [ ] Charts draw themselves in when they scroll into view
96. [ ] Haptics mean one thing each: tick for choices, tap for presses, success for saves

### G. Quality and wrap-up (97–100)
97. [ ] Heavy pages wait until the slide-in finishes before drawing what's off screen
98. [ ] Every new piece checked at the largest text size and with VoiceOver
99. [ ] Every new piece checked with Reduce Motion on
100. [ ] CLAUDE.md: the frame, motion tokens, and the About you privacy rules

## Build order

1. **The frame**: 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 19, 31, 32, 33, 43, 44, 45.
2. **Scrolling and lists**: 16, 17, 18, 20, 23, 27, 28, 29, 30, 35, 12, 7.
3. **About you**: 51–63, 70, 71–73, 75.
4. **Learning from use**: 76–88, 66, 67, 79.
5. **Finding your way and delight**: 36, 37, 39, 42, 89–96.
6. **Quality**: 48, 49, 97–100, then commit and push.

## RESUME HERE (for a fresh session after compaction)

**The user's standing instructions (2026-10-02):** keep building Round 5
when usage resets; if stuck, go with the best answer. When Round 5 is
finished, write a **master plan** (a new `docs/masterpiece-6.md`): check
that everything interacts correctly across the app, improve what can be
improved, and come up with new ideas that make it better, more beautiful,
smoother, more presentable. "You are the master here." Allowed: Xcode, the
iOS Simulator, and third-party services (Supabase, GitHub, Xcode, …). If a
permission prompt on the Mac goes unanswered for ~15 seconds, the user is
away: move on without it (skip that step and note it), don't wait.
Commit and push at the end of the round (and whenever asked).

Everything up to here is **committed and pushed** (see `git log`).

Done and checked live: the frame (step 1); About you (page, swipe deck,
chips, nickname, cheer, goals, both switches with the AI preview, share,
erase with Undo); Desk cards (five-card intro for someone new, question of
the day, ring to About you); Drawer (About you tile, Recently opened, Most
used); Settings row with a percent ring; Steady ordered by what calms you;
"Did that help?" after grounding (and Breathe, built); Focus starts on the
usual length with a note; greeting uses the nickname; safe Back (goBack)
everywhere and hold Back to go home (goHome) in core/chrome.ts. Built, not
seen live: cheerLine styles at 14 finish moments, helper chips
(helperChips), the AI note line (aboutForAI in buildNote), StillTrue
re-ask, brief-first for night owls / morning people.

New files this round: core/chrome.ts, core/motion.ts, core/about.ts,
core/learned.ts, core/tools.ts (Drawer tool list, moved out of
app/drawer.tsx), components/OpenWatcher.tsx (records Drawer tool opens),
components/about/{ThisOrThatDeck,DidItHelp}.tsx,
components/desk/AboutCards.tsx, app/about.tsx. lifeStore `about` gained
`opened` and `recent` (plus noteOpen()).

Next, in order:
1. Learning leftovers: #81 (after a low check-in, the tool that helped
   last time first), #82 "Things I've noticed" Desk card (one learned note
   at a time with "Not right"), #83 sleep and mood together, #84/#85 quiet
   hours and check-in days, #79 Desk tiles by use.
2. About you leftovers: #61 Sunday goal check-in from Ember, #71–#74
   (stress sources, your people, best wins, week in a sentence).
3. Step 2 and delight: #7 sheets with grabbers, #13, #14 keep scroll per
   tab, #17 pull-past-top glow, #18 slower backdrop, #20 reading progress
   line, #21 pinned day headers, #22 jump chips, #23 scroll indicator, #25
   field slides into view, #26 pull to refresh with an Ember hop, #27 rows
   slide into place, #31 one press feel, #33 Reduce Motion, #34, #35 glow
   where it lands, #42 Desk sections fold, #46–#47, #89–#96.
4. Quality: #10 badge pop live, #24 audit, #48 large text, #49 VoiceOver,
   #50 iPad/landscape, #97–#100 (CLAUDE.md: frame, motion tokens, About
   you privacy rules).
5. Reset the Simulator's About-you test data before the end (it holds
   "Navi", Chemistry, "Get a B in chem", "Astronomy", helped ground [0,1],
   five picks) so the user can play the cards fresh; a backup from before
   the erase test is in the session scratchpad (life-before-erase.json).
6. Type-check, check live, update this file, scan for secrets, commit and
   push. Then write the master plan (docs/masterpiece-6.md) and start it.

Simulator tips: Metro runs from the preview tool ("metro"); relaunch with
`xcrun simctl terminate booted com.peternunley.brainnavigator` then
`launch`; hold Ember ~2.9 s on the wake screen. Screenshots lag: wait
~1.5 s after a scroll before tapping, and confirm by reading the JSON in
the app container's Documents/. Taps faster than ~0.4 s apart can drop.
iOS 26 switches need a 0.2 s press from the Simulator tool (real fingers
are fine). Don't start a drag on the bottom nav (y > ~780 pt). Editing
core/chrome.ts or a store reloads the whole app. To test "opened from a
link", terminate the app and `xcrun simctl openurl booted
brainnavigator://<route>`. This week's free AI replies are used up
(resets Monday); the developer "pretend I bought Plus" switch is at the
bottom of /plus (turn it off after).

## Progress log

- 2026-10-01: plan written.
- 2026-10-01: Step 1, the frame, built and checked in the Simulator: one
  nav for the app (holds still while pages slide; hides on Ember's chat and
  Breathe), tucks away when reading down and returns on any move up; tap
  your tab to go to the top; glass compact bar with Back and the title
  (tap it to go up) on every page; full-page swipe back (a homework row's
  own swipe still wins); the tab pill glides; the + turns to × and its
  sheet drags closed; Ember steps aside while a page scrolls; pages settle
  once per session, faster.
- 2026-10-01: Step 3 started: About you data model, content, swipe deck,
  the page, and learned notes, all type-checking; not opened live yet.
  Paused here for a context compaction (see RESUME HERE).
- 2026-10-02: About you checked live and fixed (replay deck, nickname and
  goal dropped the last letter, Undo on forgetting a pick, synced name after
  Undo, dividers). Ways in (Drawer tile, Settings row, Desk cards with the
  five-card intro and the question of the day). Wired in: Steady order,
  "Did that help?", Focus usual length and time, nickname greeting,
  cheer styles, helper chips, the AI note line, brief-first. Drawer
  Recently opened and Most used. Fixed: Back from a page opened by a link
  errored ("GO_BACK was not handled"); now goBack() everywhere and hold
  Back for the Desk. Fixed a Reanimated opacity warning on Your day.
  Committed and pushed at the user's request.

