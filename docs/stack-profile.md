# Stack profile: astro + none

## Stack

| Concern                                                    | Choice                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Framework                                                  | astro (static output)                                                                       |
| Database                                                   | none                                                                                        |
| Hosting                                                    | Cloudflare Pages (free)                                                                     |
| Auth                                                       | none                                                                                        |
| Styling                                                    | tailwind + tailwind-typography                                                              |
| UI components                                              | shadcn (Base UI, React islands)                                                             |
| Icons                                                      | lucide                                                                                      |
| Fonts                                                      | astro-fonts (Inter)                                                                         |
| CMS                                                        | none (Markdown in the repo)                                                                 |
| PWA / offline                                              | hand-written-sw (project draft, `docs/stack-drafts/capability-pwa.md`)                      |
| Analytics, search, forms, payments, email, structured data | skipped                                                                                     |
| On-device storage                                          | pending: not in catalog (IndexedDB via `idb`), run `/rafi:add-capability`                   |
| Color extraction and math                                  | pending: not in catalog (`culori` plus k-means in a Web Worker), run `/rafi:add-capability` |
| Export (PNG, JSON, hex, HSL)                               | pending: not in catalog (browser APIs), run `/rafi:add-capability`                          |

# Framework profile: Astro

Kind: framework. Use for content-driven sites where SEO and speed matter most: blogs, documentation, marketing and portfolio sites, and small shops backed by a headless service. A purely static site needs no database profile (choose none). Add one only if the site has server-side data.
Verified against: Astro 7.x (Vite 8, Rust compiler), September 2026. Read in full: the Astro v7 upgrade guide, https://docs.astro.build/en/guides/upgrade-to/v7/. The rest follows the Astro docs guides named below. Re-verify version-specific behavior before large changes.

## Stack

Astro 7, TypeScript strict, Vitest, Playwright, pnpm. Styling, icons, CMS, search, and other cross-cutting concerns come from the chosen capabilities (`stacks/capabilities/`). Static output by default. Interactive islands use one UI framework only when needed (React is the default choice). Default hosting: a static host (Railway, Netlify, Cloudflare Pages, or Vercel). On-demand rendering needs an adapter for the chosen host.
Node: use a current LTS that the installed Astro version supports, and pin it in `.nvmrc`.

## Scaffold contract

- Create with `pnpm create astro@latest` (minimal template, TypeScript strict), or scaffold by hand. The generator also writes its own `CLAUDE.md` and `AGENTS.md` (dev-server and docs-link notes); they must not replace the template's `CLAUDE.md`.
- Folders: `src/pages` (routes only), `src/layouts` (page shell with head, SEO, skip link), `src/components`, `src/content` (Markdown, MDX, or data), `src/content.config.ts` (collection definitions), `src/lib`, `public/` (static files such as `robots.txt`).
- Collections use the Content Layer API: a loader plus a Zod schema (Zod comes from `astro/zod`). Astro 6 and later have no legacy collections.
- Scripts: `dev` (`astro dev`), `build` (`astro build`), `preview` (`astro preview`), `typecheck` (`astro check`, which needs `@astrojs/check` and `typescript@^6`: as of September 2026 `astro check` refuses TypeScript 7, and TypeScript 7 support is only experimental through `@astrojs/ts-content-mapper`), `lint` (ESLint with `eslint-plugin-astro`), `test` (Vitest configured with `getViteConfig` from `astro/config`), `check` (typecheck + lint + test), `test:e2e` (`playwright test`), `lighthouse` (`lhci autorun`).
- Also: `packageManager`, `.nvmrc`, Prettier with `prettier-plugin-astro`, `.env.example`, one passing test, `@astrojs/sitemap`, and `site` set in `astro.config.mjs`.
- Overrides to the standard bootstrap list: no health endpoint for static output. Environment variables are declared in the `astro:env` schema instead of a hand-written Zod env module.
- E2E and Lighthouse dev dependencies: `@playwright/test`, `@axe-core/playwright`, `@lhci/cli`. Reuse the `e2e/a11y.spec.ts` pattern from the Next.js profile with this site's real routes. E2E and Lighthouse run against a build served with `pnpm preview`, so run `pnpm build` first.

