# Second reel: source-grounded reference-reconstruction method

**Source:** User-uploaded `ScreenRecording_11-14-2026 19-11-57_1.mp4`, ~76 seconds, showing an Instagram Reel by @inspiri.flow. This is an **observation-based analysis of visible frames and captions**, not a verbatim audio transcript and not a verified inspection of the creator's codebase. Timeline is approximate; some captions are partial. The text shown mentions a tool called **reanimate** and an example from Stripe's card-issuing page; those identifiers are cited as visible in the recording, not independently verified software documentation.

## Observed technique, in sequence

1. **0–15s: The problem.** A card-style website animation is shown as the target. The captions contrast what a coding AI can see with the actual animation; an interface named `reanimate` appears, asking for reanimation of a card hover on `stripe.com`. The implication is that a text-only prompt or isolated screenshot does not encode the motion.
2. **18–27s: Motion becomes a spec.** A `spec.md`-style view lists target, viewport (`1440×900`), FPS (`25`), a motion-fidelity aim, and a table with elements (card, button, arrows, glow), start times, durations, property changes, and easing curves. This is a **measured description** instead of a vague “make it smoother” request.
3. **27–39s: Compare the candidate to the reference.** Side-by-side reference/clone/difference panels and a frame-activity plot appear; captions describe counting changed pixels and correcting the largest mismatches. Later frames show a filmstrip. Comparison works on a **sequence**, not a flattering still image.
4. **42–57s: Account for rendering architecture.** The reel notes that a card animation may not be ordinary HTML elements. It diagrams HTML/button vs a drawn card, then shows tracking data, canvas/WebGL-looking instrumentation, and components/routines used to draw a card. The method appears concerned with what the browser **renders**, not only the DOM labels.
5. **57–72s: Calibrate paths and visualize error.** A motion/tilt graph, cursor-position plots, and a reference-vs-copy comparison are displayed. The captions refer to large differences being reduced. The video suggests a quantitative iterative process, but we cannot independently confirm the displayed numbers from screenshots alone.
6. **72–76s: Consequence of temporal sampling.** A comparison of many frames versus a single frame appears: the point is that a complete animation needs multiple synchronized observations.

## Transferable principles

- Treat reference media as **evidence to measure**, not a mood board to imitate.
- Describe **where, when, how far, and under what trigger** things change.
- Store extracted constraints in a spec so different agents or iterations can use them.
- Compare aligned outputs over **time**, not only one completed state.
- Diagnose the **dominant difference**, then revise and rerun the comparison.
- Handle DOM, canvas, SVG, WebGL, and flattened video as possibilities; don't infer internal rendering technology from looks alone.
- Interpret the underlying method across domains: reference → observable properties → success tests → iterative correction.

## What the reel does NOT prove

- That the viewer or agent has access to the original page's private source code, exact shaders, event handlers, or all hidden states.
- That any one chosen error metric is equivalent to human-perceived similarity.
- That a few sampled frames prove exact motion/timing between samples.
- That the same pixel-level approach works unchanged for essays, research, or arbitrary software behavior.
- That the example's target artwork, brand assets, or exact implementation may always be reused without permission.

**The skill's command-line probing script, templates, confidence labels, and nonvisual analogies are our additions**, not claims that the reel provides or endorses those exact implementations.
