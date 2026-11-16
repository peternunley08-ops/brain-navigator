# Scenario playbooks

Load only the relevant section. Each subsection translates the **principle** from the source, not every surface-level technique.

## Reference-driven recreation (any medium, especially visual/temporal)

**Interpretation:** choose faithful / behavioral / principles mode from the user's actual wording. Inspect supplied media, not the title or a search snippet. Record observed/inferred/unknown; source reference interpretation in `reference-interpretation.md`.

**Structural evidence:** create geometry/content/layer/state spec; if there is motion, timestamp samples and state transitions. Capture trigger timing and input path. Don't assume CSS when canvas/other rendering is possible.

**Iteration:** compare reference vs candidate under aligned viewport, inputs, and relative times; prioritize largest mismatches; preserve semantic and functional behavior. Use the bundled local probe if frame capture/difference helps, but a simple pixel metric doesn't replace a user review.

**Check:** original visual evidence inspected, temporal claims grounded, fidelity target named, multiple relevant frames/states compared, unknowns disclosed. For anything nonvisual, replace "pixels" with source-faithful information structures, facts, and behaviors.

**Concrete prompt:** “Interpret this reference as observable evidence. Build a spec of what is visible, what changes over time, and what cannot be known. Recreate only the features my requested fidelity demands. Compare against the original at matched states/timestamps, fix the largest real difference, and report exactly what was verified.”

## Color, brand palette, and attention hierarchy

**Diagnose:** determine where a viewer's attention goes first vs where it should go. Examine surrounding saturation, type scale, proportion, negative space, and actual task. “Quiet” and “loud” describe **relative visual roles**; a bright red field may be a quiet foundation when a small yellow callout is the focal point.

**Structure:** pick semantic canvas/surface/text/accent/onAccent roles and appropriate status variants. Begin with a coherent two-role foundation and one focal accent if this serves the job. Preserve existing brand requirements; if a chart or semantic UI needs more colors, use them carefully.

**Delight:** accent only what matters; reinforce with positioning, shape and copy. A CTA can stand out without making every header, card and badge equally bright.

**Simplify:** stop repeating high-salience accents on low-priority components. Check grayscale and small-screen reading order.

**Check:** actual token pair contrast via `scripts/palette_probe.py` when local tools exist, normal text and UI focus, non-color-only meanings, hover/focus/touch states, component composition, and source-vs-inference boundaries. See `color-attention-system.md`.

**Concrete prompt:** “Find the one element that deserves attention. Establish quiet supporting surfaces, give the focal element a purposeful accent, validate text/action contrast and non-color cues, then compare the viewing hierarchy before and after.”

## UI and product: websites, dashboards, apps

**Diagnose:** identify user's primary job, strongest information, main CTA, cluttered navigation, generic/placeholder cards, missing states, misleading visual hierarchy.

**Structure:** prioritize by frequency/importance; group related cards and actions; make headings and labels precise; choose layout for actual content; distinguish summary from details; keep destructive actions appropriately separated. On analytics screens, include definitions, units, comparison periods, and source/refresh data where applicable.

**Delight:** high-quality visual composition, deliberate typography/spacing, a clear focal accent if useful, context-aware CTA language, useful feedback, hover/focus/pressed states, restrained motion, surface effects only when contrast and legibility remain strong. Define tokens for spacing, color, radius, type, state changes; avoid accumulating contradictory per-component styles.

**Simplify:** collapse nonessential information; order nav by user workflow; group categories with clear labels and useful icons; consider command search only for dense desktop workflows; do not conceal primary actions or make search the sole navigation method.

**Check:** primary task from start to finish; empty/loading/error/success states; keyboard and visible focus; mobile/touch; responsive overflow; contrast; reduced motion; reasonable performance. Never claim these pass unless evaluated.

**Concrete prompt:** “Audit this interface for the main user task. Keep business logic intact. Reorganize content by relationship and priority, make one CTA dominant, remove unused cards, add only interactions that provide feedback, then check touch/keyboard/contrast.”

## Visual and creative: illustrations, static designs, brand work

**Diagnose:** generic composition, overused style tropes, unclear focal point, diluted brand identity, excessive visual complexity, poor typographic rhythm.

**Structure:** define message, audience, focal subject, secondary story, visual proportions, hierarchy, negative space, contrast, and brand-specific constraints.

**Delight:** one original visual motif, thoughtful material/texture, unique composition, a deliberate interaction analog such as a visual reveal in a sequence (not literal hover in static art).

**Simplify:** remove gratuitous effects, unrelated decorative shapes, excessive hues, crowded captions, inconsistent texture styles.

**Check:** thumbnail readability; text legibility; continuity across variants; accessibility/contrast; fidelity to user references; no invented logos, statistics, or copyrighted design claims. For image prompts, validate key visible details and composition after render when possible.

## Writing and evidence: essays, reports, articles, proposals, research

**Diagnose:** no real thesis, filler opening, repetitive sections, stock adjectives, lack of specificity, weak evidence, buried recommendation, facts stated without support.

**Structure:** lead with the actual question and main conclusion; organize by reasoning or user decisions; group evidence near corresponding claims; use headings for scanability; separate facts, inferences, and recommendations.

**Delight:** a precise opening, one memorable concrete example, elegant transitions, strong but measured voice. Do not force jokes, metaphors, or flowery wording.

