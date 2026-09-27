# Meie Koning — Portfolio

Personal portfolio of Meie Koning, Computer Science student at TU/e. The site is written for two audiences:

- **Recruiters and interviewers** (internships, side jobs): proof that I build real, working software.
- **Potential clients** of the software studio I'm starting with Rik Loeffen: proof that we can turn an idea into a working product.

**Live:** _coming soon (Cloudflare Pages)_

## Tech stack

- [Vite](https://vitejs.dev) + vanilla JavaScript (ES modules)
- [GSAP](https://gsap.com) + ScrollTrigger for scroll animations
- [Lenis](https://lenis.darkroom.engineering) for smooth scrolling
- [Three.js](https://threejs.org) for the wireframe torus only (lazy-loaded, skipped on phones)
- Canvas 2D particle network
- [Formspree](https://formspree.io) for the contact form (no backend)
- [Playwright](https://playwright.dev) smoke tests
- Hosted on Cloudflare Pages

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm test           # Playwright smoke tests (first time: npx playwright install chromium)
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
public/                 Static files: CV, OG image, project previews, favicon
scripts/generate-assets.mjs  Regenerates the Open Graph image
tests/smoke.spec.js     Playwright smoke tests
```

## Editing content

- Text lives in `index.html`. Placeholders are in `[square brackets]`.
- Tech stack, Formspree ID and form placeholder text live in `src/config.js`.
- Replace `public/cv/Meie-Koning-CV.pdf`, `public/photo-placeholder.svg` and `public/projects/*.svg` with the real files.
- After changing the hero words or tagline, run `node scripts/generate-assets.mjs` to refresh the OG image.

## Deployment

Cloudflare Pages, connected to this repo: every push to `main` deploys to production, and every other branch gets its own preview URL.

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20 (see `.nvmrc`)
