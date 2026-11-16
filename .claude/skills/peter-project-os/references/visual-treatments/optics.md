# Optical treatments

The five recipes below distinguish compositional approximations from optical simulation. Use an existing renderer only when the task requires its capabilities. Read the selected technical source in [sources.md](sources.md) before relying on version-specific APIs.

## 2. Fluted glass

**Identity and fit.** Repeated ribs distort the background directionally, producing bands of compression, highlights, and partial visibility. Ordinary frosted blur is insufficient. Best for a bounded hero panel or product scene; avoid placing essential text inside the distorted background.

**Build.** Choose vertical or horizontal rib orientation. A low-cost approximation layers narrow translucent bands and highlights over an image; label it as stylized. For actual image displacement, sample the background with a periodic offset such as `u' = u + a sin(2πu/p)` for vertical ribs, where `a` and `p` share normalized coordinates. This is an illustrative distortion field, not a physical glass model. Keep semantic text in an unaffected sibling layer. SVG displacement can work on a supplied image; it does not automatically capture an arbitrary live page backdrop. Use tested browser-supported compositing or a controlled scene for that case.

**Tune.** Start around 12–32 display pixels between ribs and small displacement, then judge at final size. Add blur only if needed. [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) describes filtering behind translucent elements; it does not make blur equivalent to refraction.

**Verify/fallback.** Check scrolling, stacking contexts, clipped edges, readability, small-screen rib density, and actual browser behavior. Fallback: a baked fluted image or opaque panel. Do not assert true optical thickness/IOR from a CSS treatment.

## 4. Water ripples

**Identity and fit.** Coherent wavefronts with changing surface normals and light, rather than random wobble. Useful for water-related scenes, a contained response to input, or an atmospheric focal asset. Avoid moving the entire reading surface.

**Build.** Define whether the aim is concentric impact ripples, overlapping surface waves, or a static reflection image. For an illustrative radial wave, use a damped height field `h(r,t)=A exp(-d r) sin(k r-ωt)` within a finite envelope; derive shading/displacement from the gradient rather than treating bright rings as water by themselves. Handle the center without division by zero. For more realistic existing 3D scenes, combine wave components and normals; [NVIDIA's water chapter](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) explains a sum-of-waves approach.

**Tune.** Record amplitude, wavelength, propagation speed, damping, light direction, trigger, and settling time. Use normalized coordinates with aspect-ratio correction so circles do not become accidental ellipses. A short, bounded reaction is usually easier to validate than endless motion.

**Verify/fallback.** Inspect start, peak, and settled states, edge behavior, frame cost, and reduced-motion replacement. Keep data and labels undistorted. Fallback: one static ripple frame or simple nonmoving feedback. State when a result is a wave-inspired approximation rather than fluid simulation.

## 16. Lens distortion

**Identity and fit.** Radial barrel/pincushion deformation or a localized lens field. Distinguish geometry distortion from blur, zoom, and chromatic aberration. Useful in bounded experimental imagery, generally unsuitable for data charts or required reading.

**Build.** Center coordinates around the chosen optical center and account for aspect ratio. A simple radial model uses `r²=x²+y²` and scale `s=1+k1 r²+k2 r⁴`; sampled coordinates become `(xs,ys)`. [OpenCV](https://docs.opencv.org/4.13.0/dc/dbb/tutorial_py_calibration.html) describes radial and tangential calibration models. For rendering, explicitly choose forward or inverse mapping: the sign's visible barrel/pincushion result depends on that choice. Do not claim calibrated real-lens reconstruction from arbitrary coefficients.

**Tune.** Begin near zero distortion; increase while inspecting straight-line guides, edge crop, and the focal object. Define boundary handling: overscan, mirror, clamp, or transparent fill. Mask a localized lens smoothly; do not introduce discontinuities at its boundary. Add color fringing only if the reference calls for it.

**Verify/fallback.** Test corners, aspect ratios, hover/touch equivalence where interactive, and text exclusion. Avoid geometry foldover or disorienting cursor coupling. Fallback: a static distorted asset or unchanged source. Preserve an unmodified original, particularly for photographic evidence.

## 19. Blurred photos

**Identity and fit.** Recognizable photographic color and broad composition with reduced detail. Useful as an atmospheric background when the photo's meaning still supports the content. Blur does not remove licensing obligations and is not a reliable privacy-redaction method.

**Build.** Select an authorized photo with useful light/dark regions, crop it deliberately, then blur only the image layer. Add a tonal scrim or opaque content panel when needed; never blur the parent containing labels and controls. Pre-blur a static responsive asset when a live filter gives no meaningful benefit. Extend the image beyond the visible crop enough to prevent blur-edge halos.

**Tune.** Blur radius depends on output size and subject; try a small preview range such as 8–24 display pixels, then tune by actual readability. Adjust crop and saturation before making blur extreme. Retain a clear focal structure rather than a generic multicolor fog.

**Verify/fallback.** Check every responsive crop, bright/dark background extreme, edge seams, file weight, and rendered contrast. If identifying details must be removed, use an actual redaction process, not this treatment. Fallback: a solid color sampled from the intended palette or a compressed pre-rendered background. See [filter primitives](https://www.w3.org/TR/filter-effects-1/) for blur/compositing foundations.

## 20. Iridescent shapes

**Identity and fit.** Hue changes with viewing and lighting angle, associated with thin-film effects; not simply a rainbow fill. Use as a focal object against quiet supporting surfaces when it fits the brand or concept. Keep semantic status colors stable.

**Build.** For a static approximation, make hue bands follow object curvature and combine them with coherent highlights/shadows. For genuine angle-responsive material in an existing 3D scene, use the renderer's iridescence model, a suitable environment light, and restrained roughness. [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) exposes iridescence, IOR, and film-thickness controls; consult the project's installed version because property names change. Do not add WebGL solely to turn a small icon rainbow.

**Tune.** Record object geometry, light direction, material roughness, iridescence strength, thickness behavior, and view range. Start with a single quiet object rather than many competing metallic blobs. Do not assume greater saturation is more realistic or more effective.

**Verify/fallback.** Inspect different viewing angles and backgrounds, banding, reflective hotspots, and render cost. Keep text separately readable. Use a static render when animation adds no function or motion is reduced. Label CSS/painted variants “iridescent-inspired”; do not call them simulated thin-film interference.
