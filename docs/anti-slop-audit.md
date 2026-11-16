# Anti-slop audit

Written 2026-11-16 against `main` at `d0b2bb23e277c1036d7587de7f4edcb281960f52`.

This pass is a scorecard and a brief. It does not change screens, copy, stores, or behavior. Cloud cannot run the iOS app, so nothing here is marked checked live, and no new screenshot was taken. The five pictures in `docs/screens/` are existing show-mode stills (Riley, clock 9:41). They show one frame each. Motion, VoiceOver, and the largest text size are described from the code.

Peter Project OS scorecard, color check, and reuse gate were run from the skill unpacked outside the repo. No package was added. `scripts/reference_probe.py` does not apply: there is no reference video.

## Inferred brief

Brain Navigator is a calm iPhone app for one high school student. The job is to keep school, and the life around it, from piling up. Ember is a small flame and a computer program, not a coach and not a person. The room is candlelight (`core/theme.ts`): gold (`flame`) is the action color, Fraunces carries headings and Ember’s voice, Figtree carries body and numbers, and the words stay sentence-case, quiet, and free of guilt.

The audit’s job is to say, with evidence, where that identity is already doing the work and where the app still reads as a generic dark wellness product. The follow-up work is four small PRs. They keep the five rooms, the local data, Undo, show mode, and the single-user anon model. They do not add accounts, `auth.users`, per-user RLS, streaks, a new icon library, a new visual treatment, telemetry, or a paid service.

**Reference intent:** principles. No outside picture was supplied to copy.

**Visual treatment:** none added. The room gradients in `core/theme.ts` and the drawn candle in `components/ui/Candle.tsx` already do the atmosphere work. Felt, grain, glass fluting, halftone, and the rest of the treatment list would sit on top of a system that already has a material. Liquid Glass stays where it is (the tab bar, the sheet, round buttons over the page) and does not spread onto cards.

**What a later PR may treat as done:** a student opening the Desk can see the next right step, one gold action, and Ember, and the other tabs do not each invent a second gold. Captions on a tinted card stay readable. The words never call a habit a streak. The round-7 boxes that are still open stay open until a Mac walk.

## Coverage

| Area | What was read | Status |
| --- | --- | --- |
| Purpose and house rules | `docs/WHAT-THIS-IS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/design/DIRECTION.md` (diagnosis only; the Desk has moved on since that note) | Inspected |
| Theme, type, motion | `core/theme.ts`, `core/motion.ts` | Inspected |
| Kit | `components/ui/Button.tsx`, `Card.tsx`, `Chip.tsx`, `EmptyState.tsx`, `Screen.tsx`, `Section.tsx`, `Icon.tsx`, `Glass.tsx`, `Field.tsx`, `IconButton.tsx` | Inspected |
| Chrome | `components/BottomNav.tsx`, `components/Drawer.tsx`, `core/tools.ts` | Inspected |
| Tabs and primary rooms | `app/index.tsx`, `app/school.tsx`, `app/helpers.tsx`, `app/steady.tsx`, `app/focus.tsx` (header and subtitle), `app/welcome.tsx`, `core/helpers.ts` | Inspected |
| Hero stills | `docs/screens/1-desk.jpg` through `5-steady.jpg` | Inspected as stills |
| Copy slips | Searched app, components, `core/ember.ts`, `supabase/functions/ember/index.ts` for streak language, “Let’s”, unlock wording, empty-state formulas | Sampled by search, hits read |
| Other screens | Routes exist for ~70 screens. Grades, habits, trends, flashcards, notes, today, quiz, settings, plus, and the night clock were sampled where a finding pointed there | Sampled |
| Tests and release Notion | `tests/` file list, `tests/build.test.ts`, `tests/core.test.ts` (Sunday mention), `core/notion.ts`, `core/night.ts` | Sampled |
| Live iPhone or Simulator | Not available in this session | Unavailable |
| Palette pairs | `palette_probe.py` on flat tokens, then a separate composite for the card wash | Run, see below |
| Reuse | `reuse_gate.py` on a no-addition record | Run |
| Expo SDK 57 docs | Not required to judge layout from code and stills | Not applicable |

## Before scores

Ratings are editorial judgments from the code and the stills, not a user study and not a device pass. Weights are the scorecard’s. Score = weight × rating / 5.

| Dimension | Weight | Rating | Score | Why this number |
| --- | ---: | ---: | ---: | --- |
| Purpose and task fit | 20 | 4 | 16 | The Desk, School, Focus, and Steady each have a job a student can say out loud. The Drawer and Helpers still add a second product on top. |
| Function and correctness | 20 | 3 | 12 | Round 7 records a lot of paths as seen on a Simulator or phone. This session did not repeat them. A few words contradict the no-streak rule, and several `[~]` checks are still open. |
| Hierarchy and organization | 15 | 3 | 9 | The lit Desk and Focus have a clear first action. School, Helpers, and the Drawer put several loud things on one screen, and the center + is the loudest object on every tab. |
| Specificity and distinctiveness | 15 | 4 | 12 | Ember, the candle, Fraunces italic, and the room are a real identity. The line icons, Liquid Glass bar, rainbow Drawer tiles, and a handful of stock sentences are the generic layer. |
| Ease and interaction | 10 | 4 | 8 | Welcome can be skipped, deletes offer Undo, empty states usually say what to do next, and the lit Desk is short. The Drawer is still 45 doors. |
| Craft and consistency | 10 | 3 | 6 | Theme, motion, and the kit are deliberate. Gold is spent everywhere, faint type fails on the top of a tinted card, and the voice slips into streak and unlock language. |
| Accessibility and resilience | 10 | 3 | 6 | `textGrow`, Reduce Motion, IconButton labels, and Increase Contrast are real. The largest-text pass and the VoiceOver pass in round 7 are still `[~]`. |
| **Total** | **100** |  | **69** | **50–69: structural improvement.** The five rooms stay. The structure to improve is attention: one loud action, and a Drawer that is a list rather than a candy catalog. |

