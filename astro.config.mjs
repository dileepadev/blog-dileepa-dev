// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.dileepa.dev',
  redirects: {
    // Old slug for Part 1, published before the series moved to part-N slugs.
    // Keep this so existing external links keep working.
    '/blog/2026-08-06-zero-to-agent-microsoft-foundry-series-kickoff':
      '/blog/2026-08-06-part-1-kicking-off-the-series',
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      // Redirect stubs shouldn't be indexed as real pages.
      filter: (page) => !page.includes('/2026-08-06-zero-to-agent-microsoft-foundry-series-kickoff'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});