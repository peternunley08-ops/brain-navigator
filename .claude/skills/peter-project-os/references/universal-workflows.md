# Universal project workflows

Use every relevant section for mixed projects. Each workflow means inspect → redesign → implement → validate. Preserve useful complexity; do not impose a single aesthetic or architecture. Use existing project tooling and available specialist skills for format-specific editing and rendering.

## Apps and websites

Inspect representative entry routes, navigation, primary tasks, content, component system, data boundaries, assets, and all distinct critical states. For apps include persistence, permissions, offline behavior where relevant, and return visits. For websites include content discoverability, destination links, page metadata, and forms. Separate observable problems from conjecture about users.

Redesign around successful task completion. Fix information architecture, action labels, form sequence, feedback, error recovery, and responsive layout before decoration. Reuse sound components and tokens. Support keyboard and touch; essential content must not rely on hover. Keep routes, business logic, integrations, and real content intact unless a change is justified by the brief. Do not add fake backends or placeholder testimonials.

Implement actual interactions and appropriate loading/empty/error/success states. Preserve input after recoverable errors. Evaluate contrast in actual component states, focus visibility, readable text, reduced motion, and non-color cues. Avoid adding dependencies or effects solely for perceived polish.

Validate the core flow end to end plus relevant invalid input and error recovery. Render at representative small and large sizes; inspect overflow, navigation, focus, links, and state changes. Measure performance only with available tools and comparable conditions; state the observed metric instead of promising faster load times. Check existing automated tests and changed routes. A screenshot alone does not establish that a form submits or data persists.

## Code, APIs, automations, and agent workflows

Inspect entrypoints, interfaces, data contracts, dependencies, current changes, existing tests, and error behavior. Establish baseline failures. For agents inspect input trust boundaries, tool authorization, output validation, and evaluation examples. For automations inspect triggers, retries, idempotency, and partial failure behavior.

Redesign responsibilities and naming where observed complexity causes defects or maintenance friction. Preserve public interfaces and supported behavior. Favor focused refactors, explicit errors, and validated boundaries over a new architecture. Never add logging that reveals secrets or personal data. New dependencies require a concrete advantage and compatibility review.

Implement complete behavior including relevant edge cases. Add meaningful regression tests for substantive behavior changes; do not add tests that merely repeat implementation or change expected values to hide a failure. Do not migrate live data, reset working changes, or replace infrastructure under a generic redesign request.

Validate relevant unit/integration checks, type or build checks, and the main usage example. Exercise failure handling and boundary inputs; verify backward compatibility where required. Distinguish known baseline failures from introduced failures. If a runtime or credential is unavailable, provide a patch and state which behavior is unverified. A passing linter is not proof of correctness or security.

## Writing and editorial projects

Inspect the intended reader, authorial purpose, thesis, voice, constraints, evidence, quotations, and publication format. Identify structural weaknesses, generic language, unsupported claims, repetition, and missing connective reasoning. Preserve deliberate ambiguity, rhythm, or informality when they serve the work.

Reorganize by argument or narrative purpose; bring support near claims and make the main point clear. Replace vague wording with grounded specifics from supplied material. Improve transitions, examples, and concision without inventing events or changing the author's position. Propose a substantive change of thesis separately when needed.

Deliver revised prose, not only editorial advice. Retain exact quotations and citations unless corrections are verified; distinguish paraphrase. Respect length and requested tone. For creative writing, do not flatten personality into standardized professional prose.

Validate meaning against the original, argument continuity, source support, attribution, word limits, repetition, and audience fit. An unsupported assertion must be qualified, removed with rationale, or flagged; never supplied with a plausible-looking invented citation. Do not claim a score from an AI detector or guaranteed human authorship.

## Documents and reports

Inspect native structure and rendered pages: headings, styles, page size, tables, captions, images, references, headers/footers, and required sections. Preserve fields, tracked changes, comments, formulas, and accessibility structure as relevant. Distinguish content revisions from layout changes.

Redesign the reading sequence, executive summary, navigation, paragraph styles, page rhythm, and tables. Keep important footnotes and evidence discoverable. Use real headings and lists rather than visual simulation. Preserve required templates and formal language; never rewrite contractual or regulated meaning as stylistic polish.

Implement in the editable format when tools permit. Render the output and inspect all pages for clipping, overlap, tiny text, bad breaks, and blank pages; sample only when necessary and disclose coverage. Recheck rendered pages after layout changes. Validate contents, links, table values, pagination, and export readability. Deliver the editable original format plus requested export. If rendering is unavailable, report that layout remains unverified.

