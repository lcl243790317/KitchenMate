# Phase 3.1.3 acceptance data

Publication/deployment details and production Chrome results are recorded in the final release response after CI passes. This file contains actual catalog/audit/local-test evidence.

Formal: 370 -> 431; full 392; source-linked 39; HowToCook 365; Wikibooks 27; TheMealDB 0. Beginner 51; <=30 minutes 29; <=8 non-staple 300. Vocabulary 703 / Pantry 86 / common 24 / searchable 703. Exact coverage 330 -> 324; primary >=1/3/5/10 full 81/65/52/39.

## Calculation triage (826 original fragments)

- Real ingredient: 34
- Tool: 5
- Quantity/formula: 116
- Alternative: 29
- Optional description: 19
- Preparation instruction: 54
- Section prose: 41
- Compound ingredient: 10
- Vocabulary gap: 290
- Parser gap: 89
- Truly ambiguous: 139

Resolved 146; remaining 671; 60 explicit aliases; no new vocabulary; two operation-only required foods added. Classifications are deterministic conservative triage, not claims that all ambiguous records were manually resolved.

## Operation triage (654 original candidates)

- True missing ingredient: 2
- Already represented: 53
- Optional ingredient: 61
- Alternative: 12
- Prepared form: 30
- Reference to mixture: 11
- Tool: 0
- False positive: 4
- Ambiguous: 481

After conservative correction: 733 candidates; ambiguous candidates remain unpromoted. Wrong-mapping regression cases: 0 failed. Atomic and calculation omissions: 0.

## Twenty added everyday tutorials

Ingredient counts include optional rows and preserve original source choices. Unknown time is not estimated. No taste rankings. All listed tutorials: Wikibooks Cookbook, CC BY-SA 4.0, Chinese title translation with original English instructions.

| Title        | Source             | Structured source time (min) | Ingredient rows |
| ------------ | ------------------ | ---------------------------: | --------------: |
| 煎鸡蛋       | Wikibooks Cookbook |                            5 |               4 |
| 基础炒鸡蛋   | Wikibooks Cookbook |                 未结构化标注 |               5 |
| 鸡肉炒饭     | Wikibooks Cookbook |                           30 |              15 |
| 烤鸡胸肉     | Wikibooks Cookbook |                 未结构化标注 |               5 |
| 烤土豆       | Wikibooks Cookbook |                 未结构化标注 |               5 |
| 煎土豆       | Wikibooks Cookbook |                           20 |               3 |
| 蔬菜汤       | Wikibooks Cookbook |                 未结构化标注 |               7 |
| 芦笋汤       | Wikibooks Cookbook |                           60 |               6 |
| 儿童意面     | Wikibooks Cookbook |                 未结构化标注 |               4 |
| 番茄沙拉     | Wikibooks Cookbook |                 未结构化标注 |               6 |
| 烤燕麦       | Wikibooks Cookbook |                 未结构化标注 |               8 |
| 花生酱三明治 | Wikibooks Cookbook |                            5 |               6 |
| 芝麻酱油芦笋 | Wikibooks Cookbook |                           15 |               5 |
| 葱香土豆泥   | Wikibooks Cookbook |                 未结构化标注 |               6 |
| 培根烤包菜   | Wikibooks Cookbook |                 未结构化标注 |               9 |
| 南瓜泥       | Wikibooks Cookbook |                 未结构化标注 |               4 |
| 豌豆泥       | Wikibooks Cookbook |                 未结构化标注 |               4 |
| 包菜沙拉     | Wikibooks Cookbook |                 未结构化标注 |               5 |
| 微波炒鸡蛋   | Wikibooks Cookbook |                 未结构化标注 |               2 |
| 微波燕麦粥   | Wikibooks Cookbook |                 未结构化标注 |               3 |

Weakest full coverage: 带鱼 (0)、蛤蜊 (0)、甜玉米 (0)、乌冬面 (0)、杏鲍菇 (0)、豆干 (1)、腐竹 (1)、莲藕 (1)、蘑菇 (1)、苹果 (1). Next expansion should prioritize these primary gaps.

Licensing and source/revision strategy: RECIPE_LICENSES.md. Candidate accept/defer/reject evidence: RECIPE_EXPANSION_CANDIDATES.md. Complete triage evidence: INGREDIENT_SEMANTIC_AUDIT.json.

Local unit: 297 passed / 3 live skipped. Smoke: 15 passed. E2E: 26 passed / 3 live skipped in the offline run; a separate headed Chrome live-import run passed those three (29 scenarios tested). Build/lint/typecheck/all recipe audits/coverage passed. AI removed; Pantry inventory remains removed.
