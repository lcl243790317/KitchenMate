# Phase 3.1.2 — Complete Ingredient Sources & Browse State Restoration

Validation date: 2026-09-30. This correctness fix uses the existing 365 local HowToCook snapshots at pinned commit `a2d45c6984dff9ee941da0e7c452f7965965d962`. No live source rebuild, instruction/title/URL changes or catalog expansion. All non-ingredient fields remain equal to the SHA256 baseline.

## Complete ingredient sources

- Extraction now reads both Material and Calculation sections. Calculation records enrich material rows by canonical ID. Explicit separate calculation usages remain separate; quantities are never summed. Only literal scalar amounts are structured; ranges and formulas retain null quantity and verbatim source text.
- Warm water 温水 is an alias of existing water. Sesame oil 香油 retains its distinct `zh:香油` identity. Vocabulary remains 703; Primary Pantry 86; searchable 703; 9 UI categories plus Common. No inventory or AI functionality.
- 香菇滑鸡 (`howtocook:4f1a2679eb840431`): 5 → 12 rows. New identities: water, wine, soy-sauce, salt, dark-soy, sugar, zh:香油. All twelve calculation amounts are structured. Five actual selected ingredients own exactly five rows; selecting soy sauce adds exactly one owned row. Dried shiitake retains `zh:干香菇`, rather than treating generic fresh shiitake as a substitute.
- Global completeness audit: 365 recipes, all 365 with Calculation sections; 144 recipes gain calculation-only records; 277 calculation-only records added; 2074 material rows enriched/merged; rows 3211 → 3486 (net +275); 826 unresolved calculation fragments; 654 operation-only candidates; **0 high-confidence Calculation omissions**. The unresolved count includes unknown names, alternatives, amounts without an ingredient head, formula/prose fragments and ambiguous lists. They remain in source notes and the detailed report. Operations are audited, never automatically promoted to required ingredients.
- Atomic regression: 新疆大盘鸡 remains 16 rows, 14 required and 2 optional; garlic alone matches only garlic. The Phase 3.1.1 invariant and its historical baseline are retained in the atomic audit, which is rerun against the combined source catalog.
- Catalog remains 365 full OPEN_LICENSE + 5 SOURCE_LINKED = 370. Coverage is now 330/703, with 373 uncovered. Low-weight staples remain unowned unless selected.
- New completeness validation fails if any high-confidence Calculation ingredient is absent from final recipe.ingredients. See INGREDIENT_COMPLETENESS_AUDIT.md/json for per-recipe source evidence, unresolved fragments and operation candidates. Snapshot checksums, atomicity and source fidelity remain mandatory.

## Browse restoration

- `/recipes`: query, category, source, loaded limit, scroll and clicked recipe ID are saved before opening a detail. Query/category/source also use URL query parameters. State is restored before scroll/anchor restoration; a session/history entry token gates consumption to the actual return entry.
- `/discover`: query, mode, source tab, loaded count, time/difficulty/cuisine/diet/equipment/favorites filters, filter panel and scroll are restored. Pantry remains in the existing device state.
- Browsing state uses sessionStorage only, never IndexedDB, permanent localStorage or device backup. A consumed return ticket and document identity prevent ordinary refresh from jumping to a stale session scroll position. The ticket is armed before navigation so fast browser Back works before detail hydration.
- Shared detail back link works for server catalog pages and device-imported pages: 返回全部教程 / 返回发现菜谱 / 返回首页 according to origin. Valid history uses router.back(); direct URLs safely link to /recipes. Recipe URLs remain /recipe/:id.
- Tests cover 72 rendered cards, opening index 55, browser Back and detail Back, desktop and 390px, copied filter URLs, query/category/source preservation, Discover mode/query/filter panel/loading count/scroll, direct URL fallback, source identity and explicit amounts.

## Executed local validation

| Command                                    | Actual result                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- |
| pnpm lint                                  | Passed                                                               |
| pnpm exec next typegen                     | Passed                                                               |
| pnpm typecheck                             | Passed                                                               |
| pnpm test                                  | 157 passed, 3 opt-in live tests skipped                              |
| pnpm recipes:validate                      | 370 passed; calculation completeness, atomicity and source integrity |
| pnpm recipes:audit-ingredient-groups       | Passed, 0 violations                                                 |
| pnpm recipes:audit-ingredient-completeness | Passed, 0 violations                                                 |
| pnpm recipes:coverage                      | Passed, 330/703                                                      |
| pnpm build                                 | Passed                                                               |
| pnpm test:smoke                            | 12 passed                                                            |
| OFFLINE_TESTS=true pnpm test:e2e           | 23 passed, 3 live external imports skipped                           |

CI order: lint; typegen/typecheck; unit; recipe validation; atomic audit; completeness audit; build; static-catalog browser smoke (12 scenarios). Ordinary CI does not verify live external recipe sources. The manual source verification workflow remains separate. The service-worker cache is v3.1.2.

