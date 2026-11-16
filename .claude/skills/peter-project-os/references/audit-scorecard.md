# Anti-Slop Scorecard (optional, evidence-based)

Use for meaningful before/after comparisons or complex projects. Skip numerical scoring when the task is a tiny edit or when the evidence is too limited. Ratings are judgments, not precise scientific measurements.

Rate each dimension from **0 to 5** using real observations. Multiply by the weight to compute a score out of 100: total = sum(weight × rating / 5).

| Dimension | Weight | 0–1 looks like | 4–5 looks like |
| --- | ---: | --- | --- |
| Purpose and task fit | 20 | Unclear audience/job; wrong task | Primary purpose immediately clear; strong relevance |
| Function and correctness | 20 | Broken flow, fake facts, gaps | Key path works; facts and logic reliable |
| Hierarchy and organization | 15 | Flat/chaotic, unrelated items mixed | Priorities and group relationships obvious |
| Specificity and distinctiveness | 15 | Generic stock content or template clichés | Concrete, audience-specific, coherent identity |
| Ease and interaction | 10 | Friction, ambiguity, buried controls | Clear journey, useful feedback, minimal effort |
| Craft and consistency | 10 | Arbitrary styles, erratic voice, rough edges | Consistent, deliberate polish without clutter |
| Accessibility and resilience | 10 | Excludes users / breaks in edge cases | Readable, appropriate affordances, handles constraints |

Score interpretation: **0–49** foundational repair; **50–69** structural improvement; **70–84** targeted refinement; **85–100** quality sufficient to ship *subject to actual verification*. Never award a high numerical score because an artifact simply looks polished.

## Priority of fixes

Estimate (impact × frequency × risk) / effort using qualitative **high/medium/low** levels. Prefer repairs to correctness, clarity, and core workflow over styling. Choose up to three focused edits for each pass and re-evaluate afterward.

## Minimum gates regardless of score

- No fabricated evidence or false claims of tests.
- Purpose and primary action/conclusion are clear.
- Core requirement meets the user's brief.
- Important edge cases addressed or explicitly flagged.
- Accessibility and legibility are not sacrificed to decoration.
- Final output is actually delivered when tools permit.

A score is a prompt to reason, not a substitute for judgment. If the domain makes a dimension irrelevant, explicitly redistribute weight rather than penalizing it silently.

## Additional gate: reference fidelity (only in RECONSTRUCT mode)

Do **not** hide reference mismatches within the general anti-slop score. Report these as a separate checklist:

- **Reference coverage:** actual source media inspected; frames/states/timestamps specified; observation and inference separate.
- **Geometry/content similarity:** dimensions, placement, typography, layers, and key content matched within agreed tolerance.
- **Temporal similarity:** trigger, relative timing, direction, path, easing, and exit states compared at multiple points where relevant.
- **Functional equivalence:** real interaction and edge cases behave as required, not merely a video of an interaction.
- **Metric credibility:** alignment, crop, FPS, input conditions, and limits of error metric disclosed.
- **Unknowns:** assets or internal behavior that cannot be verified explicitly identified.

Prefer factual results (e.g., “12 matched timestamps compared; the peak region differs near the transition”) over an invented 97% fidelity rating. Only claim an exact match where all required observable states actually pass applicable tests.


## Attention and color audit (separate from total score)

Use only when relevant, and **do not** replace the functional score with palette prettiness.

- **Focal alignment:** Does the most visually salient element match the real priority?
- **Role consistency:** Are primary canvas, support surface, text, accent, and semantic feedback distinguishable and reusable?
- **Restraint:** Is focal emphasis scarce enough to remain meaningful?
- **Legibility:** Were actual foreground/background pairs checked at real sizes/states?
- **Non-color cues:** Do meaning and state remain clear in grayscale or to people with color-vision differences?
- **Cross-context:** Does the hierarchy survive mobile, thumbnail, dark/light, and user settings where applicable?

When making a release claim, report the tested color pairs and ratios from the palette checker *only if it ran*. Additional semantic, touch, focus, and visual tests remain manual unless independently verified. A palette with all supplied pairs passing is **not automatically an accessible application**.

## v4 autonomous redesign gate protocol

For substantive redesigns, record a before/after rating with evidence for each applicable dimension using the weights above. Set the applicability and acceptance criteria before edits. An uninspected dimension is **unknown**, not zero or five; do not produce a headline overall score when required dimensions lack evidence. For genuinely inapplicable dimensions, document the reason and normalize applicable weights to 100. Use the same weights before and after.

Use `dimension | baseline evidence/rating | final evidence/rating | check status | residual limitation`. Scores are reasoned editorial judgments, not user-study results. Record separate fidelity and attention checks as applicable. No automatic passing threshold supersedes the gates below.

Required gates: deliverable exists and opens where testable; primary task/meaning preserved; explicit constraints satisfied; no known introduced critical regression or data loss; consequential claims supported; relevant accessibility and edge cases checked; requested fidelity verified or clearly limited; changes within authorization; tests represented truthfully.

Check statuses are **pass, fail, not run, blocked, not applicable**. A failed or unverified required gate prevents an unconditional completion claim. Report implemented-with-limits or partial status, and continue correcting actionable failures when tools permit. When a tiny edit does not justify numerical scoring, still apply the relevant gate checks and report concise evidence.

## v4.1 visual treatment gate

For selected effects, record the treatment's purpose, implementation fidelity, composited legibility, content/data integrity, pattern artifacts, motion behavior, performance evidence, export compatibility, and fallback. Use the existing pass/fail/not-run/blocked/N/A statuses. Reject a treatment that reduces primary task success even if it looks distinctive. No points are awarded for using more effects. Do not average a failed accessibility or data-integrity gate into a passing craft score.

## v4.3 reuse gate

A new external capability must solve an observed gap, preserve project behavior, meet compatibility/rights/authorization requirements, and justify incremental runtime, dependency, instruction-context, and maintenance cost. Record baseline and actual results; unknown costs are not zero. No addition is an acceptable outcome. Failed post-integration function, regression, or footprint gates require correction or scoped rollback, not a higher cosmetic score.
