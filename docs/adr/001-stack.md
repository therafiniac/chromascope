# ADR 001: Stack

Status: accepted
Date: 2026-10-06

## Context

Chromascope is a free color analysis tool for photographers. Constraints from `docs/brainstorm.md`: no hosting budget, no accounts, photos must stay on the device, offline use, English only, and content edited by the owner in the repo. No domain bought yet.

## Decision

| Concern       | Choice                                                        | Alternatives considered                                                                                                                                       |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approach      | Static site with PWA, all processing on the device            | Full-stack app with database (adds accounts and privacy work, contradicts "saved on device"); native or Electron app (highest effort, loses open-a-link ease) |
| Framework     | Astro 7, static output                                        | React SPA (no SEO for how-to pages)                                                                                                                           |
| Database      | none                                                          | Postgres, MongoDB (nothing is stored on a server)                                                                                                             |
| Hosting       | Cloudflare Pages, free                                        | Netlify, Vercel, Railway                                                                                                                                      |
| Auth          | none                                                          | none                                                                                                                                                          |
| Styling       | Tailwind 4 and typography plugin                              | native CSS                                                                                                                                                    |
| UI components | shadcn on Base UI, in React islands                           | none; React Aria Components                                                                                                                                   |
| Icons         | lucide                                                        | Phosphor                                                                                                                                                      |
| Fonts         | Inter via the Astro Fonts API                                 | system font stack                                                                                                                                             |
| CMS           | none (Markdown in the repo)                                   | Keystatic                                                                                                                                                     |
| Analytics     | skipped for now                                               | Cloudflare Web Analytics, Umami                                                                                                                               |
| PWA           | hand-written service worker plus build script (project draft) | `@vite-pwa/astro` (1.2.0 declares Astro peers only up to 5, this project is on Astro 7); no PWA                                                               |
| Lint          | ESLint 10 with `eslint-plugin-jsx-a11y-x`                     | ESLint 9 (conflicts with `eslint-plugin-astro` 3); original `eslint-plugin-jsx-a11y` (no ESLint 10 support)                                                   |
| TypeScript    | 6                                                             | 7 (`astro check` refuses it)                                                                                                                                  |

## Consequences

- Free to run; the only cost is an optional domain.
- Private by design, and works offline. Storage is per device and can be lost if the browser clears site data (iOS Safari is stricter), so export must be offered.
- We own about 100 lines of service worker code and a build script instead of a plugin. Revisit `@vite-pwa/astro` once its peer range includes the Astro version in use.
- Pending, with no catalog profile: on-device storage (IndexedDB), color extraction and math, export. Each needs `/rafi:add-capability` before the Lab is built.
- Revisit analytics, the domain, and the `site` placeholder (`chromascope.pages.dev`) before launch.
