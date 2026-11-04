// Usage: npm run import -- bookmarks.html [--folder "Design Resources"] [--dry-run]
// Export from Chrome: Bookmarks Manager -> ⋮ -> Export bookmarks.
import { readFileSync } from 'node:fs';
import { notion, dataSource } from '../src/lib/notion';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && a.endsWith('.html'));
const dry = args.includes('--dry-run');
const fi = args.indexOf('--folder');
const folder = fi >= 0 ? args[fi + 1] : 'Design Resources';
if (!file) throw new Error('Pass the exported bookmarks .html file');

// Netscape bookmark HTML is not well-formed, so walk the tags linearly with a folder stack.
const html = readFileSync(file, 'utf8');
const tokens = html.matchAll(/<H3[^>]*>(.*?)<\/H3>|<A [^>]*HREF="([^"]*)"[^>]*>(.*?)<\/A>|<DL>|<\/DL>/gis);
const stack: (string | null)[] = []; // one entry per open <DL>; name of its folder
let pending: string | null = null;
const items: { name: string; url: string; category: string; description?: string }[] = [];
for (const m of tokens) {
  const t = m[0].toUpperCase();
  if (t.startsWith('<H3')) pending = m[1].trim();
  else if (t === '<DL>') { stack.push(pending); pending = null; }
  else if (t === '</DL>') stack.pop();
  else if (t.startsWith('<A')) {
    const i = stack.indexOf(folder);
    if (i < 0 || !/^https?:/.test(m[2])) continue;
    const sub = stack.slice(i + 1).filter(Boolean).pop();
    items.push({ name: m[3].replace(/<[^>]+>/g, '').trim(), url: m[2], category: sub ?? 'Uncategorized' });
  }
}
if (!items.length) throw new Error(`No bookmarks found in folder "${folder}"`);

// Optional: --map scripts/categories.json -> [[category, name, url, description], ...] overrides parsed items.
const mi = args.indexOf('--map');
if (mi >= 0) {
  const rows: [string, string, string, string][] = JSON.parse(readFileSync(args[mi + 1], 'utf8'));
  items.length = 0;
  for (const [category, name, url, description] of rows) items.push({ category, name, url, description });
}

console.log(`${items.length} bookmarks found`);
if (dry) {
  console.table(items.slice(0, 15));
  process.exit(0);
}

const data_source_id = await dataSource();
for (const i of items) {
  await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id },
    properties: {
      Name: { title: [{ text: { content: i.name } }] },
      URL: { url: i.url },
      Category: { select: { name: i.category } },
      Description: { rich_text: i.description ? [{ text: { content: i.description } }] : [] },
      Published: { checkbox: true },
    },
  } as any);
  console.log('added', i.name);
  await new Promise((r) => setTimeout(r, 350)); // stay under Notion's ~3 req/s limit
}
console.log('Done. Now run: npm run shots');
