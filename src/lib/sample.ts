import type { Resource } from './notion';

// Shown only when NOTION_TOKEN is not set, so the UI can be developed offline.
const s = (name: string, url: string, category: string, description: string): Resource => ({
  id: url, name, url, category, description, tags: [], order: 9999,
});

export const sample: Resource[] = [
  s('Awwwards Fonts', 'https://www.awwwards.com/awwwards/collections/free-fonts/', 'Typography', 'Curated free fonts'),
  s('Typescale', 'https://typescale.com', 'Typography', 'Generate type scales'),
  s('Godly', 'https://godly.website', 'Inspiration', 'Astronomically good web design'),
  s('Minimal Gallery', 'https://minimal.gallery', 'Inspiration', 'Hand-picked website inspiration'),
  s('Phosphor Icons', 'https://phosphoricons.com', 'Icons', 'Flexible icon family'),
  s('Motion', 'https://motion.dev', 'Code & Animation', 'JavaScript & React animation library'),
];
