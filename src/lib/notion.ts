import { createRequire } from 'node:module';
const { Client } = createRequire(import.meta.url)('@notionhq/client') as typeof import('@notionhq/client');

export interface Resource {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  tags: string[];
  order: number;
}

import { loadEnv } from 'vite';

// Works in both Astro (.env isn't copied to process.env) and tsx scripts (--env-file).
export const env = { ...loadEnv('', process.cwd(), ''), ...process.env } as Record<string, string | undefined>;
const token = env.NOTION_TOKEN;
const databaseId = env.NOTION_DATABASE_ID;
export const hasNotion = !!(token && databaseId);

export const notion = new Client({ auth: token });

let dataSourceId: string | undefined;
async function getDataSourceId() {
  if (dataSourceId) return dataSourceId;
  const db: any = await notion.databases.retrieve({ database_id: databaseId! });
  dataSourceId = db.data_sources[0].id as string;
  return dataSourceId;
}

export async function dataSource() {
  return getDataSourceId();
}

const text = (arr: any[] = []) => arr.map((t) => t.plain_text).join('');

export async function fetchResources(opts: { includeUnpublished?: boolean } = {}): Promise<Resource[]> {
  if (!token || !databaseId) throw new Error('Set NOTION_TOKEN and NOTION_DATABASE_ID in .env');
  const data_source_id = await getDataSourceId();
  const out: Resource[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.dataSources.query({ data_source_id, start_cursor: cursor, page_size: 100 });
    for (const page of res.results) {
      const p = page.properties;
      if (!opts.includeUnpublished && !p.Published?.checkbox) continue;
      const url = p.URL?.url;
      if (!url) continue;
      out.push({
        id: page.id,
        name: text(p.Name?.title) || url,
        url,
        category: p.Category?.select?.name ?? 'Uncategorized',
        description: text(p.Description?.rich_text),
        tags: (p.Tags?.multi_select ?? []).map((t: any) => t.name),
        order: p.Order?.number ?? 9999,
      });
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return out;
}

// Section order on the page. Categories not listed here go after these (A–Z), then Uncategorized,
// then PINNED_LAST. Edit these lists to reorder.
const ORDER = ['AI & Tools', 'Components & Code', 'App & Visual Inspiration', 'Web Inspiration', 'Icons', 'Learn & Careers', 'Mockups & 3D', 'Typography & Color'];
const PINNED_LAST = ['Animation'];

function rank(name: string) {
  const i = ORDER.indexOf(name);
  if (i >= 0) return [0, i, name] as const;
  if (PINNED_LAST.includes(name)) return [3, PINNED_LAST.indexOf(name), name] as const;
  if (name === 'Uncategorized') return [2, 0, name] as const;
  return [1, 0, name] as const;
}

export function groupByCategory(items: Resource[]) {
  const map = new Map<string, Resource[]>();
  for (const r of items) (map.get(r.category) ?? map.set(r.category, []).get(r.category)!).push(r);
  for (const list of map.values()) list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return [...map.entries()].sort(([a], [b]) => {
    const [ra, rb] = [rank(a), rank(b)];
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
  });
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
