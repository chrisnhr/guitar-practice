// @ts-check
import { defineConfig } from 'astro/config';
import { alphaTab } from '@coderline/alphatab-vite';

// Project page URL: https://chrisnhr.github.io/guitar-practice/
// `base` must stay in sync with the repository name. If you move to a
// custom domain or a <user>.github.io repository, set base to '/'.
export default defineConfig({
  site: 'https://chrisnhr.github.io',
  base: '/guitar-practice',
  vite: {
    plugins: [alphaTab()],
    build: {
      // alphaTab is ~300 kB gzipped; it only loads on exercise pages.
      chunkSizeWarningLimit: 1500,
    },
  },
});
