import { defineConfig } from 'vite';

// The public URL of the site. Change this one line when a custom domain is connected.
export const SITE_URL = 'https://meiekoning.meie-koning.workers.dev';

// Fills %SITE_URL% in index.html (social previews need absolute URLs) and generates
// robots.txt + sitemap.xml for that URL.
function siteUrl() {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n` });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc></url>\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [siteUrl()],
  build: {
    // Inline the two small woff2 fonts (~22 KB + ~17 KB) into the CSS so text renders
    // in the right font on first paint. Other assets stay separate files.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? true : undefined),
  },
});
