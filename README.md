# Chromascope

Free, browser-based color analysis for photographers. Load a photo, see its dominant colors and how they sit against color harmonies, and export the palette. Everything runs on your device, and it works offline.

## Stack

| Concern       | Choice                                              |
| ------------- | --------------------------------------------------- |
| Framework     | Astro 7, static output, TypeScript strict           |
| UI            | React islands, shadcn (Base UI), Tailwind 4, lucide |
| Fonts         | Inter via the Astro Fonts API                       |
| Content       | Markdown in `src/content/how-to`                    |
| Offline       | Hand-written service worker and web manifest (PWA)  |
| Database/Auth | None. Data stays on the device                      |
| Tests         | Vitest, Playwright with axe, Lighthouse CI          |
| Hosting       | Cloudflare Pages (free), not deployed yet           |

On-device storage (IndexedDB via `idb`) is in `src/lib/storage`. Pending, with no stack profile yet: color extraction and math, export.

## Commands

- Dev: `pnpm dev` | Build: `pnpm build`
- Test: `pnpm test` | Typecheck: `pnpm typecheck` | Lint: `pnpm lint`
- All checks: `pnpm check`
- E2E and accessibility: `pnpm test:e2e` | Lighthouse: `pnpm lighthouse`

Requires Node 22.12 or later (`.nvmrc` pins 24) and pnpm.

## Docs

- Specs: [`docs/prd/`](docs/prd/)
- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Decisions: [`docs/adr/`](docs/adr/)
- Stack rules and audit checks: [`docs/stack-profile.md`](docs/stack-profile.md)
