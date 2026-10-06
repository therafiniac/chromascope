# Project: Chromascope

Free, browser-based color analysis tool for photographers: load a photo, see its dominant colors and harmonies, export the palette. Everything runs on the device. Stack: Astro 7 static site, React islands, Tailwind 4, shadcn (Base UI), installable offline PWA. Hosting: Cloudflare Pages.

## Commands

- Dev: `pnpm dev` | Build: `pnpm build`
- Test: `pnpm test` (single: `pnpm test <path>`)
- Typecheck: `pnpm typecheck` | Lint: `pnpm lint`
- All checks: `pnpm check`. Run before declaring any task done.
- E2E + accessibility: `pnpm test:e2e` | Lighthouse: `pnpm lighthouse` (run these yourself; nothing runs them automatically)

## Architecture

- Static output, no server, no database, no auth, no env vars yet. All analysis and storage stay in the browser.
- Pages in `src/pages`; how-to guides are Markdown in `src/content/how-to` (collection in `src/content.config.ts`). Ship no client JS except the islands that need it.
- Offline: `public/sw.js` is filled in after `astro build` by `scripts/build-precache.mjs`. A new version waits for the user's "Update" click; never call `skipWaiting()` automatically.
- UI: shadcn components in `src/components/ui`, tokens in `src/styles/global.css`, icons from lucide, font Inter via the Astro Fonts API.
- Pending capabilities with no catalog profile yet: on-device storage (IndexedDB), color extraction and math, export. Run `/rafi:add-capability` for each before building the Lab.

- Details: @docs/architecture.md
- Stack-specific rules and audit checks: docs/stack-profile.md

## Conventions

- Coding rules live in `.claude/rules/`. Follow them.
- Validate all external input with a schema at the boundary.
- Env access only through the validated config module.
- Ask before adding a dependency.
- Commits follow Conventional Commits. A commit-msg hook enforces it.

## Workflow (commands come from the `rafi` plugin)

1. Specs live in `docs/prd/`, decisions in `docs/adr/`, idea discussions in `docs/discussions/`. `/rafi:discuss <topic>`: talk through a new idea or change against the current stack.
2. `/rafi:spec <feature>`: write the spec in `docs/prd/` (Claude asks, or I fill it). Then `/rafi:plan-feature <name>`: explore and plan. Wait for approval.
3. `/rafi:slice <name>`: implement one vertical slice with tests, checks, review, and audits.
4. `/rafi:fix-issue <description>`: failing test first, then the fix.
   `/rafi:add-capability <concern>`: add icons, CMS, search, and so on. Records the choice in `docs/stack-profile.md` and an ADR.
5. `/rafi:release-check`: full gate before shipping.
6. `/rafi:retro`: end of session. Turn corrections into rules.

## Audit triggers

| Change touches                                              | Run                              |
| ----------------------------------------------------------- | -------------------------------- |
| Auth, sessions, APIs, server actions, uploads, dependencies | `/rafi:security-audit diff`      |
| Public pages, routes, metadata, URLs                        | `/rafi:seo-audit diff`           |
| New queries, lists, pages, heavy dependencies               | `/rafi:performance-audit diff`   |
| UI components, forms, layout, color                         | `/rafi:accessibility-audit diff` |
| Any code, before commit                                     | `/rafi:code-review`              |
| Release or quarterly                                        | `/rafi:release-check`            |
| Findings are logged in `docs/audits/`.                      |

## Definition of done

- `pnpm check` passes and the build succeeds.
- Tests cover happy path, invalid input, unauthorized access, not-found, and boundaries. User-facing flows have an E2E test.
- Docs and `.env.example` are updated. Breaking changes are called out.
- Matching audits from the table above are clean or logged.

## Gotchas

- `pnpm preview` runs as a background server with a lock file. Playwright and Lighthouse start it with `--ignore-lock`. Stop a stray one with `pnpm astro preview stop`.
- `pnpm lighthouse` needs a Chrome binary. Set `CHROME_PATH` (for example to Playwright's Chromium under `~/.cache/ms-playwright`) if none is installed.
- ESLint is 10 with `eslint-plugin-jsx-a11y-x`, because `eslint-plugin-astro` 3 needs ESLint 10 and `eslint-plugin-jsx-a11y` stops at ESLint 9. TypeScript stays on 6 because `astro check` refuses 7.
- `site` in `astro.config.mjs` and the sitemap line in `public/robots.txt` are placeholders (`chromascope.pages.dev`) until a domain is bought.
- The PWA icons in `public/` are generated placeholders. Replace them with real branding.
