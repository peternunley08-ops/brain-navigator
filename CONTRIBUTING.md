# Working on Brain Navigator

Welcome. This is a small, calm iPhone app for one high school student. Read
[What this app is](docs/WHAT-THIS-IS.md) first (two minutes), then this page.

## What you need

| Need | Why | How to get it |
|---|---|---|
| A Mac with Xcode (latest) | iOS builds only run on macOS | App Store → Xcode |
| Node 22 | Expo SDK 57 | `brew install node@22` or nvm |
| Access to this repo | To push branches and open PRs | Peter invites you as a collaborator |
| A `.env` file | The app's public settings | Copy `.env.example` → `.env`; ask Peter for the values over a private channel (never in an issue or PR) |
| Your own Apple ID | Signing the app for your phone | Xcode → Settings → Accounts; free is fine |

You do **not** need Supabase, Notion or Anthropic accounts. The server
functions and their secret keys stay with Peter; the app talks to them with
the public values in `.env`.

## First run

```bash
git clone https://github.com/peternunley08-ops/brain-navigator
cd brain-navigator
npm install
cp .env.example .env            # then fill in the values Peter sends
npx expo run:ios                # Simulator (first build takes ~15 min)
```

The first `expo run:ios` installs CocoaPods for you, into Homebrew Ruby's gem
folder, which isn't on your PATH yet. If it then stops with
`spawn pod ENOENT`, add that folder to `~/.zshrc`, open a new terminal and
run it again:

```bash
export PATH="$(ls -d /opt/homebrew/lib/ruby/gems/*/bin | tail -1):$PATH"
```

On your own iPhone: `./scripts/build-phone.sh` (plugged in, unlocked).
The bundle ID `com.peternunley.brainnavigator` is tied to Peter's Apple team;
if Xcode refuses to sign it with yours, change `ios.bundleIdentifier` in
`app.json` **locally only** (don't commit it) and run `npx expo prebuild -p ios --clean`.

**Show mode** (Settings → Show) swaps in a sample student, Riley, so you can
try everything without real data. Nothing saves while showing.

## How work flows

1. **Branch from `main`**: `git checkout -b yourname/short-topic`. Never push to `main`; a pre-push hook (`.githooks/pre-push`, turned on by `npm install`) stops it.
2. **Pick something** from the current round: [`docs/rounds/round-7.md`](docs/rounds/round-7.md). Each item has a number; mention it in your commit (`Ideas: R7-11`).
3. **Follow the house rules** in [`CLAUDE.md`](CLAUDE.md) (short). The biggest ones:
   - Build screens with the kit in `components/ui/` (`Screen`, `Card`, `Pressy`, …).
   - Colors and fonts from `core/theme.ts`. Gold (`flame`) is the only action color.
   - Calm, sentence-case copy: no exclamation marks, no guilt, no streak pressure. Counts with `plural()`.
   - Every delete offers Undo. Nothing new is sent to AI or any server.
   - No new packages or native code without talking to Peter first (each one means a new phone build).
4. **Check before every commit:**
   ```bash
   node tools/hub/check.mjs --agent yourname
   ```
   It runs the house rules on your changed lines plus the TypeScript check. Fix every error.
5. **Open a pull request** into `main`. The template asks what changed, the checks, and **how to check it live** (what to tap, what you should see). Peter reviews and merges.
6. **Live check:** nothing counts as done until it's seen working in the Simulator or on a phone. Say so in the PR.

## Where things live

```
app/          Screens (each file is a page; Expo Router)
components/   UI kit (ui/), Desk cards (desk/), Ember (ember/), page pieces
core/         Stores (Zustand), theme, dates, night clock, Ember's rules
supabase/     Server functions (Peter deploys these)
plugins/      Expo config plugins, applied at prebuild
docs/         The app, every round's plan, plans, history
tools/hub/    Quality gate (check.mjs), security scan (security.mjs)
```

## Security

- Never commit `.env`, keys, tokens or screenshots with real data.
- Run `node tools/hub/security.mjs` before a PR that touches networking,
  storage or `supabase/`. Rules: [`tools/hub/SECURITY.md`](tools/hub/SECURITY.md).
- Found something sensitive in the repo? Tell Peter privately; don't open a public issue.
