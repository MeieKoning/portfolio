// Smooth scrolling (Lenis) + scroll animations (GSAP ScrollTrigger).
// Everything lives inside gsap.matchMedia(), so switching reduced motion or crossing
// the desktop breakpoint reverts the old set of animations and builds the right one.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const TOGGLE = 'play none none reverse'; // play on the way down, reverse on the way back up

export function initScroll({ scroller, content, torusReady }) {
  let lenis = null;
  let torus = null;

  ScrollTrigger.defaults({ scroller });
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  splitWords(document.querySelector('.about__bio'));
  const preview = createProjectPreview();

  const mm = gsap.matchMedia();
  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 1024px)',
      finePointer: '(hover: hover) and (pointer: fine)',
    },
    (ctx) => {
      const { motion, desktop, finePointer } = ctx.conditions;

      if (motion) {
        lenis = new Lenis({ wrapper: scroller, content, lerp: 0.1, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
      }

      // The pinned section goes first: ScrollTriggers further down the page need
      // its extra scroll distance when they calculate their positions.
      if (motion && desktop) experienceHorizontal();
      sidebar();
      if (motion) {
        heroExit(() => torus);
        headings();
        fadeUps();
        projects();
        if (finePointer) preview.enable();
        if (!desktop) experienceVertical();
        about();
        services();
      } else {
        reducedFades();
      }

      return () => {
        preview.disable();
        lenis?.destroy();
        lenis = null;
        torus?.setFlight(0);
      };
    },
  );

  torusReady.then((t) => {
    torus = t;
    ScrollTrigger.refresh();
  });
  // Font swaps and images change the page height after load: recalculate trigger
  // positions whenever the content height changes (debounced).
  let lastHeight = content.offsetHeight;
  let refreshTimer = 0;
  new ResizeObserver(() => {
    const h = content.offsetHeight;
    if (Math.abs(h - lastHeight) < 2) return;
    lastHeight = h;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  }).observe(content);

  return {
    // Scroll to an element or y-position; smooth with Lenis, instant otherwise.
    scrollTo(target, { immediate = false } = {}) {
      if (lenis) {
        lenis.scrollTo(target, { immediate, duration: 1.4 });
        return;
      }
      const y = typeof target === 'number' ? target : target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTo({ top: y, behavior: 'auto' });
    },
  };
}

// ---------------------------------------------------------------------------
// Sidebar: active section + scroll progress line (runs with and without motion)
// ---------------------------------------------------------------------------
function sidebar() {
  const fill = document.querySelector('.sidebar__progress-fill');
  const links = [...document.querySelectorAll('.nav__link[data-section]')];

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => fill.style.setProperty('--progress', self.progress.toFixed(4)),
  });

  const setActive = (key) =>
    links.forEach((a) => {
      const on = a.dataset.section === key;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });

  // Experience belongs to the "Work" part of the page.
  [['top', null], ['work', 'work'], ['experience', 'work'], ['about', 'about'], ['services', 'services'], ['contact', 'contact']].forEach(
    ([id, key]) => {
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => self.isActive && setActive(key),
      });
    },
  );
}

// ---------------------------------------------------------------------------
// Hero exit: words drift apart and blur, the camera flies into the torus
// ---------------------------------------------------------------------------
function heroExit(getTorus) {
  const [w1, w2, w3] = document.querySelectorAll('.hero__word');
  const tl = gsap.timeline({
    defaults: { ease: 'none', duration: 1 },
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
      onUpdate: (self) => getTorus()?.setFlight(self.progress),
    },
  });
  tl.to(w1, { xPercent: -14, yPercent: -40, filter: 'blur(14px)' }, 0)
    .to(w2, { xPercent: 18, filter: 'blur(14px)' }, 0)
    .to(w3, { xPercent: -8, yPercent: 45, filter: 'blur(14px)' }, 0)
    .to('.hero__words', { opacity: 0, duration: 0.7 }, 0.25)
    .to('.eyebrow, .hero__lead, .hero__actions', { y: -50, opacity: 0, stagger: 0.05, duration: 0.6 }, 0)
    .to('.stack, .scroll-cue', { opacity: 0, duration: 0.4 }, 0);
}

