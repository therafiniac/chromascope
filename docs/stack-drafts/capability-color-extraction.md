# Capability: Color extraction and math

Kind: capability
Ask when: the app finds dominant colors in a user's photo, or computes color relationships (harmonies, conversions, hue distances), entirely in the browser.
Default: astro (static output), react-spa → culori-kmeans. Evaluate `colorthief` on real photos before ruling it out (see its option).
Verified: October 2026 against MDN (`createImageBitmap`, `OffscreenCanvas`, `getImageData`), the Vite worker guide, the culori API and tree-shaking pages, the color-thief README, and the npm registry. Nothing here was built or run in a browser. Not checked: whether `ImageBitmap` can be transferred to a worker (believed so, confirm on MDN when building), whether `culori` ships its own TypeScript types, and `chroma-js` and `node-vibrant`, which are not covered.

## Options

| Option        | Status | Pick when                                                                                                                                                                                                                                                                  | Works with                       | Cost |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---- |
| culori-kmeans | trial  | Default. You want full control: `culori` (4.0.2, MIT) for color conversion and gamut handling, plus a small k-means written in the project and run in a Web Worker. You own the algorithm and its tests                                                                    | astro (React islands), react-spa | free |
| colorthief    | trial  | You prefer a ready-made extractor. Version 3.5.0 (August 2026, MIT, zero runtime dependencies) quantizes in OKLCH by default and documents use in Web Workers with `ImageBitmap`. It is a recent major version, so compare its palettes with your own on real photos first | astro (React islands), react-spa | free |

## Option: culori-kmeans

Setup: `culori` (runtime dependency: conversions, hex and HSL formatting, gamut mapping). Check whether it ships its own types; if not, add `@types/culori` (dev dependency; version 4.0.1 exists). Import from `culori/fn` and register only the modes used (`useMode(modeRgb)`, `useMode(modeOklab)`, `useMode(modeOklch)`, `useMode(modeHsl)`), so the bundle stays small. Without registration, parsing returns `undefined`. Files:

- `src/lib/color/kmeans.ts`: pure k-means over an array of OKLab points. No DOM access.
- `src/lib/color/harmony.ts`: pure hue math (see Shared).
- `src/lib/color/analyze.worker.ts`: receives an `ImageBitmap`, reads pixels, runs the clustering, and posts the result.
- `src/lib/color/analyze.ts`: main-thread client that owns the worker and exposes `analyzePhoto(file)`.
  Conventions:
- Cluster in OKLab (`l`, `a`, `b`) with Euclidean distance. Convert cluster centers to hex through `oklch` and `clampChroma` or `toGamut`, so every output color is displayable.
- Initialization is deterministic (for example farthest-point or k-means++ with a fixed-seed generator) and iterations are capped. The same photo always gives the same palette.
- Achromatic colors have an `undefined` hue in culori. Treat them as neutral in harmony math and never pass `undefined` into arithmetic.
  Sources: https://culorijs.org/api/ , https://culorijs.org/guides/tree-shaking/

## Option: colorthief

Setup: `colorthief` (runtime dependency). It returns color objects with `.hex()`, `.rgb()`, `.hsl()`, and `.oklch()` methods and offers sync and async palette functions. It accepts `ImageBitmap` and `OffscreenCanvas` and can run in a worker. Culori is likely still needed for hue rotation and gamut mapping back to hex; confirm during the Add step.
Conventions:

- Run it inside the worker with an `ImageBitmap`, never on the main thread.
- Compare its palette with `culori-kmeans` on a fixed set of synthetic and real test photos before choosing: same photo, same result every run, and no near-duplicate colors.
- Wrap it in the same `analyzePhoto(file)` interface as the other option, so the rest of the app does not depend on it.
  Sources: https://github.com/lokesh/color-thief

## Shared

Conventions:

- Pipeline: validate the file (type and size limit) → `createImageBitmap(file, { resizeWidth, resizeHeight })` → draw into an `OffscreenCanvas` in the worker → `getImageData` (RGBA, `Uint8ClampedArray`, sRGB by default) → cluster → return colors with their share of the image.
- Downscale before analysis: the long side is a single constant between 256 and 512 px. Compute both resize dimensions yourself to keep the aspect ratio. `createImageBitmap` applies EXIF orientation by default (`imageOrientation: 'from-image'`); keep that.
- Skip pixels whose alpha is below a threshold, so transparent PNGs do not produce a color.
- Result: a fixed number of colors from one constant (default 6, allowed 5 to 8), sorted by share of pixels, each with hex, OKLCH, and share. Fewer distinct colors than requested returns fewer colors, not duplicates.
- Pick one hue space (OKLCH) for all math and for the color wheel. Convert to HSL only for export.
- Harmony math in `harmony.ts`: complementary (+180°), analogous (±30°), triadic (+120°, +240°), split-complementary (+150°, +210°). Hue arithmetic wraps at 360°. A color's distance to a harmony is its smallest angular distance to a target hue. Colors with very low chroma are neutral and excluded from the distance.
- Create the worker lazily on the client, never at module top level, because the static build has no `Worker`. Vite requires `new Worker(new URL('./analyze.worker.ts', import.meta.url), { type: 'module' })` written exactly like this, with static options.
- One analysis at a time. Each job has an id, a new job cancels the previous one, results from an old job are ignored, and the worker is terminated when the island unmounts.
- Decoding failure (`InvalidStateError` from `createImageBitmap`) and unsupported types map to a clear user message. Trust a successful decode over `file.type`.
- No `fetch` or third-party script is involved. The photo never leaves the device.
  Security checks (added to security-audit):
- The uploaded file is untrusted input: type and size limits are checked before decoding, and decoding happens in the worker.
- Only pixels are used. EXIF data, location, and file names are not read, stored, or shown.
- No pixel data, palette, or file name is logged or sent anywhere.
  Performance checks (added to performance-audit):
- The main thread stays responsive during analysis: no long task over 50 ms in the Performance panel.
- Measure analysis time for a large photo (about 12 megapixels) on a mid-range phone, and record the budget in the spec.
- Only the registered `culori/fn` modes are bundled. The worker is its own chunk and loads on first use.
  Accessibility checks (added to accessibility-audit):
- Every swatch has a text label (hex and share) and does not rely on color alone.
- Progress and errors are announced through a live region and readable as text.
- Harmony results are available as a list, not only as a drawing.
  Testing:
- Unit-test `kmeans.ts` and `harmony.ts` with plain arrays, because jsdom has no `createImageBitmap` or `OffscreenCanvas`. Cases: one color, two colors, a gradient, all pixels transparent, a single pixel, more requested colors than distinct colors, and the same input giving the same output twice.
- Test hue wraparound (for example 350° plus 30°), achromatic input, and the boundary counts (5 and 8).
- E2E in a real browser: load a small synthetic fixture image and expect the right number of labeled swatches. Use generated fixtures, not real personal photos.
