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
7. [x] Quick-add pages (homework, class, candle) open as iOS sheets with a grabber — add homework, add a class, and set something down are iOS form sheets with a grabber (drag down to close); Screen `sheet` drops the status-bar gap when shown as one (checked)
8. [x] The active tab's pill slides between tabs on a spring
9. [x] Tab icons give a small lift and a light haptic tick when chosen
10. [x] The School badge pops when its number changes — the count changed live (3 → 4 → 3); the 0.2 s pop is too quick for the Simulator screenshots
11. [x] The + turns into an × while its sheet is open
12. [x] The + sheet follows your finger when you drag it down, and closes past halfway — drag past 140 pt or flick to close
13. [x] Holding a tab shows what the hold will do before it goes — holding a tab shows a label for what the hold will do ("Search everything", "Add homework or a test"…) before it fires; edge tabs keep it on screen (checked)
14. [x] Coming back to a tab keeps where you were scrolled — School, Focus, and Steady come back where you were scrolled for 10 minutes (core/chrome.ts keepScroll; checked on School)
15. [x] Sheets and pages agree: sheets close with ×, pages go back with ←

### B. Scrolling feel (16–35)
16. [x] The big title eases up and fades as it scrolls under the bar
17. [x] Pulling past the top brightens the candlelight instead of showing a dead edge — pulling past the top brightens a warm glow in the page’s color (checked)
18. [x] The backdrop's glow drifts slower than the page (a little depth) — the room’s light drifts up slower than the page (up to 60 pt), off under Reduce Motion
19. [x] Pages settle once: the staggered reveal plays the first time a page opens, quicker, and not on every visit — first open per session, 400 ms, capped stagger
20. [x] A thin progress line on long pages (notes, journal entries) — a thin gold line under the compact bar on pages 1.5 screens or longer (checked on About you)
21. [–] School's day headers stay pinned while their day scrolls — decided against: School’s day groups are a few rows each; pinned headers would fight the compact bar for the same space
22. [x] Jump chips on long pages that glide to a section — jump chips under About you’s title glide to each section (checked)
23. [x] A thin light scroll indicator on long pages, so you know where you are — the same reading line (#20) is the scroll indicator
24. [x] No heavy work while scrolling: tickers and clocks don't re-render whole pages — audited timers: Focus redrew the page 4× a second while running, now once; the rest are once a minute or local
25. [x] Typing never hides the field: it slides into view — already: the frame’s ScrollView adjusts for the keyboard (automaticallyAdjustKeyboardInsets)
26. [x] Pull to refresh on the Desk, with a hop from Ember — Ember hops when a page is pulled to refresh (core/chrome.ts emberHop)
27. [x] Rows slide into place when something is checked off or removed — already: homework rows use layout transitions (seen moving to Done)
28. [x] Swipe a homework row right to check it off — already there
29. [x] Swipe left to push it to tomorrow — already there
30. [x] A haptic detent when a swipe passes the point where it will act
31. [x] One press feel everywhere (the same sink and spring) — already: every tappable thing goes through Pressy (the design rule)
32. [x] Motion tokens: one place for every spring and duration, so the app moves as one thing — core/motion.ts
33. [x] Reduce Motion: every new movement becomes a fade — by review: the deck, count-up, draw-in, depth, pull glow, Ember’s gaze and yawn all step down under Reduce Motion
34. [x] Loading shimmer only if loading takes over 300 ms (no flash) — SkeletonCard waits 300 ms before showing, so fast loads never flash
35. [x] Something you just added glows once where it lands — homework added in the last few seconds glows once in its class color where it lands

### C. Finding your way (36–50)
36. [x] The Drawer puts the tools you use most first — "Your most used" group at the top once a tool is opened 3+ times; follows the learning switch
37. [x] "Recently opened" in the Drawer — chips at the top of the Drawer from about.recent (checked)
38. [x] Search opens ready to type, and results slide in as you type — already opened ready to type (autoFocus); results now slide in and reshape as you type (checked)
39. [x] Holding Back jumps home to the Desk — hold any Back: straight to the Desk (core/chrome.ts goHome; checked from two pages deep)
40. [x] Deep links don't stack copies of a tab — every Back/Close goes through goBack(): with nothing behind (opened from a link) it lands on the Desk instead of erroring (checked with a cold link to the add sheet)
41. [x] Every empty page has one clear next step — by review: all 35 empty states either carry a button or sit right under the form that fills them
42. [x] Desk sections fold with a tap and remember it — Due soon, On your mind, and How you’re doing fold with a tap on the heading and stay folded (settings.deskFolded; checked)
43. [x] The Undo bar and Ember's toasts ride above the nav, wherever it is — already rode above the nav; seen with "Erased About you"
44. [x] Ember steps aside while you scroll and comes back when you stop
45. [x] The compact bar's title is tappable to go to the top too
46. [–] Pages with tabs (Notebook, Moods) slide between them with the finger — decided against: a sideways swipe on those pages already means "back" (full-page swipe back), which matters more
47. [–] A gentle "end of the page" from Ember on very long pages — decided against: an Ember line at the end of long pages would be noise, and the reading line already shows the end
48. [x] The nav and bars hold up at the largest text sizes — checked at an accessibility text size: nav labels clipped, now shrink to fit; the badge keeps its size
49. [x] VoiceOver: the nav, bars, and sheets read in a sensible order — by review: new controls have roles, labels, and states (cards, fold, tabs’ hold actions, chips, switches)
50. [x] Landscape and iPad: the frame stays centered and the nav stays put — portrait only; content is capped at 520 pt and the nav is a fixed 372 pt pill, both centered

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
61. [x] This semester's goals, up to three, with a Sunday check-in from Ember — up to three, check off, remove (checked); Ember asks about one on Sundays (core/ember.ts goal tip)
62. [x] "Ember and the helpers can use this" (off by default): a short About-you line joins the AI note, shown in "What did Ember see?" — aboutForAI joins buildNote (core/emberAI.ts) only when sharing is on, so "What did Ember see?" shows it. No server change
63. [x] Share or erase everything About you in one tap — checked live in the Simulator
64. [x] A five-card "get to know you" for new students after setup (skippable) — first five This-or-that cards on the Desk for someone new; stays until finished or closed (checked)
65. [~] A gentle re-ask every couple of months: "Still a night owl?" — "Still a night owl?" when picks are 60+ days old (StillTrue in AboutCards); not seen live (needs old data)
66. [x] Answers shape the app: a night owl's Desk leads with the evening plan — the brief moves to the top of the Desk for a morning person in the morning or a night owl in the evening; greeting says "Night owl hours" / "Early start"
67. [x] "Write it down" people see journaling first in Steady; "talk it out" people see Ember — part of calmOrder: write-it-down puts Let it out first, talk-it-out puts Ember first (checked)
68. [x] Quizzo suggests quiz topics from your interests and hard subjects — helperChips(): "Quiz me on <hardest subject>", a fun round on an interest
69. [x] Sage and Quizzo lean toward how you like to study — Sage offers "Draw it out in words" / "Let me explain it back" from study ways; Pip a night-owl plan
70. [x] Ember's greeting uses your nickname, the time, and one thing it knows — Desk greeting uses the nickname (checked: "Evening, Navi"), and so does the birthday wish
71. [x] Your top stress sources (from check-ins) show in About you — "From around the app" in About you: what’s weighed on you this month, from check-in tags (checked)
72. [x] The people you trust show in About you — same section: the people you trust, linking to Your people
73. [x] Your best wins show in About you — same section: wins you kept (checked)
74. [x] A "your week in a sentence" prompt on Sundays, kept as your story — a Sunday Desk card asks for the week in a sentence; kept in About you, never sent to the AI
75. [x] About you shows when each thing was added, and where it came from — checked live in the Simulator

### E. Learned from use, always explained (76–88)
76. [x] When you actually focus: "You do your best focus around 7 PM" from your sessions — core/learned.ts bestFocusHour (checked: "around 6 PM, from 4 of 10")
77. [x] Focus suggests that time and your usual length — Focus says "Right on time: you usually focus around …" within an hour of it
78. [x] Your usual focus length becomes the timer's first choice — Focus starts on the usual length: "Started on your usual 25 minutes." (checked)
79. [–] Which tools you use most go first on the Drawer and the Desk tiles — decided against: Desk tiles moving around by use would break where your thumb expects them; the Drawer does this instead (#36)
80. [x] "Did that help?" after Breathe and Ground (one tap), so the app learns what works for you — components/about/DidItHelp.tsx after grounding and Breathe; "Not really" offers the next tool in their order (checked on grounding)
81. [x] When your check-in is low, the tool that helped you last time is offered first — a hard check-in (stress 7+ or mood ≤ 2) offers what has helped you (bestCalmer), then your calming pick, then breathing
82. [x] "Things I've noticed" card: one pattern at a time, with what it's based on and "Not right" — Desk card "Something I noticed": one pattern a day with what it’s based on, "Not right" or "Got it" (checked)
83. [x] Sleep and mood together, from your own check-ins, said plainly — learned note comparing mood after nights near the sleep goal vs short ones (sleepAndMood, needs enough check-ins)
84. [–] Quiet hours learned: if you never open the app after 11, nudges stop earlier — decided against: the app sends no notifications, so there are no nudges to quiet
85. [x] Days you check in most, so the check-in nudge comes then — learned usual check-in hour; Ember’s "you haven’t checked in" waits until about then
86. [x] Every learned thing can be turned off in About you ("Don't learn from how I use the app") — the switch in About you; learnedNotes, Drawer most-used/recent, Focus defaults and noteOpen all respect it
87. [x] Learned things need enough evidence (at least 5 times) before they show — MIN = 5 in core/learned.ts; most-used needs 3 opens
88. [x] Nothing learned ever leaves the phone — all on the phone; only aboutForAI (told, not learned) can go to the AI, and only with sharing on

### F. Delight (89–96)
89. [x] Checking something off: a springy check and a tiny spark — checking homework off: the springy pop plus a tiny spark in the class color
90. [x] Numbers count up when they appear (stat tiles, streaks) — StatTile and Ring numbers count up the first time a page opens (core/hooks/useCountUp)
91. [x] The room's light follows the time of day: dawn, day, dusk, night — already: the Desk glow follows the time of day (skyGlow)
92. [x] Cards lift with a soft glow under your finger — already: Pressy sinks under the finger and tinted cards brighten
93. [x] Ember's eyes follow your scroll a little — Ember looks down while you read down a page and up when you scroll back
94. [x] Late at night the Desk dims and Ember yawns — late at night Ember’s first move is a yawn; the Desk’s light is already the cool night blue
95. [x] Charts draw themselves in when they scroll into view — Sparkline draws its line in; LollipopChart stems grow one after another (core/hooks/useDrawIn)
96. [x] Haptics mean one thing each: tick for choices, tap for presses, success for saves — by review: selection ticks for choices and detents, light/medium taps for presses and finishing, success for completions

### G. Quality and wrap-up (97–100)
97. [–] Heavy pages wait until the slide-in finishes before drawing what's off screen — decided against for now: pages open within the push animation with no visible hitch; revisit if a page gets heavy
98. [x] Every new piece checked at the largest text size and with VoiceOver — large text checked (#48); labels and roles reviewed (#49)
99. [x] Every new piece checked with Reduce Motion on — by review (#33)
100. [x] CLAUDE.md: the frame, motion tokens, and the About you privacy rules — CLAUDE.md: the frame, motion, sheets, About you privacy rules

## Build order

1. **The frame**: 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 19, 31, 32, 33, 43, 44, 45.
2. **Scrolling and lists**: 16, 17, 18, 20, 23, 27, 28, 29, 30, 35, 12, 7.
3. **About you**: 51–63, 70, 71–73, 75.
4. **Learning from use**: 76–88, 66, 67, 79.
5. **Finding your way and delight**: 36, 37, 39, 42, 89–96.
6. **Quality**: 48, 49, 97–100, then commit and push.

## RESUME HERE (for a fresh session after compaction)

**Round 5 is finished** (93 done, 6 decided against with reasons, 1 built
but not seeable live: #65's "Still a night owl?" needs answers 60+ days
old). Committed and pushed. The next round's plan is
`docs/rounds/round-6.md`; its RESUME HERE is the place to start.

The user's standing instructions (2026-10-02): keep going round after
round; if stuck, go with the best answer; after each round write the next
master plan (check that everything interacts right, improve, new ideas,
beautiful and smooth); Xcode, the Simulator, and third-party services are
allowed; if a Mac permission prompt sits ~15 s unanswered, skip that step
and note it; commit and push at the end of each round.

Simulator state left clean: About you reset to empty (the five-card intro
shows on the Desk), the test homework removed, text size back to Large.
Backups of the data from before the reset are in the session scratchpad
(life-before-reset.json, school-before-reset.json).

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
- 2026-10-02 (night): finished the round. Learning: sleep and mood,
  usual check-in hour (Ember's nudge waits for it), what helped offered
  first on a hard check-in, a "Something I noticed" Desk card. About you:
  From around the app (stress tags, people, wins, weeks), the Sunday week
  sentence, Ember's Sunday goal question, jump chips. Frame: pull glow,
  backdrop depth, reading line, tabs keep their scroll, quick-add pages as
  grabber sheets, hold-a-tab labels, folding Desk sections, Ember hops on
  refresh, follows your scroll, and yawns late. Delight: spark on check,
  glow where new homework lands, count-ups, charts that draw in, search
  results that slide in. Fixes: big titles were half-faded at rest on
  Focus and Steady; nav labels clipped at large text; Focus redrew 4×/s.
  Committed and pushed.

