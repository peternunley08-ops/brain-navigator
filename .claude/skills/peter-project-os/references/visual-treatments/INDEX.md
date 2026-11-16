# Visual treatment engine — 22 researched options

The names and numbering below come from the user's screenshot. The screenshot supplies a vocabulary, not implementation evidence, a material specification, or permission to apply all effects simultaneously. The recipes are original engineering/design recommendations informed by the linked primary documentation; numerical starting ranges are proposed tuning values, not measurements from the screenshot or universal standards.

## Select before decorating

1. State the project outcome and visual role: foundation, focal asset, information encoding, or interaction feedback. First resolve content, hierarchy, and behavior.
2. Consider the relevant families below. Choose no effect if it would not help. Usually select one dominant treatment, with a quieter supporting treatment only when useful. This is a default attention budget, not a hard cap on creative work.
3. Read only the selected recipe and its technical sources when implementation needs them. Do not load all four family files or generate 22 candidates during ordinary invocation.
4. Set scale, palette, density, focal region, content-safe region, movement, target format, fallback, and acceptance checks in the [treatment spec](../../assets/visual-treatment-spec.md).
5. Implement a representative sample in the real composition. Inspect at final size, thumbnail size, narrow layout, and relevant output conditions. Refine the largest mismatch before extending the treatment.
6. Keep semantic text, controls, data, and source assets intact. Bake expensive static effects into reusable assets when appropriate. Verify that rendering/export preserves the result. Report implementation and check status honestly.

## Complete router

| # | Treatment | Typical useful role | Recipe |
| --- | --- | --- | --- |
| 1 | Felt texture | tactile, soft supporting material | [Materials](materials.md#1-felt-texture) |
| 2 | Fluted glass | directional optical focal layer | [Optics](optics.md#2-fluted-glass) |
| 3 | Thermal gradients | expressive energy field; controlled data mapping | [Atmosphere](atmosphere.md#3-thermal-gradients) |
| 4 | Water ripples | surface/light motion or focused feedback | [Optics](optics.md#4-water-ripples) |
| 5 | Speckled graphite | restrained mineral or drawn surface | [Materials](materials.md#5-speckled-graphite) |
| 6 | Single-hue landscapes | atmospheric depth within brand palette | [Atmosphere](atmosphere.md#6-single-hue-landscapes) |
| 7 | Blueprint grids | construction or technical framing | [Patterns](patterns.md#7-blueprint-grids) |
| 8 | Halftone | structured print-like tonal image | [Patterns](patterns.md#8-halftone) |
| 9 | Grainy gradients | soft color fields with fine texture | [Atmosphere](atmosphere.md#9-grainy-gradients) |
| 10 | Grass texture | ecological, outdoor, or tactile imagery | [Materials](materials.md#10-grass-texture) |
| 11 | Dithered images | deliberate limited-palette image treatment | [Patterns](patterns.md#11-dithered-images) |
| 12 | Paper texture | editorial or handmade supporting surface | [Materials](materials.md#12-paper-texture) |
| 13 | Contour lines | topographic framing or real level sets | [Patterns](patterns.md#13-contour-lines) |
| 14 | Cloud sky | space, atmosphere, and broad tonal structure | [Atmosphere](atmosphere.md#14-cloud-sky) |
| 15 | Pixel mosaics | coarse sampled image or modular composition | [Patterns](patterns.md#15-pixel-mosaics) |
| 16 | Lens distortion | bounded optical emphasis | [Optics](optics.md#16-lens-distortion) |
| 17 | Stippled gradients | tone through irregular dot density | [Patterns](patterns.md#17-stippled-gradients) |
| 18 | Square-dot grids | regular modular backdrop | [Patterns](patterns.md#18-square-dot-grids) |
| 19 | Blurred photos | atmospheric photographic support | [Optics](optics.md#19-blurred-photos) |
| 20 | Iridescent shapes | angle-dependent focal material | [Optics](optics.md#20-iridescent-shapes) |
| 21 | Impressionist paintings | light, color, and painterly narrative | [Atmosphere](atmosphere.md#21-impressionist-paintings) |
| 22 | ASCII and pixels | character-based or pixel-based visual language | [Patterns](patterns.md#22-ascii-and-pixels) |

## Cross-medium application

- Apps/websites: decorative layers stay separate from semantic content, with pointer events disabled and appropriate decorative accessibility treatment. Avoid applying a parent filter that distorts text and controls. Reuse tokens; do not introduce a rendering framework just for a background.
- Documents/slides: use pre-rendered supporting assets or compatible vectors. Preserve editable text, charts, and reading order. Inspect actual PDF/slide exports because web filters and blend modes may not transfer.
- Dashboards/research: decoration must not masquerade as measured data. Real heatmaps, contours, and image evidence retain their definitions, units, legends, and uncertainty. Never distort scientific images or graphs for atmosphere.
- Writing/code-only projects: the library is normally not applicable. Use it only for requested companion visuals, covers, or interfaces. Do not insert aesthetic vocabulary into prose or refactor code just to use an effect.
- Creative work: preserve artistic intent and source rights. Choose licensed/supplied assets, original construction, or available image tools. Prompts describe materials and composition precisely; inspect resulting images instead of assuming the prompt guarantees them.

## Shared acceptance gates

Compare the treatment on and off in the real layout: does it reinforce the intended focal point without reducing task success? Validate actual text/background contrast over the relevant variations, not a palette swatch average. WCAG AA normal text generally needs 4.5:1; qualifying large text 3:1; check applicability and exceptions in the [W3C guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). The bundled palette checker cannot automatically prove contrast over arbitrary textured imagery.

Default decorative motion to static unless it serves a clear purpose. Offer reduced-motion alternatives and avoid flashing. Long-running automatic movement alongside content may require pause/stop/hide controls under [SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide). Disabling nonessential interaction motion is also the stronger [AAA SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); do not mislabel it as an AA criterion.

Inspect aliasing, moiré, seams, banding, transparency, crop, and local legibility. Check image weight, runtime cost, and export compatibility against the project's existing performance expectations; do not promise a frame rate without measurement. If effects fail, simplify scale/density, flatten to an asset, or remove them. A successful static approximation must not be called a physical simulation.

See [research sources](sources.md) for technical foundations and limits. Recipes are instructions for future project implementation, not 22 shipped or benchmarked renderers.