// ---------------------------------------------------------------------------
// Section headings: title rises through its mask, the ghost follows 0.15s later
// ---------------------------------------------------------------------------
function headings() {
  gsap.utils.toArray('.heading').forEach((h) => {
    gsap
      .timeline({ scrollTrigger: { trigger: h, start: 'top 88%', toggleActions: TOGGLE } })
      .from(h.querySelector('.heading__main'), { yPercent: 110, duration: 1, ease: 'power4.out' })
      .from(h.querySelector('.heading__ghost'), { yPercent: 110, duration: 1, ease: 'power4.out' }, 0.15);
  });
}

function fadeUps() {
  gsap.utils.toArray('.section__head .meta, .section__intro, .process, .footer').forEach((el) => {
    gsap.from(el, {
      y: 28,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: TOGGLE },
    });
  });
}

// ---------------------------------------------------------------------------
// Projects: stagger in, number counts up, tech icons pop in one by one
// ---------------------------------------------------------------------------
function projects() {
  gsap.utils.toArray('.project').forEach((project, i) => {
    const num = project.querySelector('.project__num');
    const target = i + 1;
    const counter = { value: 0 };
    const writeNum = () => (num.textContent = String(Math.round(counter.value)).padStart(2, '0'));

    gsap
      .timeline({
        scrollTrigger: { trigger: project, start: 'top 85%', toggleActions: TOGGLE },
        onReverseComplete: () => (num.textContent = String(target).padStart(2, '0')),
      })
      .from(project, { y: 70, opacity: 0, duration: 0.9, ease: 'power3.out' })
      .fromTo(counter, { value: 0 }, { value: target, duration: 0.9, ease: 'power2.out', onUpdate: writeNum }, 0.1)
      .from(project.querySelectorAll('.tech li'), { scale: 0, opacity: 0, duration: 0.5, stagger: 0.09, ease: 'back.out(2.2)' }, 0.35)
      .from(project.querySelectorAll('.case__item, .project__links'), { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0.25);
  });
}

// Preview image that follows the cursor over a project and reveals with a clip path.
function createProjectPreview() {
  const box = document.createElement('div');
  box.className = 'project-preview';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<img alt="" width="640" height="400" />';
  document.body.append(box);
  const img = box.querySelector('img');

  const xTo = gsap.quickTo(box, 'x', { duration: 0.6, ease: 'power3.out' });
  const yTo = gsap.quickTo(box, 'y', { duration: 0.6, ease: 'power3.out' });
  let enabled = false;
  let visible = false;

  // Beside the cursor, flipped/clamped so the preview always stays on screen.
  const place = (e) => (e.clientX + 340 > window.innerWidth ? e.clientX - 344 : e.clientX + 24);
  const placeY = (e) => Math.max(16, Math.min(e.clientY - 120, window.innerHeight - box.offsetHeight - 16));
  const show = (e) => {
    if (!enabled) return;
    const project = e.currentTarget;
    if (img.getAttribute('src') !== project.dataset.preview) img.src = project.dataset.preview;
    if (!visible) gsap.set(box, { x: place(e), y: placeY(e) });
    visible = true;
    gsap.to(box, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
  };
  const hide = () => {
    if (!visible) return;
    visible = false;
    gsap.to(box, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.45, ease: 'power3.in', overwrite: 'auto' });
  };
  const move = (e) => {
    if (!enabled) return;
    if (!visible) return show(e); // hidden by a scroll: bring it back on the next move
    xTo(place(e));
    yTo(placeY(e));
  };

  document.querySelectorAll('.project[data-preview]').forEach((p) => {
    p.addEventListener('pointerenter', show);
    p.addEventListener('pointerleave', hide);
    p.addEventListener('pointermove', move);
  });
  document.getElementById('scroller').addEventListener('scroll', () => enabled && hide(), { passive: true });

  return {
    enable: () => (enabled = true),
    disable: () => {
      enabled = false;
      visible = false;
      gsap.set(box, { clipPath: 'inset(100% 0% 0% 0%)' });
    },
  };
}

// ---------------------------------------------------------------------------
// Experience: pinned horizontal scroll with a self-drawing progress line (desktop)
// ---------------------------------------------------------------------------
function experienceHorizontal() {
  const section = document.querySelector('.experience');
  const wrap = section.querySelector('.experience__track-wrap');
  const track = section.querySelector('.experience__track');
  const distance = () => Math.max(0, track.scrollWidth - wrap.clientWidth);

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.max(distance(), window.innerHeight * 0.6)}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    })
    .to(track, { x: () => -distance() }, 0)
    .fromTo('.experience__progress span', { scaleX: 0 }, { scaleX: 1 }, 0);

  gsap.from('.role', {
    x: 80,
    opacity: 0,
    duration: 0.9,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: TOGGLE },
  });
}

