# Research sources and evidence limits

Researched November 15, 2026. Sources below establish technical primitives, algorithms, accessibility requirements, or historical context. They do not endorse this skill's taste, proposed parameter ranges, or project-selection rules. Recipes are original synthesis. Browser/library compatibility must be checked against the target project's versions when implementing.

| Source | Established foundation | Used for / limitation |
| --- | --- | --- |
| [W3C Filter Effects Level 1](https://www.w3.org/TR/filter-effects-1/) | Noise, blur, displacement, and compositing primitives | Texture construction, glass, ripples, grain, blur. A specification is not evidence of identical support or performance in every browser. |
| [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) | Effects applied to the area behind an element | Fluted-glass fallback/compositing. Backdrop blur alone does not implement ribbed refraction. |
| [MDN: repeating-linear-gradient](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/repeating-linear-gradient) | Repeating linear color patterns | Blueprint grids and simple striping; not a complete texture simulation. |
| [MDN: radial-gradient](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/radial-gradient) | Radial color transitions | Thermal-style composition and broad atmosphere; no physical temperature model. |
| [MDN: image-rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-rendering) | Browser image scaling choices | Pixel mosaics and pixel-based imagery. Inspect actual scale and output. |
| [Three.js: MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) | Iridescence and other physical material controls | Iridescent shapes; APIs differ by release. Current docs deprecate the combined thickness-range property in favor of minimum/maximum controls; follow the installed version, not a copied snippet. |
| [OpenCV: camera calibration](https://docs.opencv.org/4.13.0/dc/dbb/tutorial_py_calibration.html) | Radial and tangential distortion models | Lens-distortion recipe. Artistic coefficients do not amount to calibrated reconstruction. |
| [NVIDIA GPU Gems: effective water simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) | Wave components, surface orientation, and normal-based detail | Water ripples. Historical renderer examples are conceptual foundations, not current device benchmarks. |
| [NVIDIA GPU Gems: waving grass](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass) | Textured grass geometry and motion strategies | Grass imagery in existing 3D scenes; no requirement to use 3D for static work. |
| [Tanner Helland: eleven dithering algorithms](https://tannerhelland.com/2012/12/28/dithering-eleven-algorithms-source-code.html) | Ordered and error-diffusion algorithm distinctions | Dithered images. Do not assume every algorithm produces the same visual character or compression result. |
| [Adrian Secord: Weighted Voronoi Stippling](https://www.cs.ucdavis.edu/~ma/SIGGRAPH02/course23/notes/papers/Secord.pdf) | Density-controlled stipple placement using weighted Voronoi techniques | Stippled gradients. Lightweight seeded sampling is a separate approximation. |
| [USGS: What is a topographic map?](https://www.usgs.gov/faqs/what-a-topographic-map) | Contours as elevation representation | Real versus decorative contour lines; preserve data meaning in maps. |
| [The Met: Impressionism—Art and Modernity](https://www.metmuseum.org/essays/impressionism-art-and-modernity) | Historical and visual context of Impressionism | Painterly recipe, not a fixed digital filter or authenticity guarantee. |
| [W3C: contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Text contrast thresholds and applicability | Actual composited text/background checks, not swatch-only certification. |
| [W3C: pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide) | Controls for qualifying moving/auto-updating content | Continuous decorative motion and interactive deployments. |
| [W3C: animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Ability to disable nonessential interaction-triggered motion; AAA criterion | Stronger motion-comfort guidance; accurately distinguish conformance level. |

## Coverage and interpretation

All 22 screenshot entries are represented in INDEX.md. Not every aesthetic name has a single canonical algorithm: felt, graphite, paper, single-hue landscapes, thermal-style graphics, cloud sky, grain, square-dot grids, and ASCII compositions admit many legitimate implementations. Their recipes state visual identity, use the applicable primitives above, and supply original decision criteria. They are not claimed to be exhaustive material-science treatments.

The screenshot does not supply exact colors, dimensions, timings, assets, source code, or reference examples for each effect. Proposed settings are starting points for real project inspection. No external imagery is bundled or implied licensed by this source list. No copied source code or verbatim article text is included. For supplied footage, retain the existing observe/specify/compare workflow rather than inferring appearance from the treatment name.
