import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const howTo = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/how-to' }),
  schema: z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(1).max(160),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = { 'how-to': howTo };