function experienceVertical() {
  gsap.utils.toArray('.role').forEach((role) => {
    gsap.from(role, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: role, start: 'top 88%', toggleActions: TOGGLE },
    });
  });
}

// ---------------------------------------------------------------------------
// About: photo reveals bottom-to-top, bio word by word, lists slide in from the right
// ---------------------------------------------------------------------------
function about() {
  gsap.fromTo(
    '.about__photo',
    { clipPath: 'inset(100% 0% 0% 0%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.3,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: '.about__photo', start: 'top 80%', toggleActions: TOGGLE },
    },
  );
  gsap.from('.about__photo img', {
    scale: 1.25,
    duration: 1.6,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.about__photo', start: 'top 80%', toggleActions: TOGGLE },
  });

  gsap.fromTo(
    '.about__bio .word',
    { opacity: 0.12 },
    {
      opacity: 1,
      stagger: 0.05,
      ease: 'none',
      scrollTrigger: { trigger: '.about__bio', start: 'top 82%', end: 'bottom 55%', scrub: true },
    },
  );

  gsap.from('.about__label, .about__lists .numbered__item', {
    x: 70,
    opacity: 0,
    duration: 0.8,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.about__lists', start: 'top 85%', toggleActions: TOGGLE },
  });
  gsap.from('.about__body > .btn', {
    y: 24,
    opacity: 0,
    duration: 0.7,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.about__body > .btn', start: 'top 95%', toggleActions: TOGGLE },
  });
}

// ---------------------------------------------------------------------------
// Services: items light up one by one as they come into view
// ---------------------------------------------------------------------------
function services() {
  const items = gsap.utils.toArray('.service');
  gsap.set(items, { opacity: 0.22 });
  ScrollTrigger.batch(items, {
    start: 'top 78%',
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
        overwrite: true,
        stagger: { each: 0.35, onStart() { this.targets()[0].classList.add('is-lit'); } },
      }),
    onLeaveBack: (batch) => {
      batch.forEach((el) => el.classList.remove('is-lit'));
      gsap.to(batch, { opacity: 0.22, duration: 0.4, overwrite: true });
    },
  });
}

// ---------------------------------------------------------------------------
// Reduced motion: simple fades, nothing moves
// ---------------------------------------------------------------------------
function reducedFades() {
  gsap.utils
    .toArray('.section__head, .project, .role, .about__photo, .about__body, .service, .process, .form')
    .forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        duration: 0.6,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: TOGGLE },
      });
    });
  document.querySelectorAll('.service').forEach((s) => s.classList.add('is-lit'));
}

// Wrap each word in a span (the text stays readable for screen readers).
function splitWords(el) {
  if (!el || el.dataset.split) return;
  el.dataset.split = 'true';
  const words = el.textContent.trim().split(/\s+/);
  el.replaceChildren(
    ...words.flatMap((w, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = w;
      return i ? [' ', span] : [span];
    }),
  );
}
