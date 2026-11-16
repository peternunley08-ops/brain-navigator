---
name: anti-slop-refinement
description: Turn generic AI outputs into deliberate, audience-specific work using iterative refinement, evidence-based reference interpretation, and attention hierarchy (quiet foundations plus purposeful accents). Trigger for anti-slop, elevate/polish/refine, professional quality, improve hierarchy/UX, color palette, two quiet one loud, match or adapt a reference, pixel/frame-level recreation, motion fidelity, or universal creative workflow. Route by artifact, fidelity intent, correctness risk, and available evidence; test rather than guessing.
---

# Anti-Slop Refinement

## Purpose

Transform *generic first drafts* into *purposeful, distinctive, usable finished work*. Do not equate “premium” with dark mode, gradients, glassmorphism, excessive animation, impressive-looking but invented metrics, complicated architecture, or long prose. The goal is quality of decisions and execution—not an effect preset.

This skill combines **three source-inspired methods**:

1. **Refinement (first recording):** diagnose design problems, fix hierarchy and relationships, add purposeful detail, simplify navigation, and iterate.
2. **Evidence-based reconstruction (second recording):** inspect a real reference as *data*, describe appearance **and behavior over time**, implement from a written spec, compare sampled results to the reference, and iteratively close the gap.
3. **Attention by contrast (third recording):** build a coherent foundation of two relatively quiet color roles, then use a clearly differentiated accent for the important point. “Quiet” is **relative to the composition**; red may be a foundational field. This is a heuristic, **not** a universal three-color constraint.

**New in v3:** an advanced routing/decision framework that coordinates all three methods, a semantic color/attention system, explicit acceptance gates, an iteration log, color-contrast calculations, and a frame-activity diagnostic.

No Reel alone is a universal solution. The workflows for writing, software, research, presentations, and other media are principled extensions. Read `references/reel-method.md`, `references/reference-reel-method.md`, and `references/color-reel-method.md` for what the recordings actually demonstrate; never attribute our added frameworks or utilities to the creators.

## First decision: purpose, evidence, attention, and risk

**Read `references/advanced-decision-system.md` for projects that are complex, involve references, or cross multiple media.** Before producing the result, infer:

- **What must work?** Audience, intended outcome, constraints, must-keep details.
- **What does the source prove?** Observed/inferred/unknown; fidelity intent.
- **What should stand out?** The central action, idea, proof, or moment.
- **What must be tested?** Functional/temporal correctness, information integrity, accessibility, and risk.

Use **INTENT → EVIDENCE → MODEL → EXECUTE → VERIFY → LEARN** as the overarching sequence. In small tasks, compress it into a brief thought and deliver immediately. In complex tasks, document the hypothesis, the changes, and the results using `assets/decision-log-template.md` and `assets/attention-map-template.md`.

**Conflict rule:** explicit constraints, correct behavior, rights/privacy, and accessibility outrank novelty; faithful matching outranks creative reinterpretation when that is what the user actually asked for. Do not claim a visual result proves source code, interaction behavior, or all accessibility requirements.

## Trigger and operation modes

Use for “make this less AI-generated,” “anti-slop,” “refine this,” “elevate the design,” “premium but not generic,” “improve the UX,” “make it production quality,” “turn my draft into something great,” and new-build requests that invoke this skill.

Infer **one** operating mode:

- **AUDIT**: Analyze the existing artifact and give prioritized, concrete changes; do not pretend to have inspected unavailable content.
- **REFINE**: Directly improve an existing artifact while preserving correct content and intent.
- **BUILD**: Create a new artifact with built-in quality gates, then self-review.
- **SYSTEMIZE**: Establish reusable standards, templates, component rules, or a design/content system.
- **RECONSTRUCT**: Interpret a supplied reference (static or temporal) and produce a faithful recreation using observable evidence, a measured specification, and a comparison loop. This is different from a creative redesign.

Before working with references, determine the **fidelity intent**: (a) *exact/faithful reproduction*, (b) *same behavior with new content/style*, or (c) *inspiration/principles only*. Infer from the user's words and context; do not silently choose a pixel-perfect clone for a vague request. If intent remains unknowable, favor preserving the supplied project's identity and explaining assumptions. "Interpret this the same way" means **apply the observational method**, not automatically duplicate the pixels.

When the artifact or audience isn't specified, use available material and reasonable assumptions; ask **one essential question at most** if no meaningful work can proceed. Explicit user constraints override defaults. Do not invent capabilities, data, sources, or requirements.

## Reference Interpretation Engine: OBSERVE → SPECIFY → BUILD → COMPARE → CORRECT

