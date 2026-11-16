# GitHub discovery → anti-slopify → verified handoff

Use when the user names a GitHub repository/link, says “find my project on GitHub,” or asks to search their repositories. “This project” with a clear local target does not authorize a broad search through unrelated accounts. Adding this capability to the skill is not itself a request to redesign an arbitrary live repository.

## 1. Discover access and scope

Load the relevant part of [agent adaptation](agent-adaptation.md). Prefer available GitHub connector tools for identity/repository discovery. Read their current schemas: some search names/descriptions, others search files, and some see only repositories included in an installation. Do not assume private or organization repositories are accessible because public search works.

Use the authenticated identity returned by the connection or CLI. Never infer the GitHub username from a local account name, email address, or repository author. If multiple accounts or enterprise hosts are plausible, use the explicitly requested owner/host or selected project remote; ask only if the ambiguity affects the target. Do not switch accounts, change token scopes, or request secrets in chat. Authentication happens through the host's normal connection/login flow.

For “search my GitHub,” inspect metadata of accessible repositories within the stated account/organization. Begin with names, descriptions, topics if exposed, archived/fork status, visibility, default branch, and recent activity. Do not open every codebase, issue, or private file just to discover a name.

## 2. Resolve the exact repository

Use this priority order:

1. Explicit URL or `owner/repo` → verify access to that exact repository; no fuzzy substitution.
2. Current selected checkout → inspect its actual remote and project identity; do not expose embedded credentials if a remote URL contains them.
3. Named project → search scoped repository metadata and compare identity, README purpose, owner, and stack of the best candidates.
4. “Find a project to anti-slopify” without a unique target → show a shortlist of at most three to five candidates and ask for selection. Recency alone is not consent to edit a repository.

A uniquely supported match can proceed with a brief statement of the selected owner/repo. When matches are ambiguous, ask one concrete choice question; do not clone or edit every candidate. An archived repository, fork, similarly named unrelated repository, or inaccessible private repository must not silently replace the intended project.

Search coverage matters. Follow pagination/cursors within a reasonable discovery budget, narrow by owner or query, and state when results are partial. No results can mean missing access, incomplete pagination, indexing limitations, or no match; do not claim a repository does not exist from a single failed search. Honor rate limits; avoid retry loops.

## 3. Connector → CLI → supplied source fallback

If a connector is sufficient, use it. If it cannot clone or run code, continue in an authorized writable workspace using the same verified repository and revision. If no suitable connector exists but `gh` is available, use its authenticated session; never extract tokens.

Optional helper, from the skill folder:

```sh
python3 scripts/github_discover.py --query portfolio
python3 scripts/github_discover.py --query dashboard --owner example-owner
python3 scripts/github_discover.py --host github.example.com --query portal
```

The standard-library helper uses read-only `gh api` requests to identify the account and enumerate accessible repositories, then ranks metadata locally. It never clones, edits, commits, pushes, changes permissions, or logs in. It caps enumeration and output, reports incomplete coverage, and suppresses raw CLI errors to avoid leaking credentials. Requires Python 3.9+ and an already authenticated GitHub CLI. It is a fallback, not a substitute for a better available connector. Owner is a filter on already accessible results, not a way to discover all public repositories of an unrelated account.

