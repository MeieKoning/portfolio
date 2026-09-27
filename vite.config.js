import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Inline the two small woff2 fonts (~22 KB + ~17 KB) into the CSS so text renders
    // in the right font on first paint. Other assets stay separate files.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? true : undefined),
  },
});
