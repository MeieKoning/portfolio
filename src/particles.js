// Particle network background (Canvas 2D).
// Particles drift and wrap at the edges, link to neighbours within LINK_DIST,
// and treat the cursor (or a finger on touch screens) as an extra node.

const LINK_DIST = 140;
const CURSOR_DIST = 180;
const BURST_DIST = 260;
const MAX_DPR = 2;
const ALPHA_BUCKETS = 12; // lines are batched per opacity level: one stroke() per bucket

export function initParticles({ canvas, hero, scroller, reducedMotion }) {
  const ctx = canvas.getContext('2d');
  const color = '94, 242, 224';

  let w = 0;
  let h = 0;
  let particles = [];
  let running = false;
  let rafId = 0;
  let heroVisible = true;
  let lastScroll = scroller.scrollTop;

  const pointer = { x: -9999, y: -9999, active: false };

  const targetCount = () => Math.round(Math.min(140, Math.max(80, (w * h) / 11000)));

  const makeParticle = (x = Math.random() * w, y = Math.random() * h) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.08 + Math.random() * 0.22;
    return {
      x,
      y,
      bvx: Math.cos(angle) * speed, // base drift
      bvy: Math.sin(angle) * speed,
      vx: 0, // extra velocity from cursor pull / bursts, decays each frame
      vy: 0,
      r: 0.8 + Math.random() * 1.3,
      depth: 0.35 + Math.random() * 0.65, // for scroll parallax
    };
  };

  function resize() {
    const oldW = w || window.innerWidth;
    const oldH = h || window.innerHeight;
    w = window.innerWidth;
    h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Keep existing particles in place (scaled), then add or remove to match the new size.
    particles.forEach((p) => {
      p.x = (p.x / oldW) * w;
      p.y = (p.y / oldH) * h;
    });
    const count = targetCount();
    while (particles.length < count) particles.push(makeParticle());
    particles.length = count;

    if (!running) draw();
  }

  function step() {
    const pull = pointer.active;
    for (const p of particles) {
      if (pull) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < CURSOR_DIST && d > 1) {
          // Gentle attraction that peaks mid-range and fades to zero at the cursor,
          // so particles gather around it instead of collapsing onto it.
          const f = Math.sin((Math.PI * d) / CURSOR_DIST) * 0.035;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.bvx + p.vx;
      p.y += p.bvy + p.vy;

      // wrap at the edges (with a margin so lines don't pop)
      if (p.x < -20) p.x += w + 40;
      else if (p.x > w + 20) p.x -= w + 40;
      if (p.y < -20) p.y += h + 40;
      else if (p.y > h + 20) p.y -= h + 40;
    }
  }

  const buckets = Array.from({ length: ALPHA_BUCKETS }, () => []);

  function draw() {
    ctx.clearRect(0, 0, w, h);
    buckets.forEach((b) => (b.length = 0));

    // particle-particle links
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      const a = particles[i];
      for (let j = i + 1; j < n; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        if (dx > LINK_DIST || dx < -LINK_DIST) continue;
        const dy = a.y - b.y;
        if (dy > LINK_DIST || dy < -LINK_DIST) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const t = 1 - Math.sqrt(d2) / LINK_DIST;
          buckets[Math.min(ALPHA_BUCKETS - 1, Math.floor(t * ALPHA_BUCKETS))].push(a.x, a.y, b.x, b.y);
        }
      }
    }
    ctx.lineWidth = 1;
    buckets.forEach((lines, k) => {
      if (!lines.length) return;
      ctx.strokeStyle = `rgba(${color}, ${(((k + 0.5) / ALPHA_BUCKETS) * 0.42).toFixed(3)})`;
      ctx.beginPath();
      for (let i = 0; i < lines.length; i += 4) {
        ctx.moveTo(lines[i], lines[i + 1]);
        ctx.lineTo(lines[i + 2], lines[i + 3]);
      }
      ctx.stroke();
    });

    // cursor links: brighter
    if (pointer.active) {
      for (const p of particles) {
        const d = Math.hypot(pointer.x - p.x, pointer.y - p.y);
        if (d < CURSOR_DIST) {
          ctx.strokeStyle = `rgba(${color}, ${((1 - d / CURSOR_DIST) * 0.75).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
    }

    // dots
    ctx.fillStyle = `rgba(${color}, 0.85)`;
    ctx.beginPath();
    for (const p of particles) {
      ctx.moveTo(p.x + p.r, p.y);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  function frame() {
    step();
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function burst(x, y) {
    for (const p of particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < BURST_DIST) {
        const f = (1 - d / BURST_DIST) * 7;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
    }
  }

  // ---------- run / pause ----------
  function sync() {
    const shouldRun = heroVisible && !document.hidden && !reducedMotion.matches;
    if (shouldRun && !running) {
      running = true;
      rafId = requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(rafId);
    }
    // Outside the hero the network stays as a calm, frozen backdrop.
    canvas.classList.toggle('is-dimmed', !heroVisible);
  }

  // ---------- input ----------
  const setPointer = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  };

  window.addEventListener('pointermove', (e) => {
    // Touch only counts while the finger is down (pointermove fires during drags).
    if (e.pointerType === 'touch' && !e.isPrimary) return;
    setPointer(e);
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    setPointer(e);
    if (running) burst(e.clientX, e.clientY);
  }, { passive: true });
  const release = (e) => {
    if (e.pointerType !== 'mouse') pointer.active = false;
  };
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', () => (pointer.active = false), { passive: true });
  document.documentElement.addEventListener('pointerleave', () => (pointer.active = false));

  // Scroll nudges particles with parallax (the main feedback on touch screens).
  scroller.addEventListener('scroll', () => {
    const dy = scroller.scrollTop - lastScroll;
    lastScroll = scroller.scrollTop;
    if (!running) return;
    const shift = Math.max(-40, Math.min(40, dy)) * 0.35;
    for (const p of particles) p.y -= shift * p.depth;
  }, { passive: true });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    sync();
  }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', () => {
    sync();
    if (!running) draw();
  });

  resize();
  sync();
}
