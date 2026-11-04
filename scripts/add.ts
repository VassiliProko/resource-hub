// Usage: npm run add -- "<url>" "<Name>" "<Category>" ["<Description>"]
import { notion, dataSource } from '../src/lib/notion';
const [url, name, category, description = ''] = process.argv.slice(2);
if (!url || !name || !category) throw new Error('Usage: npm run add -- "<url>" "<Name>" "<Category>" ["<Description>"]');
await notion.pages.create({
  parent: { type: 'data_source_id', data_source_id: await dataSource() },
  properties: {
    Name: { title: [{ text: { content: name } }] },
    URL: { url },
    Category: { select: { name: category } },
    Description: { rich_text: description ? [{ text: { content: description } }] : [] },
    Published: { checkbox: true },
  },
} as any);
console.log('added', name);
process.exit(0);
