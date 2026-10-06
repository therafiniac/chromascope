// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Placeholder until a domain is bought. Canonicals and the sitemap use it.
  site: 'https://chromascope.pages.dev',
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['100 900'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],
  // No environment variables yet. Declare each one here, never read import.meta.env directly.
  env: { schema: {} },
});
