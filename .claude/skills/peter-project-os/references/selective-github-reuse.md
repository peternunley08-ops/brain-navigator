# Selective GitHub reuse — needs first, smallest useful addition

This workflow supplements repository discovery. It selects external capabilities for the target project; it does not confuse the repository being redesigned with repositories that may supply tools. A normal Anti-Slop invocation may use this workflow automatically when a concrete gap appears. “Automatically apply” means evidence-based selection and scoped implementation, not installing a stack of popular repositories.

## 1. Identify the missing capability

After auditing the target and current host, write one sentence: **Because [observed failure], we need [capability] to achieve [acceptance test].** Examples: inspect responsive layout; parse a difficult document format; improve an actual accessibility defect; make repeated agent handoffs reproducible. “This repository has many stars” is not a need.

First inspect the project's dependencies, components, lockfile, toolchain, available host tools/skills, and relevant configuration. Reuse an installed equivalent. Improve existing code when that is simpler and reliable. A small local implementation may be preferable for trivial behavior, but do not reinvent complex security, parsing, or accessibility behavior solely to avoid a dependency count.

Classify the need before searching:

| Kind | Preferred use | Do not silently add |
| --- | --- | --- |
| Reasoning/design method | Read a relevant section or apply existing skill | New global instruction file or full framework |
| Task-specific agent skill | Activate an existing skill or isolate one compatible module | Entire collection and all dependencies |
| Development/test tool | Run an existing tool; otherwise scoped temporary/dev dependency | Production runtime dependency |
| Product library/component | Smallest supported package/subpath with required behavior | Starter app, second UI system, unused modules |
| Agent orchestration/harness | Existing host facilities first; assess only for a demonstrated workflow gap | Replacement agent runtime, delegation, hooks, daemons |
| Persistent memory/service | Only when durable state is truly required and authorized | External data upload, vector database, background process |

## 2. Discover a small candidate set

Use the [recording-derived catalog](repo-reuse-catalog.md) as leads only for relevant agent-tooling needs. It is not an allowlist or a promise that these repositories remain suitable. Search beyond it when the requirement concerns application libraries, a specific format, or an ecosystem the catalog does not address.

Search by needed capability plus actual language/framework/platform. Prefer canonical upstream repositories and official package documentation. Use suitable GitHub connector search; otherwise use supported public repository search/CLI. The existing `github_discover.py` finds the user's accessible projects, not a curated global dependency index. Never send private code or confidential project details to public search.

Start with at most three credible alternatives plus **no new dependency**. Expand only if none meets requirements or evidence is inadequate. Inspect relevant README sections, module boundaries, manifests, release information, licenses/NOTICE, tests, issue patterns, and install behavior. Avoid cloning all candidates or loading all skill bodies into context. Do not rank by stars, hype, or screenshot claims.

## 3. Build an evidence-backed candidate record

Use [reuse decision template](../assets/reuse-decision-template.md) in existing project notes or compact working context. For each serious candidate record:

- Exact upstream URL and chosen package/module/files; verified source identity and registry-to-repository mapping where applicable.
- Tag/version plus immutable source revision or package integrity/lockfile resolution. A branch name such as main is not a reproducible pin.
- Required capability, inspected evidence, why existing tools are insufficient, and the no-addition alternative.
- Host/OS/runtime/framework versions, peer dependencies, supported API, native binaries, and portability requirements.
- License and attribution obligations at the actual module/revision, including embedded assets and dependencies. Do not assume a root license covers every subfolder. Unknown reuse terms block incorporation, not the entire project; use an alternative. Escalate only a consequential unresolved licensing choice, not routine compliant reuse.
- Maintenance appropriate to the component: release history, archived status, response to material issues, tests, documented support. A stable small library need not have daily commits; activity and scores are signals, not guarantees.
- Security evidence relevant to the chosen version: known advisories, permissions, install scripts, hooks, network/data behavior, update process. Absence of known advisories is not proof of safety.
- Full incremental cost: direct/transitive dependencies, runtime bundle, install/build weight, services, permissions, configuration files, active prompt/tool schemas, and ongoing upkeep. Distinguish measured, estimated, and unknown values.

Reject unjustified scope expansion, incompatible interfaces, unresolved incorporation rights, or conflicting host instructions. Never compensate for a failed gate with a high aggregate quality score.

## 4. Choose the least costly sufficient form

Prefer, in order when capability is equivalent: existing capability → read/reference only → one existing optional module → isolated temporary tool → focused dev dependency → focused runtime dependency. This is a decision ladder, not a rule that copied code is always safer than a maintained package.

For third-party skills, apply only relevant instructions after review, under the current host's instruction hierarchy. Do not import permission changes, mandatory delegation, telemetry, auto-updaters, auto-commit/push hooks, or broad role instructions. If behavior relies on the full framework, do not claim that copying a single file yields a working standalone skill. Select another candidate or disclose the actual footprint.

For code reuse, prefer a maintained package/API over arbitrary file copying when integration/update reliability benefits. If adapting licensed source, retain required notices, provenance, and a reviewable upstream revision; document local divergence. Never strip attribution or falsely present copied code as original.

For a monorepo, inspect the relevant module and dependency closure; use a supported package/subpath or scoped checkout where practical. Partial cloning reduces download volume, not necessarily runtime weight. Tree shaking/lazy loading may help but must be verified in the real production build; package download size alone is not application bundle size.

## 5. Autonomy and resource rules

Proceed without a redundant permission question for a routine reversible project-local addition that meets the user's goal, passes evidence gates, fits existing authorization, and does not introduce a consequential new service, permission, recurring cost, or global change. Announce the benefit briefly and execute. Installation steps still follow host approvals and tool restrictions.

Global installs, replacing the agent harness, enabling multi-agent orchestration, persistent memory, new MCP servers, external account access, recurring jobs, background daemons, and paid services are separate scope decisions. Prefer a no-install/local alternative; prepare concrete consequences before requesting genuinely missing authorization. This skill never enables cron jobs or auto-update loops as part of reuse.

Default to one new capability pilot at a time and one provider per capability unless complementary roles are demonstrated. Carry no universal package-count or kilobyte cap: respect project-defined budgets and assess total impact. Set a justified acceptance threshold before the pilot when measuring a meaningful cost. With no reliable measurement, do not claim “zero bloat” or token savings.

Reuse source metadata for the same pinned revision during this task. Recheck time-sensitive advisories and compatibility when selecting a new version. Do not poll GitHub or run scheduled maintenance by default. Load only the chosen skill sections; avoid keeping several overlapping agent frameworks active.

## 6. Pilot → integrate → measure → keep or roll back

1. Record baseline function and relevant footprint. Preserve working changes and use an isolated test area/branch when needed.
2. Inspect install/build scripts before execution. Follow the ecosystem's reproducible dependency practices and current host policy. Suppressing install scripts can reduce exposure but can also prevent required native builds; it is not a security sandbox. Do not run copied `curl | sh` commands blindly.
3. Implement the smallest vertical slice that exercises the actual need. Separate tool-time additions from product runtime dependencies. Keep the same package manager and lockfile strategy; avoid broad upgrades.
4. Verify the promised behavior end to end, error/edge cases, compatibility, and affected tests. For visual work render the actual result. Run appropriate dependency/advisory checks when available; distinguish pre-existing findings from introduced ones.
5. Measure incremental footprint using comparable baseline/candidate conditions: build artifacts/chunks, dependency graph, install cost, latency/memory, or loaded context as appropriate. State exclusions and uncertainty. Tests of a toy example do not prove the real integration.
6. Keep only if capability and regression gates pass and footprint is acceptable. Otherwise remove only additions made by this attempt, restore its specific config/lockfile changes safely, and try the simpler alternative. Do not reset unrelated work or remove existing tools merely because they are unused in this one task.
7. Record the chosen revision, purpose, exact retained pieces, evidence, upgrade owner/process, and removal procedure. Clear temporary agents/services started for the pilot when safe. Future cleanup of shared dependencies requires usage evidence.

Finish integration rather than merely recommending a repository when the tools and authorization allow it. If blocked, deliver the useful patch/spec and exact missing capability. A rejected candidate is a successful decision if the project is better without it.

## Optional evidence gate helper

`scripts/reuse_gate.py` checks a structured candidate record and reports `NO_ADDITION`, `REJECT`, `HOLD`, `PILOT_ALLOWED`, or `KEEP`. It is local and read-only: it does not search, install, or independently verify the supplied evidence. Its output never overrides host policy or authorization. Use it when a reusable formal check helps; do not create administrative files for a trivial reference-only decision. See [gate example](../assets/reuse-gate-example.json) and tests.

## Research basis and limitations

[GitHub dependency review](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/customize-dependency-review-action) supports examining dependency changes, advisories, licenses, and scopes; feature availability and configured policies matter. [OpenSSF Scorecard](https://github.com/ossf/scorecard) provides security-health signals; inspect relevant checks rather than treating the aggregate as approval. [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) documents lockfile-driven installs and script controls; use the corresponding official workflow for other ecosystems. These are supporting mechanisms, not instructions to install their tools in every project.