### `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

### `lighthouserc.json` (list the real URLs)

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm preview",
      "url": ["http://localhost:4321/"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

## Conventions

- Ship zero client JavaScript by default. Add an island only for real interactivity, and use the lightest directive that works: `client:visible` or `client:idle` before `client:load`. `client:only` skips server rendering, so never use it for content.
- Layouts own the `<head>`. Title, description, canonical, Open Graph, and JSON-LD come from one `SEO` component with typed props. Pages never write raw `<meta>` tags.
- Content lives in collections and pages query it with `getCollection`. Slugs come from the content, not from hand-typed strings.
- Content images use `astro:assets` (`<Image>` or `<Picture>`) with `alt` and dimensions. No raw `<img>` for content.
- Forms and mutations on on-demand routes use Astro Actions with Zod input validation.
- A page that needs per-user data or authentication sets `export const prerender = false` and is served on demand.
- Keep templates valid HTML. Astro 7's compiler no longer repairs bad markup.

## Astro 7 changes that break older habits

- The Rust compiler is stricter: unclosed tags are errors, and invalid nesting (a `div` inside a `p`) is passed through to the browser unchanged.
- `compressHTML` now defaults to `'jsx'`, so whitespace between inline elements is stripped. Add `{" "}` where a space is needed, or set `compressHTML: true`.
- Markdown renders with Sätteri by default. Remark and rehype plugins need `@astrojs/markdown-remark` and `markdown.processor: unified()`.
- `src/fetch.ts` is a reserved file name. `@astrojs/db` is removed.
- Vite 8 is the bundler, so Vite-specific plugins may need updating.

## Security checks (added to security-audit)

- `set:html`, and `dangerouslySetInnerHTML` inside islands, render raw HTML. Use them only with sanitized or trusted content (§4, §12).
- Variables prefixed `PUBLIC_`, or declared with `context: 'client'` in `astro:env`, reach the browser. Secrets are declared with `access: 'secret'` and `context: 'server'` (§5).
- Prerendered pages skip middleware. Any page or endpoint that needs authentication is on-demand (`prerender = false`) and checks the user itself. Middleware alone is not enough (§3).
- Endpoints and Actions validate all input with Zod and check authorization on every call (§3, §4). Confirm `security.checkOrigin` behavior for the installed version on form posts (§6).
- Security headers (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`): on a static host set them in the host's configuration. On-demand routes can set them in middleware (§10).
- Third-party scripts are few, loaded async, and reviewed. Consider Partytown for heavy ones (§15).
- Integrations and adapters come from trusted publishers, at pinned versions (§9).

## SEO checks (added to seo-audit)

- `site` is set in `astro.config`. `@astrojs/sitemap` generates the sitemap index. `robots.txt` points to it and does not block production.
- Every page has a unique title, a meta description, and a canonical URL built from `Astro.url` and `site`.
- `trailingSlash` and `build.format` are set once and match the canonicals, the sitemap, and internal links. Every changed URL has a redirect (`redirects` config or host rules).
- `src/pages/404.astro` exists and the host serves it with status 404. Verify a missing URL with `curl -I`.
- JSON-LD (Article, BreadcrumbList, Organization) is rendered with `<script type="application/ld+json" set:html={JSON.stringify(data)} />` and validated.
- The LCP image is not lazy-loaded. Blogs publish an RSS feed with `@astrojs/rss`.
- Paginated lists use `paginate()`, and each page has a self-referencing canonical.
- Multilingual sites use Astro's i18n routing and `hreflang` (§9 of the SEO standard).

## Performance checks (added to performance-audit)

- Count the client islands per page and the JavaScript each one ships. A content page should ship almost none.
- No `client:load` without a written reason.
- Fonts use Astro's font handling or self-hosted subsets with `font-display: swap`. Preload only the critical font.
- View transitions and prefetch are on only if measured to help. Each adds client code.
- On-demand pages use route caching (stable in Astro 7) where the content allows. Large pages stream.
- Large collections are paginated at build time.
- Measure the bundle with a bundle-analysis tool. Measure speed with Lighthouse against `astro build` plus `astro preview`, never `astro dev`.

## Accessibility checks (added to accessibility-audit)

- The layout sets `<html lang>` and has landmarks (`header`, `nav`, `main`, `footer`) and a skip link. Each page has one `<h1>`.
- `<Image>` requires `alt`. Decorative images use `alt=""`.
- Islands are keyboard-operable and follow the WAI-ARIA pattern for their widget.
- If view transitions (`ClientRouter`) are on, verify focus handling and route announcements with a screen reader.
- Markdown content: headings do not skip levels and links have descriptive text.
- `e2e/a11y.spec.ts` covers every page template.

## Sources

- https://docs.astro.build/en/guides/upgrade-to/v7/ (read in full)
- https://docs.astro.build/en/upgrade-astro/ (latest release and Node policy)
- Astro docs guides for content collections, images, on-demand rendering, actions, environment variables, testing, and deployment. Section names taken from the docs navigation. Re-verify details before relying on them.

# Capability: Styling (tailwind + tailwind-typography)

## Option: tailwind

Setup:

- Vite-based projects (astro, react-spa, `apps/web` in react-express): `tailwindcss` and `@tailwindcss/vite`, registered as a Vite plugin (for Astro, under `vite.plugins` in `astro.config.mjs`).
- nextjs: `tailwindcss`, `@tailwindcss/postcss`, `postcss`, and `postcss.config.mjs` with `plugins: { "@tailwindcss/postcss": {} }`.
- One global stylesheet starting with `@import "tailwindcss";`. Design tokens (colors, fonts, spacing, radii) live in an `@theme { ... }` block in that file. There is no `tailwind.config.js` unless a plugin requires one.
- `prettier-plugin-tailwindcss` for consistent class order.
  Conventions:
- Colors and fonts come from `@theme` tokens only. No raw hex values or arbitrary values such as `bg-[#e11d48]` in markup.
- Dark mode, if any, uses one strategy for the whole site (media query or a class on `<html>`).
- Extract a component when the same long class list appears three times. Do not use `@apply` to rebuild a component library.
  Security checks (added to security-audit):
- No class names are built from user input (§4).
  Performance checks (added to performance-audit):
- Class names are complete strings in source. Dynamic string building (`bg-${color}-500`) is not detected by Tailwind and gets dropped from the output.
  Accessibility checks (added to accessibility-audit):
- `outline-none` or `focus:outline-none` is always paired with a visible `focus-visible:` replacement (§2).
- Motion utilities (`animate-*`, long transitions) are wrapped in `motion-safe:` or have a `motion-reduce:` fallback (§6).
  Sources: https://tailwindcss.com/docs/installation, https://tailwindcss.com/docs/installation/framework-guides/nextjs, https://tailwindcss.com/docs/theme

## Option: tailwind-typography

Setup: `@tailwindcss/typography` as a dev dependency, on top of the tailwind option. Enable it in the global stylesheet right after the import: `@plugin "@tailwindcss/typography";`.
Conventions:

- Wrap rendered Markdown or CMS HTML in `prose` (plus `dark:prose-invert` if the site has dark mode). Never use `prose` on app UI.
- Use `not-prose` for embedded components inside long-form content.
- Customize prose colors through the theme tokens, not per-page overrides.
  Accessibility checks (added to accessibility-audit):
- Prose links are distinguishable by more than color (underline) (§1).
  Sources: https://github.com/tailwindlabs/tailwindcss-typography

## Shared

Conventions:

- Name tokens by role (`--color-accent`, `--color-surface`), not by hue, so the theme can change in one place.
  Performance checks (added to performance-audit):
- One CSS entry point. No second CSS framework loaded next to the chosen one.
  Accessibility checks (added to accessibility-audit):
- Every foreground and background token pair used for text meets WCAG 2.2 AA contrast (4.5:1 body, 3:1 large text and UI parts) (§1).

# Capability: UI components (shadcn)

Setup: `pnpm dlx shadcn@latest init` (Base UI by default; `-b radix` for Radix), then `pnpm dlx shadcn@latest add <component>` per component. Components land in `src/components/ui/`.
Conventions:

- The components are your code. Edit them freely, but keep their keyboard and ARIA behavior.
- Use one primitive library (Base UI or Radix) for the whole project.
- Add components only when a feature needs them, not the whole catalog up front.
  Sources: https://ui.shadcn.com/docs/installation, https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default

## Shared

Conventions:

- Theme through the styling tokens, not per-component color overrides.
  Performance checks (added to performance-audit):
- Heavy components (data table, date picker, rich editor) load lazily on the pages that use them.
  Accessibility checks (added to accessibility-audit):
- Dialogs trap focus, close on Escape, and return focus to their trigger; menus and tabs support arrow keys (§2).
- Every custom widget follows its WAI-ARIA Authoring Practices pattern, and `e2e/a11y.spec.ts` covers a page that uses it (§4).
- Component colors meet contrast in every state (default, hover, focus, disabled text excepted) (§1).

# Capability: Icons (lucide)

Setup: astro → `@lucide/astro` (official package; the older third-party `lucide-astro` is deprecated). React-based → `lucide-react`.
Conventions:

- Import each icon by name, e.g. `import { Search } from '@lucide/astro'` or `from 'lucide-react'`.
  Sources: https://lucide.dev/guide/installation, https://lucide.dev/guide/astro/getting-started

## Shared

Conventions:

- Import each icon individually. Never import a whole set or look icons up by string at runtime.
- Size and color come from the surrounding text (`1em` or a `size` prop, `currentColor`), not hardcoded per use.
- One set for interface icons across the project. Brand logos are the only exception.
  Performance checks (added to performance-audit):
- No `import * as Icons` or dynamic icon lookup that pulls a full set into a bundle.
  Accessibility checks (added to accessibility-audit):
- Decorative icons next to text have `aria-hidden="true"` (§1).
- Icon-only buttons and links have an accessible name (`aria-label` or visually hidden text), and the target is at least 24×24 CSS pixels (§2, §4).

# Capability: Fonts (astro-fonts)

Setup: in `astro.config.mjs`, a top-level `fonts` array (Astro 6 and later), with `fontProviders` imported from `astro/config`:

```js
fonts: [
  {
    provider: fontProviders.fontsource(),
    name: 'Noto Serif',
    cssVariable: '--font-noto-serif',
    weights: [400, 700],
    subsets: ['latin', 'latin-ext'],
    fallbacks: ['serif'],
  },
];
```

In the base layout head: `import { Font } from "astro:assets"` and `<Font cssVariable="--font-noto-serif" preload />`. Local files use `fontProviders.local()` with `options.variants`.
Sources: https://docs.astro.build/en/guides/fonts/

## Shared

Conventions (for system-stack, only the token and `lang` rules apply):

- At most two families. Prefer variable fonts.
- Two layers of names: the font loader's variable is named after the family (`--font-noto-serif`), and the styling token is named by role and points at it (`--font-serif: var(--font-noto-serif), serif`). With Tailwind, declare these role tokens in `@theme inline { ... }`. Never give both the same name: `--font-serif: var(--font-serif)` is a circular variable, and the browser silently falls back to the default font.
- Components use the role token (`font-serif`), never a family name.
- Several scripts (for example Latin with IAST diacritics plus Devanagari): pick families that contain every glyph you need. Include `latin-ext` for diacritics such as ā ī ū ṛ ṅ ñ ṭ ḍ ṇ ś ṣ ṃ ḥ, add the script's own subset (`devanagari`), and test real text in both.
- Mark text in another language with `lang` (for example `lang="sa"` or `lang="hi"`), so browsers and screen readers pick the right font and pronunciation.
  Performance checks (added to performance-audit):
- `woff2` only. Preload only the font used above the fold, in its main weight.
- `font-display: swap`, with the metric-adjusted fallback that the Astro Fonts API and `next/font` generate, to keep CLS low.
- Subsets limit the download to the scripts actually used.
- In the built CSS, no font variable refers to itself (search the output for `--font-x: var(--font-x)`).
  Accessibility checks (added to accessibility-audit):
- Body text is at least 16px equivalent, and text resizes to 200% without loss (§1).
- No text is rendered as an image (§1).
- `lang` is set on passages in another language (§3).

# Capability: PWA / offline (hand-written-sw)

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
