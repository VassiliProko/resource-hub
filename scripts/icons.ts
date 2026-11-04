// Usage: npm run icons            -> fetch high-res favicons for rows missing one
//        npm run icons -- --refresh all
// Saves public/icons/<pageId>.png (128px). Rows without one fall back to Google's favicon service.
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { fetchResources } from '../src/lib/notion';

const refresh = process.argv.includes('--refresh');
const only = process.argv.includes('--missing-tiles');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const get = (u: string) => fetch(u, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(12000) });

async function candidates(pageUrl: string): Promise<string[]> {
  const out: { url: string; score: number }[] = [];
  let base = pageUrl;
  try {
    const res = await get(pageUrl);
    base = res.url;
    const html = (await res.text()).slice(0, 200_000);
    for (const tag of html.match(/<link\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi) ?? []) {
      const rel = /rel=["']([^"']*)["']/i.exec(tag)?.[1].toLowerCase() ?? '';
      const hm = /href=(?:"([^"]*)"|'([^']*)')/i.exec(tag);
      const href = hm?.[1] ?? hm?.[2];
      if (!href || !rel.includes('icon') || rel.includes('mask')) continue;
      const size = parseInt(/sizes=["'](\d+)/i.exec(tag)?.[1] ?? '0');
      let score = size || 16;
      if (rel.includes('apple-touch')) score += 1000;
      if (/\.svg(\?|$)/i.test(href)) score += 500;
      if (/\.ico(\?|$)/i.test(href)) score -= 100; // sharp can't decode ICO
      out.push({ url: href.startsWith('data:') ? href : new URL(href, base).href, score });
    }
  } catch {}
  const origin = new URL(base).origin;
  const host = new URL(base).hostname;
  out.sort((a, b) => b.score - a.score);
  return [...out.map((o) => o.url), `${origin}/apple-touch-icon.png`, `${origin}/favicon.png`, `https://icons.duckduckgo.com/ip3/${host}.ico`, `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${origin}&size=128`];
}

mkdirSync('public/icons', { recursive: true });
const all = await fetchResources({ includeUnpublished: true });
const todo = all.filter((r) => refresh || !existsSync(`public/icons/${r.id}.png`));
console.log(`${todo.length} icon(s) to fetch`);

for (const r of todo) {
  let done = false;
  for (const url of await candidates(r.url)) {
    try {
      let buf: Buffer;
      if (url.startsWith('data:')) {
        const [meta, data] = [url.slice(0, url.indexOf(',')), url.slice(url.indexOf(',') + 1)];
        buf = meta.includes('base64') ? Buffer.from(data, 'base64') : Buffer.from(decodeURIComponent(data));
      } else {
        const res = await get(url);
        if (!res.ok) continue;
        buf = Buffer.from(await res.arrayBuffer());
      }
      if (buf.length < 100) continue;
      await sharp(buf, { density: 300 }).resize(128, 128, { fit: 'cover' }).png().toFile(`public/icons/${r.id}.png`);
      console.log('ok  ', r.name, '<-', url.slice(0, 80));
      done = true;
      break;
    } catch {}
  }
  if (!done) {
    const letter = (r.name.match(/[a-z0-9]/i)?.[0] ?? '?').toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#f5f5f5"/><text x="64" y="64" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="600" fill="#737373" text-anchor="middle" dominant-baseline="central">${letter}</text></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(`public/icons/${r.id}.png`);
    console.log('tile', r.name);
  }
}
process.exit(0);
