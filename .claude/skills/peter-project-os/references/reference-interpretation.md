# Reference Interpretation Engine — evidence-first, cross-domain playbook

Use this when a user says "do it like this," "recreate this," "match the reference," "same technique," "pixel-perfect," "match the animation," "understand this video," or supplies a sample for fidelity. It is the **interpretation and QA layer** of Anti-Slop Refinement, not a universal instruction to copy appearances.

## A. Route intent before reproducing

Determine which of three contracts applies:

| Contract | User language | Optimize for | Don't do |
|---|---|---|---|
| **Faithful** | recreate this exactly; match reference; same timing | observable similarity + functional equivalence | redescribe as inspiration, substitute arbitrary effects |
| **Behavioral** | same interaction, with my branding/content | transition order, trigger, affordances, latency | clone logo, palette, labels unnecessarily |
| **Principles** | same quality, method, feeling; adapt universally | design rules, causal improvements, usability | force exact layout, stack, animation |

If ambiguous, pick the narrowest useful contract supported by context and label it. Never claim direct observation of absent material. For creative work, respect user wishes for distinctiveness and ownership.

## B. Build a reference evidence ledger

Record `observation | evidence/timecode | confidence (observed/inferred/unknown) | effect on implementation`. Identify which details are important enough to verify further.

For UI/image: viewport, bounds, alignment, visual hierarchy, type, spacing, radii, gradients, shadows, content, states, asset placement, responsive changes. For video/animation: clip duration, FPS or source cadence, time-zero event, start/end keyframes, trigger, object identity, movement paths, rotations, scaling, opacity, easing, layer order, occlusion and final state. For an app: input device, hover/press/keyboard, error/loading/success states, and available source code vs output-only observation.

A screenshot can establish visible appearance at a single instant; it does **not** establish event order, animation duration, intermediate frames, sound, functional states, or implementation details. Record these as unknown until the appropriate source is viewed.

### Source fidelity test

Before a deliverable is called "same as reference," explicitly state what was checked. If only an image was accessible, say "static approximation; temporal behavior unverified." If you inspected frame captures but not audio, say "visual reconstruction; spoken content unverified." If source code wasn't inspected, say "rendering architecture inferred, not proven."

## C. Convert observations into structured, measurable specifications

Start with `assets/reference-spec-template.md`; tailor to the medium. For motion, represent one property per element/change:

| Element/state | Trigger | Start (ms) | Duration (ms) | Property | From | To | Easing or sampled curve | Evidence |
|---|---|---:|---:|---|---|---|---|---|
| card | hover | 0 | TBD | rotateY | 0° | observed value | fit from samples | sample frames |
| CTA | hover | TBD | TBD | opacity | 1 | observed value | unknown | keyframes |

Values in this table are **illustrative placeholders**, not numbers extracted from the video. Do not replace unknowns with fictional precision. A value seen in a particular video/spec applies to that demo, not automatically to a user's separate target.

For non-temporal work define analogous dimensions:
- **Static graphics:** bounding boxes, hierarchy, proportions, legibility, color/style references, materials, exclusion conditions.
- **Documents/writing:** argument outline, claims, citations, tone, audience, logical transitions, explicit requirements; no pixel-matching prose.
- **Presentations:** story beats, slide role, content density, data encoding, sequence, typography, audience constraints.
- **Code/software:** observable input→output cases, invariants, side effects, performance thresholds, error behavior, architecture constraints.
- **AI agents:** trigger, tools permitted, inputs, decisions, guardrails, output contract, reproducible test cases.
- **Audio:** only when audio can actually be heard/transcribed; describe timeline, dynamics, speech cues, not imagined words.

## D. Sample sequences at two resolutions

