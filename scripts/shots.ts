// Usage: npm run shots            -> capture screenshots for rows missing one
//        npm run shots -- --refresh <pageId|all>
import { chromium } from 'playwright';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { fetchResources } from '../src/lib/notion';

const args = process.argv.slice(2);
const refreshIdx = args.indexOf('--refresh');
const refresh = refreshIdx >= 0 ? args[refreshIdx + 1] : null;

mkdirSync('public/shots', { recursive: true });
const all = await fetchResources({ includeUnpublished: true });
const todo = all.filter((r) => {
  const file = `public/shots/${r.id}.webp`;
  if (refresh === 'all' || refresh === r.id) return true;
  return !existsSync(file);
});

console.log(`${todo.length} screenshot(s) to capture`);
if (!todo.length) process.exit(0);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

for (const r of todo) {
  const page = await ctx.newPage();
  try {
    await page.goto(r.url, { waitUntil: 'load', timeout: 25000 });
    await page.waitForTimeout(2000); // let animations / lazy content settle
    const png = await page.screenshot({ type: 'png' });
    await sharp(png).resize({ width: 800 }).webp({ quality: 78 }).toFile(`public/shots/${r.id}.webp`);
    console.log('ok  ', r.name);
  } catch (e) {
    console.warn('FAIL', r.name, (e as Error).message.split('\n')[0]);
  } finally {
    await page.close();
  }
}
await browser.close();
