# Round 8: One Lit Thing, all the way through

Written 2026-11-02 after the Candlelight design pass and Round 7 Simulator
walk (`docs/rounds/round-7.md`).

Rounds 6 and 7 proved the **One Lit Thing** direction (`docs/design/DIRECTION.md`):
one lit card on the Desk, top-lit candlelight cards, a quieter floating Ember
that peeks from the edge, and five clean App Store hero screens. Round 8
carries that calm hierarchy through the rest of the app, closes the open
design questions from Round 7 (`G22` weather memory, `G24` exam season), and
prepares the app for daily life on the phone.

Statuses: `[ ]` not started · `[~]` built, partly checked · `[x]` done and
checked · `[–]` decided against (with why)

## A. On the phone: feel, sound, and speed

1. [ ] Cold start on the phone: measure launch-to-Desk in Release and trim anything blocking the first frame under 1 s (from R7-B9)
2. [ ] 120 Hz scroll and drag audit on the phone: check Desk, School, and Notebook with the performance monitor (from R7-B10, G37)
3. [ ] Shake to drop a worry (Desk) and Shake the jar (Wins) on the physical iPhone: tune the threshold so walking never triggers it (from R7-D14, F20.10)
4. [ ] Fire crackle and breathing haptics on the phone speaker and Taptic Engine during Focus and Hold-to-breathe (from R6-70, R6-86)
5. [ ] VoiceOver listen pass on the phone across Desk, School, Helpers, and Steady (from R7-A7, F20.3)

## B. One Lit Thing, phase two

6. [x] **Weather memory across cold starts (solves R7-G22)**: cache the last known weather code, temperature, and sunrise/sunset on the phone (`weather.json` in `core/weatherStore.ts`, loaded at launch in `app/_layout.tsx` with a 3-hour freshness window and same-day sunrise/sunset) so the room's window sky and real sunset work on cold start without asking for location at launch — built and verified 2026-11-03
7. [x] **Exam season focus view (solves R7-G24)**: when 3+ tests land within 7 days, let the Exam Season lead card expand into a calm "Study plan for this week" view right on the Desk, folding non-essential cards until the last test passes — built in `components/desk/ExamSeason.tsx`, `core/lifeStore.ts` (`examFocus`), and `app/index.tsx` and verified 2026-11-03
8. [x] **Lit card "Turned in" follow-through**: when marking a homework done from the Desk's lit card, offer a quiet "Turned in too" pill inside the Undo bar so students can mark both in two taps — built in `core/undoStore.ts`, `components/UndoBar.tsx`, `components/desk/LitCard.tsx`, and `components/school/AssignmentRow.tsx` and verified 2026-11-03
9. [x] **Steady's "Right now" lead**: when today's check-in logged high stress (7+) or low sleep (<6 h), highlight the single tool that helped most in the past (`about.helped`) at the top of Steady with one calm sentence — built in `app/steady.tsx` and verified 2026-11-03
10. [x] **Friday afternoon wrap**: after the last class on Friday, a Desk note bridges the finished school week into Your week's one-line reflection and lights the week's shelf candle — built in `core/deskNotes.ts`, `components/desk/DayCards.tsx` (`FridayWrap`), and `components/desk/EmberNote.tsx` and verified 2026-11-03

## C. Craft and micro-interactions

11. [x] **Widget deep-links**: tapping tomorrow's first class or due count on the Home Screen widget (`widgets/TomorrowWidget.tsx`) opens straight to `brainnavigator://school` or `brainnavigator://today` — built in `widgets/TomorrowWidget.tsx` (`widgetURL`) and verified 2026-11-03
12. [x] **Break-time flashcards in Pip's plan**: during a 5-minute break between Pip's study blocks, offer "Flip 5 cards" if a deck has cards due today — built in `components/helpers/TonightPlan.tsx` and verified 2026-11-03
13. [x] **Class page quick-scan**: add a "Scan the board or handout" action inside a class page so scanned homework and notes already belong to that class — built in `app/class/[id].tsx` and `app/scan.tsx` (`presetClassId`) and verified 2026-11-03
14. [x] **Candlelight sheet headers**: give the four quick-add sheets (`add-assignment`, `class-edit`, `new-entry`, `pocket-worry`) the same warm top-edge light and quiet kicker as the main tabs — built in `components/ui/Screen.tsx`, `app/add-assignment.tsx`, `app/class-edit.tsx`, `app/new-entry.tsx`, and `app/pocket-worry.tsx` and verified 2026-11-03
15. [ ] **Over-the-air updates (`expo-updates`)**: ship JS-only rounds to the phone without plugging into the Mac (from R7-C12)

## D. Privacy, offline, and release readiness

16. [x] **On-this-phone-only mode**: let the student run check-ins, habits, vents, and open loops entirely on-device (persisted to local JSON, using the `sampleDb` query engine) when offline or when they prefer no cloud sync (solves R7-H29 / B1 for single-device use) — built in `core/sampleDb.ts` (`localFrom`, `fillLocalDb`), `core/supabase.ts` (`loadPhoneOnlyDb`, `phoneOnly` proxy), `core/lifeStore.ts` (`phoneOnly`), and `app/settings.tsx` and verified 2026-11-03
17. [x] **Private entry-photo bucket**: run Supabase schema Phase 20 and verify old and new entry photos over signed URLs (from R7-H30 / B2) — ran `update storage.buckets set public = false where id = 'snapshot-images'` on `jmjdiudekhkrxxontvhc` and verified 2026-11-03 that direct public URLs return HTTP 400 while `createSignedUrl` returns HTTP 200
18. [x] **Full data wipe on "Start over"**: clear both on-device files and the server tables when starting fresh (from `RELEASE-COMPLIANCE.md` S3) — built in `app/settings.tsx` (`resetAll` wipes all on-device JSON files, `localDb.json`, and online tables) and `app/privacy.tsx` and verified 2026-11-03
19. [x] **Privacy policy and terms in Settings**: link the hosted policy and consumer-health-data notice from Settings → Privacy (from R7-H32 / B4) — built in `app/privacy.tsx` and `app/settings.tsx` and verified 2026-11-03
20. [x] **3-hour companion break check**: verify the 3-hour AI companion break nudge in a long chat session and link the crisis protocol from How AI works here (from R7-H35 / B7) — built in `app/ai.tsx` ("Safety and break reminders" linking `CRISIS-PROTOCOL.md` and `/help`) and verified 2026-11-03

## Ground rules

Everything from Rounds 4–7 holds: candlelight palette (`core/theme.ts`), one
primary gold action color (`colors.flame`), Fraunces for headings and Ember's
voice, Figtree for body and tabular numbers, calm sentence-case copy, every
delete offers Undo, `nightNow()` for day/night time, and `node tools/hub/check.mjs`
passes on every commit.
