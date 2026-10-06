# Capability: On-device storage

Kind: capability
Ask when: the app saves user data in the browser (saved results, history, settings, drafts) with no server and no account, and it must work offline.
Default: astro (static output), react-spa → idb. Use localStorage only for a few small UI preferences (see `localstorage`).
Verified: October 2026 against the idb README, Dexie versioning docs, MDN (IndexedDB guide, storage quotas and eviction), web.dev IndexedDB best practices, and the npm registry. Nothing here was built in a test project. Re-verify the chosen option in its official docs before scaffolding.

## Options

| Option        | Status | Pick when                                                                                                                                                                                   | Works with                       | Cost              |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------- |
| idb           | trial  | Default. A few stores, simple reads and writes. Promise wrapper of about 1.2 kB (brotli) over IndexedDB. Last npm release was May 2025, so check it is still the right call before adopting | astro (React islands), react-spa | free (ISC)        |
| dexie         | trial  | Many queries, indexes, live queries, or several schema migrations. Larger (about 30 kB gzipped in a third-party measurement of 4.4.2) and actively released (4.4.6, September 2026)         | astro (React islands), react-spa | free (Apache-2.0) |
| raw-indexeddb | trial  | You want no dependency and accept writing the promise helpers and upgrade handling yourself                                                                                                 | any                              | free              |
| localstorage  | hold   | Do not use for saved records or images. Limited to about 5 MiB per origin, synchronous, and strings only. Acceptable only for a few small UI preferences                                    | —                                | —                 |

## Option: idb

Setup: `idb` (runtime dependency) and `fake-indexeddb` (dev dependency, for tests, because jsdom has no IndexedDB). Files:

- `src/lib/storage/db.ts`: a `DBSchema` interface, one exported `DB_VERSION` constant, and `openDB` with `upgrade`, `blocked`, and `blocking` handlers.
- `src/lib/storage/<records>.ts`: a small repository per record type (list, get, put, delete) that parses every record with a Zod schema.
- `src/lib/storage/persist.ts`: `persist()` and `estimate()` helpers (see Shared).
  Conventions:
- Open the database lazily from an event handler or effect. Never at module top level: static builds and server rendering have no `indexedDB`.
- `upgrade(db, oldVersion, newVersion, tx)` runs one step per version, selected by `oldVersion`. Shipped steps are never edited; a change adds a new version and a new step.
- `blocking` closes the connection so another tab can upgrade. `blocked` shows a message asking the user to close other tabs.
- `await tx.done` after writes. Group related writes into one transaction.
  Sources: https://github.com/jakearchibald/idb , https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

## Option: dexie

Setup: `dexie` (runtime dependency), optionally `dexie-react-hooks` (live queries in React; peers `dexie >=4.2.0-alpha.1 <5.0.0` and `react >=16`), and `fake-indexeddb` (dev dependency, for tests). Declare the schema with `db.version(n).stores({...})` in `src/lib/storage/db.ts`.
Conventions:

- Create the `Dexie` instance lazily on the client. Never touch it at module top level in code that runs during the static build.
- A new schema version lists only the changed tables. An index left out of a new version is dropped. Data changes use `.upgrade(tx => ...)`.
- Never edit a shipped version that has an upgrade function; add a new version.
- Parse every record read from the database with a Zod schema.
  Sources: https://dexie.org/docs/Tutorial/Design#database-versioning , https://dexie.org/docs/IndexedDB-on-Safari

## Option: raw-indexeddb

Setup: no packages except `fake-indexeddb` (dev dependency, for tests). Write `src/lib/storage/db.ts` with a promise helper around `indexedDB.open`.
Conventions:

- Create object stores and indexes only in `onupgradeneeded`, by `oldVersion`. Versions are integers; `2.1` and `2.4` both round to `2`.
- Set `db.onversionchange` to close the connection, handle `onblocked` with a user message, and set `db.onclose` for unexpected closure.
- Add a database-level error handler. Error events bubble from request to transaction to database, and an unhandled one aborts the transaction.
- Keep transactions short and make requests inside them, because a transaction goes inactive when control returns to the event loop with nothing pending.
  Sources: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

## Option: localstorage

Setup: none. Use `localStorage` only for per-viewer UI conveniences such as a remembered tab or a collapsed panel, wrapped in try/catch.
Conventions:

- Never store records, images, thumbnails, or anything that must persist reliably. The quota is about 5 MiB per origin and a write can throw.
  Sources: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

## Shared

Conventions:

- Store derived data only (for example a palette, settings, and a small thumbnail), not original photos, unless the PRD says otherwise.
- Store one record per item. Do not keep the whole app state as one record: structured cloning runs on the main thread, so large objects block it.
- Store a thumbnail as an `ArrayBuffer` plus its MIME type, with a maximum pixel size and byte size. Older WebKit bugs reported failures storing `Blob` in IndexedDB on iOS, and I could not confirm their current status, so avoid `Blob` records.
- Every record carries a `schemaVersion`. Every read is parsed with a Zod schema. A record that fails parsing is skipped and reported to the user; it never crashes the app.
- Set a maximum item count and total size. When a limit is reached, ask the user what to delete. Never delete silently.
- Handle every failure at the storage boundary: the database cannot open (for example private browsing), a write throws, or `QuotaExceededError` occurs. The rest of the app keeps working and shows a message in text that offers to delete old items or export.
- After the first successful save, call `navigator.storage.persist()` and show the result in plain text. Show usage from `navigator.storage.estimate()`. A refusal is normal; do not treat it as an error.
- Browsers can evict best-effort storage. Eviction deletes an origin's data all at once, which includes IndexedDB and the Cache API (the PWA precache). Safari also clears script-created storage for an origin after 7 days with no user interaction. Always offer an export of saved data (JSON) and an import that validates the file with a schema before writing anything.
- Tests: use `fake-indexeddb` (`setupFiles: ['fake-indexeddb/auto']` in the Vitest config; reset between tests with `indexedDB = new IDBFactory()`). Its README documents Jest; for Vitest and jsdom confirm that it works and whether a `structuredClone` polyfill is needed.
  Security checks (added to security-audit):
- Saved items, thumbnails, and palettes derived from a user's photos are personal data: they are never logged, never sent to a server, and never read by a third-party script.
- An imported file is validated with a schema, with a size limit, before it is written to the database.
  Performance checks (added to performance-audit):
- Lists read bounded sets (a cursor or a capped count), and list views do not load full records when metadata is enough.
- No transaction stays open across a `fetch` or a user prompt.
- Writing and reading large records does not block input: measure with a representative number of saved items.
  Accessibility checks (added to accessibility-audit):
- Storage errors, quota messages, and the persistence result are announced through a live region and are readable as text, not only by color or icon.
- Delete and export actions are keyboard operable and have accessible names.
