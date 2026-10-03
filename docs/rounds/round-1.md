# The Masterpiece — 120 ideas, all executed

Requested 2026-09-30: "orchestrate a master piece make over 100 plus ideas
and execute all of them." This file is the plan AND the progress tracker —
if the session compacts, resume from the first unchecked box. Every idea is
local-first (school.json / hub.json / life.json on the phone), no new
native modules, no Supabase Auth. Verify in the Simulator in batches.

Legend: [x] built and seen working live · [~] built and type-checked, not yet exercised live · [ ] not started

## Where things live
- `core/schoolStore.ts` — + priority, subtasks, repeat, grades, class level/credits
- `core/hubStore.ts` — + college tier, scholarships, rec letters, activities list, visits
- `core/lifeStore.ts` (new, life.json) — wins, gratitude, hours, countdowns,
  people, pack list, wind-down, worry box, achievements, flashcards, Ember style,
  daily "one thing", weekly reviews, distractions
- New screens are listed per idea; all reachable from the Drawer or a parent screen

## A. The Desk (home)
1. [x] "One thing" — pin today's single priority to the top of the Desk
2. [x] Countdown chips row: next test, next college deadline, weekend, your own countdowns
3. [x] Tonight's load mini-meter on the Desk (minutes vs nightly cap)
4. [x] A line for the day (quote/affirmation that changes daily)
5. [x] "All clear" celebration card + sparks when nothing is due by tomorrow
6. [x] Semester progress bar (days until break) when a countdown is marked "break"
7. [x] Search button on the Desk header (everything: assignments, notes, classes, colleges)
8. [x] Sky that follows the time of day (dawn/day/dusk/night tint on the Desk glow)
9. [~] Weekly review prompt on Sunday evenings
10. [~] Achievements unlocked toast when something is earned

## B. School planner
11. [x] Priority star on assignments (starred float to the top)
12. [x] Subtasks — break a big assignment into checkable steps
13. [x] "Plan it backward" — auto-spread study steps across the days before a test/project
14. [x] Snooze: push an assignment to tomorrow in one tap (assignment detail)
15. [~] Duplicate an assignment
16. [~] Repeats weekly (e.g. vocab quiz every Friday) — next one is created when you finish
17. [x] Overdue triage screen: do tonight / move / drop / ask the teacher
18. [~] "Ask for an extension" message drafter (Share sheet, you send it)
19. [x] Class page: its work, notes, grades, teacher, room, times
20. [~] "I was out" helper — what to ask each class for after an absence
21. [x] Week view: timetable grid of classes Mon–Fri, colored by class
22. [x] Workload heatmap: next 14 days, minutes due per day vs your cap
23. [~] Time spent on an assignment (from focus sessions) on its detail page
24. [~] Finals mode: exam list + countdown + study plan (from countdown kind "finals")
25. [x] Search across schoolwork
26. [x] Done this week count on School
27. [x] Quick "+1 day / +1 week" move chips on the detail screen
28. [x] Assignment notes shown in rows when present (little note mark)

## C. Grades
29. [x] Log grades per class (score / out of, category, date)
30. [x] Running class average with letter grade
31. [~] Weighted categories per class (tests 50%, homework 30%…)
32. [x] "What do I need on the final?" calculator
33. [x] GPA — unweighted and weighted (Honors/AP +1) with class level + credits
34. [x] Grade trend sparkline per class
35. [~] Ember notices a slipping class gently (tip)

## D. Focus & study
36. [x] Focus presets: Pomodoro 25/5, Deep 50/10, Sprint 15/3
37. [~] "Just 5 minutes" start (beat procrastination)
38. [~] Distraction catcher: jot a stray thought mid-session, get back to work
39. [~] Session reflection (how did it go? 3 taps) saved with the session
40. [x] Weekly focus goal with progress ring
41. [x] Study techniques library: active recall, spaced repetition, Feynman,
       interleaving, blurting, Pomodoro, elaboration, practice testing
42. [x] Flashcard decks per class
43. [x] Flashcard study mode: flip card, "got it / again", Leitner boxes (spaced repetition)
44. [x] Deck stats: mastered / learning / new
45. [x] Make cards fast: "front :: back" paste-in, one per line
46. [~] Focus streak-free history: minutes per day this week (exists) + total all-time
47. [~] Suggested next thing to study (soonest test with a deck or plan)

## E. Ember
48. [x] Ember accessories: grad cap (College), headphones (Focus), scarf (night), glasses (study)
49. [x] Ember color themes: gold, rose, ocean-blue, forest-green, violet flame
50. [x] Warmth: self-care and schoolwork warm Ember up; unlocks themes/accessories
51. [x] Ember's style picker in Settings (theme + accessory)
52. [x] Milestone cheers (first scan, 10 focus sessions, first A…)
53. [~] Pet Ember: stroke across it → happy wiggle
54. [~] Bedtime nudge: past your wind-down time Ember suggests the routine
55. [~] Tips for new features: grades slipping, deck due, service hours goal, countdown today
56. [~] "About this screen" text for every new screen
57. [~] Ember in empty states everywhere (already via EmptyState) + new moods in new screens
58. [~] Ember birthday wish (if birthday set in Settings)

