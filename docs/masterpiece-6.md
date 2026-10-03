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
20. [ ] A last full pass: open every page once more after the round, read every word

### B. Night, the app's best hour (21–35)
21. [~] **Night Desk**: after wind-down, the Desk becomes one quiet card stack: tomorrow's first class, what's due tomorrow, the pack list, and "lights out by"
22. [~] Everything else on the Desk folds away at night (one tap shows it all)
23. [~] The room dims a little more each hour after wind-down
24. [ ] Ember holds a tiny candle at night and speaks softer (shorter lines)
25. [~] "Put the day down": one tap at night lists what got done, sets down what's left for tomorrow, and says goodnight
26. [~] A goodnight line from Ember that names one real thing from the day
27. [~] Late-night writing in Let it out offers "keep it for tomorrow" (the worry box) instead of solving it now
28. [~] After midnight, Ember's first line is about sleep, never homework
29. [~] Morning light: the first open after wake time shows "first light" (today's first class, one thing, the weather) and fades to the normal Desk
30. [ ] The sky outside the room follows the real sunset time (from the weather store's location, if it has one)
31. [~] Stars appear in the night backdrop, a few at a time, slower than the motes
32. [~] Night mode respects Reduce Motion (stars stay still)
33. [~] The night stack works with the Desk's fold choices (folded stays folded)
34. [~] Night is learned: if they're a night owl, the night layout starts later
35. [~] Sunday night: the week sentence card leads the night stack

### C. Presentable (36–55)
36. [x] **Show someone**: Settings → "Show someone the app" swaps in a full set of sample data (a made-up student), shown with a small banner, and nothing saves; one tap returns to your own app untouched — Settings → Show someone the app; Riley's data in every store; a gold "Showing Riley | Done" pill under the Dynamic Island (checked both ways)
37. [x] Sample data covers every page (classes, homework, notes, decks, wins, moods, colleges) so every page looks lived-in — core/sampleData.ts: classes, homework with steps, focus, grades, notes, colleges, decks, wins, people (555 numbers), hours, About you, 14 check-ins, habits, entries, journal
38. [x] While showing, AI calls are off and Ember says so (no cost, nothing sent) — AI off (aiOff in the sample settings and the client refuses), Notion, Calendar, Health, weather cut off
39. [x] While showing, nothing from the real journal, check-ins, or About you can appear — the online database is replaced by an in-memory stand-in (core/sampleDb.ts); your files are never written while showing
40. [ ] A guided tour in show mode: Ember walks through five pages with one line each
41. [ ] The wake screen: Ember yawns, stretches, and the quote fades in (one breath long)
42. [x] First run: the welcome flow ends with the five This-or-that cards, so the app knows you from minute one
43. [x] Every empty page has an Ember drawing and one clear next step (consistent art, not just text) (EmptyState draws Ember by default; the plain lines left are in-section notes, by design)
44. [~] Cards share one shadow and one corner radius scale (audit the stragglers)
45. [ ] Section headings breathe the same everywhere (spacing audit)
46. [~] Every number in the app uses tabular figures so columns line up
47. [ ] Icons in the Drawer get a soft inner glow in their color
48. [ ] The + sheet's options get small illustrations
49. [~] What's New gets a Round 5–6 entry with the best changes
50. [x] Settings reads like a story: You, Your Desk, Ember, AI, Your data (reorder and regroup)
51. [x] Long pages get their jump chips (Settings, Your year, Steady's toolkit)
52. [~] A tasteful app-wide accent for "new" (a small gold dot) that clears when seen
53. [ ] Screenshots: a script that captures the hero pages for sharing (docs/screens/)
54. [ ] A one-page "what this app is" in the repo (docs/about-the-app.md) with the screenshots
55. [ ] The phone gets a fresh Release build with everything (free signing renews)

### D. Surprise: things that make it feel like nothing else (56–75)
56. [x] **Candle of the week**: every Sunday, the week's focus minutes, wins, and check-ins become one candle on a shelf; the shelf fills over the semester (Your year)
57. [~] The shelf is touchable: tap a week's candle to see its sentence and best moment
58. [~] **Ember remembers firsts**: first focus hour, first A, first week with every check-in; each gets a quiet moment, never a pop-up storm
59. [~] **Sparks carry over**: checking things off makes sparks that fly to the Desk's candle and brighten it a little for the day
60. [~] The Desk's candle burns brighter with the day's progress (done vs due)
61. [~] **Weather in the window**: rain, snow, or clear outside shows faintly in the room's backdrop
62. [~] **Hold the flame**: holding Ember for a long breath starts a 3-breath calm right there, anywhere in the app
63. [ ] **Pocket worry**: shake the phone to drop a worry into the box from anywhere (with Undo)
64. [~] **Study buddy**: during Focus, Ember studies too (a tiny book), and peeks up when time's half done
65. [~] **Streak of light**: the days you showed up glow as a thin line under the Desk title (no numbers, no guilt)
66. [~] **One kind thing**: once a week, Ember suggests texting one person from Your people something kind (a ready line, they tap send)
67. [ ] **Exam season mode**: when 3+ tests are within a week, the Desk turns into a study plan view with a countdown ring per test
68. [~] **Birthday morning**: the room has confetti sparks and Ember a party hat (once)
69. [ ] **Seasons**: autumn leaves, winter frost, spring blossoms drift as the motes, by date
70. [ ] **Soundscape** (opt-in, with a real mute): soft fire crackle during Focus
71. [~] **The good mail**: a note you write to yourself in Wins can be "sealed" until a date, and opens then
72. [ ] **Your constellation**: About you drawn as stars (each pick a star), joined as more is known
73. [ ] **Ember's journal**: Ember writes one line a week about your week (on the phone, no AI)
74. [~] **Tiny wins radar**: Ember notices a small good thing in the data ("first time Chem was done a day early") and says it
75. [~] **Hand-off**: a page you leave half-done (a note, a check-in) offers "pick up where you left off" on the Desk

### E. Smoothness, the second pass (76–90)
76. [ ] Numbers animate when they change, not only on first open
77. [x] Rows that move between groups (Today → Done) glide instead of jumping
78. [ ] The tab pill stretches slightly as it slides (a liquid feel)
79. [ ] Pages pushed from a card grow from that card (a zoom-from-card transition where supported)
80. [~] The compact bar's title slides up from where the big title was
81. [~] Chips press with a springy sink like cards
82. [~] Pull-to-refresh on School and Steady too, with Ember's hop
83. [ ] The keyboard and the page move together (fields slide, never jump)
84. [ ] Sheets snap to a half height when their content is short
85. [ ] Long lists render lazily (Notebook, Search, Badges) so pages open instantly
86. [~] Haptic texture on sliders (a tick per step)
87. [~] Swipe between days in Your day
88. [ ] Ember's drag follows the finger with a slight lag (weight)
89. [~] Toasts and the Undo bar never overlap (a single queue)
90. [ ] Everything at 120 Hz: no JavaScript per frame during scroll or drag (audit with the perf monitor)

### F. Quality and wrap-up (91–100)
91. [ ] Every new piece checked live in the Simulator, with screenshots
92. [ ] Every new piece at the largest text size
93. [ ] Every new piece with VoiceOver labels
94. [ ] Every new piece with Reduce Motion
95. [x] Show-someone mode can't save over real data (tested by checking the files before and after) — checked: file fingerprints identical after checking things off as Riley; only your own Settings visits changed, no Riley data in your files
96. [ ] The app opens to the Desk in under a second on the phone (measure)
97. [x] CLAUDE.md: night Desk, show mode, the shelf, and their rules
98. [x] SESSION_LOG and this file's progress log
99. [x] Secret scan, commit, push
100. [ ] Write Round 7's plan from what's left and what the user says

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

Wave 3 runs in a cloud session on branch `claude/round6-wave3` (draft PR).
The gate works there (`node tools/hub/check.mjs --agent atlas`); there is
no Simulator in the cloud, so every [~] item still needs a live check on
the Mac before it becomes [x]. Status marks above were brought up to date
on 2026-10-03, so read them instead of searching the code. Wave 3: Glide
(School group-collapse jump, Steady pull-to-refresh) and Spark (firsts,
tiny wins radar).

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
