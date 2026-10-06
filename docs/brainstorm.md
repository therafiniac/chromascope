# Brainstorm: Chromascope

## Idea

A free, browser-based color analysis tool for photographers (also useful to designers and general users). Load a photo, see its dominant colors, see how they sit against color harmonies, and export the result. Inspired by the Color Lab at louimagin.com/the-colorcode-yt.

## Users

- Primary: photographers who color grade (Lightroom, Photoshop).
- Secondary: designers and general users who want a palette from an image.

## Core flows

1. Load a photo and see its dominant colors.
2. See the colors placed on a color wheel with harmony suggestions (complementary, analogous, triadic, split-complementary) and the shifts needed to reach one.
3. Export the palette: hex list, PNG palette card, JSON, HSL values.
4. Save analyses on the device and reopen them later.
5. Read short how-to pages on using the tool (no color theory).

## Non-goals (v1)

- Accounts, cloud sync, payments, courses, or video content.
- Color theory teaching content.
- Languages other than English.
- A blog or search.

## Acceptance criteria (draft)

- Given a JPEG, PNG or WebP photo, when it is loaded, then dominant colors appear without the image leaving the device.
- Given an analyzed photo, when a harmony is chosen, then the wheel shows the image hues against that harmony.
- Given an analyzed photo, when an export format is chosen, then the file or text is produced in that format (hex, PNG, JSON, HSL).
- Given a saved analysis, when the page is reloaded or offline, then it can be reopened from device storage.
- Given the installed app and no network, when the Lab is opened, then it loads and analyzes a new photo.
- Given an unsupported or oversized file, when it is loaded, then a clear error is shown and nothing is stored.
- Given a keyboard-only user, when using the Lab, then every control is reachable and has a visible focus state.

## Chosen approach

A: static Astro site with a React island for the Lab, a PWA, and all analysis and storage on the device. It matches: free, private, no accounts, English only, content edited by the owner.

Rejected:

- B, full-stack app with database: adds accounts, privacy and security work, and contradicts "saved on device".
- C, native or Electron app: highest effort, and loses the "open a link and use it" ease.

## Stack

| Concern                        | Choice                                                      | Alternatives considered     |
| ------------------------------ | ----------------------------------------------------------- | --------------------------- |
| Framework                      | astro (static output)                                       | react-spa                   |
| Database                       | none                                                        | postgres, mongodb           |
| Hosting                        | Cloudflare Pages (free)                                     | Netlify, Vercel, Railway    |
| Auth                           | none                                                        | none                        |
| Styling                        | tailwind + tailwind-typography                              | native-css                  |
| UI components                  | shadcn (React islands)                                      | none, react-aria-components |
| Icons                          | lucide                                                      | phosphor                    |
| Fonts                          | astro-fonts                                                 | system-stack                |
| CMS                            | none (Markdown in repo)                                     | keystatic                   |
| Analytics                      | cloudflare-web-analytics (optional)                         | umami                       |
| Search, forms, payments, email | skipped                                                     | —                           |
| Structured data                | skipped                                                     | hand-written-jsonld         |
| PWA / offline                  | **not in catalog**: @vite-pwa/astro                         | hand-written service worker |
| On-device storage              | **not in catalog**: IndexedDB via `idb`                     | localStorage                |
| Color extraction and math      | **not in catalog**: `culori` + k-means in a Web Worker      | colorthief, node-vibrant    |
| Export                         | **not in catalog**: canvas PNG card, JSON, hex and HSL text | none                        |

## Open questions

- Domain name and budget (none bought yet; roughly $10-15 a year).
- Maximum image size and the downscale size used for analysis.
- Exact harmony set and how "shift suggestions" map to Lightroom HSL and grading controls.
- Whether analytics is wanted at all.
- Does the PWA need to be installable on iOS Safari (limited support)?

Next: `/rafi:add-capability` for the four "not in catalog" rows (PWA, on-device storage, color extraction, export), then `/rafi:bootstrap-project chromascope`, which reads `docs/brainstorm.md`.