## F. Wellness
59. [x] Sleep calculator: wake time → bedtimes by 90-min cycles, respecting your sleep goal
60. [x] Wind-down routine checklist (editable) with tonight's progress
61. [x] Tomorrow's bag packing list (editable, resets nightly)
62. [x] Gratitude: three good things, once a day
63. [x] Wins jar: log small wins, see them fill a jar
64. [~] Mood calendar: month of check-in moods as colored dots
65. [~] Stress source insights: what comes up most (from check-in tags)
66. [~] Test anxiety toolkit: reappraise ("this is excitement"), 4-7-8 breath, 2-minute prep list
67. [x] Progressive muscle relaxation guided steps
68. [~] Self-compassion break (3 steps)
69. [~] Thought reframe helper: pick a thinking trap, rewrite the thought
70. [~] Worry box: write a worry, schedule it for "worry time", release when handled
71. [~] Reach out: your trusted people (name + number), one tap to text or call
72. [~] Habit ideas for students (one-tap add)
73. [~] Screen-time reflection? → folded into wind-down ("phone out of the bedroom")
74. [~] Steady links to the new toolkit, people, worry box

## G. Notebook
75. [x] Search notes
76. [x] Markdown shortcuts: "# " heading, "- " bullet, "[] " todo, "> " quote, "1. " numbered
77. [x] New blocks: numbered, quote/callout, divider
78. [~] Templates: Cornell notes, lab report, reading notes, meeting/club notes
79. [~] Share a note (Share sheet as plain text)
80. [~] Turn a note's to-do into an assignment
81. [x] Pinned notes first + pin toggle
82. [x] Word count on every note (for essays)
83. [~] Notes filtered by class (chips)

## H. College
84. [x] Reach / target / likely tier per college, with a balance bar
85. [x] Deadline timeline across all colleges
86. [~] Scholarship tracker: name, amount, deadline, status
87. [~] Recommendation letters: who, asked on, due, thank-you sent
88. [~] Activities list builder (Common App: 10 activities, 150-char descriptions, live counter)
89. [~] Essay word counter with 650 limit (in notes with the essay template)
90. [~] FAFSA / CSS Profile checklist
91. [~] Campus visit notes (rating + what stood out)
92. [~] College countdown on the Desk chips (idea 2)

## I. Student life
93. [x] Community service hours log with a goal (e.g. 40 hrs)
94. [~] Driving practice log (learner's permit: total + night hours toward 50/10)
95. [x] Countdowns: prom, break, game, birthday — your own events
96. [~] Job shifts as activities (already via schedule) + hours total in Hours
97. [x] "Your year" stats: assignments done, focus hours, check-ins, wins

## J. Motivation (gentle, no streak shame)
98. [x] Achievements (quiet badges): first scan, first focus, 5 check-ins, 10 wins…
99. [~] Weekly review: what went well, what was hard, one thing next week + stats
100. [~] "Days you showed up" (count, not a streak)
101. [~] Celebrate finishing every subtask of a big project

## K. Design & graphics
102. [x] New icons: star, search, grade, cards, gift, car, hands, jar-fill, bag, bed, settings, share, sparkle-star, trophy, list
103. [x] Progress bar primitive (animated) used across new screens
104. [x] Segmented control primitive
105. [~] Toast with Undo (delete an assignment → Undo)
106. [x] Friendly error boundary with Ember (screen crash → "something tipped over")
107. [x] Flip-card animation for flashcards
108. [x] Jar-filling graphic for wins
109. [~] Month dot grid graphic for moods
110. [x] Heatmap graphic for workload
111. [x] Timetable graphic for the week

## L. Settings, data & quality
112. [x] Settings screen: name, grade, birthday, sleep goal, nightly cap, wind-down time
113. [~] Export everything (school/hub/life JSON) via Share sheet
114. [~] Reset local data (hold to confirm)
115. [x] Drawer reorganized with the new tools (School, Study, Wellness, College, Life)
116. [~] Quick-add sheet: + Grade, + Flashcards, + Win
117. [~] Accessibility labels on every new control
118. [~] Reduce Motion respected in new animations
119. [x] What's-new card on the Desk (one time) + Ember explains every new screen
120. [x] Docs: CLAUDE.md + SESSION_LOG + todo updated

## Progress log
(append a line per batch: what shipped, what was verified)
- Batch 1+2 (foundation, school, grades, study, Ember look, settings): built
  core/lifeStore.ts, core/achievements.ts, core/emberLook.ts, core/undoStore.ts;
  screens settings, achievements, year, triage, week, class/[id], grades,
  search, absent, flashcards, deck/[id], techniques; focus + assignment detail
  upgraded. Verified live: School tools row, Grades log → B+ 88.0%, final calc
  98% (correct), badge watcher announced "Keeping score", Ember scarf at night
  and glasses on Grades.
- Batch 3+4 (wellness, college, student life): sleep, wins, moods, toolkit,
  worry, people, scholarships, recs, activities, aid, hours, countdowns;
  Steady doors, habit ideas, College tiers/balance/timeline/visits. Not yet
  verified live.
- Batch 5 (Desk, Ember tips, Notebook, review, nav): countdown chips, one
  thing, all-clear, review prompt, tonight's load, day line, sky glow, search;
  Ember tips (birthday, wind-down, cards due, slipping grade, Sunday review,
  countdown today) + ABOUT for every new route; Notebook shortcuts/new
  blocks/word count/share/todo→assignment/search/filters; weekly review;
  quick-add row; Drawer regrouped; What's New card. Only #120 (docs) left.
- Verification sweep + docs: see SESSION_LOG 2026-09-30. [x] = seen working
  live; [~] = built and type-checked, not yet exercised live. Fixed along
  the way: alpha() worklet crash, note-editor keystroke loss, one-thing
  last letter, doubled weekday, sleep cycle labels, jar marbles, class tap
  target, flashcard crispness, settings icon, search capitalization.
