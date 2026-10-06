# Architecture

## Overview

Chromascope is a static website with one interactive tool, the Lab. Photos are analyzed in the browser and results are saved on the device, so there is no server, database, or account system. A service worker precaches the whole site so it also works offline and can be installed.

## Stack

See [`stack-profile.md`](stack-profile.md). Astro 7 (static), React islands, Tailwind 4, shadcn (Base UI), lucide, Inter, hand-written service worker. Hosting: Cloudflare Pages.

## Folder layout

```
src/pages/            routes: index, lab, how-to (list and [...slug]), 404
src/layouts/          BaseLayout: head, skip link, nav, footer, update prompt
src/components/       SEO.astro, UpdatePrompt.tsx, ui/ (shadcn)
src/content/how-to/   Markdown guides (collection in src/content.config.ts)
src/styles/           global.css (Tailwind import, design tokens)
src/lib/              shared helpers (cn)
public/               sw.js, manifest, icons, _headers, robots.txt
scripts/              build-precache.mjs (post-build step for the service worker)
e2e/                  Playwright tests (accessibility, offline, manifest)
```

## Data model

None on the server. Planned on-device storage: saved analyses in IndexedDB (not built yet).

## API or route map

| Route or action   | Auth | Input schema | Output                         |
| ----------------- | ---- | ------------ | ------------------------------ |
| `/`               | none | none         | Landing page                   |
| `/lab/`           | none | none         | Lab (placeholder)              |
| `/how-to/`        | none | none         | Guide list                     |
| `/how-to/<slug>/` | none | none         | Guide from Markdown            |
| `/404.html`       | none | none         | Not-found and offline fallback |

## Auth and permissions

None. There are no accounts. Nothing is sent to a server.

## Environment variables

None yet. Declare each new one in the `env.schema` of `astro.config.mjs` and list it in `.env.example`.

## Deployment

Cloudflare Pages, static output from `pnpm build` (`dist/`). The build runs `astro build` and then `scripts/build-precache.mjs`, which fills the version and file list into `dist/sw.js`. `public/_headers` sets caching: `no-cache` for `sw.js` and the manifest, immutable for `/_astro/*`. No health endpoint (static). Rollback: redeploy the previous deployment in Cloudflare Pages. Not deployed yet.

## Decisions

- [001: Stack](adr/001-stack.md)
