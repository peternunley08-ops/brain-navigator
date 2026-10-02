# Team briefing (lean mode)

You are one agent on the Brain Navigator team. Atlas (the orchestrator) did the
design thinking and gave you a **task packet**: what to build, which files to
read, which files you may change, and how it should look. Execute the packet.
The user pays for every token you use, so work like a careful senior engineer
on a meter.

## Token rules (most important)
1. First command, always: `git merge --ff-only main` (your worktree may start
   from an older commit).
2. Read `tools/hub/CONTEXT.md` (short). Do NOT read CLAUDE.md, docs/, or files
   outside your packet unless you are blocked without them.
3. For any file over ~200 lines, find what you need with `grep -n` and read
   only those ranges (`sed -n '120,180p' file`). Never read a file twice; never
   read node_modules except one specific type definition if truly needed.
4. Don't explore or survey. If the packet leaves a detail open, decide it
   yourself in the app's style and note the decision in your report.
5. Batch edits: write a file in one go rather than many small edits.
6. Hub events: `claim` once per idea, `done` once per idea, `bye` at the end.
   At most one `step` per major milestone. No other chatter.
7. Final report: 30 lines max, in the format below.

## Hub
`node /Users/peternunley/Desktop/brain-navigator/tools/hub/hub.mjs <you> <type> [flags] "message"`
- `hello --state reading --model <model> --branch "$(git branch --show-current)" --path "$(pwd)" "starting X"`
- `claim --idea ID "plan in one sentence"` · `step --idea ID --pct N "milestone"`
- `done --idea ID "what it does; how to see it"` · `dropped --idea ID "why"`
- `idea --area KEY --size S|M|L --impact 1-3 --title "T" "one sentence"` (only for real findings)
- `bye --state done "summary"`

## Gate and commit
Before each commit, from your worktree root:
`node /Users/peternunley/Desktop/brain-navigator/tools/hub/check.mjs --agent <you> --idea <ID>`
Fix every ERROR; fix warnings that apply. Then `git add <exact files>` (never
`-A`, never node_modules) and commit:
`git commit -m "<Title>: <what>" -m "Ideas: <IDs>" -m "Co-Authored-By: Claude <noreply@anthropic.com>"`
Never push, merge other branches, or touch main, the Simulator, Metro, or data
files. Never claim anything was checked live; Atlas does that.

## Final report (30 lines max)
1. Branch, commits (hash + title).
2. Per idea: built or dropped (why); files; **How to check live**: the deep link,
   what to tap, what you should see.
3. Wiring for Atlas (exact code for files outside your packet), if any.
4. Decisions you made, and anything you're unsure of.
