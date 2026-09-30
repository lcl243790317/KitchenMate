# Recipe content licenses — Phase 3.1.4

Recipe content rights are separate from application code licensing. data/recipe-sources.json gates all public full instructions. Device-only imports never enter the formal public catalog. No source photographs were copied.

| Source | Reuse basis | Full | Attribution | Translation | Images | Pinned strategy |
|---|---|---|---|---|---|---|
| HowToCook | The Unlicense; committed LICENSE | Yes, unchanged Chinese | Path/title/commit | Original unchanged | Placeholder | a2d45c6984dff9ee941da0e7c452f7965965d962 |
| Wikibooks | CC BY-SA 4.0 official text policy | Yes | Contributors, original title, revision/history | KitchenMate Chinese; independent original; adaptations CC BY-SA4 | Separate rights required; none reused | Exact MediaWiki revision + SHA256 |
| Based Cooking | The Unlicense; README explicitly covers all content | Yes | Original contributor and source | KitchenMate Chinese + independent original; The Unlicense | Disabled in registry; none reused | 9d4a31a040eedd61e4fb608cb0c114ff9a7c4dd2 + file SHA256 |
| Commons explicit recipe description | Writer-owned unstructured text CC BY-SA4/GFDL | Yes, one explicit authored recipe | pelican, page/revision | Chinese CC BY-SA4; independent original | Photo separately CC BY-SA2; none reused | Page77826608 revision1177828291 + SHA256 |
| TheMealDB | Official API terms; formal production key required | Disabled;0 records | Required if enabled | No content added | None | No test key1 production |
| Commercial sites | Factual metadata and original link only | No | Site/title/URL/verification | No full instruction translation or rewrite | No copied images | Committed facts; monthly change report |

## ShareAlike isolation

Wikibooks and Commons recipe content, original snapshots, translated titles, Chinese instruction artifacts and formatting adaptations retain CC BY-SA4 independently of app licensing. Every recipe retains licenseName/licenseUrl/author/originalTitle/exact revision/sourceUrl; detail exposes these. data/recipe-translations/zh.json binds each artifact to source revision, SHA256 and verbatim original steps, with a per-artifact license. Preserve these notices in redistribution. Chinese is labeled “中文翻译：KitchenMate”, never represented as the source-author Chinese original. Source-original instructions and JSON-LD remain independent. No unit conversion, added temperature, quantity or step.

Based Cooking adaptations retain The Unlicense. Although repository policy can permit contributed images, KitchenMate disables image reuse. Commons text policy differs from the pictured file license; this tutorial is explicit author-written description, not derived from a photograph.

Policies reviewed from original sources:

- [Wikibooks copyrights](https://en.wikibooks.org/wiki/Wikibooks:Copyrights)
- [CC BY-SA4](https://creativecommons.org/licenses/by-sa/4.0/)
- [Based Cooking pinned README](https://github.com/LukeSmithxyz/based.cooking/blob/9d4a31a040eedd61e4fb608cb0c114ff9a7c4dd2/README.md) and [LICENSE](https://github.com/LukeSmithxyz/based.cooking/blob/9d4a31a040eedd61e4fb608cb0c114ff9a7c4dd2/LICENSE.md)
- [Commons text/media reuse](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia#Requirements_of_frequently-used_licenses)
- [Exact Commons revision](https://commons.wikimedia.org/w/index.php?oldid=1177828291)
- [MediaWiki API](https://www.mediawiki.org/wiki/API:Revisions)
- [TheMealDB key policy](https://www.themealdb.com/api.php)