Production acceptance and release identifiers are recorded after the CI-gated deployment. Existing KitchenMate Railway project/service/domain are retained.

---

## Historical Phase 3.1.1 validation

# Phase 3.1.1 — Atomic Ingredient Parsing Fix

Validation date: 2026-09-30. This production fix rebuilds the pinned HowToCook catalog from existing checksum-verified snapshots. The product UI and 703 / 86 / 24 Pantry design are unchanged.

- Root cause: one Markdown bullet was treated as one RecipeIngredient; a recognized garlic alias could represent an entire multi-ingredient source line.
- Parser: lib/howtocook-ingredient-parser.ts splits only top-level punctuation and safe conjunctions, keeps parentheses/alternatives as notes, propagates explicit optional annotations and leaves ambiguous names unknown. Each fragment keeps originalText and sourceGroupText. Matching remains ID-based; pantry staples are not automatically owned.
- Xinjiang chicken: 3 grouped rows → 16 atomic rows (14 required + 2 optional). 大葱 retains its existing vocabulary ID zh:大葱. The four source names without reliable vocabulary mappings are left unknown.
- Audit: 365 recipes, 3197 material bullets; 58 grouped ingredient bullets across 34 recipes; stored ingredient rows 3024 → 3211; 103 ambiguous parts left unresolved; 551 total unknown rows (previously 520); 0 atomic invariant violations; 0 newly excluded recipes. See INGREDIENT_PARSING_AUDIT.md/json for ten source-backed examples and unresolved details.
- Catalog: 365 full HowToCook tutorials + 5 source-linked external records = 370, unchanged. Exact vocabulary coverage: 312/703 → 314/703; 389 uncovered.
- Fidelity: pinned commit a2d45c6984dff9ee941da0e7c452f7965965d962 unchanged; all non-ingredient recipe fields match the SHA256 baseline. Repeated offline rebuild produces identical catalog bytes.

| Local command                        | Observed result                                               |
| ------------------------------------ | ------------------------------------------------------------- |
| pnpm lint                            | Passed                                                        |
| pnpm exec next typegen               | Passed                                                        |
| pnpm typecheck                       | Passed                                                        |
| pnpm test                            | 144 passed, 3 opt-in live tests skipped                       |
| pnpm recipes:validate                | 370 records passed, including atomic source parsing invariant |
| pnpm recipes:audit-ingredient-groups | Passed, zero violations                                       |
| pnpm recipes:coverage                | Passed, 314/703                                               |
| pnpm build                           | Passed                                                        |
| pnpm test:smoke                      | 6 passed                                                      |
| OFFLINE_TESTS=true pnpm test:e2e     | 17 passed, 3 live external imports skipped                    |

CI now runs the ingredient-group audit in addition to source validation; the 6 static browser smoke scenarios include the garlic → chicken → potato regression. Ordinary CI does not call live recipe sites. Offline cache version is bumped to clear the prior recipe page cache.

Deployment is gated on CI success; exact release identifiers, GitHub Actions URL and real production Chrome results are supplied in the delivery report and retained in GitHub/Railway history. The command table above records executed local checks. No source re-verification timestamps were advanced during this offline parser rebuild.

---

## Historical Phase 3.1 baseline

# Phase 3.1 Validation — Product Simplification & Recommendation Fix

Validation date: 2026-09-30. This report replaces the obsolete Phase 1/2 report. No AI recipe generation, instructions or ingredient guessing is implemented. Pantry stores selected ingredient IDs, not inventory quantities, expiry dates or storage locations. Postgres is not required for these flows.

## Product and data

- Vocabulary: **703** ingredients; searchable Pantry vocabulary: **703**.
- Primary Pantry: **86** unique ingredients, including **24** common ingredients shown first.
- UI: **9** grouped categories plus the Common section (**10** sections); underlying **37** categories unchanged.
- Selection data: `data/ingredients/pantry-primary.json`; presentation adapter: `lib/pantry-selection.ts`. Import parsing continues to use the complete vocabulary.
- Selection rationale: prioritize familiar Chinese household ingredients and frequently used ingredients in the actual verified catalog (egg 90 recipes, tomato 21, onion 34, pork belly 21). Retain useful staples and a few familiar coverage gaps; do not invent recipes or broaden ingredient substitution. Sweet corn and black wood ear retain their actual vocabulary identities.
- Global catalog: **370** displayable recipes: **365 OPEN_LICENSE full tutorials** from HowToCook; **5 SOURCE_LINKED** external records. FULL_VERIFIED enum count is 0; OPEN_LICENSE tutorials are fully usable. No fabricated FULL_VERIFIED data was added for testing.
- Coverage remains **312 covered / 391 uncovered**. `pnpm recipes:coverage` retained and executed. Recipe expansion was not included in this simplification release.
- HowToCook pinned snapshot: `a2d45c6984dff9ee941da0e7c452f7965965d962`. External source records: Budget Bytes, BBC Good Food, Love and Lemons, Cookie and Kate, Gimme Some Oven. No new live source verification is claimed here.
- Legacy 82 instruction sets and FIRST_PARTY_TEST remain excluded by `canDisplayRecipe`. Source-only entries cannot enter cooking mode.