**Always invoke this sub-workflow before ordinary aesthetic refinement when the user supplies a visual/behavioral reference or asks to match an example.** Full procedure: `references/reference-interpretation.md`. Create a working spec using `assets/reference-spec-template.md`. When video comparison tooling is available, `scripts/reference_probe.py` can extract time-indexed frames and produce *basic* pixel-difference reports. This script does not automatically infer animation curves or reveal application source code.

1. **OBSERVE:** inspect the *actual* user-supplied reference; never pretend a title, thumbnail, URL, or one frame proves the motion. Capture format, dimensions/viewport, duration, key states, scene elements, visible text, assets, entry/exit order, interactions, and a coarse timeline. Mark **observed / inferred / unknown** for every consequential detail. If audio is relevant, use actual audio access; silent frame inspection is not a transcript.
2. **SPECIFY:** turn visual impressions into measurable constraints. For animations, create rows of **element → start time → duration → property → from → to → easing/trajectory → evidence confidence**. Include the reference FPS, timeline zero event, viewport, triggers, DOM/canvas/WebGL uncertainty, and exact-vs-inspired fidelity. Sample **multiple frames**, especially transitions; use a fine temporal sample where motion is fast. For images, use geometry, typography, color and layering; for nonvisual artifacts, translate this to structure, behavior, evidence, and acceptance tests.
3. **BUILD:** implement the simplest architecture that can reproduce required results. Preserve the project's own content and working behavior. Do **not** assume a visual effect is CSS/DOM when the reference may be canvas, SVG, WebGL, or composited layers. Use whatever stack is appropriate and permitted; rendering technology cannot usually be proved by pixels alone.
4. **COMPARE:** render/capture **candidate and reference at matched time points, size, state, and triggers**. Start with composition and keyframe comparisons, then test motion paths, delays, acceleration, and endings. Use side-by-side, overlays, pixel diffs, and region-specific measurements where possible. Misaligned capture conditions invalidate quantitative comparisons; color/antialias differences also matter. Don't market a raw diff as perceptual accuracy.
5. **CORRECT:** pick the **largest demonstrable mismatch**, change the smallest relevant cause, and re-capture. Continue across **multiple frames/states**, not a single final screenshot. Track improvement/regressions and stop when acceptance criteria are met or evidence/tool limits block further progress.

If no artifact is attached or the tools cannot inspect video/audio/target app, say what cannot be verified and work from the available evidence. **Never claim frame-perfect reconstruction, motion fidelity, or an exact transcript without verifying it.**

**Cross-domain rule:** exact matching and creative improvement are separate objectives. When reconstructing, don't "improve" away reference details; when refining, don't copy reference decoration indiscriminately.

## Color & Attention Engine: AIM → FOUNDATION → EMPHASIS → TEST

**Invoke when:** a task concerns visual hierarchy, palettes, brand refinement, CTAs, dashboard/landing-page composition, or the third video. Full playbook: `references/color-attention-system.md`.

1. **AIM:** identify the exact element or moment that deserves attention and why. If multiple urgent priorities exist, clarify their relative hierarchy instead of highlighting everything.
2. **FOUNDATION:** assign stable semantic roles (`canvas`, `surface`, readable `text`, etc.), using two complementary low-competition roles as a useful starting point. These roles may be vivid in isolation but visually quiet relative to the composition.
3. **EMPHASIS:** assign one intentional focal accent to the primary action/idea. Use visual position, size, type, spacing, and contrast alongside color. A decorative accent without a job is noise.
4. **TEST:** evaluate the whole layout in context, including main task, thumbnail visibility, actual foreground/background contrast, status semantics, accessibility, and variants. More colors are allowed whenever data, identity, or status requires them. Never make color the sole carrier of meaning.

For color work, create semantic tokens before sprinkling hex values into components. Optional local tool: `scripts/palette_probe.py` checks explicitly defined contrast pairs against common WCAG 2.x thresholds and can render a static preview. Example: `python scripts/palette_probe.py --spec assets/color-tokens-example.json --html palette.html --strict`. The checker is **not** full accessibility certification and does not discover correct pairings from a screenshot automatically.

**Nonvisual adaptation:** treat “two quiet, one loud” as an *attention budget* metaphor. In writing, the focal thesis can stand out against organized support; in software, a critical error can stand out against predictable UI/API behavior. Don't mechanically limit the work to three objects, categories, paragraphs, or classes.

## The governing loop: DIAGNOSE → STRUCTURE → DELIGHT → SIMPLIFY → VERIFY

Use this as a decision process, not a rigid checklist. Do not add features just to complete a pass. In RECONSTRUCT mode, the reference engine above governs source interpretation and correctness; the refinement loop improves clarity/craft **without replacing the requested reference behavior**.

### 0. Establish the actual job

