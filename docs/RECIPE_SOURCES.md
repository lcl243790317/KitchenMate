# Recipe sources and usage review

Reviewed: 2026-09-29. A real page and permission to redistribute are separate checks. KitchenMate does not invent recipe instructions.

|Provider / source|Method|Usage basis|Full steps|Images|Attribution|Production|
|---|---|---|---|---|---|---|
|HowToCook, Anduin2017 and contributors|Pinned GitHub Markdown source files, raw HTTP, SHA256 manifests|The Unlicense, license copy retained beside snapshots|Yes, verbatim source operation blocks|Not used|Name, original title, canonical source URL, verification date, license and commit|Enabled|
|Allrecipes, Budget Bytes, BBC Good Food, Love and Lemons, Cookie and Kate, Gimme Some Oven|Live Recipe JSON-LD verification|Factual title and ingredient identity index plus source link; no permission to redistribute full copyrighted prose asserted|No; SOURCE_LINKED|Not used|Source website and direct recipe URL|5 source-only records enabled; Allrecipes intermittently unavailable, excluded from index|
|User URL import|User-triggered JSON-LD / Microdata through secure HTTPS importer|Personal device snapshot; not republished into the global catalog|Only actual structured source steps|Omitted where usage rights are unknown|Original URL, site, author when supplied, imported/checked timestamps|Enabled, device-only|
|TheMealDB|Official name search, ingredient filter and ID lookup API|Official API Terms of Use; attribution retained, production supporter key required|API instructions only|Official API artwork permitted with attribution|TheMealDB and meal ID/source link|Disabled until legal production key configured; key 1 rejected in production|
|First-party example|Fixed JSON-LD import fixture|Project-owned test data|Test flow only|None|FIRST_PARTY_TEST clearly displayed|Excluded from recommendations and Cooking Mode|
|Legacy KitchenMate 82|Previous locally authored data|No recorded third-party provenance|Hidden|None|UNVERIFIED|Never recommended; old saved data retained for backup|
|Xiachufang|No authorized integration|No permission asserted|No|No|Disabled placeholder|Disabled; no crawling or private API|

## Primary sources

- [HowToCook repository](https://github.com/Anduin2017/HowToCook)
- [Pinned license](https://github.com/Anduin2017/HowToCook/blob/a2d45c6984dff9ee941da0e7c452f7965965d962/LICENSE)
- [Maintainer confirmation that recipes are public domain and commercially reusable](https://github.com/Anduin2017/HowToCook/issues/1468)
- [TheMealDB API guide](https://www.themealdb.com/docs_api_guide.php)
- [TheMealDB terms](https://themealdb.com/terms_of_use.php)

## Snapshot method and limits

HowToCook commit: `a2d45c6984dff9ee941da0e7c452f7965965d962`. All 373 candidate Markdown recipe files were actually requested. 365 met the structural contract; 8 lacked recognized sections or at least two food ingredients. See `data/verified-recipes/howtocook/excluded.json`. No text was composed to fill those gaps. GitHub commit history remains the author record; individual author is null when not stated by the source file.

Ingredients retain their source lines. Formula amounts remain in the displayed original calculation section; they are not converted into guessed numeric quantities. Missing time remains null; missing structured servings displays “份量见原文”. This means the quick-meal filter has fewer matches than a catalog that guesses cooking times. Source temperatures and timing in prose remain unchanged. Original Markdown and SHA256 are kept for independent audit. Tool lines are removed from the normalized ingredient list but the original materials section is also displayed.

Compound alternatives that cannot be mapped unambiguously remain unknown. The 703-entry vocabulary does not represent every regional ingredient, tool, cocktail product or spice. The English unknown-rate report measures the six actual external examples, not all English recipes on the internet. Legacy dish replacements are source records with their own identities; old instructions never gain trust merely because the dish names match.

## Verification workflow

`pnpm recipes:validate` runs offline and checks attribution, full/source-only boundaries, unique URLs and every full instruction/ingredient against the saved source text. `pnpm recipes:audit` reports all 82 legacy records. `pnpm recipes:coverage` measures exact ingredient IDs without inflating coverage through parent families.

`LIVE_RECIPE_VERIFICATION=true pnpm recipes:verify` checks the actual source page and pinned raw snapshot; it also verifies structured source-linked records. `RECIPE_VERIFY_LIMIT=20` draws a random sample. Results retain HTTP status, check/verification dates, structured data availability, ingredient and instruction counts and consecutive failures. Failures are reported as temporarily-unavailable; they never trigger invented replacements. Saved licensed content remains usable when the origin is temporarily offline. A failed report requires review before rebuilding the static catalog; reports do not silently rewrite production data. GitHub manual “Verify Recipe Sources” uploads reports, separate from normal CI.

Search uses static records and local indexes. Runtime searching never crawls this source dataset. The optional database is only a public provider cache; personal imports stay on the user's device.
