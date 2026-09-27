import './styles/main.css';

import { hydrateIcons, iconSvg, ICONS } from './icons.js';
import { STACK, STACK_PREVIEW_COUNT, HERO_WORD_INTERVAL } from './config.js';
import { initContact } from './contact.js';
import { initParticles } from './particles.js';
import { initScroll } from './scroll.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scroller = document.getElementById('scroller');

// ---------- Icons + tech stack column ----------
function initStack() {
  const preview = document.querySelector('.stack__preview');
  const all = document.querySelector('.stack__all');
  const more = document.querySelector('.stack__more');
  const stack = document.querySelector('.stack');

  preview.innerHTML = STACK.slice(0, STACK_PREVIEW_COUNT)
    .map((k) => `<li class="stack__circle" title="${ICONS[k].title}">${iconSvg(k)}</li>`)
    .join('');
  all.innerHTML = STACK.map(
    (k) => `<li class="stack__chip">${iconSvg(k)}<span>${ICONS[k].title}</span></li>`,
  ).join('');
  more.querySelector('.stack__count').textContent = `+${STACK.length - STACK_PREVIEW_COUNT}`;

  const setOpen = (open) => {
    stack.classList.toggle('is-open', open);
    more.setAttribute('aria-expanded', String(open));
  };
  // Hover opens it for mouse users; click/Enter toggles it for touch and keyboard.
  stack.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && setOpen(true));
  stack.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && setOpen(false));
  more.addEventListener('click', () => setOpen(more.getAttribute('aria-expanded') !== 'true'));
  stack.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      more.focus();
    }
  });
  stack.addEventListener('focusout', (e) => {
    if (!stack.contains(e.relatedTarget)) setOpen(false);
  });
}

// ---------- Hero: highlight moves down the three words ----------
function initHeroWords() {
  const words = [...document.querySelectorAll('.hero__word')];
  const hero = document.querySelector('.hero');
  let active = 0;
  let timer = null;
  let heroVisible = true;

  const render = () =>
    words.forEach((w, i) => {
      w.dataset.rank = String((i - active + words.length) % words.length);
    });
  const tick = () => {
    active = (active + 1) % words.length;
    render();
  };
  const sync = () => {
    const shouldRun = heroVisible && !document.hidden && !reducedMotion.matches;
    if (shouldRun && !timer) timer = setInterval(tick, HERO_WORD_INTERVAL);
    if (!shouldRun && timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    sync();
  }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  render();
  sync();
}

// ---------- Mobile menu ----------
function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const nav = document.getElementById('site-nav');

  const setOpen = (open) => {
    sidebar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Close' : 'Menu';
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => e.target.closest('a') && setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// ---------- In-page links: scroll inside the frame, then move focus ----------
function initAnchors(scroll) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();

    scroll.scrollTo(id === 'top' ? 0 : target);
    history.replaceState(null, '', id === 'top' ? location.pathname : `#${id}`);

    // Move keyboard focus to the section so the next Tab continues from there.
    const focusTarget = id === 'main' ? target : target.querySelector('h1, h2') || target;
    if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  });

  // Placeholder links that still need a real URL
  document.querySelectorAll('a[data-todo]').forEach((a) =>
    a.addEventListener('click', (e) => e.preventDefault()),
  );
}

// ---------- Keyboard scrolling ----------
// The page scrolls inside .scroller (so it can sit in the frame). When focus is on
// <body>, browsers do not route PageDown/Space/arrows there, so forward them.
function initKeyboardScroll(scroll) {
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = document.activeElement;
    if (el && el !== document.body && el.closest('input, textarea, select, [contenteditable]')) return;
    if (el && el !== document.body && scroller.contains(el) && el !== scroller) {
      // Focus is inside the scroller: native keyboard scrolling already works,
      // except Space on links/buttons (which activates them).
      return;
    }
    const page = scroller.clientHeight * 0.85;
    const deltas = {
      ArrowDown: 80,
      ArrowUp: -80,
      PageDown: page,
      PageUp: -page,
      ' ': e.shiftKey ? -page : page,
    };
    let top = null;
    if (e.key in deltas) top = scroller.scrollTop + deltas[e.key];
    if (e.key === 'Home') top = 0;
    if (e.key === 'End') top = scroller.scrollHeight;
    if (top === null) return;
    e.preventDefault();
    scroll.scrollTo(Math.max(0, Math.min(top, scroller.scrollHeight - scroller.clientHeight)));
  });
}

// Three.js is only needed for the torus: load it after first paint so it never
// delays the content. The scroll animations use the returned controller.
// Phones skip it: behind stacked text it has to be nearly invisible anyway, and
// that saves ~130 KB of JavaScript and GPU work on small devices.
const torusReady = new Promise((resolve) => {
  const load = () =>
    import('./torus.js')
      .then(({ initTorus }) =>
        resolve(initTorus({ canvas: document.getElementById('torus'), hero: document.querySelector('.hero'), reducedMotion })),
      )
      .catch(() => resolve(null));
  const idle = () =>
    'requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 1500 }) : setTimeout(load, 300);
  const start = () => (document.readyState === 'complete' ? idle() : window.addEventListener('load', idle, { once: true }));
  if (window.innerWidth >= 768) return start();
  // Opened narrow: load it if the window is widened later.
  const onResize = () => {
    if (window.innerWidth < 768) return;
    window.removeEventListener('resize', onResize);
    start();
  };
  window.addEventListener('resize', onResize);
});

hydrateIcons();
initStack();
initHeroWords();
initMenu();
initContact();
initParticles({
  canvas: document.getElementById('particles'),
  hero: document.querySelector('.hero'),
  scroller,
  reducedMotion,
});

// The custom cursor only matters on devices with a mouse.
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  import('./cursor.js').then(({ initCursor }) => initCursor({ reducedMotion }));
}

const scroll = initScroll({
  scroller,
  content: document.querySelector('.scroller__content'),
  torusReady,
});
initAnchors(scroll);
initKeyboardScroll(scroll);

document.getElementById('year').textContent = new Date().getFullYear();

// Open on the right section when the page is loaded with a hash.
if (location.hash) {
  const target = document.getElementById(location.hash.slice(1));
  if (target) requestAnimationFrame(() => scroll.scrollTo(target, { immediate: true }));
}