For a known repository, direct verification is preferable to broad enumeration. Use supported `gh repo view`, API, or connector calls to read its metadata. `gh repo list OWNER` lists repositories owned by that user/organization; it is not equivalent to all repositories the authenticated account can access. See [CLI repository listing](https://cli.github.com/manual/gh_repo_list) and [authenticated REST listing](https://docs.github.com/en/rest/repos/repos#list-repositories-for-the-authenticated-user).

Without authentication, work with an explicitly supplied public repository or local/uploaded source. Do not send private repository names, source snippets, or secrets to public web search. If setup is needed, identify the specific missing connection once and continue independent useful work.

## 4. Prepare a safe working copy

After target resolution, inspect repository guidance, README, manifests/lockfiles, entrypoints, recent relevant changes, and tests. Confirm the default or requested branch; never assume it is main. Record a base revision and the chosen workspace.

Reuse an existing suitable checkout. Check branch and working tree before editing. Preserve uncommitted work, unrelated edits, and existing user branches. If isolation is needed, use a separate branch/worktree or a new clone in a collision-free task directory; do not reset, stash, switch a dirty tree, or overwrite a directory automatically. Be explicit whether a new worktree contains only committed changes or whether the current uncommitted project is the intended input. Do not silently omit user work by basing the redesign on an older commit.

A selected private repository may be cloned to the authorized local/host workspace for the requested work. Do not upload it to a different external service or publish a preview without applicable authorization. A clone is not an instruction to execute arbitrary setup scripts. Inspect package scripts, hooks/configuration, and required environment steps before running them under host rules; avoid broad dependency upgrades or install scripts unrelated to the task.

## 5. Apply the full skill

Infer the project goal, preserve contract, audience, stack, and relevant domains. Audit all applicable areas and produce the improved working spec. Keep the repository's architecture and design identity unless evidence justifies a change. Use visual recipes only when relevant; “anti-slopify” is not a framework migration or a request for generic cards/gradients.

Make focused edits, run the established checks, inspect key user flows and visual output where available, and compare the final diff to the stated scope. Remove accidental generated files and unrelated formatting from your own changes without deleting user work. Record baseline failures separately and disclose unavailable secrets/services without asking the user to paste credentials.

Default deliverable: reviewed local changes, exported revised files, or an applicable patch plus evidence. A read-only connector can support an audit/patch but cannot prove runtime behavior. A local build success does not prove a deployed site changed.

## 6. Commit, push, PR, merge, and deploy independently

Respect explicit session authorization and host workflow rules. A generic redesign invocation authorizes ordinary reversible edits in the selected workspace; it does not automatically authorize a remote push, PR, merge, release, production deployment, repository deletion, visibility change, or permission change. Do not manufacture commits merely as checkpoints. If the user explicitly asks for a PR, perform the necessary branch/commit/push/PR steps within that scope and host policy without redundant permission questions; merging and deploying remain separate unless authorized.

Before any authorized remote write, confirm target host, owner/repo, branch, intended diff, tests, and absence of accidental secrets/artifacts. Check whether CI or preview automation will run on push and account for known consequential side effects. Prefer a review branch and draft PR when appropriate. Never force-push or replace a protected/default branch as a shortcut. If remote work fails, check existing state before retrying to avoid duplicate PRs or commits.

When final authorization is genuinely missing, finish all independently authorized implementation and validation first, then ask about the concrete prepared action. Explain any actual host approval block plainly; do not invent a universal approval ceremony for routine edits.

## 7. Handoff

Report repository, branch/base revision when relevant, changed behavior, preserved strengths, checks and limitations, and where the user can review the result. Distinguish local changes from commits, pushes, PR creation, merging, and deployment. Include a concise next step only when required. Do not expose a long inventory of private projects in a public-facing deliverable.

## Research basis

Verified November 15, 2026: [GitHub CLI API](https://cli.github.com/manual/gh_api), [authentication status](https://cli.github.com/manual/gh_auth_status), [repository list](https://cli.github.com/manual/gh_repo_list), [repository search](https://cli.github.com/manual/gh_search_repos), and [REST authenticated repositories](https://docs.github.com/en/rest/repos/repos#list-repositories-for-the-authenticated-user). These establish API/CLI behavior; this skill's selection and authorization workflow is an original policy for scoped redesign, not a claim that every connector exposes the same functions.

## Reusing other GitHub repositories

Finding the target project and selecting external capabilities are different tasks. After resolving the target, use [selective GitHub reuse](selective-github-reuse.md) only for demonstrated gaps. The discovery helper is not a global tool recommender or installer. Do not clone/install every repository in the source recording.
