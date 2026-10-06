# Capability: Export

Kind: capability
Ask when: the app lets users take results out of the browser as files or clipboard text (palettes, images, JSON, reports) with no server involved.
Default: astro (static output), react-spa → native-apis. Add a library only for a concrete problem the native APIs do not solve.
Verified: October 2026 against MDN (`HTMLCanvasElement.toBlob`, Clipboard API, `navigator.share`, the `download` attribute), the html-to-image and FileSaver.js READMEs, and the npm registry. Nothing here was built or tested in a browser. Re-verify the chosen option in its official docs before scaffolding.

## Options

| Option        | Status | Pick when                                                                                                                                                                                                                          | Works with                       | Cost       |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------- |
| native-apis   | trial  | Default. `Blob` and an `<a download>` link for files, the Clipboard API for copy, `navigator.share` where available, and a canvas drawn in code for image cards. No dependency                                                     | any                              | free       |
| html-to-image | trial  | The image must match a styled HTML component and you accept a dependency. It renders a DOM subtree through SVG `foreignObject` (1.11.13, last modified April 2025). It fails on very large DOMs and cannot render a tainted canvas | astro (React islands), react-spa | free (MIT) |
| file-saver    | trial  | You need its `saveAs` wrapper for download quirks. Version 2.0.5 was last modified November 2024, and its own README says that on iOS Safari files open in a new window instead of downloading                                     | any                              | free (MIT) |

## Option: native-apis

Setup: no packages. Files:

- `src/lib/export/formats.ts`: pure functions that turn a palette into text (hex list, HSL text, JSON). No DOM access, so they are easy to test.
- `src/lib/export/png-card.ts`: draws the palette card on a canvas and returns a `Blob` through `canvas.toBlob(callback, 'image/png')`.
- `src/lib/export/deliver.ts`: `downloadBlob`, `copyText`, `copyImage`, and `shareFile`, each feature-detected and each returning a typed result (done, cancelled, unsupported, failed).
  Conventions:
- Download: create an object URL with `URL.createObjectURL(blob)`, click an `<a>` with a `download` filename, then call `URL.revokeObjectURL`. The `download` attribute works only for same-origin, `blob:`, and `data:` URLs.
- `canvas.toBlob` calls back with `null` when the image cannot be created, and throws `SecurityError` for a tainted canvas. Treat `null` as a failure and show a message.
- Copy text with `navigator.clipboard.writeText`. Copy an image with `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`. The Clipboard API needs a secure context and is not available in workers, so call it from the main thread. Firefox and Safari require transient user activation for writes.
- Share with `navigator.share({ files })` only after `navigator.canShare({ files })` returns true. `AbortError` means the user cancelled, which is not a failure.
  Sources: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#download , https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob , https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API , https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

## Option: html-to-image

Setup: `html-to-image` (runtime dependency), used from a React island. Render the card as a hidden component and call `toBlob` on it.
Conventions:

- The component rendered to an image contains only local content: no cross-origin images, because tainted canvas content fails to render.
- Fonts are discovered from `@font-face`, downloaded, and inlined by the library. Use a self-hosted font only, and check the output image in every supported browser.
- Keep the DOM small. The README warns that rendering fails on a huge DOM.
- Delivery (download, copy, share) follows the `native-apis` conventions in `## Shared`.
  Sources: https://github.com/bubkoo/html-to-image

## Option: file-saver

Setup: `file-saver` (runtime dependency) and its type definitions if the package does not ship them. Use `saveAs(blob, filename)` for downloads.
Conventions:

- Call `saveAs` directly inside the click handler. Its README says a `setTimeout` prevents it from working on iOS Safari.
- Copy and share still use the native APIs (`## Shared`).
  Sources: https://github.com/eligrey/FileSaver.js

## Shared

Conventions:

- Formats: hex list (one uppercase `#RRGGBB` per line), HSL text (hue 0 to 360, saturation and lightness as percentages), JSON (`schemaVersion`, `exportedAt`, the palette), and a PNG palette card. Whether HSL values map to Lightroom adjustments is a product decision for the spec.
- Every export starts from a user click. Clipboard writes and sharing require transient user activation in some browsers.
- Feature-detect every delivery method and offer the others when one is missing. Never show a button that does nothing.
- Every failure shows a visible text message with a next step (try download instead of copy, for example).
- File names are built by one function: a fixed prefix, a sanitized label limited to letters, digits, `-` and `_`, a length limit, and the right extension. The browser converts `/` and `\` to `_`, but do not rely on that.
- Palette values are validated (hex pattern, count limit) before they are formatted. Stored data may be corrupt.
- The PNG card shows swatches and labels only. Including the photo thumbnail is an explicit opt-in toggle, off by default.
- The PNG card has one fixed size set in one constant. Maximum canvas size varies by browser and I could not confirm limits, so keep it modest and test on a phone.
- Draw card text only after the font it uses is available, so the PNG never falls back to a different typeface.
- A backup export (all saved analyses as JSON) uses the same delivery code. Importing a file validates it with a schema and a size limit before anything is written (see the on-device storage draft).
  Security checks (added to security-audit):
- Exported text and images are built from validated data. No HTML is built from user text, and card text is drawn with canvas text calls only.
- Imported files are size-limited and schema-validated before use.
- Nothing is uploaded: no export path calls `fetch` or loads a third-party script.
  Performance checks (added to performance-audit):
- Pure formatters run synchronously and quickly. Image generation and file reads that could block input are measured with the largest palette allowed.
- Object URLs are revoked after use, so repeated exports do not leak memory.
  Accessibility checks (added to accessibility-audit):
- Export buttons are real `<button>` elements with accessible names that include the format.
- Results ("Copied", "Download started", "Sharing cancelled", errors) are announced through a polite live region and readable as text, not only by color or icon.
- A copy or download action does not move focus unexpectedly.
  Testing:
- Unit-test every formatter with zero, one, maximum, and invalid colors, and the filename function with empty, long, and unsafe labels.
- E2E tests click each export and wait for the download event to check file name and content. Clipboard tests need clipboard permissions granted in the test browser context; confirm the exact Playwright calls when writing them.
