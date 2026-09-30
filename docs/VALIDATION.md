# Phase 3.1.4 — Targeted Beginner Coverage & Bilingual Tutorials

Actual local validation record, 2026-09-30. Detailed counts, all24 added tutorials, ten Chinese/English examples, exact weak-coverage table and limitations: [PHASE_3_1_4_ACCEPTANCE.md](PHASE_3_1_4_ACCEPTANCE.md). Final exact commit/CI/Railway ID and production results are reported after deployment; they are not pre-claimed here.

| Check | Actual result |
|---|---|
| lint / next typegen / typecheck | PASS |
| Unit | 440 PASS;3 opt-in live tests skipped |
| Source registry, license, pinned snapshots | 455 formal records PASS |
| Chinese translation validation | 50 artifacts PASS;36 English Wikibooks,13 Based Cooking,1 Commons |
| Atomic ingredient audit |365 HowToCook;0 violations |
| Calculation completeness audit |365 HowToCook;0 omissions |
| Semantic audit |671 unresolved calculations/733 operation candidates; scope unchanged;0 wrong-mapping regression |
| Vocabulary coverage |331/703 exact identities |
| Primary coverage |86; Full >=1/3/5/10:85/71/58/40 |
| Primary beginner Full >=1/3/5 |59/33/21 |
| Common24 beginner Full >=1/3/5 |21/16/13 |
| Expansion planner |86 identities; developer-only score,1 zero-Full gap |
| Production build |PASS |
| Headed Chrome static Smoke |20/20 PASS;390px and desktop |
| Deterministic headed Chrome full E2E including offline |31 PASS;3 opt-in external tests skipped;34 total |
| Additional live external importer E2E |Budget Bytes/Gimme Some Oven PASS; BBC failed original retrieval; not counted as PASS |

Catalog431→455; Full392→416; source-linked39 unchanged. HowToCook365 unchanged, Wikibooks37 (+10), Based Cooking13, Commons1, MealDB0. Beginner51→93 (31 existing recipes gain affirmative pinned source evidence;11 additional recipes qualify); <=30min29→39; <=8non-staple300→318. Few ingredients alone never confers beginner status.

703 vocabulary/86 Primary/24 common/703 searchable unchanged. Four zero-Full targets now have1 each:蛤蜊、甜玉米、乌冬面、杏鲍菇. 带鱼 remains0: no rights-backed complete source passed review; commercial original fetch403, no bypass. The86/86 goal is not claimed achieved. Generic fish/corn/mushroom recipes do not inflate specific ingredient coverage.

All36 English Wikibooks formal tutorials now offer default Chinese detail and cooking steps with inline English original. Fifty committed reviewed translation artifacts bind exact revision, SHA256, source original, step count/order, numbers, units, temperature and time. Source originals/JSON-LD remain independent, invalid artifacts fall back to English, timers/progress do not reset on language toggle. One new Wikibooks tutorial is native Chinese. ShareAlike notices are retained separately from app licensing; images remain placeholders.

HowToCook upstream equals existing pin a2d45c6984dff9ee941da0e7c452f7965965d962. 香菇滑鸡12 ingredients; 新疆大盘鸡16 atomic; garlic alone owns garlic; light soy cannot own dark soy. No source title/URL/instructions rewrite, no AI recipes, inventory or broad unknown cleanup.

GitHub ordinary CI: lint → typegen/typecheck → unit → source/license/snapshot validation → translation validation → atomic/completeness/semantic audits → coverage/primary/planner → build → static browser smoke. No third-party live verification dependency. Monthly/manual verification reports changes only.

Additional-source research: [OPEN_RECIPE_SOURCE_RESEARCH.md](OPEN_RECIPE_SOURCE_RESEARCH.md). Rights: [RECIPE_LICENSES.md](RECIPE_LICENSES.md). Candidates retain FULL/DEFER/REJECT, revisions, HTTP result, target coverage and translation status. Prior atomic/completeness/semantic reports remain, and historical acceptance is available in PHASE_3_1_3_ACCEPTANCE.md and the retained atomic/completeness reports.

## First production acceptance and mobile follow-up

Commit9aabf31 main CI36788433860 SUCCESS; Railway eca6cb06-f854-44d5-89a0-95310ac6e0e6 SUCCESS. Actual headed production Chrome ran30 deterministic E2E scenarios successfully (3 live imports disabled). Additional immediate390px screenshot review found the original unresolved English udon-broth label overflowing before/after hydration. The follow-up fixes first-column wrapping without inventing ingredient mapping and adds a JavaScript-disabled390px regression;20 local smoke scenarios pass. Final production patch deployment and browser evidence are reported in the release response.

Final official Wikibooks API search for 帶魚/带鱼/hairtail returned200: Chinese matches were a seafood overview and a biology page, not complete recipes; English had no hits. The overview original revision was fetched and explicitly has no Ingredients/Procedure. It does not fill 带鱼 coverage.
