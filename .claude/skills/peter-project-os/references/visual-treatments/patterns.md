# Grids, marks, and discrete imagery

Choose the sampling scale before judging the pattern. Screen scaling and export can change the result substantially. Avoid thousands of decorative DOM nodes; use a background, SVG, canvas, or baked image according to actual editability and performance needs. Source foundations are in [sources.md](sources.md).

## 7. Blueprint grids

**Identity and fit.** A construction-grid motif with a disciplined major/minor rhythm, often light lines on blue. Useful for technical explanation, planning, engineering identity, or a designed diagram. A decorative blueprint is not an engineering drawing or manufacturing specification.

**Build.** Use two orthogonal repeated line layers; optionally add a coarser major grid and sparse real annotations. Align meaningful diagram elements to the grid where useful. CSS repeating gradients or an SVG pattern are sufficient for simple web work; use vector lines or a raster asset for documents. [MDN repeating gradients](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/repeating-linear-gradient) explains the primitive.

**Tune.** Suggested starting point: 16–32 display-pixel minor spacing and one major line every four or five cells. Keep minor lines visibly quieter than content. Preserve consistent line weight, label style, and units. Do not add fabricated dimensions to make a concept look technical.

**Verify/fallback.** Inspect at different zoom levels, device pixel ratios, exports, and narrow crops. Look for moiré and lines that compete with letters or charts. Fallback: a faint major grid, a border-framed diagram, or plain background. Retain real dimensional accuracy when the task is technical documentation.

## 8. Halftone

**Identity and fit.** A regular screen of dots or other marks whose coverage represents tone. The regular sampling structure distinguishes a classic clustered-dot halftone from stochastic stippling or error-diffusion dithering. Useful for print-inspired posters, editorial portraits, and limited-color graphics.

**Build.** Choose the output cell grid, sample local tone, then vary dot area within each cell. For an illustrative black-on-white circular screen, coverage `c=1-L` suggests radius `r=s sqrt(c/π)` for cell width `s`, until circle clipping/overlap needs deliberate handling. This is a simple area model, not a complete commercial screening algorithm. Generate in SVG/canvas or bake an image; a uniform dotted overlay does not reproduce image tone.

**Tune.** Start with cells around 4–10 display pixels when the dot structure should be visible. Choose angle, dot shape, maximum coverage, palette, and desired highlight/shadow detail. For print, coordinate screen frequency with final output process rather than prescribing universal DPI/LPI settings.

**Verify/fallback.** Test facial/detail recognition, tonal range, dot merging, and interference at actual export size. Preserve logos and small text outside the halftone layer. Fallback: coarser monochrome dots or a continuous-tone asset. Multi-color screens require extra moiré and registration review; avoid claiming print readiness from an on-screen preview.

## 11. Dithered images