1. **Coarse timeline:** start, midpoint, end; capture each meaningful state/trigger; for long videos sample spaced frames to locate important transitions.
2. **Fine timeline:** for high-motion or ambiguous periods sample near source FPS (e.g., 24/25/30 fps if the source allows). Include anticipations, peaks, overshoots, settles, and reversals.
3. **Interactions:** capture trigger and exit; repeat under keyboard/touch where relevant. Record cursor position when it may affect transforms. Align start-of-animation to trigger, not merely clip start.
4. **Track:** if possible, track boxes/centroids and sampled property values; estimate easing from position vs time. Separate path shape from timing curve and from triggering logic.
5. **Missing data:** no reverse-engineering should confidently assign an unseen intermediate state or exact easing formula from a handful of points. Use a confidence interval or mark approximate.

Use source FPS only as observation cadence, not a guarantee of underlying rendering frequency. Videos may have variable rate/dropped frames. Preserve exact dimensions/aspect ratio when visual comparison matters.

## E. Build only what evidence supports

- Source may be ordinary DOM/CSS, SVG, canvas 2D, WebGL, video, or composites. Pixel output alone rarely reveals which. Use accessible inspection, developer tools, or artifacts **only with authorization**.
- Implement the smallest controllable reproduction, not the most complex shader.
- Keep layers separate: **content**, **geometry**, **appearance**, **timeline**, **trigger/state**, **renderer**, **data/logic**. This isolates causes of mismatch.
- For cross-domain creation, preserve the project's purpose and user content; do not clone corporate branding/creative material when a principle-based translation will do.
- Document alternatives when a faithful recreation is blocked by unavailable assets or source behavior.

## F. Quantitative and qualitative compare loop

1. Match **viewport and crop**, resolution/DPR, font/assets, background, device, animation start event, user input/cursor path, timeline times, and color handling where practical.
2. Capture candidate and reference at the **same semantic state and relative animation time**. Avoid comparing a late frame with an early frame.
3. Compare by **regions and layers**: global composition; text/layout; primary object; effects/shadows; interaction states; motion path/easing; entry/exit timing.
4. Show side-by-side, overlay, and heatmap when useful. Basic normalized MAE or thresholded pixel difference finds mismatches but can over-penalize font anti-aliasing, small translation and lighting. SSIM/perceptual and human review can complement but not replace functional testing.
5. Rank by user impact × mismatch size × frequency. Correct the largest actionable source, then measure again. Keep a log `version -> changed -> measured improvement/regression`.
6. Use multiple frames and states. A good static clone of the end state can still be a poor animation clone.
7. Verify behavior, not only pixels: hover/focus/touch, screen readers, performance, reduced motion, edge cases, privacy/security where applicable.

### Optional bundled local probe

```
python scripts/reference_probe.py inspect --video reference.mp4
python scripts/reference_probe.py frames --video reference.mp4 --fps 4 --out analysis/reference
python scripts/reference_probe.py compare --reference reference.mp4 --candidate clone.mp4 --fps 10 --out analysis/diff
```

Requires Python with OpenCV, NumPy, and Pillow. These commands are **local utilities**, not a browser recorder, animation-curve extractor, source inspector, or automatic replication system. `compare` deliberately refuses different image sizes unless explicitly told to resize, and reports warnings about temporal/capture alignment. For very fast motion increase FPS and use a small time window. Use temporary copies; do not overwrite the originals.

## G. Definition of done

A reference-driven result needs: (1) stated fidelity target, (2) groundable spec (with unknowns), (3) actual deliverable when tools permit, (4) comparison across relevant frames/states or an explicit limitation, (5) no unsupported precision, (6) preserved functionality/copyright/privacy constraints, (7) brief list of remaining mismatches. Prefer "visually close at these 10 sampled times" over "identical animation".

## H. When reference imitation conflicts with Anti-Slop

If the source is intentionally cluttered, unusual, or motion-heavy **and user wants fidelity**, don't silently simplify it. If user wants a better product **inspired by** the source, audit the reference and choose which techniques serve the new users. Make the trade-off visible: **faithfulness vs improvement**.
