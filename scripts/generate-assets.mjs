// Renders public/og-image.png (1200x630 social preview) and public/apple-touch-icon.png
// with Playwright's Chromium.
// Pass --cv-placeholder to also write a placeholder public/cv/Meie-Koning-CV.pdf.
// Run: node scripts/generate-assets.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const font = (p) => readFileSync(`${root}src/assets/fonts/${p}`).toString('base64');
const fontCss = `
  @font-face { font-family: 'SG'; font-weight: 300 700; src: url(data:font/woff2;base64,${font('space-grotesk.woff2')}) format('woff2'); }
  @font-face { font-family: 'SM'; src: url(data:font/woff2;base64,${font('space-mono.woff2')}) format('woff2'); }
`;

const og = `<!doctype html><html><head><style>${fontCss}
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #05090F; font-family: SG; color: #E6F1F0; overflow: hidden; position: relative; }
  canvas { position: absolute; inset: 0; }
  .frame { position: absolute; inset: 22px; border: 8px solid #0C2826; border-radius: 24px; padding: 64px 72px; background: rgba(5,9,15,.6); display: flex; flex-direction: column; justify-content: center; }
  .mono { font-family: SM; text-transform: uppercase; letter-spacing: .18em; font-size: 20px; color: #5EF2E0; }
  .words { margin: 26px 0 30px; font-weight: 700; font-size: 104px; line-height: .9; letter-spacing: -.055em; }
  .words span:nth-child(1) { color: #5EF2E0; }
  .words span:nth-child(2) { opacity: .62; }
  .words span:nth-child(3) { opacity: .39; }
  .words span { display: block; }
  .lead { font-size: 30px; max-width: 760px; }
  .meta { position: absolute; right: 64px; bottom: 50px; font-family: SM; font-size: 16px; letter-spacing: .18em; color: #2E8C85; text-transform: uppercase; }
  .logo { position: absolute; right: 64px; top: 56px; width: 64px; height: 64px; border: 2px solid #5EF2E0; border-radius: 16px; display: grid; place-items: center; font-weight: 700; font-size: 24px; color: #5EF2E0; letter-spacing: -.04em; }
</style></head><body>
<canvas id="c" width="1200" height="630"></canvas>
<div class="frame">
  <div class="logo">MK</div>
  <p class="mono">— I'm Meie Koning</p>
  <p class="words"><span>Idea.</span><span>Prototype.</span><span>Product.</span></p>
  <p class="lead">I build AI tools, web apps and games that people actually use.</p>
  <p class="meta">CS @ TU/e · Available for internships &amp; projects</p>
</div>
<script>
  // Static particle network, seeded so the image is reproducible
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const c = document.getElementById('c').getContext('2d');
  const pts = Array.from({ length: 110 }, () => [r() * 1200, r() * 630]);
  for (const a of pts) for (const b of pts) {
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (d < 130) { c.strokeStyle = 'rgba(94,242,224,' + (1 - d / 130) * .35 + ')'; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
  }
  c.fillStyle = '#5EF2E0'; for (const p of pts) { c.beginPath(); c.arc(p[0], p[1], 1.6, 0, 7); c.fill(); }
</script></body></html>`;

const cv = `<!doctype html><html><head><style>${fontCss}
  body { font-family: SG; padding: 64px; color: #05090F; }
  h1 { font-size: 40px; letter-spacing: -.03em; margin: 0 0 8px; }
  p { font-family: SM; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; color: #2E8C85; }
</style></head><body><h1>Meie Koning — CV</h1><p>Placeholder. Replace public/cv/Meie-Koning-CV.pdf with the real CV.</p></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${root}public/og-image.png` });
console.log('wrote public/og-image.png');

// 180x180 home-screen icon for iOS (it adds its own rounded corners)
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(`<style>${fontCss} body{margin:0;width:180px;height:180px;background:#05090F;display:grid;place-items:center}
  div{width:132px;height:132px;border:4px solid #5EF2E0;border-radius:34px;display:grid;place-items:center;font:700 56px SG;letter-spacing:-.04em;color:#5EF2E0}</style><div>MK</div>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${root}public/apple-touch-icon.png` });
console.log('wrote public/apple-touch-icon.png');

if (process.argv.includes('--cv-placeholder')) {
  await page.setContent(cv);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: `${root}public/cv/Meie-Koning-CV.pdf`, format: 'A4' });
  console.log('wrote public/cv/Meie-Koning-CV.pdf');
}
await browser.close();