## Behavior

- All five recommended modes require selectedIngredientUsage > 0, including when filtering favorites. Missing-core modes require 0/1/2; quick mode requires a known totalTime <= 30. Best match sorts score, selected usage, then full-tutorial availability.
- Empty Pantry recommendation view offers ingredient selection or `/recipes`; it does not pretend to recommend. The user's device imports remain accessible.
- `/recipes` is independent of Pantry and recommendation mode. It uses canDisplayRecipe, stable title sorting, actual catalog count, 24-card batches, source/category filters, and title/ingredient/Chinese alias/English alias/tag/cuisine search. Query survives refresh with `?q=`. Source categories are preserved rather than guessed.
- Cards prioritize title, source, tutorial availability and ingredients. Unknown time/difficulty are omitted. Long unstructured source ingredient text is clamped on cards and retained in detail.
- Title aliases live in `data/recipe-search-aliases.json`. Explicit tomato-egg dish aliases replace the former global 西红柿→番茄 / 鸡蛋→蛋 title rewriting. Cake and duck-egg negative tests pass.
- Device hydration completes before recipe API fallback. `import:` IDs never call the server recipe endpoint; explicit local snapshot lookup is independent of catalog source-URL deduplication.
- Desktop navigation adds All Recipes; mobile uses four core links and a More menu for shopping/import. The home page distinguishes ingredient recommendation and browsing all tutorials.

## Executed local checks

Windows / Node 24 / pnpm 11.19 / Chrome; production build served on port 3002.

| Command                          | Observed result                                                    |
| -------------------------------- | ------------------------------------------------------------------ |
| pnpm lint                        | Passed                                                             |
| pnpm exec next typegen           | Passed                                                             |
| pnpm typecheck                   | Passed                                                             |
| pnpm test                        | 119 passed, 3 explicitly opt-in live tests skipped                 |
| pnpm recipes:validate            | 370 records passed, source identity/attribution/snapshot integrity |
| pnpm recipes:coverage            | 703 vocabulary, 312 covered, 391 uncovered                         |
| pnpm build                       | Passed, includes /recipes                                          |
| OFFLINE_TESTS=true pnpm test:e2e | 16 passed, 3 live external import tests skipped                    |
| pnpm test:smoke                  | 5 passed                                                           |

The five smoke scenarios include simplified Pantry and rare searches; all recommendation modes; empty-Pantry all-recipes browsing, pagination, query persistence and filters; attributed full tutorial/cooking and source-only guard; local imported detail/cooking reload without API fallback. Existing regression tests cover backup migration, IndexedDB upgrade, shopping, test-fixture exclusion, recents, dark mode and offline progress.

Visible Chrome review at 390px inspected home, Pantry, Discover, All Recipes, detail and cooking. New smoke asserts no horizontal body overflow. Screenshots are generated under ignored `.cache/` rather than overwriting historical committed screenshots.

## GitHub Actions and deployment

- CI: `.github/workflows/ci.yml` runs lint, generated route types/typecheck, unit tests, offline recipe validation, production build, Chromium installation and the 5 browser smoke scenarios.
- Smoke starts its own local production server in CI. It does not use TheMealDB or live external recipe pages.
- Source verification remains a separate manual workflow and now also runs monthly at 08:00 UTC on day 1. It uploads reports; it does not commit changes or delete recipes.
- Phase 3.1 implementation commit `901c359d5d1b7d6c8d69f5e316a05ffd26f54bb6`: [GitHub Actions 36669660866](https://github.com/lcl243790317/KitchenMate/actions/runs/36669660866) completed SUCCESS, including all 5 Chromium smoke scenarios.
- Railway deployment `ab70aa1f-daaa-44b7-8fc4-b596ddbc6f73` reached SUCCESS for that commit on 2026-09-30. No project, service or domain was recreated.
- Production Chrome E2E: **19 passed**, including all three real external imports (Budget Bytes garlic noodles, BBC brownies, Gimme Some Oven fried rice), backup, shopping, offline recovery and the 5 Phase 3.1 smoke scenarios.
- Production health returned HTTP 200 with status=ok. Production recipe endpoint returned 365 OPEN_LICENSE and 5 SOURCE_LINKED records.
- Visible production Chrome at 390px inspected home, Pantry, Discover, catalog, source detail and cooking. The review identified the pre-existing horizontally scrolling recommendation tabs; the follow-up CSS wraps them and the smoke now asserts the tab strip itself does not overflow.
- The release follow-up retains the same application behavior, adds that layout correction and this observed production record. Every follow-up is also gated on CI before deployment; exact final commit/deployment identifiers are recorded in the delivery report and Railway deployment history.
- Production target remains https://kitchenmate-production.up.railway.app/ using the existing KitchenMate project/service/domain.