Identify: target audience; their top task; the artifact's purpose; success condition; platform/format; constraints; desired tone; existing assets to preserve; and the single most important outcome. For an existing project, distinguish **keep**, **change**, and **unknown**. Prioritize genuine user value over superficial aesthetic novelty.

If the project is for people other than its creator, identify their likely reading/usage context and accessibility needs. Never assume desktop-only when mobile or touch use is plausible.

### 1. DIAGNOSE: make “slop” a specific, testable problem

Look for:

1. **Ambiguous purpose** — no obvious next step, value proposition, or intended result.
2. **Flat hierarchy** — everything shouts, or the most important item is buried.
3. **Unrelated grouping** — content/actions are scattered or artificially repeated.
4. **Template residue** — stock phrases, placeholder stats, generic cards, overused visual motifs, unused sections.
5. **Decoration without function** — animation, glass, gradients, icons, or buzzwords that add cognitive load.
6. **Friction** — unclear labels, excessive navigation, unnecessary steps, bad states, inaccessible interactions.
7. **Trust failures** — unverifiable claims, fictitious data, inaccurate logic, missing provenance, false certainty.
8. **Inconsistency** — mismatched spacing, typography, behaviors, terminology, visuals, or architecture.

Return a concise diagnosis: what is weak, **why it is weak for this user**, and the intended improvement. Prefer 3 high-impact findings to 20 vague comments. Distinguish *observed* facts from *inferred* problems.

### 2. STRUCTURE: solve hierarchy before decoration

- Rank elements by task importance, frequency, and consequence.
- Establish a primary action or primary message. Secondary actions must remain discoverable but not compete.
- Group by **user relationship and workflow**, not merely visual similarity.
- Organize into clear sections with informative, non-generic labels.
- Use progressive disclosure: surface essentials; fold secondary complexity into meaningful sections, links, detail views, or reusable references.
- Choose defaults appropriate to the medium (page layout, outline, information architecture, code modules, learning sequence, narrative order).
- Improve copy/naming so it describes a genuine action or fact.

**Rule:** Do not add visual polish until the top task is clear and the information architecture makes sense.

### 3. DELIGHT: add a small number of purposeful details

Pick **0–3** intentional enhancements that improve understanding, feedback, identity, memorability, or flow. Use the Color & Attention Engine where visual salience matters; decide the *role* of each high-contrast element before picking a trendy hue. Examples: contextual button language on hover/focus, a restrained transition showing action completion, a strong original illustration, a well-written lead, useful inline validation, a meaningful analogy, or a keyboard shortcut for frequent tasks.

For digital UI, effects must respect input modality (touch has no hover), reduced-motion preference, contrast, performance, and functional feedback. A demo's paper-plane animation or frosted panels are **examples**, never mandatory defaults. If the artifact is text, do not simulate animation—use rhythm, examples, and precise language instead.

### 4. SIMPLIFY: remove noise after polishing

- Eliminate duplicate components/claims and filler sentences.
- Reorder according to how users actually operate, read, decide, or learn.
- Collapse low-priority detail without hiding essential controls, citations, or safety information.
- Consolidate related navigation; use group names and consistent icons only when they improve scanning.
- Make power-user affordances optional and discoverable (e.g. command search in complex desktop UI, search within a long report, a table of contents for a long document).
- Remove any enhancement that makes the central task slower, harder to understand, or less accessible.

**Challenge:** If one component, adjective, animation, chart, dependency, or paragraph disappeared, would the experience improve? Remove it if yes.

### 5. VERIFY: prove the improvement rather than proclaim it

Use the domain-specific checks in `references/scenario-playbooks.md` and the scoring rubric in `references/audit-scorecard.md`. Test the most important task or claim end to end, including at least one edge case. For visual UI, test keyboard/touch/desktop sizes and color role contrast pairs when practical; for writing, test argument/evidence/clarity; for code, run real tests when tooling exists; for reports, verify data and citation integrity. Never state an unrun test passed.

Repeat with a focused revision if the artifact is still weak. Stop when meaningful success criteria are met or improvements would add complexity for marginal gain. In tool-limited environments, clearly state what remains unverified.

## Operating intensity

Select based on project complexity and user intent:

| Level | When | Output |
| --- | --- | --- |
| **Quick** | Small edit, short copy, minor component | Top 1–3 issues → revised result → one check |
| **Standard** | Page, essay, presentation, feature, design concept | Short audit → prioritized plan → revised artifact → QA summary |
| **Deep** | Multi-screen system, production app, long report, complex workflow | Requirements → architecture → focused iteration passes → edge-case testing → handoff and backlog |

Do not ask the user to select a level if the appropriate one is obvious. Time/budget/tool limits take precedence.

## Scenario router

Select the relevant reference section instead of applying everything:

