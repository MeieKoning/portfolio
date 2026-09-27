# CLAUDE.md

Portfolio site for Meie Koning (CS student, TU/e). Two audiences on one page: recruiters (proof of
working software) and clients of the software studio Meie is starting with Rik Loeffen (company
name still `[Company name]`). Every section should serve both; lead with proof, not claims.

Live: https://meiekoning.meie-koning.workers.dev · Repo: github.com/MeieKoning/portfolio

## Commands

```bash
npm run dev                  # Vite dev server
npm run build                # production build -> dist/
npm test                     # builds, serves dist/, runs Playwright in Chrome desktop, Chrome 375px, iPhone WebKit, Firefox
BASE_URL=https://meiekoning.meie-koning.workers.dev npm test   # same suite against the live site
node scripts/generate-assets.mjs   # regenerate public/og-image.png + apple-touch-icon.png (after changing hero words/tagline)
```

Node 22 (`.nvmrc`); current Wrangler needs it. Vite itself also runs on Node 20.

## Stack and structure

Vite + vanilla JS (ES modules), GSAP + ScrollTrigger, Lenis, Three.js (torus only). No framework.

- `index.html` holds all content (semantic HTML, SEO/OG tags, JSON-LD). Placeholders are in `[square brackets]`.
- `src/config.js`: Formspree ID, tech stack list, contact form copy.
- `src/main.js`: entry; icons, stack column, hero word cycle, mobile menu, anchors, keyboard scroll, module boot.
- `src/particles.js` (Canvas 2D network), `src/cursor.js` (custom cursor + `[data-magnetic]`),
  `src/torus.js` (Three.js, exposes `setFlight(t)`), `src/scroll.js` (Lenis + all ScrollTrigger animations),
  `src/contact.js` (validation + Formspree), `src/icons.js` (simple-icons + LinkedIn/mail paths).
- `src/styles/main.css`: tokens on `:root`, then sections in page order, then breakpoints (1023px, 767px), then reduced motion.
- `vite.config.js`: `SITE_URL` (fills `%SITE_URL%` in index.html, generates robots.txt + sitemap.xml) and font inlining.
- `public/_headers`: caching + security headers incl. CSP. `wrangler.jsonc`: Cloudflare static-assets deploy.

## Design rules

Colors: bg `#05090F`, surface `#0A1520`, accent `#5EF2E0`, muted `#2E8C85`, text `#E6F1F0`.
Headings Space Grotesk bold with tight tracking; meta text Space Mono, uppercase, wide tracking (`.meta`).
Ghost-echo headings (`.heading__main` + `.heading__ghost`), mono numbering 01/02/03, 1px dividers,
no cards or shadows. Desktop: framed "screen in a screen" with the fixed sidebar; below 1024px the
frame drops and the sidebar becomes a top bar with a full-screen menu.

## Things that are easy to break

- **The page scrolls inside `#scroller`, not the window** (so it can sit inside the frame). Lenis uses
  `wrapper: scroller, content: .scroller__content`; `ScrollTrigger.defaults({ scroller })`. Use the
  `scroll.scrollTo()` API from `initScroll`, never `window.scrollTo`. `main.js` forwards
  PageDown/Space/Home/End when focus is on `<body>`, because browsers don't route them to the scroller.
- **ScrollTrigger creation order:** the pinned Experience section must be created before any trigger
  below it, or those triggers ignore the pin distance (wrong active nav, early reveals). See the comment in
  `scroll.js`.
- **Everything animated lives in `gsap.matchMedia()`** (motion / desktop / fine pointer), so reduced
  motion and breakpoint changes revert cleanly. Entrance animations use `toggleActions: 'play none none reverse'`
  so scrolling back up reverses them.
- **Triggers refresh on content height change** (ResizeObserver in `scroll.js`). Font swaps once changed
  the page height by ~2000px.
- **Fonts are inlined into the CSS** (`src/assets/fonts`, `assetsInlineLimit` in vite.config). Don't go back
  to `<link rel=preload>`: WebKit downloaded them twice and the swap caused layout shift.
- **Animation loops pause** when the hero is off screen or the tab is hidden (particles, torus, hero word
  cycle, scroll-cue CSS animation via `.hero.is-offscreen`). Keep new loops to that rule.
- **Torus is lazy-loaded** after page load and skipped under 768px (131 KB gzip; kept mobile Lighthouse at 100).
- **Horizontal overflow:** `.scroller__content { overflow-x: clip }` hides elements waiting to slide in.
- **CSP** in `public/_headers` allows only self + `https://formspree.io` (connect/form-action), fonts from
  `data:`. New third-party scripts, fonts or APIs need a CSP change.

## Testing expectations

Before committing: `npm test` green, zero console errors/warnings, no horizontal scroll at 375/768/1440,
check reduced motion and keyboard navigation. Tests filter two known non-issues: headless "GL Driver
Message" notices (software WebGL) and Firefox's "scroll-linked positioning effect" advisory (fires for any
scroll-driven animation; not an error). Formspree is mocked in tests; don't send real submissions from tests.
Lighthouse target ≥ 90 (currently 99–100 on mobile and desktop).

## Deploy

Cloudflare Workers static assets, connected to GitHub: push to `main` deploys in ~1 minute; other
branches get preview URLs. Build `npm run build`, deploy `npx wrangler deploy`. Changing the domain:
update `SITE_URL` in `vite.config.js` (and add it in Cloudflare → Domains).

## Contact form

Formspree form `xljdoayp`, AJAX submit with honeypot `_gotcha`. Domain restriction isn't available on the
free plan. For a real delivery test use a deliverable address, a natural message and no links:
submissions from `test@example.com` or with URLs land in Formspree's spam tab and are never emailed.

## Conventions

Commit and push after every meaningful change, with descriptive messages. Never commit secrets
(the Formspree ID is public by design). Match the existing code style: small focused modules, comments
that explain why, CSS tokens instead of raw colors.
