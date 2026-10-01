# The Masterpiece, round 2 — helpers, multi-scan, Plus, and 100 improvements

Requested 2026-09-30: "make it so it can spawn ai agents that help you
thats interactive and fun", "when i scanned my schedule it only would scan
one screenshot make it so it can scan multiple", "make the ai aspect of the
app limited then put a paywall", "commit" (done: da32a82), and "come up
with a 100 more ideas to improve on any ideas you have had already and
orchestrate more improvements to the entire ui".

Resume from the first unchecked box. Legend: [x] built and seen working
live · [~] built and type-checked, not yet exercised live · [ ] not started

## The three requests
R1. [x] Helper crew (core/helpers.ts, helperOffline.ts, app/helpers.tsx,
    app/helper/[id].tsx, components/helpers/*): Quizzo (quiz game from
    flashcards + AI), Pip (tonight's plan → Your day + AI), Quill (brainstorm
    → Notebook + AI), Sage (explain-it-back + AI), Spark (start + hype + AI).
    Spawn animation, per-helper chat memory, "Get a helper" on assignments.
R2. [x] Multi-screenshot scan: up to 10 per pick, each parsed separately and
    merged (mergeScans), thumbnails with progress, "Add more screenshots".
R3. [x] AI allowance + Plus paywall (core/aiQuota.ts, app/plus.tsx): Free 20
    AI replies/week; Plus 400/month at $2.99/mo or $19.99/yr. Purchases NOT
    wired (needs paid Apple Developer account + App Store Connect product +
    StoreKit lib) — button says so honestly. Crisis/wellness always free.

## A. UI consistency and polish
1. [x] Remove "A · B" middle-dot joins everywhere (a design-system rule)
2. [~] Tabular figures on every number readout
3. [~] Skeleton shimmer while Supabase lists load (check-ins, habits, to-dos)
4. [x] Haptics audit: success on finishing, selection on toggles, warning on misses
5. [~] Cap Dynamic Type growth on dense rows (maxFontSizeMultiplier)
6. [~] Long-press a tab for its quick action
7. [~] Section headings can carry a small icon
8. [~] Empty states: Ember wears the right gear for the screen
9. [~] Pull to refresh on Desk and School
10. [~] Add/edit screens open as sheets (modal presentation)
11. [x] Swipe an assignment right to finish, left to push to tomorrow
12. [~] Tinted cards glow a touch when pressed
13. [x] Undo bar shows what kind of thing it'll bring back
14. [x] Keyboard: tap outside / scroll to dismiss everywhere
15. [x] Contrast pass on faint text tokens
16. [~] Reduce Motion: Ember's idle antics and sparks calm down
17. [x] Time-of-day glow on School and Focus too
18. [~] Icon sizes consistent across rows and tiles
19. [x] Launch gate shows the student line of the day, not adult quotes
20. [~] Screen titles never truncate awkwardly (long class names)

## B. Desk
21. [~] Customize the Desk: hide sections you don't use
22. [~] Evening "tomorrow" card: first class and what's due
23. [x] Morning brief card: today's classes and due today
24. [x] Quick capture bar: "bio quiz friday" becomes a real assignment
25. [x] Natural-language parsing for quick capture (kind, class, date)
26. [x] Helper suggestion card: test tomorrow → call Quizzo
27. [~] Resurfaced good thing: "A while ago you were grateful for…"
28. [~] Worry-time card when worries are waiting (4–7 PM)
29. [x] Warmth meter on the Desk
30. [~] Soonest countdown gets a progress ring

## C. School
31. [~] "Add another like this" on assignments
32. [~] Due-date pile-up warning when adding (3+ due the same day)
33. [~] Smarter time estimates from your own focus history
34. [~] Grade what-if: try a hypothetical score
35. [~] Grade goal per class with progress
36. [~] Scan grades from a screenshot ("85/100" lines)
37. [~] Scan class times from a schedule screenshot ("8:00 AM - 8:50 AM")
38. [~] Week view: tap a day to add a study block
39. [~] "Do this now" line at the top of School
40. [~] Class page quick color change
41. [~] Bulk move: push every overdue thing to one day
42. [~] Assignment detail shows which helper you last used on it

## D. Study and Focus
43. [~] Pomodoro auto-cycles (4 rounds, then a long break)
44. [~] Long focus sessions drop into the wins jar automatically
45. [x] Flashcards: type-the-answer mode
46. [x] Flashcards: reverse mode (back to front)
47. [x] Make flashcards from a note's "term — definition" lines
48. [~] Share a deck as text; import one by pasting
49. [x] Focus month heat calendar
50. [x] Best time of day to focus (from your sessions)
51. [x] Quizzo warm-up offer on the Focus setup
52. [x] Techniques: "try it tonight" adds a step to an assignment

## E. Helpers and AI
53. [x] Study session combo: Pip plans → Spark starts → Quizzo warms up
54. [x] Helpers remember last time ("Last time we planned Tuesday")
55. [~] Helper looks "listening" while you type
56. [x] Quizzo lightning round: 10 seconds per question
57. [x] Pip: "I'm busy until…" start-later chips
58. [x] Quill: word-goal tracker for an essay note
59. [x] Sage AI: level chips (like I'm 5 / 12 / expert)
60. [~] Save a helper's reply to your Notebook (long-press)
61. [x] AI usage log: what your replies went to
62. [x] Ember's bubble tip: "3 AI replies left — on-phone modes are free"
63. [~] Helper chats pruned after 30 days
64. [x] Helpers get their own badges (game on, quiz whiz, called the crew)

## F. Wellness
65. [x] Mood picker faces drawn as Ember expressions
66. [x] Mood map day detail shows the stress tags and note
67. [x] Wind-down nights counted (no streaks)
68. [x] One-minute breath button at the top of Steady
69. [x] Stress tag → matching tool suggestion after a check-in
70. [~] Weekly "check on a friend" nudge from Your people
71. [x] Five-minute reset routine in the Toolkit
72. [~] Long-press the Steady tab → Need help now
73. [~] Sleep: tonight's bedtime on the evening Desk
74. [x] Gratitude: prompts rotate daily

## G. College and life
75. [x] Supplement essays per college with word limits
76. [~] Application fees and waivers per college
77. [x] Scholarships sorted by urgency with colors
78. [~] Activities list: copy all as text for the Common App
79. [x] Hours: share a log (for a supervisor to verify)
80. [x] Driving: time of day logged, night hours auto-marked
81. [~] Work: hourly wage and earnings this month
82. [x] Countdowns: pick an icon

## H. Motivation
83. [x] Badges show progress toward the next one
84. [x] Share a badge as text
85. [x] Your year: month-by-month chart
86. [x] Weekly review auto-highlights (best day, most-focused class)
87. [x] Bigger celebration for big moments (all steps done, 100 score)
88. [x] Achievements screen groups (school, study, you)

## I. Data, settings, quality
89. [x] Restore from a backup (paste the JSON)
90. [x] Ember quiet mode (fewer tips and toasts)
91. [~] Ember quiet during class time
92. [~] Long lists render lazily (search, grades, cards)
93. [~] VoiceOver pass on the new screens (helpers, quiz, plus)
94. [~] Error screen: copy the details for a bug report
95. [~] Old per-day checklists and chats trimmed automatically
96. [x] Welcome flow mentions helpers and scanning
97. [~] "How AI works here" page: what's free, what's sent, what it costs
98. [x] Privacy page: what lives on the phone vs Supabase vs Anthropic
99. [x] Replay the app tour from Settings
100. [~] What's new history page

## RESUME HERE (for a fresh session after compaction)
- Committed so far: da32a82 (round 1). Round 2 is NOT committed yet — wait
  for the user's "commit".
- Round 2 is fully built. Continue in docs/masterpiece-3.md.
- (old) Next up: I #89–100, F #65–74, G #75–82, H #83–88,
  I #89–100. Then docs (CLAUDE.md "Masterpiece round 2" section,
  SESSION_LOG, todo) and a phone rebuild after the user commits.
- Test recipe: relaunch the Simulator app after edits (hot reload can crash
  dev builds with AppContextLost), hold Ember ~2.5 s at (201, ~485) to wake,
  deep link with `xcrun simctl openurl booted brainnavigator://<route>`.

## Progress log
- R1–R3 built; Helpers screen + Quizzo game verified live (spawn, answer B
  correct → score 10). Header compacts during games/chats.
- Verified live: Quizzo game (compact header), AI chat → honest no-credit
  notice + free-mode button (allowance unchanged at 20), Plus screen + honest
  "payments aren't switched on" message, multi-scan of 2 screenshots merged
  ("From 2 screenshots", thumbnails with checks). Found + fixed: parser now
  handles Classroom's title/class/due order (was taking the class as the
  title); node test of both layouts + merge passes.
- Batch A+B (UI + Desk): dot joins → commas, tabular numbers, type caps,
  tab long-press shortcuts (hold Steady → Need help now), pull to refresh,
  add/edit as sheets, swipe rows (verified: swipe left → tomorrow + Undo),
  tinted-card press glow, undo icons, Ember gear in empty states, section
  icons, skeletons, contrast (textFaint 4.47 → 5.2:1), Reduce Motion for
  Ember's idle antics, sky glow on School/Focus, launch line of the day
  (verified), quick capture with natural language (verified: "chem
  worksheet friday" → AP Chemistry, Friday), morning brief (verified),
  evening tomorrow card, Quizzo nudge (verified), resurfaced gratitude,
  worry time, warmth tile (verified), Desk customization, countdown rings.
- Batch D (study + focus): Pomodoro keep-cycling with a long break every 4th
  round, long sessions into the wins jar, flashcards type-the-answer
  (`checkAnswer` in lifeStore: typos OK in words, never in numbers; node
  tested) and back-to-front (both verified), share a deck as "front :: back"
  text, "Make N flashcards from this page" on notes (verified: 3 cards → new
  deck), month heat map on Focus (verified; Monday-aligned, explicit cell
  sizes — `aspectRatio` + % width drew flat lines), best time of day
  (verified: "evenings"), Quizzo warm-up on Focus (verified), techniques
  "Try it tonight on …" adds a step (verified). Also fixed: long bullet /
  checklist lines in notes were cut off (single-line fields) — every block
  now wraps, Return still starts the next line (`submitBehavior`).
- Batch E (helpers + AI): study session combo (Pip → Quizzo → Spark → Focus,
  verified end to end), helpers remember last time (`helperLast`, verified:
  "Earlier today, we planned 1h 30m of work from 6:00 PM."), listening face
  while typing, Quizzo lightning round (verified: clock, timeout → "Time!"
  miss), Pip "Busy until…" start times (verified: 6 PM → 6:00–7:40), word
  limits on essay notes (verified: 150 → "30 over the 150-word limit"),
  Sage level chips (verified visible), hold a reply to save it to the
  Notebook (needs a real AI reply to test), AI usage log "Where they went"
  on Plus (verified with seeded usage), Ember tip at ≤3 replies left
  (verified), chats untouched 30 days pruned at load, crew badge now counts
  free modes. Also fixed: Pip split a 30-minute task into 25 + a 5-minute
  scrap (leftovers under 10 min now ride along), "Break — …" and "0 words —
  aim…" dash labels.
- Batch F (wellness): mood picker faces are little Embers (flame grows with
  the mood; verified; fixed Rough looking angry, and dropped the scale on
  the selected face, which drew it blocky), mood map day detail adds "That
  day: 25 minutes of focus, 1 thing finished." (verified), wind-down nights
  counted, no streak (verified: "6 of the last 14 nights"), one-minute
  breath card at the top of Steady (verified), today's stress tag → matching
  tool card on the Desk (verified: Homework → Pip), Your people remembers
  when you last reached out + a Sunday/Wednesday afternoon Ember nudge about
  someone quiet for 7+ days (built, not seen live), five-minute reset in the
  Toolkit (verified), gratitude prompts rotate daily (verified). Also fixed:
  the Desk's compact due list hid dates beyond tomorrow ("Chem worksheet"
  showed no day).
- Batch G (college + life): supplement essays per college, each opening its
  own note with the word limit set (verified: "UC Davis: Why this major",
  0 of 350), application fee + waiver per college with a total on the
  balance card (fee saved; total line not seen yet), scholarships sorted by
  urgency with red/gold tints and "2 days left" (verified), activities
  share as Common App text (built), hours "Share log" with a sign-off line
  (verified sheet), driving start time with night set from a rough monthly
  sunset (verified: 9 PM → night, "1 h from 9:00 PM, night"), work wage +
  this month's earnings (built), countdown icons (verified: Prom with a
  heart). Also fixed: "5/14" typed in September parsed as last May (numeric
  dates now roll to next year like month names; node tested), countdowns
  never land in the past, a tap anywhere inside an open college card folded
  it away (only the header toggles now), "— 12 days" dash on college cards.
- Batch H (motivation): badges grouped School / Study / You with "1 of 10
  finished" progress on count badges (verified), hold an earned badge to
  share it, Your year month-by-month chart with Finished / Focus / Days
  (verified: "Your biggest month: September"), weekly review highlights
  (verified: "Tuesday was your biggest day: 1 finished, 25 minutes of
  focus."), whole-screen celebration for big moments (`core/celebrateStore`
  + `components/Celebration.tsx`: all steps done (3+), Quizzo 100+, college
  yes, scholarship won, weekly focus goal; verified with a $1,000 win).
- Environment: the Mac restarted mid-session; Metro now starts from the
  "metro" entry in ~/Desktop/.claude/launch.json (no CI=1, which disables
  reloads).
- Batch I (data, settings, quality): restore from a pasted backup with a
  preview and hold-to-restore (verified end to end; curly quotes from
  typing are straightened on retry; Canvas connection kept), Ember Chatty /
  Quiet / Silent in class (chips verified; class silence uses nowState),
  search "Show all N" + recent searches, decks page at 40 cards, VoiceOver
  labels (held AI replies, heat map days read as "Tuesday, Sep 29: 25
  minutes of focus"), error screen "Share what happened" (no personal data),
  old per-day lists and 90+ day "one thing" trimmed at load, welcome step
  "I brought friends" with the crew (verified, 4 dots), How AI works page,
  Where your stuff lives page (verified; says plainly the online part has
  no login yet), What's new history, Replay the welcome (verified).