A 69 is not a verdict that the app is a template. Desk, Focus, and Steady, as drawn, would score higher alone. The number comes down where those rooms share a chrome and a catalog that fight them.

### Purpose and task fit — 4

`docs/WHAT-THIS-IS.md` states the audience and the job in the first lines: one high school student, school and the life around it, no streaks, no guilt, no scoreboard. The lit Desk matches that. `docs/screens/1-desk.jpg` shows “Monday afternoon”, “Hey, Riley”, the next class, one card (“Finish the lab write-up” with **Light the candle**), one nudge, and three Today rows. `app/index.tsx` keeps that stack when `settings.deskLayout` is not `'classic'`, and folds the rest under “More on your desk”.

School (`app/school.tsx`, `docs/screens/2-school.jpg`) is tonight’s load, the next block, and the week. Focus (`app/focus.tsx`, `docs/screens/3-focus.jpg`) is one candle and a timer: “One thing. One candle.” Steady (`app/steady.tsx`, `docs/screens/5-steady.jpg`) leads with “Need help now?” Helpers (`app/helpers.tsx`) is a crew, which is part of the product, and its subtitle leads with the AI mode.

The fit drops from 5 because `core/tools.ts` still lists 45 tools in five groups, each with its own color, and `docs/design/DIRECTION.md` already named that catalog as the thing that asks the student to do the sorting. The tools were moved off the tabs on purpose. They are still a second app behind the Drawer.

### Function and correctness — 3

This session did not tap through the app. Round 7 says many items were seen on a Simulator or on Peter’s iPhone, and `tests/` has 16 node files (dates, night clock, school, age, safety, scan, storage, release Notion). That is evidence the project has been checking itself. It is not a fresh pass.

What the code itself gets wrong, as a contract:

- Habits are a count. `app/habits.tsx` says a missed day never resets anything. `core/ember.ts` still tells Ember, on `/habits`: “the streak counts itself.” The same file’s tip copy says “That’s a streak kept.” The model guide in `supabase/functions/ember/index.ts` says “Habits track small things with streaks.”
- `components/helpers/QuizGame.tsx` shows a flame counter and a numeric score, and adds `streak * 2` to the score. That is a scoreboard inside an app whose own description forbids one.
- Settings (`app/settings.tsx`) talks about the next Ember color as an unlock, and `emberSay` says a color “unlocks at” a warmth number. Warmth can stay. The loot-box word should not.

Open round-7 items that keep this at 3 are listed under the reliability PR. They were not re-tested here.

### Hierarchy and organization — 3

`components/ui/Screen.tsx` gives every page the same header: an optional Fraunces italic kicker in `colors.flame` (16px), a 34px Fraunces title, a Figtree muted subtitle. That header is clear, and the kicker is a good use of gold (one line, the voice).

Under it, most pages are a column of `Card`s (`components/ui/Card.tsx`: radius 22, `colors.surface`, a hairline that is lighter on the top edge). The lit Desk and Focus break that column with a real object (the one-thing card, the candle). School, Steady, Loops (`docs/screens/4-mind.jpg`, route `/open-loops`), and the Drawer do not.

`components/BottomNav.tsx` floats a Liquid Glass pill (Desk, School, a gold + , Helpers, Steady) over every tab. The + uses `gradients.flame` and a 28px plus. On the Desk still, it is brighter than **Light the candle**. On School it is brighter than “Sort it out”, “Add homework or a test”, and “Not sure? Let Ember pick what’s first” (`components/school/EmberPick.tsx`), which are also gold. On Steady it competes with the help card. One control can be the loud one. Four gold controls plus a gold + means none of them is.

The Drawer (`components/Drawer.tsx`) paints each tool’s icon in `t.color` from `core/tools.ts`. Those hexes are a scatter: sky blue, sage, pink, tan, lavender, gold, often two tools in the same group sharing a color by accident and the next tool inventing another. The group names are sensible (“School and study”, “Feeling okay”, “Your days”, “Later and looking back”, “You and the app”). The color does not carry a meaning.

### Specificity and distinctiveness — 4

What is already specific, and should stay:

- The palette comment and the tokens in `core/theme.ts`. Night `#120F14`, parchment `#F5EBDD`, one flame `#F5B45C`, ink on the flame `#2A1606`, and three state colors that mean something: ember `#F0845A` for still open, sage `#8CC0A8` for resolved, dusk lavender `#AFA2DE` for let go.
- Fraunces and Figtree, including Ember’s italic (`fonts.displaySoft`). `components/ui/Section.tsx` refuses an uppercase eyebrow. A search found no `textTransform: 'uppercase'`.
- Ember, drawn, with gear for empty states (`components/ui/EmptyState.tsx`). Study empty states that sound like this app: “The plate’s empty.” (`app/tasks.tsx`), “The sky’s still empty.” (`app/topography.tsx`), “The box is empty.” (`app/worry.tsx`), “A blank notebook.” (`app/notes.tsx`).
- Focus: a wax candle, a small Ember with glasses and a book, “Just focusing”, “Stray thought? Park it here” (`docs/screens/3-focus.jpg`).
- Motion in `core/motion.ts` is one set of springs, taps settle without bounce, and Reduce Motion is respected. That is not a generic bounce-on-everything.
- Welcome (`app/welcome.tsx`) introduces Ember as “a small program”, offers a scan that stays on the phone, and can be skipped. The three-step dots are ordinary. The words mostly are not.

