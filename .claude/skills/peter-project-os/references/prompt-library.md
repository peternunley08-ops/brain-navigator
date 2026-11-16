> v4 default: **Run $anti-slop-refinement on this project.** Token-aware expansion: “Check token usage when available and conserve tokens while completing the necessary work and validation.” This is already part of the default workflow. The following longer commands are optional specialized controls; SKILL.md supplies autonomous inference and execution.

# Prompt library: useful commands, not a giant one-shot prompt

These can be pasted individually into an AI assistant. Replace bracketed fields or let the assistant infer safely from the supplied artifact.

## Universal launch prompt

> Apply the **Anti-Slop Refinement** method to [artifact / project]. The audience is [audience] and the most important outcome is [goal]. First identify the 3 biggest issues in clarity, structure, or usefulness. Preserve [constraints / facts / existing functionality]. Then refine in focused passes: organize meaning and hierarchy, add only purposeful polish, simplify, and verify. Do **not** impose a template look, invent data, or change working behavior without reason. Produce the improved result, not just suggestions. Distinguish tested improvements from unverified assumptions.

## Audit only

> Evaluate this [artifact] for purpose, hierarchy, specificity, friction, craft, and accuracy. Describe observed weaknesses with concrete evidence. Rank only the highest-impact fixes. Avoid generic feedback like “make it pop.” Do not redesign until you have explained the problem.

## Hierarchy pass

> Based on the primary user job, identify the most important message/action. Reorder and regroup elements by their real relationship. Reduce competition from secondary content. Preserve all required information and explain any material you propose hiding or merging.

## Purposeful delight pass

> Suggest at most three refinements that improve feedback, clarity, personality, or efficiency. Explain why each helps, what could go wrong, and how you would handle accessibility or platform limitations. Prefer zero effects over decorative noise.

## Simplification pass

> Remove filler, duplicate content, unnecessary interaction, and overengineered structure. Use progressive disclosure for optional details, but keep primary tasks and trust-critical information visible. State what you removed and what improved.

## QA / red-team pass

> Try to break the result. Check core outcome, edge cases, accuracy, accessibility, responsive/touch/keyboard behavior where relevant, and user constraints. Separate checks actually performed from checks recommended. Propose the smallest viable fixes.

## Comparative evaluation

> Compare [before] with [after] using the Anti-Slop Scorecard. Support each score with an observable reason. Flag any trade-off where the new version looks more impressive but works less well. Recommend only the highest-return next pass.

## New build from scratch

> Build [artifact] for [audience] to accomplish [goal]. Before generating, establish the content hierarchy and central action. Create a coherent, non-generic result grounded in real requirements. Add 0–3 meaningful distinctive touches only where useful. Remove generic filler and verify against the success criteria. Show the deliverable and concise QA findings.

## Project handoff

> Create a concise record of design/content decisions: user job, hierarchy, grouped sections, purposeful embellishments, accessibility constraints, rejected gimmicks, unresolved assumptions, and acceptance tests. A future contributor should be able to continue without recreating the same debates.

## Match a video / animation reference (for real reconstruction)

> Use **Anti-Slop Reference Interpretation Engine**. Inspect my supplied video, frame by frame where needed. Establish original dimensions, animation trigger/time zero, timeline, layers, element geometry, positions/scale/rotation/opacity over time, motion paths, and easing only to the precision the frames support. Write a source-grounded spec with observed/inferred/unknown labels. Implement [target] from this spec; compare reference and candidate at matched frames and states, use overlays/differences when practical, and iterate on the largest mismatch. Do not claim a screenshot reveals motion or that you know the original CSS/canvas/WebGL code unless actually inspected.

## Reuse reference *behavior* with a different brand

> Learn the interaction rules and timing from this reference, but keep my content, styling, and brand. Extract trigger, sequence, transitions, feedback, and exit behavior. Preserve accessibility and reduced-motion behavior. Compare motion at representative timestamps, not superficial colors or logos.

## Learn the method, not the appearance

> Analyze the supplied example to identify the creator's decision process and specific evidence they use to judge quality. Translate those principles into my [project type] and propose measurable acceptance criteria. Separate what the example visibly proves from what you infer. Avoid copying visual motifs that do not help my project.

## Fidelity audit before shipping

> Use the reference spec as ground truth for observable properties. Capture and compare [before/reference] and [candidate] under matched states, dimensions, triggers, and times; prioritize the 3 highest-impact differences. Report actual measurements and remaining unknowns, without equating raw pixel error to human perception.


## Advanced v3 universal application

> Apply Anti-Slop Refinement v3 to this project. First infer my audience, must-keep constraints, intended outcome, and whether supplied references should be recreated, translated, or used for principles. Diagnose purpose and information hierarchy, extract source-grounded evidence, and establish the single priority the result should communicate. Make a quiet, coherent foundation and a deliberate focal treatment where appropriate, not a generic trendy aesthetic. Implement in focused passes, compare against my reference if provided, check functional correctness, accessibility, and actual contrast/temporal behavior, and report only tests truly performed. Save useful decisions as reusable rules or tokens.

## Color and attention from a reference

> Interpret the color-composition method in my example rather than blindly copying its swatches. Identify which colors act as stable foundations and which one carries attention, using surrounding area and contrast rather than absolute saturation. Transfer that attention hierarchy to my own brand and constraints. Create semantic tokens, apply the focal accent to the primary action/idea, and check foreground/background contrast. Allow extra colors for meaningful charts, status, and accessibility needs.

## Critique a palette in context

> Audit the attached design. Identify its true focal point and compare that to the most important user action. State which visual areas are competing, propose no more than three direct fixes, and test legibility, normal-text/large-text/component contrast pairs, grayscale hierarchy and responsive reading order. Don't call a palette accessible unless relevant states and contrast pairs were checked.

## Advanced matched-reference video QA

> For the supplied source and candidate recordings, first align viewport, crop, triggers and timeline zero. Sample multiple states and transition frames. Inspect frame activity to find busy intervals; compare the same timestamps and relevant regions. Correct the largest observed mismatch and rerun. Report timing ambiguities and do not treat pixel difference as equivalent to semantic correctness or human perception.

## High-risk conservative refinement

> Preserve working behavior and source integrity above style. Identify what is observed, inferred, and unknown; choose minimal high-benefit changes. Verify critical paths and relevant failure modes. Do not hide a correctness issue under an aesthetic score. Document remaining limitations clearly.

## Optional visual treatment request

“Run Anti-Slop on this project. Select an appropriate treatment from the 22-technique library if it improves the project. Preserve identity and functionality, build the effect with available tools, and verify readability, performance, responsive/export behavior, and motion preferences. Check token usage when available and load only relevant recipes.”

This detail is optional: the bare invocation already routes visual projects to the library. A named effect can narrow selection, for example “Use restrained fluted glass in the hero only; keep text and controls clear.”

## Agent-independent and GitHub shortcuts

- “Anti-slopify this project.”
- “Find my portfolio on GitHub and anti-slopify it.”
- “Anti-slopify owner/repository; preserve the branding.”
- “Anti-slopify owner/repository and open a draft PR.”
- “Search my GitHub for dashboard projects and let me choose one.”

Adapt to the host's actual tools and existing authorization. Search is not permission to redesign every result. Do not invent token counts or repository access.

## Selective GitHub reuse

“Anti-slopify this project. Automatically use relevant GitHub tools or modules only when they solve a demonstrated gap. Prefer existing capabilities, avoid overlapping frameworks, pilot the smallest useful addition, and retain it only after behavior and footprint checks pass.”

This behavior is built into the bare invocation; the longer wording is optional.
