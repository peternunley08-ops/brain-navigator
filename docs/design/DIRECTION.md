# Design direction: One Lit Thing

Written by Muse, 2026-10-05, for Peter's ask: "a simpler layout with things
that impact the connection to the app; everything stays; balance the product
and how it is sold." This is a plan, not a build. Nothing here has been seen
on a phone yet; every phase ends with a live check.

---

## 1. What exists today (the map)

| Surface | What's there now | Count |
|---|---|---|
| Routes | `app/*.tsx` file routes, including 6 dynamic ones (`class/[id]`, `deck/[id]`…) | 71 files, about 70 screens |
| Tab bar (`components/BottomNav.tsx`) | Desk, School, **+**, Focus, Steady; each tab has a hold shortcut (Search, Add homework, 5 minutes, Need help now); School shows a due badge | 4 tabs + 1 add button + 4 hidden holds |
| + quick add | 4 big options (homework, on my mind, focus, scan) + 5 small (helper, grade, flashcards, win, hours) | 9 entry points |
| Desk (`app/index.tsx`, 817 lines) | Greeting, summary line, Search and Drawer icons; then StreakOfLight, ExamSeason, FirstLight, wind-down chip, countdowns, DayBrief, WhatsNew, OneThing, NowCard, QuickCapture, PinnedNotes, then 12 day cards (Birthday, WelcomeBack, PickUp, FollowUp, AboutCards, TryThisWeek, OneKindThing, HelperNudge, PlanTest, TagTool, WorryTime, Resurface, NextBadge), All-clear; then 5 ordered sections (Due soon, On your mind + 2 buttons, How you're doing, 3 tiles: Focus / Warmth / Habits, the day line) | about 29 possible blocks above the fold and below it |
| Night Desk (`components/desk/NightDesk.tsx`) | After wind-down: a short stack; after Goodnight, only "Sleep well" | the one place the app already does what this direction asks |
| School (`app/school.tsx`) | 3 header icons (Search, Scan, Schedule), 5 chips (Week, Grades, Cards, Study tips, I was out), Add button, class filter, grouped assignments, Done | 9 ways out before the list |
| Focus (`app/focus.tsx`) | Target, length, Light the candle, Just 5 minutes, running candle, finish, break, This week stats | already one focal point |
| Steady (`app/steady.tsx`) | Need help now, Safety plan, Breathe, Let it out, Talk it through with Ember, your picked tools | calm and clear |
| Drawer (`app/drawer.tsx`, `core/tools.ts`) | Recently opened, Your most used, then 8 groups: School 8, Study 5, College 5, Feeling okay 8, Your days 6, Your body 3, Looking closer 4, You 6 | **45 tiles** |
| Ember (`components/ember/`) | Floating buddy on every screen (tap for help, hold for company, nap), `emberSay` lines, the Companion chat (AI, with its "I'm a program" header), helpers crew | everywhere |
| First run (`app/welcome.tsx`) | 5 steps: name and grade, classes, helper crew, school-night cap and sleep, five This-or-that cards; Skip on every step | 5 steps |

## 2. Diagnosis

**Where attention goes now.** At 4 PM a student opening the Desk meets a
greeting, a summary line, two header icons, a glowing two-week line, possibly
an exam banner, countdown chips, a brief, a "what's new" card, the one-thing
card, the class-now card, a capture field, pinned notes and up to twelve day
cards before "Due soon" even starts. Each card is good. Together they are a
dashboard, and a dashboard asks the student to do the sorting. The app was
built to do the sorting for them.

**Where it should go.** One thing: the next right step for this moment (the
class now, tonight's homework, the worry you set down, sleep). Ember says it,
in the student's name. Everything else is one tap away and still there.

**What overwhelms.**
- Too many doors to the same rooms: Add homework has 5 entry points, Search 4,
  Focus 4. Forty-five Drawer tiles in eight groups read as a settings page.
- Too many cards at once: day cards are each "closable for today", which
  turns the Desk into a chore of dismissing.
- Too many words: every card has a title and a body; the eye reads none.
- Three different numbers on the Desk (Warmth "N to next unlock", habit
  counts, badge "number left") pull toward collecting rather than living.

**What's emotionally missing.**
- Continuity. Ember notices things (FollowUp, Resurface, WelcomeBack) but
  those moments are scattered among other cards, so they don't land as "Ember
  remembered". The relationship needs one consistent place to speak.
- An ending to the day. Goodnight exists and is lovely, but nothing on the
  day Desk leads there, and nothing says "tomorrow I'll ask about X", which is
  the honest, healthy reason to come back.
- A peak. Finishing the night's homework, a focus session, a sealed letter:
  these happen, but the Desk doesn't change because of them. It should get
  quieter and warmer when the day is done.

**What a tired student sees first at 11 PM.** Today, the Night Desk: good,
and the model for the rest of the app. Its weakness is entry: the Night Desk
still has a "show all" escape into the whole day dashboard, and the floating
Ember plus the tab bar are as loud as at noon.

**What brings someone back tomorrow (ethically).** Not a streak, not a badge
count. Three things: tomorrow's plan was already made last night; Ember said
it would ask how the quiz went and it does; the app was lighter than their
head, so opening it felt like relief.

**Two things already over a hard line or near it** (see section 8):
Habits shows streak counts and cheers "that's how streaks get built"
(`app/habits.tsx`), and the Desk's Warmth tile says "N to next unlock". Both
are fixed in Phase 4 without losing the feature.

---

## 3. The direction: One Lit Thing

**The idea.** Every screen lights one thing: the next right step, said by
Ember in your name. Everything else stays in the room, unlit, one tap away.

**Why it connects.** A student feels known when the app has already looked
at their day and picked the one thing that matters, and feels safe when the
rest is there but quiet. The connection is Ember's single, continuous voice in
one place, remembering, not a dashboard of widgets competing for a glance.

The candle is the metaphor the app already owns: one flame lit, the others
waiting. The Night Desk already works this way. This direction takes the
night's calm into the day.

---

## 4. Information architecture

### The top level

Unchanged tab bar, because it is right and it is learned:

**Desk · School · + · Focus · Steady**

What changes is what each holds first, and the Drawer gets a front door.

- **Desk** = now. Ember's line, one lit card, three short rows, and "More on
  your desk" folded.
- **School** = the work. Tonight first, then everything due.
- **+** = put something down. Ordered by the time of day.
- **Focus** = sit down and work. Already one focal point.
- **Steady** = the other part of being a student. Help is always first.
- **The Drawer** (from the Desk header) = find anything. A search field at the
  top, then five groups by need, each showing its four most-used tiles and
  "All".

The floating Ember stays on every screen but becomes quieter (Section 6).

### Every feature's new home (nothing removed)

| Feature | Now | New home |
|---|---|---|
| Greeting and summary line | Desk header | Desk header, summary becomes Ember's line (one sentence) |
| NowCard (class now) | Desk, mid-stack | Desk lit card when a class is on |
| OneThing | Desk card | Desk lit card when set; else a row under Today |
| DayBrief | Desk card | Desk lit card in the morning/evening slot |
| FirstLight | Desk, first open each morning | Unchanged; it already is a one-thing moment |
| Birthday, WelcomeBack, FollowUp, PickUp, PlanTest, HelperNudge, WorryTime, TryThisWeek, OneKindThing, Resurface, TagTool, AboutCards | Desk, all at once | **Ember's note**: one at a time under the lit card, by priority; "Ember has 2 more" opens the rest in a sheet |
| NextBadge | Desk card | Ember's note queue, last priority, no number |
| WhatsNew | Desk card | Ember's note queue (low priority) |
| ExamSeason | Desk banner | Desk lit card during exam season |
| Wind-down chip | Desk top | Desk lit card in the hour before wind-down ("Wind-down at 10:30") |
| Due soon + tonight's load bar | Desk section | Desk "Today" row 1 (compact: "Tonight: 40 of 90 minutes"), full list in School |
| On your mind (candles) + Set something down | Desk section | Desk "Today" row 2 (the candle row stays, smaller) |
| How you're doing (rings, mood picker) | Desk section | Desk "Today" row 3 (mood picker only if no check-in today) |
| Countdowns | Desk chips | More on your desk |
| PinnedNotes | Desk | More on your desk |
| QuickCapture | Desk field | More on your desk (the + already captures) |
| Tiles: Focus today, Habits | Desk | More on your desk |
| Tile: Warmth | Desk | Settings, Ember's look (where unlocks are used) |
| StreakOfLight | Desk top | More on your desk (top of the fold) |
| Day line (`lineForToday`) | Desk bottom | Ember's line on quiet days, otherwise end of More |
| All clear | Desk card | Replaces the lit card when nothing is due (the day's peak) |
| Search | Desk icon, Desk hold, Drawer tile, School icon | Drawer's front door (the field at its top); Desk hold stays |
| Drawer, 45 tools | 8 groups | 5 groups (below), every tool kept, "All" shows the full group |
| School header: Search, Scan, Schedule | 3 icons | One "…" menu: Your schedule, Scan a screenshot, Search |
| School chips: Week, Grades, Cards, Study tips, I was out | 5 chips | Same 5 chips, below Tonight |
| Focus This week stats | Under the setup | Folded "This week" under the setup |
| Steady doors and tools | As is | As is; Need help now and Safety plan stay first |
| + sheet options | Fixed order | Same 9 options, ordered by time of day |
| Welcome: name, classes, crew, cap, This-or-that | 5 steps | 3 steps (name, classes, a school night); crew and This-or-that become Ember's notes in the first week |
| Plus | Drawer tile, Settings, helper quota, companion, AI page | Drawer "You and the app", Settings, and the helper quota only; never on the Desk |
| Need help now | Drawer, Steady, Steady hold | Same, plus pinned at the bottom of every Drawer view |

### The Drawer's five groups (45 tools, regrouped by need)

| Group | Tools |
|---|---|
| **School and study** (13) | Your day, Your week, Your schedule, Grades, Sort out what's late, I was out, Connections, Scan a screenshot, Helpers, Flashcards, How to study, Notebook, Search |
| **Feeling okay** (11) | Check-in, Mood map, Sleep, Toolkit, Worry box, Your people, Wins, Weekly review, Health, Trends, Food |
| **Your days** (6) | To-dos, Habits, Countdowns, Hours, Calendar, Kept |
| **Later and looking back** (9) | Applications, Activities list, Scholarships, Rec letters, Financial aid, Loops, The Map, Wellness wheel, The science |
| **You and the app** (6) | About you, Badges, Your year, Plus, Settings, Need help now (also pinned), and the existing "Recently opened" / "Your most used" rows above all groups |

Each group shows four tiles (your most opened first, if learning is on;
otherwise the order above) and "All 13". The Drawer's first view is a search
field, Recently opened, and the five groups: about 25 tiles visible instead of
45, everything reachable in one more tap.

---

## 5. Screen by screen

### Desk (day)

**First five seconds.** Ember's line under the greeting, then one lit card.

```
Tuesday · after school
Evening, Maya.
Chem quiz Thursday. Tonight's a light one.        <- Ember's line (Fraunces)

[ lit card ]  Finish the lab write-up             <- the one lit thing
              About 30 minutes. Due tomorrow.
              [ Light the candle ]

Ember's note  You said Tuesday's practice was a lot. How did it go?   (×)
              Ember has 2 more

Today
  Tonight      40 of 90 minutes                    >
  On your mind  ●●●  3 candles                      >
  How you're doing   (mood picker, or rings)       >

More on your desk                                  v
```

**What picks the lit card** (in order, first that applies): all clear today
(the peak), a class on now, wind-down within the hour, the One thing if set,
the most urgent thing due tonight, exam season, the morning or evening brief,
otherwise Ember's line alone and nothing else lit. One card, never two.

**What moves behind one tap.** "Ember has N more" (the note queue), "More on
your desk" (countdowns, pinned notes, capture, StreakOfLight, Focus today,
Habits, the day line). Folded state already persists in `deskFolded`.

**Emotional beat.** Relief: "it already looked". When all is done, the lit card
becomes the peak.

**Copy.**
- Ember's line, light night: "Tonight's a light one."
- Over the cap: "Tonight holds more than you planned. Want to move one thing?"
- Nothing due: "Nothing due by tomorrow. The rest of the day is yours."
- All clear (peak): "All clear. Three things done today. Go be a person."
- Note queue link: "Ember has 2 more" / "That's everything."
- Fold: "More on your desk"

### Desk (night)

Keep the Night Desk as is. Two changes: the "show all" becomes "Open the day
desk" in small text (not a button), and the tab bar dims to 60 percent after
wind-down so the screen's light is the candle, not the chrome. The night's end
is Goodnight; its last line now says what Ember will ask tomorrow (Section 6).

**Copy.** "Put the day down" (the lit card, after wind-down). After Goodnight:
"Sleep well. Tomorrow's plan is ready."

### School

**First.** Tonight: the load bar against your cap and the next thing due.

**Behind one tap.** The header's three icons fold into one "…" (Your schedule,
Scan a screenshot, Search). The five chips stay, under Tonight.

**Emotional beat.** Control: "I know what tonight holds".

**Copy.** Subtitle: "Tonight: 40 of 90 minutes" or "Nothing due tonight". Over
the cap: "More than you planned for tonight. Sort it out" (link to Triage).
Empty: "Nothing here yet. Scan a screenshot of your classes, or add one."
Replace "Nothing due. Nice." with "Nothing due."

### Focus

**First.** "Light the candle", with the next thing due already chosen as the
target (still changeable). "Can't start? Just 5 minutes" stays right under it.

**Behind one tap.** "This week" stats fold closed by default.

**Emotional beat.** The finish is the peak: the candle burns down, Ember says
one specific line about what you did, and the Desk's lit card has changed when
you go back. Reduce Motion gets a still candle and the same words.

**Copy.** "Working on: Lab write-up. Change". Finish: "Twenty-five minutes on
the lab write-up. That counts." Then "Mark it done" or "Another round".

### Steady

Already right. Keep help first. One addition: when a check-in today said
stress was high, the matching tool moves to first among your tools (the
TagTool logic, used here instead of on the Desk).

**Copy.** Keep "For when it's a lot, right now." and "Need help now?".

### The Drawer

**First.** A search field: "Find anything". Under it Recently opened, then the
five groups, four tiles each. "Need help now" pinned at the bottom.

**Behind one tap.** "All 13" per group. Settings stays the header icon.

**Emotional beat.** "Nothing is lost." The student trusts the Desk to be short
because they know the Drawer has it all.

**Copy.** Title "The Drawer", subtitle "Everything else, one search away."

### + quick add

Same nine options. Order follows the moment: after school, "Homework or a
test" first; after wind-down, "Something on my mind" first and Focus last;
Sunday, "A win" moves up. The sheet title: "Put something down".

### First run

Three steps instead of five, still all skippable:
1. "Hi. I'm Ember, a small program that keeps your school days from piling
   up. What should I call you?" (name, grade)
2. "Let's get your classes in, so I always know what's next." (scan or type)
3. "How much should a school night hold?" (cap, sleep goal)

Then the Desk opens with one lit card ready: the next class or "Add your first
homework". The crew and This-or-that come later as Ember's notes (Section 7).

---

## 6. Ember's role

Ember is the voice of the lit thing. One place on the Desk (Ember's line and
Ember's note) where it speaks, so the relationship has a home.

- **Continuity.** At Goodnight, Ember names tomorrow's question: "Tomorrow
  I'll ask how the chem quiz went." Next day, FollowUp is the first Ember's
  note. Only from things the student chose to tell Ember, and only if memory
  is on.
- **Noticing small things.** Resurface, a finished assignment, the first focus
  session, a birthday. Said once, specifically: "You finished everything due
  this week. That's the first time this month."
- **Honest that it's a program.** The first-run line says "a small program".
  The companion header keeps its disclosure. Ember's lines never say "I missed
  you", "I'm proud of you" or "I felt"; they say "I noticed", "I kept track",
  "here's what's next".
- **Points outward.** OneKindThing and Your people stay in the note queue;
  when a check-in is low, Ember's note offers a person first: "Want to text
  someone from your people?"
- **Quieter floating Ember.** On every screen still, but it speaks at most
  once per screen visit, and stays silent on the Desk (where its line already
  is), Steady's help cards, and after Goodnight.

## 7. How it's sold

The product is the calm. Selling it means showing the calm in two seconds.

**The positioning line.** "School, kept from piling up." Supporting line: "A
quiet planner with a small flame that notices."

**First run story.** Ember appears, asks your name, gets your classes in, asks
how much a night should hold. Under a minute, three questions, and the app
already knows what's next.

**The first 60 seconds.** 0 to 10: Ember's hello and your name. 10 to 40:
scan a screenshot of your schedule (the moment of magic: classes appear).
40 to 50: the school-night cap. 50 to 60: the Desk with one lit card, your
next class, in your name. The student has done three things and the app is
already useful.

**The first week (one Ember's note a day, skippable, no notifications).**
- Day 1: "Add one thing due this week and I'll keep track of it."
- Day 2: "I brought friends. Each one helps with a different part of
  studying." (the crew, from step 3 of today's welcome)
- Day 3: "Five quick this-or-thats, so I can get to know you." (This-or-that)
- Day 4: the worry box, when there are open worries, or "If something's on
  your mind, you can set it down here."
- Day 5: Goodnight, introduced at wind-down: "Want to put the day down?"
- Day 7: the weekly review, Sunday: "Five minutes on the week, if you want."
If a day is missed, the next note just waits; nothing says it was missed.

**App Store story (5 frames).**
1. "Know what's next." The Desk with one lit card, the next class.
2. "Tonight, at a glance." School's Tonight bar: 40 of 90 minutes.
3. "One candle. One thing." Focus, mid-session.
4. "Set it down." On your mind candles and the worry box.
5. "A small flame that notices. And says it's a program." Ember's note
   following up on a quiz, with the AI disclosure visible, and "Need help now"
   in frame.

All screenshots use show mode (Riley), never a real student's data.

## 8. Ethical check

| Hard line (muse.md) | How One Lit Thing respects it |
|---|---|
| No streak pressure, loss framing, guilt, urgency, punishment | One lit card is chosen by what helps now, never by what lapsed. Phase 4 changes Habits from streak counts to "kept 9 of the last 14 days" and drops "that's how streaks get built". WelcomeBack keeps its no-guilt copy. Missed first-week notes wait silently. |
| No infinite feeds, slot mechanics, time-in-app goals | The Desk gets shorter. Ember's notes are a finite queue that ends with "That's everything." Success is All clear, which tells the student to leave. Warmth "N to next unlock" leaves the Desk. |
| Ember never needy, never claims feelings, never discourages people | First-run line says "a small program"; banned phrases listed in Section 6; Your people and OneKindThing stay in the queue; low check-ins offer a person first. |
| No notification spam; easy to leave, turn off, delete | The direction adds no notifications. The first week lives inside the app. Folds and hides keep using Settings (`deskHidden`, `deskOrder`). |
| Plus is honest, never gates help | Plus leaves the Desk and appears only where AI quota is used, in Settings and in the Drawer. Help, Safety plan, Steady and every wellness tool stay free and first. |
| AI disclosures, consent and help lines visible | Companion disclosure, `ai-consent`, How AI works here untouched. Need help now is pinned in the Drawer and stays first in Steady and on the Steady hold. |

---

## 9. Phased build plan

Each phase is one PR, moves features rather than removing them, keeps old
settings working, and is reversible by reverting one PR. Each adds its live
check to `docs/LIVE-CHECKS.md` through `tools/hub/live-checks.mjs` and passes
`node tools/hub/check.mjs --agent muse`.

### Phase 1. Ember's note: one day card at a time

*Highest impact, lowest risk: no new screens, no moved routes.*
- **Files.** `components/desk/DayCards.tsx` (export a pure `when…()` check next
  to each card, reusing its existing condition), new `core/deskNotes.ts`
  (priority list and pick), `app/index.tsx` (render only the first eligible
  card plus "Ember has N more", which opens the rest in a sheet).
- **Moves.** 12 day cards + AboutCards + WhatsNew + NextBadge from "all at
  once" to a queue. Close-for-today behaviour unchanged.
- **Risk.** Low. Duplicated eligibility logic could disagree with a card's own
  render; mitigated by each card calling its own `when…()`.
- **Live check.** Open the Desk on a day with several cards (show mode, Riley):
  one card under the summary, "Ember has N more" under it. Tap it: the others
  in a sheet. Close the shown card: the next one takes its place. Reduce Motion
  on: same, no slide.

### Phase 2. The lit card, Today rows and "More on your desk"

- **Files.** `app/index.tsx`, new `components/desk/LitCard.tsx` (wraps NowCard,
  OneThing, DayBrief, ExamSeason, wind-down, All clear by priority),
  `core/lifeStore.ts` (optional `deskLayout?: 'lit' | 'classic'`, default
  `'lit'` for everyone; Settings switch to go back).
- **Moves.** Countdowns, PinnedNotes, QuickCapture, StreakOfLight, tiles, day
  line into a "More on your desk" fold; Due / On your mind / How you're doing
  become three compact Today rows.
- **Risk.** Medium-low: the largest change to the Desk; reversible by the
  Settings switch and the PR.
- **Live check.** At 4 PM with homework due tomorrow: one lit card with
  "Light the candle"; Today shows "Tonight 40 of 90 minutes". Finish all due
  work: the lit card becomes All clear. Settings → Desk → Classic layout
  brings the old Desk back.

### Phase 3. The Drawer's front door

- **Files.** `core/tools.ts` (5 groups, same 45 tools), `app/drawer.tsx`
  (search field at the top, four per group with "All N", Need help now
  pinned), `app/search.tsx` (accept an initial query).
- **Moves.** Search becomes the Drawer's first element; the Drawer tile for
  Search stays inside "School and study".
- **Risk.** Low. Add a test that `TOOLS.length` is still 45 and every path is
  still present.
- **Live check.** Open the Drawer: a "Find anything" field, Recently opened,
  five groups with four tiles each. Type "fafsa": Financial aid. Tap "All 13"
  under School and study: all 13. Scroll to the bottom: Need help now.

### Phase 4. Ethical tidy: streaks and unlock numbers

- **Files.** `app/habits.tsx` (show "kept 9 of the last 14 days", drop the
  streak line and cheer), `app/index.tsx` (Warmth tile out), `app/settings.tsx`
  (Warmth shown with Ember's look), `components/desk/DayCards.tsx` (NextBadge
  without "N left").
- **Moves.** Warmth to Settings; streak numbers to a gentle count.
- **Risk.** Low. Store data is unchanged; only display.
- **Live check.** Habits: no flame-and-number streak, a quiet "kept 9 of the
  last 14 days". Miss a day: nothing turns red or resets. Desk has no Warmth
  tile; Settings → Ember shows warmth next to the looks it unlocks.

### Phase 5. School and Focus, one focal point each

- **Files.** `app/school.tsx` (Tonight first, header icons into one "…"
  menu), `app/focus.tsx` (preselect the next thing due, fold This week).
- **Risk.** Low.
- **Live check.** School: the first thing is "Tonight: 40 of 90 minutes" and the
  next due; "…" opens Schedule, Scan, Search. Focus: the target already reads
  "Lab write-up"; This week is folded and opens on tap.

### Phase 6. The + sheet follows the moment

- **Files.** `components/BottomNav.tsx` (order `ADD_OPTIONS` and
  `MORE_OPTIONS` by `nightNow()` and weekday; title "Put something down").
- **Risk.** Low; same nine options.
- **Live check.** With `brainnavigator://?night=23:30`, tap +: "Something on my
  mind" first, Focus last. At 4 PM: "Homework or a test" first.

### Phase 7. First run in three steps, first week through Ember's notes

- **Files.** `app/welcome.tsx` (3 steps; first line says "a small program"),
  `core/deskNotes.ts` (first-week notes, using Phase 1's queue),
  `core/lifeStore.ts` (optional `firstWeek?: { started: string; done: string[] }`).
- **Moves.** Helper crew and This-or-that from welcome to Day 2 and Day 3 notes.
- **Risk.** Medium-low: onboarding. Existing students (welcome done) see no
  first-week notes.
- **Live check.** Reset the welcome in Settings: three steps, Skip works on
  each, the Desk opens with one lit card. Next day (or pretend clock): Ember's
  note introduces the crew. Skip it: it doesn't come back.

### Phase 8. Ember's continuity at the day's end

- **Files.** `app/goodnight.tsx` (last line names tomorrow's FollowUp, when
  there is one), `components/desk/NightDesk.tsx` ("Open the day desk" as small
  text), `components/BottomNav.tsx` (dim after wind-down),
  `components/ember/EmberBuddy.tsx` (once per screen, silent on Desk and after
  Goodnight).
- **Risk.** Low-medium: touches the global Ember; each change is small.
- **Live check.** Tell Ember about a quiz Thursday in the companion. Goodnight
  on Wednesday: "Tomorrow I'll ask how the quiz went." Thursday morning: that's
  Ember's note. With memory off in About you: no such line.

---

## 10. Open questions for Peter

- Keep the name "Desk" for the first tab? This plan keeps it (learned, warm).
- Is a Settings switch back to the classic Desk wanted long term, or only for
  the first release after Phase 2?
- "Later and looking back" groups College with reflection tools; if college
  matters more for a senior, College could be its own fifth group and "You
  and the app" fold into Settings.
