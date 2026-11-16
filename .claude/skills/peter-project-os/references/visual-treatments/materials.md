# Tactile materials

Shared approach: separate large-scale shading, mid-scale material structure, and fine detail. Reuse a deterministic seed or recorded source asset so comparisons are repeatable. A new noise seed must not distract from whether a change improved the composition. Technical foundations and sources are in [sources.md](sources.md); the recipes and tuning ranges below are original suggestions.

## 1. Felt texture

**Identity and fit.** Convey compressed, interlocking fibers with soft diffuse shading; not a knitted weave, velvet sheen, or uniformly blurred noise. Useful for friendly tactile brand imagery, toy-like objects, packaging concepts, and restrained panels. Avoid placing busy fibers behind small labels or presenting synthetic texture as a real product photograph.

**Build.** Start with the selected base color and broad, low-amplitude tonal variation. Add short, thin, irregular fiber marks in multiple directions, clustered subtly rather than evenly tiled. Use two or three close tones and occasional lighter edge fibers. For a 3D object, tune surface roughness and shallow normal detail before adding geometry; reserve silhouette fibers for close views. A flattened image is generally enough for a static interface background.

**Tune.** Proposed starting point: visible fibers roughly 1–4 display pixels long at the intended size; fine detail at about 3–8% visual strength, reduced under content. Record scale in output units, not only texture-image dimensions. Avoid a strong repeating directional comb unless the reference shows one.

**Verify/fallback.** Inspect seams, edge halo, material recognizability, and contrast. At thumbnail size it should read as soft material rather than dirt. If texture disappears in export, enlarge a few fibers instead of globally sharpening. Fallback: a solid matte surface with restrained tonal depth. Distinguish this art-directed approximation from measured fiber scattering.

## 5. Speckled graphite

**Identity and fit.** Small irregular graphite-like flecks on a coherent mineral or drawn field. Interpret whether the user means dark graphite material or pencil residue from the actual reference; the name alone does not resolve that ambiguity. Useful for editorial covers and quiet industrial compositions.

**Build.** Use a stable charcoal/gray field, sparse marks with varied size and aspect ratio, and subtle lower-frequency tone variation. For a graphite-drawing interpretation, align some marks with plausible strokes and let the paper show through. For a material interpretation, keep the surface continuous and the flecks embedded. Avoid adding glossy metallic highlights unless the visual reference supports them.

**Tune.** Begin with small clusters rather than uniformly spaced dots, mostly sub-2-pixel marks with occasional larger flecks at final size. Reduce overall contrast before reducing all dots to unresolvable noise. Place content on a quieter masked region or separate panel.

**Verify/fallback.** Check whether compression creates muddy blocks or repeating tile seams. Inspect grayscale, low-brightness display, and print proof when relevant. Compare against a clean gray version to confirm the texture contributes identity. Fallback: a flat gray field or a modest baked grain tile. Do not confuse this with a halftone tonal encoding.

## 10. Grass texture

**Identity and fit.** A field of blades or clustered vegetation with direction, occlusion, and varied scale; green noise alone is not convincing grass. Appropriate to outdoor, sports, ecology, or playful tactile imagery, not evidence of an environmental claim.

**Build.** For static work, prefer supplied/licensed photography, original illustration, or a generated asset inspected for repetition and blade coherence. Establish ground tone, clump distribution, light direction, blade height variation, and a clear depth/camera scale. For existing 3D environments, instanced clumps or crossed textured cards can be economical; [NVIDIA's grass chapter](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass) illustrates that approach. Treat its historical hardware limits as historical, not current benchmarks.

**Tune.** Vary clump spacing and hue modestly, retain rooted bases, and use distance-based simplification in interactive scenes. If motion is justified, vary phase across clumps while keeping the base anchored. Do not model thousands of DOM elements as blades.

**Verify/fallback.** Inspect repeated clusters, floating roots, transparency fringes, close/far transitions, overdraw, and motion comfort. For interfaces, keep grass outside dense content regions and test crop at narrow sizes. Fallback: a single well-composed static field or stylized silhouette. Do not claim botanical or physical accuracy without supporting evidence.

## 12. Paper texture

**Identity and fit.** Subtle fibers, tooth, and uneven reflectance on a mostly planar surface; different from dramatic crumpled paper or dirt. Useful for editorial material, stationery, art portfolios, and handmade narratives. Formal reports may benefit from plain paper instead.

**Build.** Start from an appropriate paper tone, then add low-strength broad variation and fine fiber/tooth detail. Separate lighting shadows from the texture so a repeated tile does not repeat a visible lighting pattern. Use a seamless neutral tile or sufficiently large original scan with permission. Keep text as editable text above the texture, not baked into an image.

**Tune.** A suggested starting range is 2–6% texture strength behind reading content; increase only in empty margins or hero imagery. Avoid implying aged parchment through yellow tint, torn edges, stains, and curled corners unless requested. Maintain a quiet region for charts and footnotes.

**Verify/fallback.** Render the document to its actual output format. Check legibility, image size, page breaks, color changes, and whether the texture prints as a gray wash. Consider an economical plain-paper export for long documents. Fallback: solid off-white with proper typography and spacing. A texture is not a substitute for document structure.
