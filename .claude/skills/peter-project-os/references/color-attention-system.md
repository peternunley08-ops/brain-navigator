# Color & Attention System — operational guide

## Principle

**Two quiet roles, one loud role** is a *composition heuristic*, not a palette quota. “Quiet” means a color behaves as part of a stable visual ground; “loud” means it stands apart from that ground and therefore deserves scarce attention. This can be achieved through differences in hue, luminance, saturation, area, location, surrounding whitespace, motion, or type weight. A bright color that fills 90% of a poster can act as the stable base; a smaller, contrasting color can still be its focal accent.

Color has a **job**. Never pick an accent merely because a neon button looks impressive.

## The attention budget

1. **Select the focus:** the one action/idea deserving the first glance; distinguish it from a warning, destructive action, or actual system status.
2. **Give supporting content a consistent visual ground:** primary surface, secondary surface, typography. “Two quiet colors” may be light/dark neutrals, brand relatives, or two nearby hues.
3. **Allocate accent sparingly:** CTA, critical highlight, editorial key phrase, or a small marker. Multiple accents may be needed for complex data; preserve *one dominant attention channel* even then.
4. **Measure interaction, not isolated swatches:** test accent against its actual background, at actual size, alongside images and headings.
5. **Reduce noise before intensifying the accent:** if everything competes, lowering competing contrast often works better than making the CTA brighter.
6. **Confirm meaning:** red/orange used for a brand accent should not inadvertently imply error or danger. Warning, error, success, selection, and disabled states need more than hue alone.

## Token specification

Use semantic roles, not raw `#...` values scattered across components:

| Token | Responsibility | Example usage |
|---|---|---|
| `canvas` | foundational quiet field | page background |
| `surface` | supporting quiet field | cards, sections, alternating blocks |
| `text` | readable foreground | body and headings |
| `mutedText` | lower-priority text, still legible | metadata, hints |
| `accent` | action/attention signal | primary CTA, selected hero phrase |
| `onAccent` | readable foreground over accent | CTA label, icon |
| `focus` | visible keyboard focus | rings/outlines |
| `danger`, `success`, `warning` | semantic feedback only when required | validation/status; not forced into three-color limit |

Choose **roles first**, then hues. A working starter JSON file lives at `assets/color-tokens-example.json`; those sample HEX values are *illustrative*, not extracted from the reel.

## Composition workflow: ACCENT

- **A — Aim:** What is the audience supposed to notice/do first? Write one line.
- **C — Context:** Identify brand, medium, lighting, audience, images, and existing tokens to preserve.
- **C — Calm foundation:** Pick an integrated background+support pair; ensure sufficient contrast with text.
- **E — Emphasis:** Add an accent to the priority element, not to every panel.
- **N — Normalize across states:** Check hover/focus/active/disabled and alerts; touch/print/dark mode when relevant.
- **T — Test:** Validate contrast, visual order, grayscale, color-vision differences, different screens, and usability.

### Verification gates

**Accessibility (WCAG-style AA checks, context-dependent):** aim for normal-text contrast **>=4.5:1**, large-text contrast **>=3:1**, and relevant UI component / graphical object contrast **>=3:1**. Contrast pairs depend on actual adjacent colors and states. Large text means approximately >=24px regular or >=18.66px bold at CSS pixel/point mapping conventions; check the applicable standard and rendering context. These numbers are not all-purpose guarantees of full accessibility: fonts, overlays, images, gradients, anti-aliasing, and color-vision requirements still matter.

- Test all actual **foreground/background** pairs, not just the three swatches against each other.
- Do not rely on color as the **only** way to convey selection, success, error, urgency, or category.
- Verify in **grayscale**: if the accent loses salience, strengthen shape, position, size, or hierarchy.
- Examine small screens and thumbnails: does the focal action remain obvious?
- If a complex chart needs six distinguishable series, keep a functional multicolor palette; the heuristic must not harm data comprehension.
- When business/brand colors fail contrast, alter the treatment (outline, border, foreground, local surface), not the brand identity blindly.
- For long text, prioritize readability over accent novelty; avoid low-contrast pastel-on-pastel and neon-on-white copy.

### How to diagnose issues

| Symptom | Likely cause | High-leverage correction |
|---|---|---|
| Everything is “loud” | Accent repeated across too many areas | Consolidate accents; lower background competition |
| CTA is invisible | Similar contrast or weight to surrounding items | Give primary action a distinctive shape and accent role |
| Accent feels random | No link to a task or message | Anchor to priority action/concept and repeat consistently |
| Palette looks coherent but unhelpful | Color carries no functional meaning | Add emphasis to target moment or remove excess color |
| Brand color passes as decoration but fails on text | Foreground/background pairing insufficient | Adjust surface or text treatment; test ratios |
| Color-only status / distinction | No redundant label or pattern | Add text/icon/pattern, plus contrast and focus states |
| Important content hidden in a bright background | Saturation overwhelms information | Stabilize surrounding surfaces and typography |

## Cross-domain translation, explicitly metaphorical

Color is one embodiment of a more general **signal-to-noise budget**:

| Domain | “Quiet” foundations | “Loud” intentional emphasis | Verification |
|---|---|---|---|
| Writing | precise claims and supporting evidence | pivotal sentence or conclusion | Does the argument remain accurate and easy to follow? |
| Presentations | restrained grid and typography | one meaningful chart/figure/takeaway | Is key insight legible from the back of room? |
| Product UI | surfaces, navigation, consistent controls | primary action or selected state | Can users complete their main task? |
| Motion | predictable cadence, stable scene | one timed transition / interaction feedback | Does motion communicate causality and meet reduced-motion needs? |
| Software/API | steady naming and module boundaries | explicit error and critical action path | Tests, observability, clear failure behavior |
| Education | structured explanation, repeated pattern | key distinction, worked example | Do learners understand the intended concept? |

Do not literally restrict words, statuses, modules, or data series to three categories. Keep the **attention economics**, not a forced formula.

## Practical prompt

> Study this example's attention strategy. Separate its quiet foundation from its focal accent, then explain how hue, contrast, area, and positioning direct attention. Transfer those relationships to my project while respecting brand, semantics, accessibility, and existing correct behavior. Generate semantic tokens, identify the focal element, compare before/after, and report test results rather than saying it “pops.”
