# Preserved Anti-Slop helper documentation

For Peter Project OS installation and commands use [QUICK_START.md](QUICK_START.md). The following inherited documentation describes the preserved helpers and methods; historical release and folder names are provenance, not the active package identity.

# Anti-Slop Refinement v4.3

Universal, one-command autonomous redesign built from the supplied v3 package. Start with [QUICK_START.md](QUICK_START.md), then invoke `Run $anti-slop-refinement on this project.`

The skill automatically infers the brief, audits the applicable dimensions, improves the specification, implements justified changes, and verifies against an evidence-based rubric. It covers apps, websites, code, writing, documents, presentations, dashboards, research, and creative projects. It does not grant tool access or authorize unrelated actions.

## Preserved methods and provenance

All three v3 methods remain: deliberate structural refinement; measured reference interpretation; restrained attention through relative quiet/loud roles. The original source summaries, reference/color engines, scenario playbooks, templates, Python utilities, and tests are retained. The old entrypoint is preserved verbatim in `references/v3-original-skill.md`. Those source summaries document prior inspection; this update does not claim a new transcription or independent verification of the original Reels.

The new SKILL.md is authoritative for v4 orchestration. The new `references/autonomous-workflow.md` supplies scope and inference rules; `references/universal-workflows.md` adds detailed medium-specific execution and validation; the rubric gains explicit unknown/failure handling; `assets/redesign-brief-template.md` is filled by the agent. Legacy specialized prompts remain optional. See CHANGELOG.md and VALIDATION.md for changes and checks.

## Optional palette utility

From this skill folder:

```sh
python3 scripts/palette_probe.py --spec assets/color-tokens-example.json --json palette-report.json --html palette-preview.html --strict
python3 -m unittest discover -s tests -v
```

Uses Python's standard library. `--strict` exits 2 when a declared pair fails. The example palette is illustrative, not extracted from a Reel. Contrast-pair success does not certify application accessibility.

## Optional video utility

Requires Python with OpenCV (`opencv-python`), NumPy, and Pillow, preferably in an isolated environment. Other workflows need no video dependencies.

```sh
python3 scripts/reference_probe.py inspect --video reference.mp4
python3 scripts/reference_probe.py frames --video reference.mp4 --fps 5 --out frames
python3 scripts/reference_probe.py activity --video reference.mp4 --fps 10 --out activity
python3 scripts/reference_probe.py compare --reference reference.mp4 --candidate candidate.mp4 --fps 10 --out comparison
```

Use fresh output directories to avoid overwriting prior reports. Match viewport, trigger, crop, and relative times before comparing. The script measures sampled pixel changes, not source code, exact easing, audio, accessibility, or perceptual equivalence. Its success exit alone is not a fidelity acceptance gate: inspect coverage and per-frame results against the spec.

## v4.1 visual library

All 22 treatments from the supplied screenshot now have detailed identity, selection, construction, tuning, validation, and fallback guidance. Start at [the router](references/visual-treatments/INDEX.md); four family files provide the depth, and [the research register](references/visual-treatments/sources.md) links 16 primary/documentation sources. Recipes are original synthesis, not benchmarked renderers. Existing methods, utilities, domain workflows, and token discipline remain.

## v4.2 agent adaptation and GitHub discovery

The [agent adapter](references/agent-adaptation.md) selects workflows from actual tools and permissions; the [GitHub workflow](references/github-workflow.md) resolves repositories, preserves working changes, implements redesigns, and separates local edits from remote delivery. “Find my portfolio on GitHub and anti-slopify it” is now a supported request. No account is connected or modified merely by installing the skill.

Optional CLI fallback (Python 3.9+, authenticated `gh`):

```sh
python3 scripts/github_discover.py --query portfolio --limit 5
python3 -m unittest discover -s tests -v
```

The helper makes GET requests only, lists accessible repository metadata with bounded pagination, ranks matches locally, and reports incomplete coverage. Default host is github.com; select `--host` for a known enterprise host. It never automatically selects, clones, edits, pushes, or creates a PR. Prefer a suitable available connector. Tests use mocked responses and do not access your account.

## v4.3 selective reuse

The [reuse workflow](references/selective-github-reuse.md) selects capabilities from demonstrated project needs, reuses existing tools first, and validates a small integration before retention. [Nine recording-derived leads](references/repo-reuse-catalog.md) are documented without bundling third-party code. The optional evidence gate accepts a JSON record and makes no network requests or changes:

```sh
python3 scripts/reuse_gate.py assets/reuse-gate-example.json
```

The example intentionally returns HOLD (exit 1), because its evidence is unknown. Exit 0 means NO_ADDITION, PILOT_ALLOWED, or KEEP as stated in the JSON; it never means independent approval. Exit 2 means invalid input. The eight new tests are offline decision fixtures.