- **Reference-driven work (including UI/video/animation):** `references/reference-interpretation.md`, plus `assets/reference-spec-template.md`; use reference-probe script when suitable.
- **Palettes / visual attention / accent strategy:** `references/color-attention-system.md` plus `assets/attention-map-template.md`; check actual token pairs with `scripts/palette_probe.py`.
- **Complex multi-domain projects:** `references/advanced-decision-system.md` and the decision log; explicit priorities and verification gates.
- UI, dashboard, website, app → `references/scenario-playbooks.md` § UI and product.
- Brand, static graphics, image prompt → § Visual and creative.
- Writing, essays, reports, research → § Writing and evidence.
- Slide decks and learning material → § Presentations and education.
- Code, APIs, automations, AI agents → § Software and systems.
- Marketing and outreach → § Marketing and communication.

The cross-domain translation is **hierarchy → structure → intentional attention → progressive disclosure → verification**. Hover states, visual glass, and command palettes are **medium-specific**, not universal.

## Response contract

Unless the user requests only a specific artifact or format, provide:

1. **Goal and what was preserved** (one short statement).
2. **Biggest improvements** (at most 3–5, tied to real user benefit).
3. **The improved deliverable** (not merely advice) when editing/creation is requested and tools allow it.
4. **Verification** (what was checked, and what couldn't be checked).
5. **Next iteration** only if truly useful.

For color/attention work report the **focal element**, the semantic roles or attention strategy chosen, and any contrast/visibility checks actually run.

For RECONSTRUCT mode also report the **fidelity target**, the observed evidence and assumptions, and at least one comparison result or a clear explanation of why comparison was not possible. A quantified score only means what the stated method measures.

Avoid statements like “now it feels premium” without describing observable changes. Do not replace meaningful content with empty elegance. If an artifact cannot be accessed, request it or present a clearly labeled general plan—not a fabricated project-specific critique.

## Anti-patterns and rules

- **No aesthetic cargo cult:** do not automatically use dark mode, frosted glass, gradients, rounded cards, purple palettes, animated icons, neon accents, or generic futuristic motifs.
- **No fake substance:** don't invent metrics, case studies, quotes, testimonials, sources, testing outcomes, or functional implementations.
- **No novelty tax:** enhancements require a benefit; zero microinteractions is a valid outcome. One focal accent is a useful heuristic, not a mandatory three-color palette.
- **No destructive makeover:** preserve working functionality, source meaning, brand requirements, and user-provided facts unless asked to change them.
- **No inaccessible polish:** motion sensitivity, contrast, readable type, responsive layouts, keyboard navigation, and touch parity matter.
- **No one-shot illusion:** keep a short evidence-driven review loop; stop when quality is sufficiently high rather than cycling forever.
- **No screenshot-as-video fallacy:** motion requires time samples and trigger context. Don't invent behavior from stills.
- **No unmeasured fidelity claims:** match capture conditions before computing visual errors; report the limits of the metric.
- **No source-code hallucination:** rendered pixels do not prove DOM structure, hidden libraries, shaders, event handlers, or private source.
- **Respect supplied material:** adhere to license/rights, privacy, and requested scope; don't use inaccessible or private third-party source code.
- **No unnecessary interrogation:** make grounded defaults and deliver useful work.

## Resources

- `references/reel-method.md`: source-grounded breakdown of first uploaded dashboard-improvement video.
- `references/reference-reel-method.md`: source-grounded breakdown of second uploaded animation-reconstruction video.
- `references/color-reel-method.md`: source-grounded observations from the third Reel demonstrating coherent color pairs and high-contrast focal accents.
- `references/color-attention-system.md`: color role assignment, attention budget, contrast and semantic-color verification.
- `references/advanced-decision-system.md`: cross-method router, conflict resolution, objective hypotheses, risk-adjusted release gates.
- `references/reference-interpretation.md`: evidence-first reverse-engineering workflow, modality adaptations, and verification strategy.
- `scripts/reference_probe.py`: local, optional frame extraction, frame-activity measurement, and before-vs-after pixel-difference helper.
- `scripts/palette_probe.py`: dependency-free color role contrast checker and optional HTML preview.
- `tests/test_palette_probe.py`: runnable known-value color math tests.
- `assets/color-tokens-example.json`: example semantic color tokens and real pair checks (illustrative only).
- `assets/attention-map-template.md`: focal priority mapping.
- `assets/decision-log-template.md`: reproducible change/test record.
- `assets/reference-spec-template.md`: structured interpretation and temporal-spec template.
- `references/scenario-playbooks.md`: specific recommendations, analogies, and acceptance checks across project types.
- `references/audit-scorecard.md`: consistent weighted scoring and priority logic.
- `references/prompt-library.md`: reusable commands for diagnosis, redesign, interaction, simplification, and verification.
- `assets/project-brief-template.md`: optional brief for complex projects.
