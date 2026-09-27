// Brand icons come from simple-icons (CC0), imported individually so Vite tree-shakes the rest.
import {
  siAnthropic,
  siClaude,
  siCloudflare,
  siCplusplus,
  siDiscord,
  siDocker,
  siFigma,
  siGit,
  siGithub,
  siGodotengine,
  siJavascript,
  siNodedotjs,
  siPostgresql,
  siPython,
  siReact,
  siThreedotjs,
  siTypescript,
  siVite,
} from 'simple-icons';

const brand = (si, title = si.title) => ({ title, path: si.path });

export const ICONS = {
  anthropic: brand(siAnthropic),
  claude: brand(siClaude, 'Claude API'),
  cloudflare: brand(siCloudflare),
  cplusplus: brand(siCplusplus, 'C++'),
  discord: brand(siDiscord, 'discord.js'),
  docker: brand(siDocker),
  figma: brand(siFigma),
  git: brand(siGit),
  github: brand(siGithub),
  godotengine: brand(siGodotengine, 'Godot'),
  javascript: brand(siJavascript),
  nodedotjs: brand(siNodedotjs, 'Node.js'),
  postgresql: brand(siPostgresql),
  python: brand(siPython),
  react: brand(siReact),
  threedotjs: brand(siThreedotjs, 'Three.js'),
  typescript: brand(siTypescript),
  vite: brand(siVite),
  // simple-icons no longer ships LinkedIn, and mail is not a brand
  linkedin: {
    title: 'LinkedIn',
    path: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z',
  },
  mail: {
    title: 'Email',
    path: 'M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.4l10 6.25L22 6.4V6H2zm20 2.75-9.47 5.92a1 1 0 0 1-1.06 0L2 8.75V18h20V8.75z',
  },
};

export function iconSvg(name) {
  const icon = ICONS[name];
  if (!icon) return '';
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${icon.path}"/></svg>`;
}

// Fills every <span data-icon="name"> with its SVG. With data-label, the icon also gets
// an accessible name (for tech lists); otherwise the parent link carries the label.
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.dataset.icon;
    el.innerHTML = iconSvg(name);
    if (el.hasAttribute('data-label') && ICONS[name]) {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', ICONS[name].title);
      el.title = ICONS[name].title;
    }
  });
}
