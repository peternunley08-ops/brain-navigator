# Color, atmosphere, and painting

Use these as composition systems, not automatic decorative overlays. Decide subject, lighting, focal point, and content-safe region before selecting colors. Technical and historical sources appear in [sources.md](sources.md). The implementation choices below are recommendations, not claims about techniques demonstrated by the supplied screenshot.

## 3. Thermal gradients

**Identity and fit.** False-color-like transitions suggesting temperature or energy. Decide whether this is abstract branding or real scalar data. An expressive heat-like background must not be presented as a temperature measurement.

**Build.** For decoration, define a smooth scalar field from a few overlapping broad shapes and map its values through deliberate color stops. A radial-gradient composition can approximate the field cheaply; a texture/shader permits more controlled domain warping. Keep a single coherent hotspot or focal region and leave a quieter zone for text. Avoid a collection of equally bright blobs with no hierarchy.

**Tune.** Record cold/middle/hot colors, stop spacing, hotspot size, transition softness, and noise amount. Use lightness as well as hue to control focus. For actual data, instead use a defensible sequential/diverging map, explicit value domain, units, legend, and missing-data treatment; never remap values to improve composition.

**Verify/fallback.** Inspect banding, clipping, color-vision distinguishability, grayscale hierarchy, and text contrast. Check encoded values independently when used for data. Fallback: a simpler gradient or solid field. Decorative “thermal” does not mean physically correct blackbody emission. CSS radial gradient syntax is documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/radial-gradient).

## 6. Single-hue landscapes

**Identity and fit.** Landscape depth expressed largely through lightness, saturation, and overlap within a narrow hue family. Useful for calm illustrations, covers, backgrounds, and a cohesive brand world. Do not collapse all planes into indistinguishable silhouettes.

**Build.** Establish horizon, foreground/middle/background silhouettes, light source, and a primary subject. Use progressively quieter contrast for distant planes and stronger local definition near the focal region. Small warm/cool variations may aid depth if the reference permits them; “single-hue” need not prohibit every hue shift. Use vector silhouettes for graphic scenes and a rendered/painted asset for textured scenes.

**Tune.** Start with three to five distinguishable depth planes, then add only needed detail. Set hue range, luminance separation, edge softness, horizon position, and negative space. This is a compositional starting point, not a required number of layers. For generated imagery, specify the scene and spatial relationships rather than asking only for “monochrome aesthetic.”

**Verify/fallback.** Inspect silhouettes in grayscale, at thumbnail size, and behind real content. Ensure the important subject survives narrow crops. Do not stylize factual geographic evidence without disclosure. Fallback: fewer clean silhouettes or a flat illustration with a clear foreground/background distinction.

## 9. Grainy gradients

**Identity and fit.** A continuous color field with a fine, intentionally visible texture. Unlike dithering, this need not reduce the palette. Unlike stippling, it need not build tone from distinct dots. Suitable for broad supporting surfaces and tactile editorial graphics.

**Build.** Construct the gradient first and verify composition without noise. Add a fixed-seed fine grain layer at low amplitude, preferably baked when static. Keep grain mostly luminance-based unless colored grain serves a particular reference. Do not call every noise overlay “dithering”: output quantization and error control are separate concerns.

**Tune.** Start with grain around one output pixel and approximately 2–5% visual strength; tune at final dimensions rather than magnified previews. Avoid large contrast speckles behind fine text. Maintain the same seed between comparison passes so improvements are attributable to parameter changes. Compress and inspect the actual exported asset.

**Verify/fallback.** Check seams, banding, noisy halos, compression blocks, and file-size growth. Grain can hide some banding visually but is not a guaranteed cure for a poor color pipeline. Avoid animated random grain by default because it flickers and consumes resources. Fallback: a clean gradient or a subtler reusable static tile. Procedural noise primitives are documented in the [SVG filter specification](https://www.w3.org/TR/filter-effects-1/).

## 14. Cloud sky

**Identity and fit.** A sky with readable cloud masses, atmospheric depth, and consistent illumination. Appropriate for open, expansive narratives and nature imagery; a soft white blob field may be enough for abstract work but should not be called a realistic sky.

**Build.** Choose time of day, horizon, weather character, sun direction, and cloud scale. For a graphic background, use layered soft shapes with varied edges and a coherent sky gradient. For realism, use an authorized photograph, inspected generated image, or existing volumetric rendering workflow. Multi-scale noise is a construction tool, not by itself a complete cloud-lighting model.

**Tune.** Balance a few large masses with smaller variation; reserve negative space for content. Make shadow color and highlight direction agree across the scene. If clouds move, use coherent slow translation or evolution rather than independently jittering every patch; establish static reduced-motion output.

**Verify/fallback.** Check for repeated cloud stamps, inconsistent light, unrealistic edge halos, crop balance, and lost contrast under text. Test export and performance; avoid adding a full volumetric renderer for a static page header. Fallback: a static atmospheric image or broad tonal sky gradient. Do not use illustrative skies as evidence of actual weather conditions.

## 21. Impressionist paintings

**Identity and fit.** Painterly interpretation emphasizing light and color relationships with visible marks, rather than a generic blur or a photograph with canvas grain. Useful for expressive scenes, editorial illustrations, and culture-related work. The [Met's overview](https://www.metmuseum.org/essays/impressionism-art-and-modernity) provides historical context; these modern production recipes are our extension, not a historical rulebook.

**Build.** Define scene, time/light, color relationships, subject hierarchy, and brush-mark scale. Build large value/color masses first, then use directional marks that describe form and light. Reserve smaller, sharper marks for important areas; soften secondary detail through simplification, not indiscriminate Gaussian blur. For generated imagery, specify subject, lighting, composition, visible broken marks, and quiet text space instead of relying on an artist name alone.

**Tune.** Choose mark size relative to final display, edge variety, saturation, highlight placement, and degree of abstraction. Keep a recognizable focal subject and coherent spatial relationships. Preserve intentionally unusual palette or brushwork when it is part of the user's reference.

**Verify/fallback.** Inspect recognizable anatomy/objects where relevant, subject continuity, excessive smearing, and whether printed/displayed marks survive scaling. Keep captions and required text editable above the image. Use authorized source works and clear provenance; do not label newly generated work as an authentic historical painting. Fallback: a simplified painterly illustration or approved static artwork.
