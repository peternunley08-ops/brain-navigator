# Evidence-driven engineering

Use for a substantive feature, repair or operational project. Adapt the detail to risk. The recordings motivate stronger verification and reusable context; this workflow is an interpretation, not a transcript or endorsement of named vendors.

## Build a compact evidence packet
Record target/revision and affected surface, expected outcome, exact reproduction steps, observed outcome, relevant redacted error/trace, environment, and a concrete success check. For a bug, reproduce before editing where feasible; if not reproducible, distinguish hypothesis from diagnosis and collect the smallest missing evidence. For a feature, define its primary task and important error/cancel/retry states. Preserve the original failing example so validation cannot drift toward an easier case.

Use logs, source and realistic fixtures together. Do not copy secrets, full user databases or private conversations into prompts. Browser evidence should include decisive state and route; backend changes may need actual persisted state as well. If only a mock is available, state that external integration is unverified.

## Plan at the level that reduces uncertainty
A small bug needs a short hypothesis and patch. A cross-system feature needs interfaces, changed files, invariants and validation steps before edits. Ask the current agent to surface missing edge cases and dependencies; this improves the spec without requiring Peter to write an exhaustive prompt. Inspect repository guidance before choosing commands. Do not turn every change into a large planning document or install a plan framework.

## Isolate when shared state matters
Check working status, branch and active work first. Use the existing host worktree where suitable; create an additional worktree only for a concrete isolation need. Git worktrees isolate checked-out files and index/HEAD, but do not isolate databases, ports, cloud accounts, caches, secrets or external services. Assign task-specific local ports/data stores/test accounts where supported, with synthetic fixtures. Do not clone production data or create a paid cloud environment by default. Record which state is shared; cleanup only resources created for this task after confirming they are disposable. Never force-remove a dirty worktree.

## Implement and test the user-visible outcome
1. Reproduce or establish baseline and known failures.
2. Change the smallest coherent cause; avoid bundling unrelated refactors.
3. Run meaningful targeted checks and repeat the original action under equivalent conditions.
4. Check adjacent regressions and inspect actual rendered state where applicable.
5. Review the diff against the preserve contract and delivery destination.

Use existing runners first. For browser tests prefer role/label locators and assertions that wait for expected state, avoiding arbitrary sleeps. Keep tests isolated and control third-party responses when appropriate; then separately identify which integrations remain untested. A mocked payment success does not validate real billing. Do not add Playwright to a project merely because this guide mentions it.

Scale validation: text/style edits → relevant output inspection; code behavior → regression and integration checks; auth/sync/data/hardware → explicit failure cases and stronger review. Assess accessibility and keyboard/touch when relevant. Never weaken a failing test just to pass. After correcting a failure rerun affected checks; do not repeat an unchanged full suite without a reason.

## Maintain the verification playbook only when useful

When a meaningful flow is added or a real escaped defect exposes a missing check, extend the existing project test/verification guidance with setup, synthetic fixture, exact user steps, expected UI and persisted state, failure/recovery case, and how to reset only test-created data. Link the relevant test or scenario instead of duplicating a long procedure. Verify the procedure actually works before calling it reusable. If no guidance exists, add a small project-local document only when future reuse justifies it; a one-off CSS change does not need one. Never automatically rewrite global skills from a single incident.

## Review without an agent tax
Check the diff yourself for missing cases, accidental scope, secret exposure, stale exports and mismatched claims. An independent reviewer can help on consequential work when authorized and available; give it exact diff, acceptance criteria and evidence without steering toward approval. Resolve substantive findings. Do not mandate two LLMs or launch parallel agents because a video recommends them. Multiple model opinions are not a substitute for tests. If independent review is absent, report it only where it limits a requested assurance.

## Bounded error-fixing loop
Reproduce → hypothesize → patch → verify → review. Two ineffective attempts on the same symptom trigger a different diagnosis, smaller reproduction or missing-evidence check. Stop destructive or unbounded retries. Never enable an always-on error bot, automatic merge or indefinite “Ralph loop” under this skill. A user-requested recurring system requires a separate explicit scope, stopping rules, permissions, observability and rollback design.

## Handoff and delivery
Use existing project notes rather than creating a second memory system. Save only what a next agent needs: target/base revision, branch, intent, preserve contract, changed files, exact checks/results, remaining blockers and authorization already given. A fresh agent verifies current state before continuing but does not reread everything. Keep credentials and unrelated private context out. A PR is a delivery option only when requested/authorized; inspect whether merge would publish. Do not claim an automatic monitoring or verification service exists.

## Primary research
Checked 2026-11-15. [Git worktree documentation](https://git-scm.com/docs/git-worktree) supports the linked-worktree mechanism; service isolation is an engineering requirement added here. [Playwright best practices](https://playwright.dev/docs/best-practices) supports testing user-visible behavior, isolated tests and resilient locators. These sources do not validate the user's repositories or promise a productivity multiplier.
