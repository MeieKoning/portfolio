// Glowing wireframe torus behind the particle network (Three.js).
// Built from plain line segments (rings around the tube + lines along it) with
// additive blending. It spins slowly and tilts toward the cursor with eased parallax.
// setFlight(t) moves the camera through the hole (0 = resting, 1 = inside); the
// scroll animations in scroll.js drive it.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Fog,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

const MAX_DPR = 2;
const PARALLAX_LERP = 0.05;
const TILT = 0.38; // max tilt toward the cursor, in radians
const BG = 0x05090f;
const TEAL = new Color(0x5ef2e0);
const CAMERA_Z = 11;

export function initTorus({ canvas, hero, reducedMotion }) {
  // Three.js needs WebGL2; check first so unsupported browsers fail silently.
  if (!document.createElement('canvas').getContext('webgl2')) {
    canvas.remove();
    return null;
  }
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    canvas.remove(); // no WebGL: the particle network carries the hero alone
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  scene.fog = new Fog(BG, 6, 22); // far side of the torus fades into the background

  const camera = new PerspectiveCamera(55, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_Z);

  const small = window.innerWidth < 768;
  const torus = buildTorus({
    R: 4,
    r: 1.6,
    rings: small ? 48 : 72, // rings around the tube
    sides: small ? 14 : 18, // lines along the tube
  });

  // tilt (cursor parallax) -> spin (constant rotation) -> torus
  const tilt = new Group();
  const spin = new Group();
  spin.add(torus);
  tilt.add(spin);
  scene.add(tilt);

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let flight = 0;
  let baseOpacity = 0.5;
  let running = false;
  let heroVisible = true;
  let rafId = 0;
  let last = performance.now();

  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole ring in view on portrait screens.
    camera.fov = w / h < 1 ? 75 : 55;
    camera.updateProjectionMatrix();
    // Sit to the right of the hero text on wide screens, centred on narrow ones.
    tilt.position.x = w >= 1024 ? 3.2 : 0;
    tilt.position.y = w >= 1024 ? 0 : -1.2;
    // Behind stacked text on small screens it should whisper, not shout.
    baseOpacity = w >= 1024 ? 0.5 : 0.22;
  }

  function render() {
    tilt.rotation.x = current.y * TILT + flight * 0.2;
    tilt.rotation.y = current.x * TILT;
    // Fly the camera through the hole; ease the torus to the centre on the way.
    camera.position.z = CAMERA_Z - flight * (CAMERA_Z + 2);
    const offsetScale = 1 - flight;
    tilt.position.x = (window.innerWidth >= 1024 ? 3.2 : 0) * offsetScale;
    torus.material.opacity = baseOpacity * (1 - flight * 0.6);
    renderer.render(scene, camera);
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    current.x += (target.x - current.x) * PARALLAX_LERP;
    current.y += (target.y - current.y) * PARALLAX_LERP;
    spin.rotation.z += dt * 0.08;
    spin.rotation.y = Math.sin(now / 9000) * 0.15;
    render();
    rafId = requestAnimationFrame(frame);
  }

  function sync() {
    const shouldRun = heroVisible && !document.hidden && !reducedMotion.matches;
    if (shouldRun && !running) {
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(rafId);
    }
    canvas.classList.toggle('is-dimmed', !heroVisible);
  }

  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      layout();
      if (!running) render();
    }, 100);
  });

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    sync();
  }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', () => {
    sync();
    if (!running) render();
  });

  layout();
  render();
  sync();
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  return {
    setFlight(t) {
      flight = Math.max(0, Math.min(1, t));
      if (!running) render();
    },
  };
}

// Wireframe torus as line segments, with brighter vertices on the outer rim so it
// reads as glowing when additive lines overlap.
function buildTorus({ R, r, rings, sides }) {
  const point = (u, v) => {
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const cv = Math.cos(v);
    const sv = Math.sin(v);
    return [(R + r * cv) * cu, (R + r * cv) * su, r * sv];
  };
  const brightness = (v) => 0.45 + 0.55 * ((Math.cos(v) + 1) / 2);

  const positions = [];
  const colors = [];
  const push = (u, v) => {
    positions.push(...point(u, v));
    const b = brightness(v);
    colors.push(TEAL.r * b, TEAL.g * b, TEAL.b * b);
  };

  for (let i = 0; i < rings; i++) {
    const u0 = (i / rings) * Math.PI * 2;
    const u1 = ((i + 1) / rings) * Math.PI * 2;
    for (let j = 0; j < sides; j++) {
      const v0 = (j / sides) * Math.PI * 2;
      const v1 = ((j + 1) / sides) * Math.PI * 2;
      push(u0, v0); // around the tube
      push(u0, v1);
      push(u0, v0); // along the tube
      push(u1, v0);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  const material = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    blending: AdditiveBlending,
    depthWrite: false,
    fog: true,
  });
  return new LineSegments(geometry, material);
}
