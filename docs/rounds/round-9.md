# Round 9: Interactive Study Polish, First-Open Value & Launch Readiness

With Rounds 1–8 (`522 [x]` items) and the 14-point WCAG 2.1 AA Accessibility Audit (`PR #87`) complete, Round 9 focuses on interactive data exploration, low-friction student study workflows, first-open value ([`docs/plans/TOP-APPS-STUDY.md`](../plans/TOP-APPS-STUDY.md)), and public launch readiness ([`docs/legal/RELEASE-COMPLIANCE.md`](../legal/RELEASE-COMPLIANCE.md)).

Status marks: `[ ]` open · `[~]` built, needs live check · `[x]` verified on screen · `[–]` decided against.

---

## A. Interactive Insights & Study Workflows

1. [x] **Interactive Trend Scrubbing (`app/trends.tsx`)** — Let the student drag or tap across the trend chart in `app/trends.tsx` to inspect any day's exact reading, date, and check-in note with a subtle haptic tick at each point.
2. [x] **Flashcard Paste & Bulk Import (`app/deck/[id].tsx`)** — Add a *"Paste a list"* sheet in `app/deck/[id].tsx` so a student can paste `Term - Definition` or tab-separated lines (e.g. from Quizlet or a study guide) and preview/add them in one tap.
3. [x] **Deck Share / Export as Text (`app/deck/[id].tsx`)** — Add a *"Share cards"* action in `app/deck/[id].tsx` using `Share.share` so a student can text or AirDrop a clean `front — back` study list to a classmate.
4. [ ] **Quick Voice Dictation Cue on New Candle (`app/new-entry.tsx`, `app/pocket-worry.tsx`)** — Add a quiet helper hint and one-tap focus into the note field for night-time voice dictation when a student is too tired to type.

---

## B. First-Open Value & Smart Timing (`TOP-APPS-STUDY.md` Picks D & E)

5. [ ] **First-Open Starter Card on the Desk (`app/index.tsx`, `core/lifeStore.ts`)** — On a brand-new install with no classes or assignments yet, show one warm, dismissible starter card on the Desk (`app/index.tsx`) before asking the student to set up classes (Pick D in `docs/plans/TOP-APPS-STUDY.md`).
6. [ ] **Opt-In Evening Workload Cap Nudge (`app/settings.tsx`, `core/lifeStore.ts`)** — Add an off-by-default *"Quiet reminder when tonight is over my cap"* setting in `app/settings.tsx` and `core/lifeStore.ts` that surfaces an in-app evening banner linking straight to Pip's plan (Pick E in `docs/plans/TOP-APPS-STUDY.md`).
7. [ ] **Study Session Reflection Note (`app/focus.tsx`, `core/schoolStore.ts`)** — When a Focus candle finishes in `app/focus.tsx`, let the student optionally jot a one-line *"Where I left off"* note on the assignment so tomorrow's session picks up in the exact spot (`components/desk/LitCard.tsx`).
8. [ ] **"Where you left off" Resume Line on Lit Card (`components/desk/LitCard.tsx`, `app/assignment/[id].tsx`)** — Display the saved *"Where I left off"* bookmark line from the last Focus session right on `components/desk/LitCard.tsx` and `app/assignment/[id].tsx`.

---

## C. Privacy, Compliance & Master Hub (`RELEASE-COMPLIANCE.md`)

9. [x] **Live Master Dashboard & Simulator Remote (`tools/hub/server.mjs`, `tools/hub/index.html`)** — Upgrade `http://localhost:4410` with a Live System Health & Compliance Matrix, WCAG 2.1 AA Accessibility Scorecard, interactive Simulator deep-link remote control (`/api/action`), and live gate runner.
10. [ ] **Per-Device Local Vault Status & Export Checksum (`app/privacy.tsx`, `core/supabase.ts`)** — Show a clear *"Where your data lives"* status badge in `app/privacy.tsx` (On this phone only vs. Cloud synced) with item counts across check-ins, Desk candles, notes, and flashcards.
11. [ ] **Static Legal Pages Bundle (`docs/legal/index.html`, `app/privacy.tsx`)** — Generate a clean, dark-mode candlelight HTML page (`docs/legal/index.html`) combining `PRIVACY-POLICY.md`, `TERMS.md`, and `CRISIS-PROTOCOL.md` ready for GitHub Pages hosting.
12. [ ] **Physical iPhone Release Sync (`scripts/build-phone.sh`)** — Rebuild and install the updated Release build with Round 8 + Accessibility Audit + Round 9 improvements onto Peter's iPhone (`00008150-001C4CE12110C01C`).