What still reads as a generated dark-mode app:

- **Icons.** `components/ui/Icon.tsx` is a custom set, which is good, and it is drawn as 24px rounded strokes, the same family as every Lucide-style kit. Search, book, people, plus, and the grid on the Desk stills are those strokes. The candle glyph is the exception. A full redraw is not justified in the next PR. The generic read is real, and it is carried more by the rainbow tiles around the icons than by the paths.
- **Liquid Glass.** `components/ui/Glass.tsx` uses iOS 26 `GlassView` on the tab bar, the sheet, and some icon buttons, with a night tint and a solid fallback. Platform chrome is a fair reason to keep it. It is also the most “current template” object in the app. Do not put glass behind cards or type.
- **A second palette, in hex, outside the theme.** Helper colors in `core/helpers.ts` (`#B79AF0`, `#7CC4F2`, `#F58FA8`, `#93D37A`, `#F9AE4E`). Drawer colors in `core/tools.ts`. Day-card colors in `components/desk/DayCards.tsx` (`#8FB4E8`, `#7CC4F2`, `#F08A8A`, `#B79AF0`, …). The wellness wheel’s `dimensionColor` in `core/theme.ts` is different: eight series that have to stay distinguishable. Those stay. The one-off hexes that repeat sky blue and pink do not need to be new hues.
- **Stock sentences.** “Let’s get your classes in, so I always know what’s next.” (`app/welcome.tsx`). “No decks yet.” (`app/flashcards.tsx`). “No habits yet.” (`app/habits.tsx`). “No check-ins yet.” and “No lines to draw yet.” (`app/trends.tsx`). “Welcome to Plus. Thank you — really.” (`app/plus.tsx`). Helper roles “Quiz master” and “Hype” (`core/helpers.ts`). Deck subtitle “mastered” (`app/deck/[id].tsx`).
- **Empty states that skip the kit.** `app/today.tsx` uses a plain line, “Nothing scheduled yet today.”, instead of `EmptyState`.

### Ease and interaction — 4

The first run can be skipped (`app/welcome.tsx`, Skip in the header). Show mode is offered before the questions. The lit Desk is one screen with a folded “more”. Steady puts real people first. Empty states that use the kit include a next step (add a class, make a deck, sort what’s late).

Friction that is still in the structure: School’s header, week strip, sort link, Ember pick, and add button are five ways to act before the list (`app/school.tsx`). The + sheet is a sixth way to add, and holding the School tab is a seventh (`components/BottomNav.tsx` hold shortcuts). `docs/design/DIRECTION.md` counted those doors; the lit Desk got quieter after that note, and School did not get the same edit. This audit does not propose deleting a path. It proposes making one of them gold and the others quiet, so the extra doors are still there and no longer shout.

### Craft and consistency — 3

The kit is consistent: `Pressy`, `Card`, `Button`, `Screen`, sentence case, one motion file. The craft problem is emphasis and a few sentences that break the voice.

`components/ui/Button.tsx` paints ghost labels in `colors.flame`. `components/ui/Section.tsx` paints every section action in `colors.flame`. `components/ui/Chip.tsx` defaults the selected color to flame. `ProgressBar` and `Ring` default to flame. So “gold is the only action color” has been implemented as “gold is every action.” Secondary buttons already exist (`variant="secondary"`, parchment label on a raised surface). They are the quiet role. Ghost should join them, and a screen should opt into one gold control.

`components/desk/StreakOfLight.tsx` is a 2px line of the last 14 days inside “More on your desk”, with no number on screen. That part is quiet. If today is unlit and Reduce Motion is off, the today segment pulses forever (`withRepeat`, 1600 ms each way). A permanent pulse on the Desk is a nag, even at 2px.

Kickers stay gold. They are one italic line in Ember’s voice (“Monday afternoon”, “Take a breath.”, “Ember’s crew”). That is the accent used once per header, which is what the attention budget asks for.

### Accessibility and resilience — 3

In the code, on purpose:

- `textGrow` in `core/theme.ts` caps display, headings, and controls so words are less likely to break. Helpers and Today rows stack when `fontScale > 1.5`.
- `core/motion.ts` documents that Reanimated drops movement under Reduce Motion. Welcome and chips check `useReducedMotion`.
- `IconButton` requires a `label`. `Field` sets `accessibilityLabel` to the label or the placeholder so VoiceOver still has a name after the field is filled (`components/ui/Field.tsx`).
- Increase Contrast rewrites `textMuted`, `textFaint`, `hint`, and the hairlines from `contrast.txt` (`core/theme.ts`).

Still open, from round 7, and visible in the code:

- Item 6: a full pass at the largest text size was never finished. `numberOfLines={1}` without `maxFontSizeMultiplier` or `adjustsFontSizeToFit` is the pattern that clips. Examples: `components/ui/Ring.tsx` (the value), `components/ui/Segmented.tsx`, `app/search.tsx`, `app/grades.tsx`, `app/flashcards.tsx`, `app/notes.tsx`, `app/classes.tsx`, `components/school/NowCard.tsx`, `app/settings.tsx` (swatch labels). School’s week letters and the tab labels already shrink to fit.
- Item 20.3 (X122): VoiceOver labels were audited in code and are still `[~]` until someone listens on the phone.
- Flat contrast is mostly fine. Faint type on the top of a tinted card is not. See the color check.

