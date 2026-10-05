# Brain Navigator

A small, quiet iPhone app for one high school student. It keeps school, and the rest of life around it, from piling up.

It lives in a candlelit night room. **Ember**, a small flame, keeps you company: it notices what's going on, says things in plain words, and never nags. No streaks, no guilt, no scoreboard.

> New here? Start with **[What this app is](docs/WHAT-THIS-IS.md)** (a two-minute read).

---

## The app at a glance

| Tab | What it's for |
|---|---|
| **Desk** | The front page: what's next, one thing to start with, countdowns, pinned notes. At night it becomes a short, quiet stack; in the morning, First light. |
| **School** | Classes, assignments and due dates, grades, exam season. |
| **+** | Quick add: homework, a note, a check-in, a focus session, a worry. |
| **Focus** | Sit down and work for a while. Ember studies with you; optional fire crackle. |
| **Steady** | Sleep, winding down, worries, small wins, Let it out. |
| **Drawer** | Everything else: notes, colleges, study helpers and games, Your year, About you. |

**How it treats you:** calm sentence-case words, every delete can be undone, schoolwork stays on the phone, AI chat is optional and can be turned off. A **show mode** (sample student Riley) demos the app without revealing real data.

---

## Built with

| Layer | Tools |
|---|---|
| App | Expo SDK 57, Expo Router, React Native 0.86 (iOS) |
| State | Zustand 5, saved as JSON files on the phone |
| Motion | Reanimated 4, Gesture Handler 3, react-native-svg |
| Backend | Supabase (Edge Functions in `supabase/functions/`: `ember`, `notion`) |
| Design | "Candlelight" palette in `core/theme.ts`; Fraunces for headings and Ember's voice, Figtree for everything else |

## Where things live

```
app/          Screens (Expo Router: each file is a page)
components/   UI kit (components/ui), Desk cards, Ember, and page pieces
core/         Stores, theme, dates, night clock, Ember's rules, helpers
supabase/     Edge Functions
assets/       Icons, fonts, audio
plugins/      Expo config plugins (iOS 27 scene life cycle)
scripts/      Small generators (ambient tones, fire crackle) and evals
tools/hub/    The agent team's dashboard, quality gate and security scan
docs/         What the app is, every round's plan, future plans, history
```

---

## Run it

```bash
npm install
npx expo start            # Simulator / dev build
```

**Install a Release build on the iPhone** (from the Mac, phone plugged in and unlocked):

```bash
./scripts/build-phone.sh --main     # pull main, find the phone, build, install
```

The script sets UTF-8 (CocoaPods crashes without it), finds the connected iPhone, and warns if Xcode can't prepare it. Free signing lasts 7 days; run it again when the app stops opening. If Xcode says the developer disk image can't be mounted, unlock the phone and let Xcode finish preparing it (Window → Devices and Simulators). When a build fails on signing ("No Accounts", "No profiles for…"), the script prints the steps to fix it; never delete the app from the phone to get past one, its data goes with it.

**Before every commit:** `node tools/hub/check.mjs --agent <name>` (house rules plus the type check).

---

## How it was built

The app grew in rounds. Each round has a plan with every idea and its status (`[x]` done, `[~]` built and waiting for a live check, `[–]` decided against).

| Round | Theme | Plan |
|---|---|---|
| 1 | 120 ideas, local-first | [round-1](docs/rounds/round-1.md) |
| 2 | Helpers, multi-scan, Plus | [round-2](docs/rounds/round-2.md) |
| 3 | 100 more, building on 1–2 | [round-3](docs/rounds/round-3.md) |
| 4 | The AI design | [round-4](docs/rounds/round-4.md) |
| 5 | Smooth, and knows you | [round-5](docs/rounds/round-5.md) |
| 6 | Everything in tune: the night room, Ember moments, polish | [round-6](docs/rounds/round-6.md) |
| 7 | Seen, shipped, and on the phone (next) | [round-7](docs/rounds/round-7.md) |

Rounds 6 and later were built by a small team of AI agents working in parallel, each in its own git branch, with one orchestrator reviewing and merging. See [`tools/hub/BRIEFING.md`](tools/hub/BRIEFING.md).

**Want to help?** Start with [CONTRIBUTING.md](CONTRIBUTING.md): setup, the `.env` file, how work flows, and the house rules.

More: [docs index](docs/README.md) · [house rules](CLAUDE.md)
