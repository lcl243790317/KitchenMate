# Recipe content licenses — Phase 3.1.3

Recipe content rights are separate from application code licensing. Registry: data/recipe-sources.json. Formal full instructions are rejected unless their registry source permits full reuse. Device-only user imports do not enter the public catalog.

| Source | Basis | Reuse | Attribution | Translation | Images | Revision strategy |
|---|---|---|---|---|---|---|
| HowToCook | The Unlicense; committed LICENSE | Full original text | Source/path/pinned revision | Original Chinese unchanged | No images reused | Existing fixed commit a2d45c6984dff9ee941da0e7c452f7965965d962 |
| Wikibooks Cookbook | CC BY-SA 4.0 | Full text and formatting adaptation | Original page, contributor credit, exact revision and history | Only Chinese titles translated by KitchenMate; instructions retain English. Translated titles and adapted recipe content are CC BY-SA 4.0 | Placeholder; no image assumed licensed | Exact MediaWiki revision + SHA-256 committed snapshot |
| TheMealDB | Official API terms | Production disabled; no formal key configured | Required when enabled | No content imported this release | None | No production records |
| Budget Bytes / Love and Lemons / BBC / Cookie and Kate / Gimme Some Oven | Factual metadata and source link only | SOURCE_LINKED; no instructions, prose, or images republished | Source, title, original URL, verification timestamp | No instruction translation/rewrite | None | Committed factual records; monthly checks report changes |

## ShareAlike isolation

All data/verified-recipes/wikibooks recipe content, snapshots, Chinese title translations and formatting adaptations are offered under CC BY-SA 4.0, irrespective of the application code license. Each record carries licenseName, licenseUrl, attributionText, sourceRevision and original title; the detail screen exposes these and links to the exact revision. Preserve those notices when exporting/reusing this content. This release does not translate instructions, add temperatures, convert units or create synthetic steps. Original source units and safety temperatures are retained. Images require separate Commons/media permission and none were imported.

Official policy reviewed: https://en.wikibooks.org/wiki/Wikibooks:Copyrights
License: https://creativecommons.org/licenses/by-sa/4.0/
API: https://www.mediawiki.org/wiki/API:Revisions
TheMealDB key policy: https://www.themealdb.com/api.php
