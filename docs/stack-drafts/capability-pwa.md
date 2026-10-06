# Capability: PWA (offline and install)

Kind: capability
Ask when: the app must work with no network after the first visit, or must be installable to the home screen or desktop. Skip for sites that only need to be read online.
Default: astro (static output) → hand-written-sw. Static output with no offline need → none. Re-check `vite-pwa-astro` once its Astro peer range includes the Astro version in use.
Verified: October 2026 against the vite-pwa docs, the `@vite-pwa/astro` and `vite-plugin-pwa` package.json files on GitHub, and the Cloudflare Pages headers docs. Nothing here was built in a test project. Re-verify the chosen option in its official docs before scaffolding.

## Options

| Option          | Status | Pick when                                                                                                                                                                                                               | Works with                                                            | Cost |
| --------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---- |
| hand-written-sw | trial  | Static Astro site that needs offline use and install, with no plugin tied to the Astro version. You own about 100 lines of service worker and a small build script                                                      | astro (static output), react-spa                                      | free |
| vite-pwa-astro  | trial  | You want generated Workbox service worker and manifest. As of October 2026 `@vite-pwa/astro` 1.2.0 declares `astro` peers only up to `^5.0.0`, so check it installs and builds on your Astro version before choosing it | astro (verify peer range), react-spa (use `vite-plugin-pwa` directly) | free |
| none            | adopt  | Online-only is acceptable. No service worker, no manifest                                                                                                                                                               | any                                                                   | free |

## Option: hand-written-sw

Setup: no runtime dependency. Files:

- `public/manifest.webmanifest`: `name`, `short_name`, `start_url`, `scope`, `display: "standalone"`, `theme_color`, `background_color`, and icons at 192 and 512 px plus one 512 px `purpose: "maskable"`. Link it from the base layout head with `<link rel="manifest">`.
- `public/sw.js`, a plain JavaScript file copied to the site root so its scope is the whole site. It contains two placeholders (`__BUILD_VERSION__` and the precache list) that the build script fills in. Type checking does not cover it, so keep it small. It precaches the app shell and every built page and asset, then answers same-origin GET requests from the cache first.
- `scripts/build-precache.mjs`, run after `astro build`: lists the files in `dist/` with a content hash each, replaces the placeholders in `dist/sw.js` with the list and a build version, and fails the build if the total precache size exceeds the budget set in the script.
- `src/components/UpdatePrompt.tsx`, a React island in the base layout, registers the worker (production builds only) and shows the "Update available" prompt (see Conventions).
- `public/_headers` (Cloudflare Pages) sets `Cache-Control: no-cache` for `/sw.js` and `/manifest.webmanifest`, and `public, max-age=31556952, immutable` for fingerprinted assets.
  Conventions:
- The cache name includes the build version. On `activate`, delete every cache whose name is not the current one.
- Never call `skipWaiting()` automatically. A new worker waits; the page shows an "Update available" prompt, and only the user's click posts a `SKIP_WAITING` message. Reload on `controllerchange`. This avoids replacing the app while a user is mid-analysis.
- Handle only same-origin `GET` requests. Cache only responses with status 200. Never cache third-party requests or non-GET methods.
- Navigations are served from the precache; unknown offline routes fall back to the precached `/404` page.
- Photos and saved analyses never go into Cache Storage. Store them in IndexedDB (on-device storage capability).
- Call `navigator.storage.persist()` after the first successful save, and handle a refusal and `QuotaExceededError` with a visible message.
- Register the worker only in production builds, so development never serves stale cached pages.
  Security checks (added to security-audit):
- The site is served over HTTPS only (a service worker needs a secure context; `localhost` is the exception).
- `sw.js` is served from the site root with `no-cache`, and its scope is not widened.
- No secrets or user data appear in the precache list or in Cache Storage.
- The worker caches no cross-origin or authenticated responses.
  Performance checks (added to performance-audit):
- Precache size stays under the budget set in `scripts/build-precache.mjs`. Large optional assets load lazily at first use instead of being precached.
- Fingerprinted assets use `immutable` caching; HTML and `sw.js` do not.
- Registration runs after page load and does not delay first paint.
  Accessibility checks (added to accessibility-audit):
- The "Update available" prompt is a keyboard-reachable control with an accessible name, announced through a polite live region, and not auto-dismissed.
- The offline state is shown in text, not only by color or icon.
  SEO checks (added to seo-audit, if relevant):
- Pages keep real HTML and canonical URLs; the service worker does not replace content seen by crawlers.
  Sources: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps , https://developers.cloudflare.com/pages/configuration/headers/

## Option: vite-pwa-astro

Setup: `@vite-pwa/astro` (Astro integration) with `vite-plugin-pwa` (Workbox-based generator, required by the integration). Add `AstroPWA({ registerType: 'prompt', manifest: {...}, workbox: { navigateFallback: '/404' } })` to `integrations` in `astro.config.mjs`. Register the worker from a client module using `virtual:pwa-register`. Before installing, confirm three things, because the declared versions disagreed at the time of writing: the integration's `astro` peer range (1.2.0 stops at `^5.0.0`), its `vite-plugin-pwa` range (`^1.2.0`), and the current `vite-plugin-pwa` release (2.0.0, which requires Node 20.19 or later and `workbox-build` and `workbox-window` `^7.4.1`). Do not override a peer range with `pnpm.overrides` without a passing build and offline test.
Conventions:

- Use `registerType: 'prompt'`, not `'autoUpdate'`, for the reason given under hand-written-sw: no silent replacement of the app mid-session.
- Same rules as hand-written-sw for what may be cached: same-origin GET, status 200, no user photos or analyses in Cache Storage.
- Keep the precache glob explicit and review the generated precache list after each build.
  Security checks (added to security-audit):
- Same as hand-written-sw.
- The dependency tree is checked for advisories and abandoned packages (`pnpm audit`), since the integration has had no release since November.
  Performance checks (added to performance-audit):
- Same budget rule as hand-written-sw, applied to the generated precache manifest.
  Accessibility checks (added to accessibility-audit):
- Same as hand-written-sw.
  SEO checks (added to seo-audit, if relevant):
- Same as hand-written-sw.
  Sources: https://vite-pwa-org.netlify.app/frameworks/astro , https://github.com/vite-pwa/astro/blob/main/package.json , https://github.com/vite-pwa/vite-plugin-pwa/blob/main/package.json

## Option: none

Setup: no service worker, no manifest. The app needs the network on every visit.
Conventions:

- State "requires an internet connection" in the project docs so offline expectations are explicit.
  Sources: none.

## Shared

Conventions:

- Test offline behavior in a production build served with `pnpm preview`: load the app once, wait for the service worker to be active, call `context.setOffline(true)` in Playwright, then reload and run the core flow.
- Installability is checked in the browser's Application panel or an E2E test that fetches and validates `manifest.webmanifest`.
- iOS Safari: support is limited and storage can be evicted. Secondary sources (not Apple documentation) report a 7-day cleanup for sites unused in Safari, an installed home-screen app being exempt in some sources and not in others, and a roughly 50 MB quota for non-installed sites. Treat device storage as best effort: always offer an export so users can keep a copy of their data, and do not promise permanence in the UI.
  Security checks (added to security-audit):
- A service worker is a persistent script on the origin. Changes to `sw.js` get the same review as other production code.
  Performance checks (added to performance-audit):
- Repeat visit on a throttled connection loads from the cache without network requests for shell assets.
  Accessibility checks (added to accessibility-audit):
- Install and update prompts work by keyboard and screen reader (see option sections).