## Attention and color

Separate from the 69. “Two quiet, one loud” is already the theme’s idea. The loud role is `flame`. The quiet roles are `night`, `surface`, and the parchment text colors.

| Check | Result | Evidence |
| --- | --- | --- |
| Focal alignment | Fail on School and on every tab; pass on Focus; partial on the Desk and Steady | The gold + in `BottomNav` is the brightest object in all five stills. Focus’s candle and time still win. The Desk’s **Light the candle** is the right action and loses to the +. Steady’s help card is first in the list and loses to the +. |
| Role consistency | Partial | Tokens exist and mean something. Ghost, section actions, chips, bars, and raw hexes also spend `flame`, or invent a hue the theme does not name. |
| Restraint | Fail | School’s still shows gold on the load number, “Sort it out”, the Ember-pick line, “Add homework or a test”, and the +. |
| Legibility | Partial | Flat pairs below. Faint text fails on the top stop of a tinted card wash. Glass, candle artwork, and gradients over the room were not measured as composites. |
| Non-color cues | Partial | Selected chips change fill, border, and weight (`Chip.tsx`). Week dots are color for the class, and the day’s button label includes the count (`app/school.tsx`). Mood faces have words (`MoodPicker.tsx`). The streak flame in QuizGame is a counter with a number beside it. |
| Cross-context | Partial | There is no light theme; the app is the night room. Large text and VoiceOver are the open device checks. Increase Contrast has its own tokens and they pass the flat pairs. |

### Palette probe

`palette_probe.py` (WCAG 2.x math, flat hex only) on the tokens in `core/theme.ts` plus the helper hexes and the room-gradient ends. **33 pass, 1 fail.** The failure is a guard pair, not a button that ships: parchment `text` `#F5EBDD` on `flame` `#F5B45C` is **1.54:1**. Primary buttons and the show-mode banner put `flameInk` `#2A1606` on the gold, which passes at **9.51:1** on `flame`, **13.19:1** on `flameHot`, and **6.05:1** on `flameDeep`.

Flat pairs that matter, all passing:

| Pair | Ratio | Use |
| --- | ---: | --- |
| `text` on `night` | 16.13 | Titles and body on the room |
| `text` on `surface` | 14.37 | Card titles |
| `textMuted` `#C3B3A0` on `night` | 9.31 | Subtitles |
| `textMuted` on `surface` | 8.29 | Card secondary lines |
| `textFaint` `#998C7D` on `surface` | 5.17 | Captions. The theme comment says 5.2:1. |
| `textFaint` on `surfaceHigh` | 4.66 | The theme comment says 4.7:1 on a raised card. |
| `textFaint` on `night` | 5.80 | Captions on the room |
| `hint` `#8E8173` on `surfaceSunk` | 4.87 | Field placeholder. The comment says 4.55:1; the measured pair is a bit stronger. |
| `flame` on `night` | 10.47 | Kickers, ghost labels, gold icons |
| `flame` on `surface` | 9.33 | Section actions, selected chip text |
| `flame` on `surfaceHigh` | 8.42 | Field “Done” on the number-pad bar |
| State colors `unlocked`, `secured`, `shelved`, `danger` on `surface` or `night` | 5.80–8.25 | Numbers and status |
| Helper role colors on `surface` | 7.18–9.55 | 12px role under the helper’s name |
| Increase Contrast `mutedStrong`, `faintStrong`, `hintStrong` on their surfaces | 7.40–13.65 | The stronger set |

The script cannot see alpha. `Card` lays a vertical wash from `alpha(tint, 0.11)` at the top to `alpha(tint, 0.02)` at the bottom, and the top goes to `0.16` while pressed. Compositing `textFaint` over that top stop:

| Wash over `surface` | Faint text ratio |
| --- | ---: |
| Flame at 0.11 (top of a tinted card) | **4.13 fail** |
| Unlocked, shelved, or sky at 0.11 | **4.22–4.32 fail** |
| Flame at 0.06 | 4.61 pass |
| Flame at 0.02 (bottom of the card) | 4.99 pass |
| A helper’s own color at 0.07 (the crew card) | 4.59 pass for faint text; the role colors themselves stay above 6.3 |

So the captions that use `colors.textFaint` are legal on a flat card and illegal near the top of a tinted one. Body text and `textMuted` still pass on that wash (about 6.6:1 and 11.5:1). Selected chip text, flame on a 0.16 flame wash over surface (`#43332E`), is 6.60:1.

This does not certify the app. Glass, the candle illustration, small 12px type, and color-vision differences need a device.

## Reuse gate

Record passed to `reuse_gate.py`: schema version 1, `existing_sufficient: true`, stage `proposal`. The need is an audit. The repo already has the theme, the kit, node tests, and `node tools/hub/check.mjs`.

Result: **NO_ADDITION.** “Existing capability meets the need.” The script judges the record only. It did not install anything, and this PR adds no dependency.

## What reads as generic, by surface

**Visuals.** A night background, a 22px card, a hairline, a 24px line icon, and a glass tab bar with a center gold button is a common 2025–2026 kit. Brain Navigator fills that kit with a real candle and a real voice, and then spends the gold on every link, so the kit shows through. The Drawer is the place it shows through most: 45 tinted icon chips (`components/Drawer.tsx` around the `t.color` rows).

**Copy.** Most lines are specific and calm. The generic ones are the streak sentences, the unlock sentence, “Let’s get your classes in”, “No … yet.”, “mastered”, “Quiz master”, “Hype”, and the Plus thank-you. The Science note on Habits (`app/habits.tsx`) ends with “don’t let one slip talk you into quitting the streak”, which is both the forbidden word and a small lecture.

