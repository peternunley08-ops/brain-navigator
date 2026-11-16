# Inferred redesign brief

Agent fills this in; the user need not complete a questionnaire. Omit irrelevant fields.

- Host capabilities and tool limits (brief):
- GitHub identity/host, resolved repo, branch/base revision, and search coverage if relevant:
- Delivery scope: local edits / export / patch / authorized PR or other action
- Target and current version:
- Audience and primary outcome:
- Observed evidence:
- Inferred assumptions and confidence:
- Unknowns that matter:
- Must preserve (behavior, facts, identity, interfaces, user edits):
- Scope and non-goals:
- Supported additions and rationale:
- Visual treatment, if relevant: chosen role/recipe, implementation, fallback, checks; otherwise none
- Reference intent: faithful / behavior / principles / none
- Available read/edit/render/test capabilities:
- Token usage/budget if exposed; otherwise unavailable (do not invent):
- Observable acceptance criteria:
- Recovery method and authorization boundaries:

## Improved working prompt

Improve [target] for [audience/outcome], preserving [invariants]. Resolve [evidence-backed problems] through [appropriate domain workflows]. Include [justified missing requirements], exclude [scope expansion], and verify [observable checks]. Implement within available tools and authorization. Check token usage when available and conserve tokens through targeted inspection, concise reporting, and reuse of evidence, without skipping required work or validation. Report unknowns and verification limits honestly.

## Coverage and decisions

| Area | Evidence and coverage | Strength or issue | Keep/change/defer | Acceptance check | Result |
| --- | --- | --- | --- | --- | --- |

## Completion

- Delivered artifact or patch:
- Checks actually run and evidence:
- Before/after rubric and gate status:
- Remaining limitations or required decisions:
