---
name: add-resource
description: Add a link to the Resource Hub. Use when the user pastes a URL (optionally with a name, category or note) to add to their curated design/AI resources list. Adds the Notion row, captures screenshot and icon, commits and pushes.
---

The user pastes a URL, sometimes with a category or note. Do the whole flow without asking questions. Pushing is pre-authorized for this skill.

Work in the project root, which is the session's working directory (currently `/Users/vassi/Documents/Projects/design-resources+experiments/resource-hub`).

1. **Duplicate check.** `grep -rl` is not enough; run `npx tsx --env-file=.env -e "import {fetchResources} from './src/lib/notion'; const r=await fetchResources({includeUnpublished:true}); console.log(r.map(x=>x.url+' | '+x.category).join('\n')); process.exit(0)"`. If the host is already there, say so and stop.
2. **Read the page.** `curl -sL` it and take the `<title>` and meta/og description. Derive a short Name (brand name, not the full title).
3. **Pick the category** from the existing ones (AI & Tools, Components & Code, App & Visual Inspiration, Web Inspiration, Icons, Learn & Careers, Mockups & 3D, Typography & Color, Animation). Use the user's category if given. Only create a new category if nothing fits.
4. **Description:** one short line (about 6 to 10 words, sentence case, no trailing period), like the existing rows. Use the user's note if given.
5. `npm run add -- "<url>" "<Name>" "<Category>" "<Description>"` then `npm run shots`.
6. **Check the new screenshot** in `public/shots/` (Read the image; newest file via `git status`). If it shows a block page, sign-in wall or cookie overlay, try the site's public landing URL, or `npm run shots -- --refresh <pageId>`. If it is still bad, keep it and say so.
7. Commit only the new files in `public/shots/` and `public/icons/` with message `Add <Name>`, then `git push`.
8. Reply in two lines max: what was added (name, category, description) and that it is pushed and deploys in about a minute. Mention any screenshot problem.