**Layout.** Header, cards, chevron, repeat. Focus is the layout that does not do this. The lit Desk mostly does not. School, Steady, Loops, and the tool pages do. Steady’s stack is the right order (help, a person, a plan, a breath, a vent). Its problem is sameness of weight, not the wrong content.

**Motion.** The shared springs are a strength. The generic bits are Welcome’s `FadeInDown` and the Desk’s endless 2px pulse. Neither needs a new motion system. The pulse should stop. Welcome’s fade can stay; it already bails out under Reduce Motion.

**Empty states.** The component is Ember plus an italic line plus a next step. Call sites sometimes fall back to “No X yet.” or skip the component.

**Icons.** Custom, and visually the same idea as a stock rounded set. Leave the paths. Quiet the colors behind them.

**Onboarding.** Three steps, dots, Skip, Ember at 120px. The “Let’s” line is the part that sounds generated. The scan-or-type choice is specific and should stay word for word aside from that one sentence.

## Improved brief

Four PRs, in this order, so later ones rebase on the shared components. Each PR runs `node tools/hub/check.mjs --agent <name>` and does not mark a round-7 box `[x]`. No new package. Gold stays the only action color, by being used once per screen instead of being replaced with a second brand color.

### 1. Visual system

Shared components and tokens. No new hue for decoration. No icon redraw. No glass on cards. No treatment from the recipe list.

- `core/theme.ts` — Keep the candlelight tokens. Name the repeated sky blue `#8FB4E8` (it is already `skyGlow`’s night return, and it is pasted through Desk and Drawer). Leave `dimensionColor` as the eight-series wheel. Do not lighten `textFaint` to chase the wash; it is already tuned for the flat surfaces.
- `components/ui/Card.tsx` — Drop the tint wash’s top stop from `0.11` (pressed `0.16`) to a stop that keeps `textFaint` at 4.5:1 or better. A flame wash at `0.06` measured 4.61:1. Re-measure the pressed state the same way. The top hairline (`borderTopColor`) can keep the “lid under a lamp” read.
- `components/ui/Button.tsx` — Ghost label color becomes `colors.text` (the quiet role). Primary stays the flame gradient with `flameInk`. A screen that has no other gold control may still pass `tint` or keep one primary. `app/school.tsx` passes `tint={colors.flame}` on the add button; that line is the per-tab PR, so this PR does not have to edit School.
- `components/ui/Section.tsx` — The trailing action (“All”, “Add”) uses `colors.text`, with an optional color for the one screen that truly has no other gold.
- `components/BottomNav.tsx` — On `/steady`, draw the center + quieter (a surface fill and a `flame` glyph, or `flameDeep` with `flameInk`) so the help card is the loud object. The button still adds. Other tabs keep the gradient until the per-tab PR decides they have their own gold control.
- `core/tools.ts` — Color fields only. Map each tool onto `colors.flame`, `colors.unlocked`, `colors.secured`, `colors.shelved`, or the named sky token. One meaning per color (school work, still open, resolved, let go, time), not a new hex per row. Titles and bodies stay for the copy PR if they need a word change; most of them are already plain.
- `core/helpers.ts` — Color fields only, moved onto theme tokens the characters already sit near (lavender, sky, a single pink that matches `dimensionColor.social` or stays one named token, sage, flame). The five cousins stay five shapes. Role strings stay for the copy PR.
- Hex in `components/desk/DayCards.tsx`, `components/desk/CountdownChips.tsx`, `components/about/ThisOrThatDeck.tsx`, `components/desk/AboutCards.tsx`, and `components/ui/MoodPicker.tsx` — point them at tokens. The mood scale is already a walk from ember through gold to sage; name those five stops in the theme instead of local hex.
- Leave `components/ui/Icon.tsx`, `components/ui/Glass.tsx`, `components/ui/Candle.tsx`, and `core/motion.ts` alone.

**Done when:** one primary button is the only flame-filled control in the kit’s default; ghost and section actions are parchment; a tinted card’s top wash keeps faint text at 4.5:1 in the same composite check; Drawer and helper colors come from `core/theme.ts`; the gate’s hex warning is quiet on the files this PR touched.

### 2. Copy and voice

Strings only, plus the quiz HUD that those strings are tied to. No layout change.

- `core/ember.ts` — `/habits` line (“the streak counts itself”) and the tip “That’s a streak kept.” Say what the screen does: a count of recent days, a missed day changes nothing.
- `app/habits.tsx` — The Science note’s last clause. Keep the cue, routine, and reward sentence. End without “streak” and without telling the student not to quit.
- `supabase/functions/ember/index.ts` — In `APP_GUIDE`, “Habits track small things with streaks.” becomes the same count, with no streak. Safety rules stay.
- `components/helpers/QuizGame.tsx` — Remove the flame streak counter, the numeric `score`, and the `streak * 2` bonus. Keep “1 / n”, right and wrong, and the lightning timer. A quiz can tell you how far you are. It does not keep a scoreboard. If this file was recolored by the visual PR, rebase and touch only the HUD and the score math.
- `app/settings.tsx` and the `emberSay` next to a locked color — “next unlock” and “unlocks at” become a plain warmth fact (“Opens at 50 warmth. You’re at 20.”) or the locked swatch stays quiet with no sentence. Thresholds in `core/emberLook.ts` stay.
- `app/plus.tsx` — “Welcome to Plus. Thank you — really.” becomes one calm line in Ember’s voice.
- `app/welcome.tsx` — Replace “Let’s get your classes in…”. Keep the rest of Ember’s three lines.
- `app/deck/[id].tsx` — “mastered” becomes a plain count the screen already knows (cards that are known, or due).
- `app/flashcards.tsx`, `app/habits.tsx` (empty title), `app/trends.tsx` — Rewrite “No decks yet.”, “No habits yet.”, “No check-ins yet.”, “No lines to draw yet.” in the same spirit as “A blank notebook.” and “The box is empty.” “No grades yet” on `app/grades.tsx` can stay; it is a status, not a greeting.
- `core/helpers.ts` — Role labels only: “Quiz master” and “Hype”. Names Quizzo, Pip, Quill, Sage, and Spark stay. Taglines that are already plain stay.

