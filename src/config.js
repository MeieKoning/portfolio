// Site settings that are easy to change without touching the markup.

// Formspree form ID (the part after /f/ in your form endpoint). Not a secret:
// it is visible in the page anyway. Lock it down with "allowed domains" in Formspree.
export const FORMSPREE_ID = 'xljdoayp';

// Tech stack shown in the hero column. The first PREVIEW_COUNT appear as circles,
// the rest sit behind the "+N" circle. Keys refer to src/icons.js.
export const STACK = [
  'python',
  'javascript',
  'typescript',
  'react',
  'nodedotjs',
  'claude',
  'threedotjs',
  'postgresql',
  'docker',
  'discord',
  'godotengine',
  'cplusplus',
  'git',
  'vite',
  'figma',
  'cloudflare',
];
export const STACK_PREVIEW_COUNT = 5;

// Hero: how long each word stays highlighted.
export const HERO_WORD_INTERVAL = 3000;

// Contact form placeholders per intent.
export const CONTACT_COPY = {
  hiring: {
    name: 'Your name and company',
    email: 'you@company.com',
    message: 'Tell me about the role: internship or side job, the team, and when it starts.',
    subject: 'Portfolio: hiring enquiry',
  },
  project: {
    name: 'Your name',
    email: 'you@example.com',
    message: 'What do you want to build? A rough idea is enough, we will help shape it.',
    subject: 'Portfolio: project enquiry',
  },
};