**Identity and fit.** Spatially distributed quantization choices approximate tones absent from a limited palette. Ordered dithering creates a repeatable matrix pattern; error diffusion propagates quantization error to neighboring pixels. It is not the same operation as shrinking an image into blocks. [Tanner Helland's algorithm discussion](https://tannerhelland.com/2012/12/28/dithering-eleven-algorithms-source-code.html) compares these approaches.

**Build.** Select the working resolution and deliberate palette first. For an ordered method, compare pixel tone with thresholds from a repeated matrix. For error diffusion, choose the nearest palette color and distribute the difference to future pixels with a defined kernel; handle boundaries explicitly. Use a maintained image library or a tested implementation. Check the library's actual conversion mode: not every quantization path applies dithering identically.

**Tune.** Compare a small ordered pattern against an error-diffused version only when this choice materially affects the reference. Control resolution, palette, gamma/color treatment, and final scaling. Keep a fixed input and palette for before/after checks.

**Verify/fallback.** Inspect gradients, edges, highlight detail, and crawling patterns in animation. Increase size with deliberate sharp pixel rendering where intended; avoid resampling that destroys the pattern. Fallback: a larger palette or undithered source. Do not claim dithering always reduces file size; measure the actual export.

## 13. Contour lines

**Identity and fit.** Curves following equal values of a field. Real topographic contours represent equal elevations, as explained by [USGS](https://www.usgs.gov/faqs/what-a-topographic-map). Abstract contour-inspired art can use invented fields, but must not imply a surveyed location.

**Build.** For data, use validated source elevations/values and a known contouring implementation. For decorative art, generate a smooth scalar field and extract level sets, or author a coherent family of nested curves. Keep contour intervals and topology controlled; handle marching-squares saddle ambiguities consistently if implementing an extractor. Do not substitute randomly wavy lines for actual map data.

**Tune.** Choose field scale, contour interval, line weight, selective major lines, and crop. Spacing may carry meaning; do not redistribute lines in a data map merely to improve aesthetics. For abstract art, keep a quiet region for content and avoid excessive contour density at the focal point.

**Verify/fallback.** Inspect continuity, unintended intersections, tiny loops, rasterized aliasing, and readability. In real maps verify legend, units, coordinate context, and source. Fallback: fewer vector curves or a simplified static pattern. Scientific contours must retain their data lineage.

## 15. Pixel mosaics

**Identity and fit.** A composition reconstructed from coarse image cells, colored tiles, or deliberately arranged blocks. Decide which interpretation is intended; a mosaic of photographs differs from square color sampling. Useful for playful, modular, retro, or digital narratives.

**Build.** Choose the image crop and logical grid; average each source region to a cell color or use intentional palette assignment. Preserve consistent cell geometry. Render tile boundaries/gaps only when they serve the reference. For crisp pixel imagery, scale the logical image to final size without unwanted interpolation; for physical-tile imagery, add restrained material detail separately.

**Tune.** Start with a small number of cells across the main subject, then increase until identity and composition survive. Record logical dimensions, palette size, gap, border, and scaling mode. A selected grid is an artistic decision, not a measured fidelity target unless supplied.

**Verify/fallback.** Check recognition at thumbnail and final size, cropped cells, uneven spacing, palette drift, and distortion from nonuniform scaling. [MDN image-rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-rendering) documents browser scaling controls; inspect actual output rather than assuming all zoom ratios look identical. Fallback: a finer mosaic or static normal image. Keep functional UI text out of the pixel reduction.

## 17. Stippled gradients

**Identity and fit.** Tone emerges from irregularly placed discrete dots, often through varying density rather than a regular halftone screen. Useful for quiet print-like shading and organic editorial art. Weighted Voronoi methods can improve distributions; see [Secord's research](https://www.cs.ucdavis.edu/~ma/SIGGRAPH02/course23/notes/papers/Secord.pdf).

**Build.** Define a target density from the tonal field. Place dots with spatial separation to avoid accidental clusters, then optionally relax a weighted distribution for more even tone. For lightweight art direction, seeded sampling with a minimum-distance rule may be enough; label it as an approximation rather than an implementation of a named research method. Render dots as one asset rather than many DOM elements.

**Tune.** Control dot radius, density curve, seed, minimum spacing, and tonal range. Prefer changing density first when the desired style relies on consistent dots; allow varied radii when appropriate. Do not independently regenerate dots every animation frame, which causes shimmer.

**Verify/fallback.** Inspect smooth tone transitions, unintended voids/clumps, disappearing dots after export, and noisy text regions. Bake expensive relaxation offline. Fallback: fewer larger dots or a clean gradient. Preserve the distinction between tonal stippling and random grain over an already complete gradient.

## 18. Square-dot grids

**Identity and fit.** A regular field of small square marks with clear spacing, not continuous graph-paper lines. Useful as a quiet modular backdrop or a controlled technical motif. Avoid treating decorative dots as data points.

**Build.** Use a repeated SVG tile containing a square, a small image tile, or a suitable background pattern. Keep mark size and tile spacing independently configurable. Fade or mask the pattern near text or focal imagery when appropriate. Create perspective only if the composition calls for it; otherwise maintain a flat coherent grid.

**Tune.** Suggested starting values: 1–3 display-pixel squares with 12–24-pixel spacing, low contrast against the foundation. Adjust to device scale and final medium. Use one deliberate accent mark only if it has a compositional purpose; random colored marks can suggest nonexistent statuses or data.

**Verify/fallback.** Check small screens, fractional zoom, uneven antialiasing, pattern alignment, and export scaling. Thin marks may disappear, while dense grids can produce moiré. Fallback: wider spacing, larger but quieter marks, or no grid. Use existing site tokens so the pattern does not establish an unrelated mini-design system.

## 22. ASCII and pixels

**Identity and fit.** Two related but distinct visual languages: glyph-based imagery and discrete pixel graphics. ASCII art uses characters to represent local tone or form; pixel art uses deliberately placed color cells. Useful for developer, retro-computing, or experimental identities, not an excuse to make all content hard to read.

**Build.** For ASCII imagery, choose a monospace font, measure glyph cell proportions, sample the image by those cells, and map tone to a glyph ramp ordered by actual rendered darkness. Correct for character aspect ratio and invert the mapping when foreground/background reverse. A conventional string of symbols may need recalibration in the chosen font. Escape markup and preserve whitespace. For pixel work, choose logical resolution, palette, and silhouettes; author meaningful clusters rather than applying indiscriminate pixelation.

**Tune.** Record font, line height, columns, glyph set, tone mapping, palette, and target dimensions. Keep decorative ASCII separate from semantic text, with a concise accessible description when it conveys information. Do not let assistive technology read thousands of meaningless characters.

**Verify/fallback.** Inspect font fallback, spacing, mobile overflow, high zoom, copying/export, and subject recognition. Avoid thousands of per-character animated elements; static text or a baked asset often suffices. Fallback: a static accessible image or simple pixel motif. For sharp browser scaling see [MDN image-rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-rendering).