**Done when:** a search for “streak” in user-facing strings and in `APP_GUIDE` is down to comments that explain the rule, the quiz HUD has no score and no flame counter, and the welcome and Plus lines can be read in the same voice as the Desk.

### 3. Per-tab polish

After the visual defaults. One gold action on each primary screen. No new blocks. No removed tools.

- **Desk.** `app/index.tsx`: leave the lit stack as it is (greeting, the lit card, Today rows, “More on your desk” folded). Do not lift Exam season, countdowns, or `StreakOfLight` back into the open stack. `components/desk/StreakOfLight.tsx`: delete the repeating pulse; the line can stay inside More, including its accessibility label. `components/desk/EmberNote.tsx`: the “Ember has N more” pill is a second gold (`colors.flame` text and border in the still). Make it parchment so **Light the candle** (`components/desk/OneThing.tsx`) is the gold control. `components/desk/TodayRows.tsx` already uses unlocked/sage for the load number; leave that, it is status.
- **School.** `app/school.tsx`: remove `tint={colors.flame}` from “Add homework or a test” so it is a secondary button. Keep “Do this now” (`Now` card / the bolt row) as the gold action when there is a next assignment. “Sort it out” becomes a quiet ghost from the visual PR. `components/school/EmberPick.tsx`: the idle link is gold text; make it the same quiet text as a ghost, and keep the picked card’s **Start focus** as the gold button once a pick exists. Week dots stay; they encode class color and the button is named for VoiceOver.
- **Focus.** `app/focus.tsx`: no restyle. The candle, “One thing. One candle.”, the parked-thought field, Pause, and End stay. Confirm the running time uses `textGrow` and does not clip at the largest size; if it clips, that fix belongs in the reliability PR.
- **Helpers.** `app/helpers.tsx`: the crew grid stays, including the hop-and-sparks on tap. The quota card’s sparkle is `colors.flame` and reads as a second campaign under the crew. Use a quiet icon color. The study-session card keeps its meaning and takes the named token instead of `#7CC4F2`.
- **Steady.** `app/steady.tsx`: no new cards, no reordering. Help, trusted adult, safety plan, one minute, let it out. The work is to confirm, once the + is quieter, that the help row is the first loud thing. The phone icon and the coral edge on that row can stay; danger is a status, not a second brand.
- **Today’s empty hour.** `app/today.tsx`: the plain “Nothing scheduled yet today.” becomes an `EmptyState` with one next step, in the same voice as the other empty rooms.
- **Drawer.** No layout change in `components/Drawer.tsx` if the visual PR has already quieted `t.color`. Do not add group illustrations or a new icon style.

**Done when:** on the lit Desk, School, Helpers, and Steady, a still (when a Mac can take one) shows a single flame-filled control, and Focus is unchanged. Show mode, Riley, 9:41, is the right capture, and it replaces `docs/screens/` only in that later PR.

### 4. Reliability, rough edges, and tests

Code and tests. Live boxes stay `[~]` or `[ ]`. Cloud does not flip them.

Round 7 items that belong in this PR:

- **Item 6 `[~]`** — largest text, still unfinished after the `textGrow` caps. Fix the one-line labels that can clip mid-word, using the pattern already in `app/helpers.tsx` and `components/desk/TodayRows.tsx` (stack or wrap past `fontScale` 1.5, or `maxFontSizeMultiplier` plus `adjustsFontSizeToFit`). Start with `components/ui/Ring.tsx`, `components/ui/Segmented.tsx`, `components/school/NowCard.tsx`, `app/search.tsx`, `app/grades.tsx`, `app/flashcards.tsx`, `app/notes.tsx`, `app/classes.tsx`, `app/settings.tsx` swatches. Leave the round box `[~]` and write the phone check in the PR: largest text size, those screens, no word broken in half.
- **Item 20.3 `[~]` (X122)** — VoiceOver names. `IconButton` and `Field` already do the right thing. Walk `Pressy` calls that show an icon and have no `accessibilityLabel` (the week days in School have one; match that). Do not mark `[x]`. The phone listen is still the check.
- **Item 5 `[~]`** — Ember’s drag lags on the phone. The gesture is `usePanGesture` in `components/ember/EmberBuddy.tsx` (the pan around the `dragging` shared value). Read that handler for JS-thread work during the move. If the code is already on the UI thread, change nothing and say so. Either way the box stays `[~]` until the phone.
- **Item 4 `[~]`** — Sunday night was seen in the Simulator except the real Sunday. `core/night.ts` `tonightKey` and `tonightWeekday` roll at 5:00 AM, and the comment says Sunday night runs past midnight. `tests/core.test.ts` checks `isoDay` Monday–Sunday and does not assert `tonightWeekday` for Monday 1:00 AM (still Sunday) or Monday 5:00 AM (Monday). Add those cases. The Desk’s Sunday-night layout stays `[~]` until a Sunday, or a `?night=` walk on a Mac.
- **Item 3 `[~]`** — the rest of the round-6 live walk. Not a code change. Do not flip those boxes from a cloud PR.