**Simplify:** remove boilerplate, redundant sentences, throat-clearing, buzzwords, and unsupported claims. For long reports, add executive summary, navigation, concise labels, and expandable appendices as appropriate.

**Check:** logic, accuracy, citations, quotes, counterarguments where relevant, audience level, requested length, style constraints, and originality. Never present conjecture as sourced fact.

**Concrete prompt:** “Keep my thesis and cited evidence. Improve argument hierarchy, merge related points, replace vague claims with examples grounded in my material, trim filler, and flag any unsupported statement without inventing a source.”

## Presentations and education: decks, one-pagers, lessons

**Diagnose:** each slide tries to say too much, no story arc, inconsistent layout, decorative graphics that don't clarify, material not suitable for the audience, no way to verify learning.

**Structure:** one takeaway per slide/section, coherent narrative sequence, group comparisons, use visuals that explain rather than decorate, progress from orientation to insight to action; separate main story from appendix.

**Delight:** visual rhythm, meaningful reveals, a powerful example or diagram, useful practice or self-check. Keep motion minimal and accessible.

**Simplify:** reduce text density, remove redundant slides, consolidate references, make charts readable. Avoid shrinking text merely to cram in detail.

**Check:** readability on target screen, accurate data, accessible contrast, speaker context, learning objectives, and correct citations. For educational materials, check that explanations scaffold difficulty and do not substitute stylistic polish for accuracy.

## Software and systems: code, scripts, automations, AI agents

**Diagnose:** happy-path-only logic, duplicated code, vague variable names, bloated dependencies, brittle boundaries, hidden assumptions, fake results, untested behavior, unclear error feedback.

**Structure:** identify core workflow and interfaces; separate concerns; use understandable defaults; prioritize critical path; name modules by responsibilities; make state and errors explicit; treat data validity and security as requirements.

**Delight:** excellent developer experience, clear error messages, useful logging, smooth onboarding, self-explanatory APIs, ergonomic shortcuts when appropriate. In non-UI code, “delight” is friction reduction—not visual effects.

**Simplify:** remove dead code, unnecessary abstraction, duplicated configuration, unused libraries, opaque helpers; do not refactor stable code without reason.

**Check:** run tests and linters if available; boundary inputs; error cases; dependency/version constraints; security/privacy; observability; regression protection. For AI agent workflows, check prompt injection boundaries, data provenance, repeatability, guardrails, and evaluation fixtures. State tests not run.

**Concrete prompt:** “Preserve working behavior. Identify the 3 highest-risk sources of complexity, restructure for clear responsibilities, improve error and empty states, write minimal tests for core paths, and report precisely what ran.”

## Marketing and communication: landing pages, emails, social posts

**Diagnose:** generic promises, fake social proof, unclear audience, competing CTAs, meandering body, overly salesy tone, invented urgency.

**Structure:** name the audience problem, state a credible differentiator, support with real proof, make one CTA obvious, order objections by audience importance.

**Delight:** distinct voice, memorable specifics, tasteful visual emphasis or a well-placed line. Avoid manipulative urgency or gimmicks.

**Simplify:** cut buzzwords, duplicate CTAs, cluttered layouts, excessive claims. For emails, keep subject and first paragraph aligned to the reader's actual need.

**Check:** truthfulness of promises, consent/privacy where relevant, clarity, tone, accessibility, and destination alignment.

## Analogy table: translating UI methods without copying them

| Reel's UI technique | General principle | Non-UI equivalent |
| --- | --- | --- |
| Improve dashboard hierarchy | Reveal what matters first | Lead with conclusion; main slide takeaway; primary API task |
| Group related elements | Structure by meaning | Cluster evidence; group code modules; organize lessons by concept |
| Primary CTA with deliberate response | Make key action clear and satisfying | Strong concluding ask; useful confirmation/error feedback |
| Frosted/layered panels | Add context-sensitive polish | Distinct but restrained visual identity or prose voice |
| Accordions for secondary items | Progressive disclosure | Appendix, footnote, optional advanced section, modular documentation |
| Group and label navigation | Reduce wayfinding cost | Clear headings, table of contents, coherent module naming |
| Compact search + command palette | Fast advanced access without noise | Searchable index, glossary, jump links, CLI commands |


## The third Reel's attention principle in different media

| Medium | Quiet foundation | Controlled emphasis | Acceptance evidence |
| --- | --- | --- | --- |
| Landing page | cohesive background + supporting surface | a distinct primary CTA | findability + contrast + working click |
| Dashboard | stable surfaces + data hierarchy | one selected task/status; semantic exceptions | correct data, scan hierarchy, keyboard/touch |
| Brand poster | consistent visual field + type system | one phrase/subject color contrast | readable thumbnail and full size |
| Presentation | repeated grid + body text | the takeaway or critical series | projection legibility and truthful charts |
| Video/animation | consistent composition + rhythm | one visually salient timed event | aligned frames and reduced-motion alternative as applicable |
| Essay/report | clear structure + evidence | core thesis/insight (metaphor, not literal colors) | argument and source integrity |
| Agent/code | predictable workflows + boundaries | clear failures and priority actions | tests, logs, no fake pass claims |

If a medium requires many meaningful categories, **do not** impose a literal palette/three-element cap.
