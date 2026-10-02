@AGENTS.md

# Brain Navigator

Expo Router (SDK 57) + React Native 0.86 (iOS). Single-user MVP: wide-open `anon` Supabase RLS. Never introduce `auth.users` or per-user RLS.

For deep history, session logs, and past changelogs, see `docs/SESSION_LOG.md` and `docs/ARCHIVE_CLAUDE_FULL.md`.

## Core Structure
- `app/` — Expo Router file-based screens. Desk (`/`), School (`/school`), Focus (`/focus`), Steady (`/steady`), Drawer (`/drawer`).
- `core/` — Zustand 5 stores (`schoolStore.ts`, `hubStore.ts`, `lifeStore.ts`, etc.), design tokens (`theme.ts`), AI integration (`emberAI.ts`), navigation helpers (`chrome.ts`), haptics (`haptics.ts`), motion (`motion.ts`).
- `components/ui/` — Design kit (`Screen`, `Card`, `Section`, `Button`, `Pressy`, `Chip`, `Candle`, etc.). Build screens using this kit.
- `components/ember/` — Mascot rig (`EmberBuddy.tsx`, `EmberSprite.tsx`).
- `supabase/functions/` — Deno Edge Functions (`ember/index.ts` is the Claude job router).
- `docs/` — Reference docs and planning.

## Key Rules & Gotchas
- **UI & Design**: "Candlelight" palette (`core/theme.ts`). Gold (`flame`) is the only action color. Fonts: Fraunces (headings, Ember voice) and Figtree (body/numbers). Calm, sentence-case copy. No uppercase eyebrow labels.
- **Navigation**: Always use `goBack()` from `core/chrome.ts` instead of `router.back()` to avoid dead ends.
- **Haptics**: Always import from `core/haptics.ts` (never import `expo-haptics` directly).
- **Zustand 5**: Select raw arrays/objects and filter in render or `useMemo`. Selectors returning new array instances trigger infinite re-render loops.
- **Reanimated & Gestures**: Use Gesture Handler 3.3 hook API (`usePanGesture`). Helpers called inside animated styles (like `alpha()`) must have the `'worklet'` directive.
- **Stores**: State is persisted locally in `.json` files. Add only optional fields with defaults. Every deletion must support Undo (`putBack`).
- **Token Efficiency**: Inspect code using targeted line ranges or `grep`. Do not ingest `docs/SESSION_LOG.md` or `package-lock.json` unless specifically requested.
- **Security**: Never put a secret in `EXPO_PUBLIC_*` (it ships inside the app); server secrets live in Supabase function secrets and the app calls a function (`ember`, `notion`). Run `node tools/hub/security.mjs` before pushing; rules in `tools/hub/SECURITY.md`.
- **Command output**: pipe builds and installs through `tail -n 25` or `grep -E "error|warning"`; never dump raw `xcodebuild`/`npm` output. Compact after each finished task.
