# Meie Koning — Portfolio

Personal portfolio of Meie Koning, Computer Science student at TU/e. The site is written for two audiences:

- **Recruiters and interviewers** (internships, side jobs): proof that I build real, working software.
- **Potential clients** of the software studio I'm starting with Rik Loeffen: proof that we can turn an idea into a working product.

**Live:** https://meiekoning.meie-koning.workers.dev

## Tech stack

- [Vite](https://vitejs.dev) + vanilla JavaScript (ES modules)
- [GSAP](https://gsap.com) + ScrollTrigger for scroll animations
- [Lenis](https://lenis.darkroom.engineering) for smooth scrolling
- [Three.js](https://threejs.org) for the wireframe torus only (lazy-loaded, skipped on phones)
- Canvas 2D particle network
- [Formspree](https://formspree.io) for the contact form (no backend)
- [Playwright](https://playwright.dev) smoke tests
- Hosted on Cloudflare (Workers static assets)

## Run it locally

Requires Node 22+ (Wrangler, the Cloudflare deploy tool, needs it).

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm test           # Playwright smoke tests against the production build
                   # (first time: npx playwright install chromium webkit firefox)
```

## Project structure

```
index.html              All content (semantic HTML, SEO + Open Graph tags)
src/main.js             Entry: wires up the modules
src/config.js           Easy-to-edit settings: Formspree ID, tech stack, form copy
src/icons.js            Brand icons (simple-icons) + LinkedIn/mail
src/contact.js          Contact form: intent toggle, validation, Formspree submit
src/particles.js        Canvas 2D particle network (hero background)
src/cursor.js           Custom cursor + magnetic buttons (mouse devices only)
src/torus.js            Three.js wireframe torus (desktop/tablet)
src/scroll.js           Lenis smooth scroll + GSAP ScrollTrigger animations
src/styles/main.css     Design tokens, layout, responsive rules
src/assets/fonts/       Space Grotesk + Space Mono (latin subsets, inlined into the CSS)
public/                 Static files: CV, OG image, project previews, icons
public/_headers         Cloudflare headers: caching + security (CSP)
wrangler.jsonc          Cloudflare deploy config (static site from dist/)
scripts/generate-assets.mjs  Regenerates the Open Graph image and Apple touch icon
tests/smoke.spec.js     Playwright smoke tests
```

## Editing content

- Text lives in `index.html`. Placeholders are in `[square brackets]`.
- Tech stack, Formspree ID and form placeholder text live in `src/config.js`.
- Replace `public/cv/Meie-Koning-CV.pdf`, `public/photo-placeholder.svg` and `public/projects/*.svg` with the real files.
- After changing the hero words or tagline, run `node scripts/generate-assets.mjs` to refresh the OG image.

## Testing

`npm test` builds the site and runs the smoke tests in four browsers: Chrome (desktop and a
375px phone), Safari/WebKit on an iPhone profile, and Firefox. They check that the page loads
without console errors, nav links reach their sections, the contact form validates and
submits (Formspree is mocked), reduced motion works and the mobile menu is accessible.

## Deployment

Cloudflare Workers (static assets, free plan), connected to this GitHub repo: every push to
`main` builds and deploys to production. `wrangler.jsonc` tells Cloudflare to serve `dist/`
as a static site, with `public/404.html` for unknown paths and `public/_headers` for caching
and security headers.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Node version: 22 (see `.nvmrc`)
- Site URL for social previews, canonical link and sitemap: `SITE_URL` in `vite.config.js`
- Run the smoke tests against the live site: `BASE_URL=https://meiekoning.meie-koning.workers.dev npm test`
