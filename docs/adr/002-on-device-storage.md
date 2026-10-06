# ADR 002: On-device storage

Status: accepted
Date: 2026-10-06

## Context

Saved analyses must stay on the user's device (no accounts, no server) and work offline. Only derived data is stored: a palette, optional name, and a small thumbnail. Original photos are not kept. The catalog had no storage capability, so a project draft was written: `docs/stack-drafts/capability-on-device-storage.md`.

## Decision

Use IndexedDB through `idb` 8.0.3, with `fake-indexeddb` for unit tests. The data layer is in `src/lib/storage`.

| Option        | Why not                                                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dexie 4       | About 30 kB gzipped and more than this app needs: one store, simple reads and writes. Revisit if queries, live queries, or many migrations appear, or if Safari reliability becomes a problem |
| Raw IndexedDB | Would mean writing the promise helpers and upgrade handling ourselves for no gain                                                                                                             |
| localStorage  | About 5 MiB per origin, synchronous, strings only                                                                                                                                             |

Rules applied: lazy open (never at module top level), one record per analysis, thumbnail as `ArrayBuffer` plus MIME type, Zod validation on write and read, item cap (100) and thumbnail cap (100 KiB) set as constants in `schema.ts`, typed `StorageError` kinds, and a persistence request plus usage helper in `persist.ts`.

## Consequences

- No dependency on a server, and data survives reloads and offline use.
- Browsers can evict storage, and eviction deletes an origin's data all at once, including the PWA precache. Safari may clear it after 7 days without interaction. A JSON export and import (backup) is required and belongs to the export capability.
- `idb` had its last release in May 2025. It is a thin wrapper over a stable browser API, but revisit if it falls behind.
- The record shape is v1. The Lab spec will refine it; any change needs a new `schemaVersion` and a migration step in `db.ts`.
- Not yet verified: `astro/zod` inside a client bundle (no page imports the storage code yet), and behavior in real Safari. Check both when the Lab first uses it.
- Found during testing: aborting a transaction rejects idb's `tx.done`. The cap check now lets the transaction finish instead.
