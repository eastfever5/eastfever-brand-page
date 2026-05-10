import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

function isCanonicalSitemapUrl(page) {
  const { pathname } = new URL(page);
  const redirectOnlyPaths = new Set(['/', '/about/']);

  if (redirectOnlyPaths.has(pathname)) return false;
  if (/^\/ko\/blog\/\d{3}\/$/.test(pathname)) return false;
  return true;
}

export default defineConfig({
  site: 'https://eastfever.com',
  integrations: [sitemap({ filter: isCanonicalSitemapUrl })],
  output: 'static'
});