Round 7 items that are open and are not this pass:

- **20.1 `[~]` Halloween hat** and **20.10 `[~]` shake the jar** — small features, still needing a phone date or a shake. Leave them.
- **B3 `[ ]` Notion** — bring-your-own OAuth is a new connection, out of scope. The “off in release” half is already in `core/notion.ts` (`IS_RELEASE` clears the database ids and the writes return immediately) and `tests/build.test.ts`. Leave the box `[ ]` until someone decides the OAuth half. Do not add auth.
- **B6 `[~]` age rating** and **B8 `[~]` Anthropic’s child-safety prompt** — Peter and Anthropic. The in-app age gate and the safety block in the Ember function stay as they are.

Tests to add in this PR, and only these:

- The Sunday-night cases above, in `tests/core.test.ts` or a sibling next to the other night-clock tests.
- After the visual PR’s wash change, one node assertion that the documented top-of-card composite stays at or above 4.5:1 for `textFaint`. Skip it if the visual PR has not landed; do not invent a second contrast library.
- Do not add a test that only echoes a rewritten sentence. Do not add a snapshot suite. Do not edit `tools/hub/`.

**Done when:** the gate is green, the new night-clock tests fail if 1:00 AM Monday is treated as Monday, the listed one-line labels can grow or wrap, and round 7 is unchanged.

## After scores

Filled 2026-11-16 from the open diffs only. The four branches were not merged, and this session did not run the iOS app, so nothing below was seen on a screen and no round-7 box was marked `[x]`. Same weights as the before table. A rating is a reading of those diffs, not a device pass.

Heads read:

