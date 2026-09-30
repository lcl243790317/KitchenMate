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

| Command | Observed result |
| --- | --- |
| pnpm lint | Passed |
| pnpm exec next typegen | Passed |
| pnpm typecheck | Passed |
| pnpm test | 119 passed, 3 explicitly opt-in live tests skipped |
| pnpm recipes:validate | 370 records passed, source identity/attribution/snapshot integrity |
| pnpm recipes:coverage | 703 vocabulary, 312 covered, 391 uncovered |
| pnpm build | Passed, includes /recipes |
| OFFLINE_TESTS=true pnpm test:e2e | 16 passed, 3 live external import tests skipped |
| pnpm test:smoke | 5 passed |

The five smoke scenarios include simplified Pantry and rare searches; all recommendation modes; empty-Pantry all-recipes browsing, pagination, query persistence and filters; attributed full tutorial/cooking and source-only guard; local imported detail/cooking reload without API fallback. Existing regression tests cover backup migration, IndexedDB upgrade, shopping, test-fixture exclusion, recents, dark mode and offline progress.

Visible Chrome review at 390px inspected home, Pantry, Discover, All Recipes, detail and cooking. New smoke asserts no horizontal body overflow. Screenshots are generated under ignored `.cache/` rather than overwriting historical committed screenshots.

## GitHub Actions and deployment

- CI: `.github/workflows/ci.yml` runs lint, generated route types/typecheck, unit tests, offline recipe validation, production build, Chromium installation and the 5 browser smoke scenarios.
- Smoke starts its own local production server in CI. It does not use TheMealDB or live external recipe pages.
- Source verification remains a separate manual workflow and now also runs monthly at 08:00 UTC on day 1. It uploads reports; it does not commit changes or delete recipes.
- Phase 3.1 GitHub CI and Railway production acceptance: pending the commit of this report. Deployment is gated on a successful CI run. The final release record will be appended after actual production verification.
- Production target remains https://kitchenmate-production.up.railway.app/ using the existing KitchenMate project/service/domain.
