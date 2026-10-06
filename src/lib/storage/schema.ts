import { z } from 'astro/zod';

/** Most analyses the app keeps. A write past this limit is refused; the user decides what to delete. */
export const MAX_ITEMS = 100;
/** Largest thumbnail kept per analysis, in bytes. */
export const MAX_THUMBNAIL_BYTES = 100 * 1024;
export const MAX_PALETTE_COLORS = 8;

// Compared by tag, not `instanceof`: a buffer read back from IndexedDB can come from another realm.
const arrayBuffer = z.custom<ArrayBuffer>(
  (value) => Object.prototype.toString.call(value) === '[object ArrayBuffer]',
  'Expected an ArrayBuffer',
);

/**
 * One saved analysis. Derived data only (no original photo). v1 shape: the Lab spec will refine it,
 * and any change adds a new `schemaVersion` and a migration in db.ts.
 */
export const savedAnalysisSchema = z.object({
  id: z.string().min(1).max(64),
  schemaVersion: z.literal(1),
  createdAt: z.number().int().nonnegative(),
  name: z.string().max(80).optional(),
  palette: z
    .array(z.string().regex(/^#[0-9A-F]{6}$/))
    .min(1)
    .max(MAX_PALETTE_COLORS),
  thumbnail: z.object({
    data: arrayBuffer.refine(
      (buffer) => buffer.byteLength <= MAX_THUMBNAIL_BYTES,
      {
        message: 'Thumbnail is too large',
      },
    ),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  }),
});

export type SavedAnalysis = z.infer<typeof savedAnalysisSchema>;
