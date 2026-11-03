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

6. [ ] **Weather memory across cold starts (solves R7-G22)**: cache the last known weather code, temperature, and sunrise/sunset on the phone (with a 3-hour freshness window) so the room's window sky and real sunset work on cold start without asking for location at launch
7. [ ] **Exam season focus view (solves R7-G24)**: when 3+ tests land within 7 days, let the Exam Season lead card expand into a calm "Study plan for this week" view right on the Desk, folding non-essential cards until the last test passes
8. [ ] **Lit card "Turned in" follow-through**: when marking a homework done from the Desk's lit card, offer a quiet "Turned in too" pill inside the Undo bar so students can mark both in two taps
9. [ ] **Steady's "Right now" lead**: when today's check-in logged high stress (7+) or low sleep (<6 h), highlight the single tool that helped most in the past (`about.helped`) at the top of Steady with one calm sentence
10. [ ] **Friday afternoon wrap**: after the last class on Friday, a Desk note bridges the finished school week into Your week's one-line reflection and lights the week's shelf candle

## C. Craft and micro-interactions

11. [ ] **Widget deep-links**: tapping tomorrow's first class or due count on the Home Screen widget (`widgets/TomorrowWidget.tsx`) opens straight to `brainnavigator://school` or `brainnavigator://today`
12. [ ] **Break-time flashcards in Pip's plan**: during a 5-minute break between Pip's study blocks, offer "Flip 5 cards" if a deck has cards due today
13. [ ] **Class page quick-scan**: add a "Scan the board or handout" action inside a class page so scanned homework and notes already belong to that class
14. [ ] **Candlelight sheet headers**: give the four quick-add sheets (`add-assignment`, `class-edit`, `new-entry`, `pocket-worry`) the same warm top-edge light and quiet kicker as the main tabs
15. [ ] **Over-the-air updates (`expo-updates`)**: ship JS-only rounds to the phone without plugging into the Mac (from R7-C12)

## D. Privacy, offline, and release readiness

16. [ ] **On-this-phone-only mode**: let the student run check-ins, habits, vents, and open loops entirely on-device (persisted to local JSON, using the `sampleDb` query engine) when offline or when they prefer no cloud sync (solves R7-H29 / B1 for single-device use)
17. [ ] **Private entry-photo bucket**: run Supabase schema Phase 20 and verify old and new entry photos over signed URLs (from R7-H30 / B2)
18. [ ] **Full data wipe on "Start over"**: clear both on-device files and the server tables when starting fresh (from `RELEASE-COMPLIANCE.md` S3)
19. [ ] **Privacy policy and terms in Settings**: link the hosted policy and consumer-health-data notice from Settings → Privacy (from R7-H32 / B4)
20. [ ] **3-hour companion break check**: verify the 3-hour AI companion break nudge in a long chat session and link the crisis protocol from How AI works here (from R7-H35 / B7)

## Ground rules

Everything from Rounds 4–7 holds: candlelight palette (`core/theme.ts`), one
primary gold action color (`colors.flame`), Fraunces for headings and Ember's
voice, Figtree for body and tabular numbers, calm sentence-case copy, every
delete offers Undo, `nightNow()` for day/night time, and `node tools/hub/check.mjs`
passes on every commit.
