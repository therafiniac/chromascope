# PRD: Chromascope

## Problem and intent

Photographers who color grade need to see the colors in a photo and how they relate to color harmonies, then carry that into their edit. Existing palette extractors list swatches but do not connect them to grading. Chromascope is a free tool that does this on the device, with no signup and no upload.

## Users

- Primary: photographers who color grade (Lightroom, Photoshop).
- Secondary: designers and general users who want a palette from an image.

## Scope (in)

- Load a photo and see its dominant colors.
- Color wheel with harmony suggestions (complementary, analogous, triadic, split-complementary) and the shifts needed to reach one.
- Export the palette: hex list, PNG palette card, JSON, HSL values.
- Save analyses on the device and reopen them later.
- Short how-to pages on using the tool (no color theory).
- Installable, works offline.

## Non-goals

- Accounts, cloud sync, payments, courses, or video content.
- Color theory teaching content.
- Languages other than English.
- A blog or search.

## Acceptance criteria (each must be testable)

- [ ] Given a JPEG, PNG or WebP photo, when it is loaded, then dominant colors appear without the image leaving the device.
- [ ] Given an analyzed photo, when a harmony is chosen, then the wheel shows the image hues against that harmony.
- [ ] Given an analyzed photo, when an export format is chosen, then the file or text is produced in that format (hex, PNG, JSON, HSL).
- [ ] Given a saved analysis, when the page is reloaded or offline, then it can be reopened from device storage.
- [ ] Given the installed app and no network, when the Lab is opened, then it loads and analyzes a new photo.
- [ ] Given an unsupported or oversized file, when it is loaded, then a clear error is shown and nothing is stored.
- [ ] Given a keyboard-only user, when using the Lab, then every control is reachable and has a visible focus state.

## Data and API notes

No server and no API. Analyses are stored on the device (IndexedDB, planned). Photos are processed in the browser and never uploaded.

## Risks and open questions

- Domain name and budget (none bought yet; roughly $10-15 a year).
- Maximum image size and the downscale size used for analysis.
- Exact harmony set, and how shift suggestions map to Lightroom HSL and grading controls.
- Whether analytics is wanted at all (skipped for now).
- iOS Safari support for install and storage persistence is limited.
- On-device storage, color math, and export have no catalog profile yet. Run `/rafi:add-capability` for each.

## Audits this feature triggers

- [ ] security (dependencies) - [x] seo (public pages) - [x] performance - [x] accessibility
