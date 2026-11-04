# Resource Hub

Personal curated resource list. Notion database → Astro static site (Vercel).

## One-time setup
1. Create a Notion database with properties: `Name` (title), `URL` (url), `Category` (select), `Description` (text), `Tags` (multi-select), `Order` (number), `Published` (checkbox).
2. notion.so/profile/integrations → new internal integration → copy token. Open the database → ⋯ → Connections → add the integration.
3. `cp .env.example .env` and fill `NOTION_TOKEN`, `NOTION_DATABASE_ID` (and `DEPLOY_HOOK_URL` after step 5).
4. Import bookmarks: export from Chrome (Bookmarks Manager → ⋮ → Export), then
   `npm run import -- bookmarks.html --dry-run`, then without `--dry-run`.
5. Push to GitHub, import in Vercel, add `NOTION_TOKEN` / `NOTION_DATABASE_ID` env vars, create a Deploy Hook.

## Adding a resource
1. Add a row in Notion (name, URL, category, check `Published`).
2. `npm run shots` — captures screenshots for new rows (`-- --refresh <pageId|all>` to redo).
3. Commit + push (`public/shots/`), or `npm run deploy` to trigger a rebuild.

## Dev
`npm run dev` — uses built-in sample data if no Notion env is set.
