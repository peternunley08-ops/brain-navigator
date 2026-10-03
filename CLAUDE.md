@AGENTS.md

# Brain Navigator

Expo Router (SDK 57) + React Native 0.86 (iOS). Single-user MVP: wide-open `anon` Supabase RLS. Never introduce `auth.users` or per-user RLS.

For detailed session history, past roadmaps, and full changelogs, see `docs/history/SESSION_LOG.md` and `docs/history/ARCHIVE_CLAUDE_FULL.md`.

## Core Structure
- `app/` — Expo Router file-based screens: Desk (`/`), School (`/school`), Focus (`/focus`), Steady (`/steady`), Drawer (`/drawer`).
- `core/` — Zustand 5 stores (`schoolStore.ts`, `hubStore.ts`, `lifeStore.ts`, etc.), design tokens (`theme.ts`), AI integration (`emberAI.ts`), navigation helpers (`chrome.ts`), haptics (`haptics.ts`), motion (`motion.ts`).
- `components/ui/` — Design kit (`Screen`, `Card`, `Section`, `Button`, `Pressy`, `Chip`, `Candle`, etc.). Build screens using this kit.
- `components/ember/` — Mascot rig (`EmberBuddy.tsx`, `EmberSprite.tsx`).
- `supabase/functions/` — Deno Edge Functions (`ember/index.ts` is the Claude job router).
- `docs/` — `WHAT-THIS-IS.md`, `rounds/` (every round's plan and status), `plans/`, `history/` (long logs). Index: `docs/README.md`.

## Key Rules & Gotchas
- **UI & Design**: "Candlelight" palette (`core/theme.ts`). Gold (`flame`) is the only action color. Fonts: Fraunces (headings, Ember voice) and Figtree (body/numbers). Calm, sentence-case copy. No uppercase eyebrow labels.
- **Navigation**: Always use `goBack()` from `core/chrome.ts` instead of `router.back()`.
- **Haptics**: Always import from `core/haptics.ts` (never import `expo-haptics` directly).
- **Zustand 5**: Select raw arrays/objects and filter in render or `useMemo`. Selectors returning new array instances trigger infinite re-render loops.
- **Reanimated & Gestures**: Use Gesture Handler 3.3 hook API (`usePanGesture`). Helpers called inside animated styles (like `alpha()`) must have the `'worklet'` directive.
- **Stores**: State is persisted locally in `.json` files. Add only optional fields with defaults. Every deletion must support Undo (`putBack`).
- **Night & clock**: Read time through `nightNow()` (`core/night.ts`), never `new Date()`, in anything night- or morning-aware, so the dev clock works (`brainnavigator://?night=23:30`, `?night=off`; a chip on the Desk shows it). Night belongs to `tonightKey()` (rolls over at 5 AM).
- **Show mode**: `isShowing()` (`core/showMode.ts`) swaps in sample student Riley; nothing saves, and firsts, wins radar and celebrations stay silent.
- **Ember lines**: `emberSay(text, mood)`; pass `asked = true` to `say` only when the student reached for Ember (hold, breath), which lets it through quiet modes. Lines wait while the Undo bar is up (one queue in `core/emberStore.ts`).
- **Agents & gate**: Team workflow in `tools/hub/BRIEFING.md`. Every commit passes `node tools/hub/check.mjs --agent <name>`. Round status lives in `docs/rounds/round-6.md` ([~] built, [x] checked live), read it instead of searching code.
- **Token Efficiency**: Inspect code using targeted line ranges or `grep`. Do not ingest `docs/history/SESSION_LOG.md` or `package-lock.json` unless specifically requested.