- Visual system, [PR 94](https://github.com/peternunley08-ops/brain-navigator/pull/94), `12e2d6371aeb5adbf52b81fb3c01b6b6e0e24de8`
- Copy and voice, [PR 95](https://github.com/peternunley08-ops/brain-navigator/pull/95), `167467ce252dfe8bf7d0d676468061cd9cfb8fd0` (includes the follow-up that sets QuizGame’s color to `colors.shelved`)
- Tab polish, [PR 93](https://github.com/peternunley08-ops/brain-navigator/pull/93), `42794eeba224e88d74f90e57d04f7d74d8230ed1`
- Reliability, [PR 96](https://github.com/peternunley08-ops/brain-navigator/pull/96), `124342e00a3c98650c919a1c2dc883619c94e44c`

Commit `66a13906d8529d636de8ea3976e611129d956d52` on that PR, after the head above, sets `accessibilityLabel={d.text}` on the parked-thought checkbox in `app/focus.tsx`. That one label does not raise the accessibility score. It stays 4, because largest text and VoiceOver were still not seen or heard.

| Dimension | Weight | Before | After | Δ | Check | Residual |
| --- | ---: | --- | --- | ---: | --- | --- |
| Purpose and task fit | 20 | 4 (16) | 4 (16) | 0 | not run | The five rooms are unchanged. The Drawer is still 45 tools. |
| Function and correctness | 20 | 3 (12) | 4 (16) | +4 | not run | Named contract lines are fixed in the diffs. The phone was not run. Quizzo still stores ten points per right answer for a badge. |
| Hierarchy and organization | 15 | 3 (9) | 4 (12) | +3 | not run | Page-level extra gold is quieted. The flame + remains the loudest fill on Desk, School, and Helpers. |
| Specificity and distinctiveness | 15 | 4 (12) | 4 (12) | 0 | not run | Stock sentences and candy hexes moved. Line icons, Liquid Glass, and the catalog shape did not. |
| Ease and interaction | 10 | 4 (8) | 4 (8) | 0 | not run | Today’s empty hour uses `EmptyState`. The extra doors are still there. |
| Craft and consistency | 10 | 3 (6) | 4 (8) | +2 | not run | Ghost, section actions, the card wash, and the streak lines are fixed in code. Spark’s hello and “Hype me up” chip are still the old voice. |
| Accessibility and resilience | 10 | 3 (6) | 4 (8) | +2 | not run | Text caps, most new labels, the Sunday-night unit test, and the wash test are in the diffs. Largest text and VoiceOver were not heard or seen. |
| **Total** | **100** | **69** | **80** | **+11** | **not run** | **70–84: targeted refinement.** Device still required before anyone calls it checked. |

### What the diffs actually change

**Purpose stays 4.** No route was removed or added. `core/tools.ts` still lists the same 45 tools. Recoloring them does not change the job of the app.

**Function 3 → 4.** In the copy diff, Ember’s habits line and the “habits-done” tip no longer say streak (`core/ember.ts`). The science note in `app/habits.tsx` keeps the cue → routine → reward sentence and drops the lecture. `APP_GUIDE` in `supabase/functions/ember/index.ts` says a missed day changes nothing. Settings says “Opens at N warmth” instead of “unlock”. QuizGame removes the flame counter, the on-screen score, the streak bonus, “See my score”, and the high-score lines, and `tests/copy.test.ts` locks those absences. It still calls `recordQuiz(quizRoundPoints(right), …)`, ten points per right answer, so a badge can still be reached. The screen shows “N of N right”. That is a quieter contract, and it is still a hidden score. Round-7 live boxes are untouched. Ember’s year line still says “Counts, not streaks.” Spark’s hello is still “SPARK HERE!” and a chip is still “Hype me up” (`core/helpers.ts`).

**Hierarchy 3 → 4.** Ghost labels use `colors.text` unless a screen passes `tint` (`components/ui/Button.tsx`). Section actions use `colors.text` unless they pass `color` (`components/ui/Section.tsx`). School drops `tint={colors.flame}` on Add (`app/school.tsx`). The idle Ember-pick link is parchment (`components/school/EmberPick.tsx`). The “Ember has N more” pill is parchment (`components/desk/EmberNote.tsx`). The two-week line no longer pulses (`components/desk/StreakOfLight.tsx`). The Helpers quota sparkle is `colors.textMuted` (`app/helpers.tsx`). The center + is a surface fill with a flame glyph only when `pathname === '/steady'` (`components/BottomNav.tsx`). Desk, School, and Helpers keep `gradients.flame` on that button, so the loudest filled control on those three tabs is still the +. Kickers stay gold. Section icons still default to `colors.flame`. Chips still default to flame. Focus’s candle scene is not restyled.

**Specificity stays 4.** Drawer and day-card hexes move onto `colors.flame`, `unlocked`, `secured`, `shelved`, `sky`, `danger`, and `dimensionColor` (visual diff). Helper role colors move onto `colors.shelved`, `dimensionColor.intellectual`, `dimensionColor.social`, `colors.secured`, and `colors.flame` (copy diff). QuizGame’s local violet hex is gone; chips, card, timer, and trophy use `colors.shelved`. Empty titles become “The list is empty.”, “The chart is blank.”, “Nothing to draw.”, and flashcards “A blank deck.” Deck copy says “known” instead of “mastered.” `components/ui/Icon.tsx` and `components/ui/Glass.tsx` are not in any of the four diffs. The school-and-study group in `core/tools.ts` is mostly `colors.flame`, so that group is one meaning and still a gold cluster.

**Ease stays 4.** `app/today.tsx` on the tab branch replaces the plain empty line with `EmptyState` (“The hour is open.” / “This day is open.”) and one next step. Add, sort, Ember pick, hold-to-add, and the + sheet are all still present.

**Craft 3 → 4.** The card wash top stop is `0.05` at rest and `0.06` while pressed (`components/ui/Card.tsx`). `tests/card-wash.test.ts` asserts `textFaint` on that composite stays at or above 4.5:1 for flame, unlocked, secured, shelved, sky, and danger, and that the old `0.11` flame stop stays under 4.5. That is a node composite, not a screenshot of a tinted card. Spark’s shout and the “Hype me up” chip were not rewritten. The four branches are unmerged, so the composed screen was not built. `components/desk/EmberNote.tsx` and `components/school/EmberPick.tsx` are edited on the same Pressy line by the tab diff (parchment) and the reliability diff (a label). A merge has to keep both. `app/today.tsx` edits different lines in those two diffs (the empty state, and a label on a due pill).

**Accessibility 3 → 4.** The reliability diff adds `maxFontSizeMultiplier` and shrink-or-wrap on `components/ui/Ring.tsx`, `components/ui/Segmented.tsx` (the rail stacks past font scale 1.5), `components/school/NowCard.tsx`, and the one-line titles in search, grades, notes, and classes. The Focus countdown (`app/focus.tsx`) uses `textGrow.display`, `adjustsFontSizeToFit`, and `minimumFontScale={0.6}`. The copy diff does the same kind of wrap for Settings swatches and flashcard names. New `accessibilityLabel`s land on icon Pressys, including Ember’s “N more”, the Ember-pick link, and Today’s due pills. `tests/core.test.ts` asserts `tonightWeekday` for Monday 1:00 AM (Sunday, 0) and Monday 5:00 AM (Monday, 1). The reliability note says the Ember pan was already a UI-thread worklet and the file was not changed. Not verified here: whether that worklet stays off the JS thread in a running app, whether any word still breaks at the largest text size, and VoiceOver on a phone. The parked-thought checkbox is named in `66a1390` with `accessibilityLabel={d.text}`. That commit is later than the scored head, and the one label does not move accessibility off 4. Item 6, item 20.3, item 5, and item 4 stay `[~]`.

### What this rescore could not verify

- Any pixel, animation, or VoiceOver pass. No new screenshot.
- The four branches applied together. They fork from the same `main` (`d0b2bb2`) and were not combined.
- Glass, candle artwork, and the room gradient as painted. The wash test is sRGB math on flat composites.
- Whether `minimumFontScale={0.6}` on the Focus timer actually keeps “4:56” inside the readout.
- Sunday night on the Desk. The new test covers the clock function only.
- Ember’s drag on a phone.
- VoiceOver reading the parked-thought checkbox. `66a1390` sets `accessibilityLabel={d.text}` in `app/focus.tsx`. The label was not heard.

Attention, from the diffs: ghost and section actions are parchment by default; `textFaint` on the new wash stops clears 4.5:1 in the unit test; Steady’s + is the quiet one; Desk, School, and Helpers still have a flame-filled +. Focus’s layout is unchanged apart from the timer’s text caps.

## Gates for this document

| Gate | Status |
| --- | --- |
| The audit file is in the repo | Pass, once this PR is open |
| Primary job and identity preserved in the brief | Pass |
| No UI, copy, store, or behavior change in this PR | Pass |
| No auto-merge, scheduled job, telemetry, paid service, or external message | Pass |
| No `auth.users` or per-user RLS | Pass |
| No new dependency (`reuse_gate.py`: NO_ADDITION) | Pass |
| Live iOS behavior | Not run |
| New screenshots | Not run, on purpose |
| After scores | Filled from the four open diffs. Live check not run. Total 80, up 11 from 69. |
