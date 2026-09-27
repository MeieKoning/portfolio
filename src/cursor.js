// Custom cursor: a teal dot that follows the pointer exactly, and a ring that trails
// behind it and grows over interactive elements. Elements with [data-magnetic] are
// pulled slightly toward the cursor. Only on devices with a fine pointer that can hover.
import { gsap } from 'gsap';

const INTERACTIVE = 'a, button, label, [role="button"], summary';
const TEXT_INPUT = 'input:not([type="radio"]):not([type="checkbox"]), textarea';
const RING_LERP = 0.18;
const MAX_PULL = 10;

const clamp = (v, max) => Math.max(-max, Math.min(max, v));

export function initCursor({ reducedMotion }) {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!finePointer.matches || reducedMotion.matches) return;

  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);
  document.documentElement.classList.add('has-custom-cursor');

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { ...pos };
  let visible = false;
  let rafId = 0;

  const loop = () => {
    ringPos.x += (pos.x - ringPos.x) * RING_LERP;
    ringPos.y += (pos.y - ringPos.y) * RING_LERP;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    // Stop the loop once the ring has caught up; the next move restarts it.
    if (Math.abs(pos.x - ringPos.x) + Math.abs(pos.y - ringPos.y) > 0.1) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = 0;
    }
  };
  const kick = () => {
    if (!rafId) rafId = requestAnimationFrame(loop);
  };

  const setVisible = (v) => {
    if (v === visible) return;
    visible = v;
    document.documentElement.classList.toggle('cursor-visible', v);
  };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!visible) {
      // Appear at the pointer, not sliding in from the last position.
      ringPos.x = e.clientX;
      ringPos.y = e.clientY;
    }
    pos.x = e.clientX;
    pos.y = e.clientY;
    setVisible(true);
    kick();
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => setVisible(false));
  window.addEventListener('blur', () => setVisible(false));

  // Hover states via delegation, so elements added later work too.
  document.addEventListener('pointerover', (e) => {
    const el = e.target;
    ring.classList.toggle('is-hover', Boolean(el.closest?.(INTERACTIVE)));
    const text = Boolean(el.closest?.(TEXT_INPUT));
    ring.classList.toggle('is-text', text);
    dot.classList.toggle('is-text', text);
  });
  window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
  window.addEventListener('pointerup', () => ring.classList.remove('is-down'));

  initMagnetic();
}

function initMagnetic() {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.25;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      // Measure from the untransformed centre so the pull doesn't feed back on itself.
      const cx = r.left + r.width / 2 - gsap.getProperty(el, 'x');
      const cy = r.top + r.height / 2 - gsap.getProperty(el, 'y');
      // Capped so neighbouring buttons never touch.
      xTo(clamp((e.clientX - cx) * strength, MAX_PULL));
      yTo(clamp((e.clientY - cy) * strength, MAX_PULL));
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