## Presentations and learning materials

Inspect audience, speaking context, duration, thesis, narrative sequence, template, charts, notes, and source data. Determine whether the deck is presented live or read independently; do not force a one-line slide style on a reading deck.

Redesign around a coherent story and a clear takeaway per slide. Select charts/diagrams that explain relationships; move supporting detail to notes or appendix when appropriate. Preserve necessary evidence and caveats. Use consistent layout and purposeful visual rhythm rather than decorative variety.

Implement editable slides where possible. Preserve master/template constraints and meaningful speaker notes. Do not rasterize all content for convenience. Ensure chart labels and citations remain readable.

Render and inspect every slide at the target aspect ratio, checking clipping, hierarchy, legibility, chart truthfulness, alignment, notes, and slide order. Test transitions only when included and supported. For lessons, check prerequisite sequence, examples, and whether practice actually measures the stated learning objective.

## Dashboards and analytical spreadsheets

Inspect the decision the dashboard supports, source data, refresh timestamps, metric definitions, units, date/time boundaries, denominators, formulas, missing values, filtering, and permissions. Identify who owns the underlying data. Never replace real data with favorable demo metrics.

Redesign around decisions and exceptions. Separate summary from drilldown; make filters and active scope visible. Pick charts appropriate to the quantity and comparison. Preserve necessary category distinctions; a one-accent rule must not erase status or data semantics. Explain stale or incomplete data instead of depicting unknowns as zero.

Implement readable layouts, meaningful labels, trustworthy formulas, useful empty states, and access to underlying records. Preserve formulas and raw source data; do not silently hardcode computed values. Avoid misleading axes and unsupported causal claims.

Validate totals against independently computed samples, filters, date windows, missing/zero distinction, formula recalculation, chart source ranges, and units. Check that changing a filter updates all dependent summaries consistently. Inspect rendering and contrast. A visually convincing dashboard with incorrect aggregates fails regardless of craft score.

## Research and evidence synthesis

Inspect the research question, scope, supplied sources, methodology, dates, claim support, uncertainty, and conflicting findings. Separate research design from completed research; do not imply an experiment was run because its protocol exists.

Improve the question and evidence structure without moving the goalposts. Build a claim-to-source map. Prefer appropriate primary evidence and verify time-sensitive or high-stakes claims with current authoritative sources when tools permit. Record search scope and exclusions for substantial research. Do not claim a systematic review from a casual search.

Implement the revised synthesis, evidence table, methods explanation, and qualified conclusions. Discuss material counterevidence and limitations. Preserve numerical results unless a reproducible correction is made. Never fabricate sources, interviews, datasets, quotations, or statistical significance.

Validate each consequential claim against the cited material, check units and calculations, distinguish association from causation, and verify links and quotation accuracy. Assess whether conclusions exceed evidence. If sources are inaccessible, mark unsupported claims and complete the accessible portion without filling gaps with inventions.

## Creative, brand, image, motion, and audio projects

Inspect the medium, audience, creative intent, existing identity, assets, references, deliverable formats, and usage constraints. Classify reference intent explicitly. A visual reference is not a license to replace the project's voice or brand.

Redesign composition, pacing, hierarchy, storytelling, typography, and distinctiveness around the purpose. Use restraint where emphasis needs contrast; preserve expressive complexity when intentional. Choose medium-native improvements. Avoid converting every creative project into a minimalist product page.

Implement with available editing/generation tools while preserving editable assets when feasible. Prefer targeted edits to unnecessary regeneration. Record important prompts/settings when reproducibility helps. For motion use the reference-spec workflow; audio claims require actual audio access. Never describe an unheard recording as transcribed.

Inspect generated outputs, text rendering, subject consistency, crops, aspect ratios, and export properties. For motion compare key transitions and endings at aligned times; for audio check intelligibility and timing when tools permit. A pixel diff measures sampled differences, not originality, legal rights, or perceptual quality. Deliver a clearly labeled concept/spec if rendering cannot be performed.

## Optional texture and visual-language routing

When a visual project benefits from a specific surface, pattern, optical treatment, or painterly direction, use the [22-treatment router](visual-treatments/INDEX.md) and only the selected recipe. Apply the relevant domain checks above in addition to the treatment checks. Texture is normally irrelevant to code-only, prose-only, and evidence-only tasks; do not force visual redesign into them.
