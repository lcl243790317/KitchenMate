# Atomic Ingredient Parsing Audit — Phase 3.1.2 rerun

Pinned HowToCook commit: a2d45c6984dff9ee941da0e7c452f7965965d962. Rebuilt from existing checksum-verified source snapshots; source titles, URLs, instructions, notes and verification timestamps are unchanged.

| Metric | Count |
| --- | ---: |
| HowToCook recipes scanned | 365 |
| Ingredient bullets scanned (including tool/note bullets) | 3197 |
| Multi-ingredient food bullets detected | 58 |
| Recipes with grouped food bullets | 34 |
| Stored ingredient rows before (not all atomic) | 3024 |
| Atomic / unresolved ingredient rows after | 3510 |
| Old grouped rows replaced | 58 |
| Net ingredient rows added | 486 |
| Ambiguous parts left unresolved | 626 |
| Unknown rows, including names absent from vocabulary | 626 |
| Catalog recipes excluded | 0 |
| Atomic invariant violations | 0 |

Each fragment retains verbatim originalText and sourceGroupText. Parentheses are not split; alternatives remain unresolved; unfamiliar named peppers stay unknown; explicit optional notes propagate to a conjunction or an unannotated comma-list group. Only explicit scalar Calculation quantities are structured; formulas and ranges are not inferred. The Phase 3.1.1 release had 3211 atomic/unresolved rows; the current combined source rebuild is reported below. Detailed unresolved parts are listed in the JSON report.

Big scallion 大葱 uses the existing distinct ID zh:大葱; it is not silently changed to the generic scallion ID. Optional peppers remain visible as unowned in detail but are excluded from required-only matching and shopping calculations. Low-weight staples are unowned until selected.

## Ten regression examples

### 1. 新疆大盘鸡

howtocook:96dd22806c801283: 3 → 16 ingredient rows.

- Source: 花椒，香叶，香果，干线椒，大蒜，大葱
- Atomic: 花椒 [zh:花椒] / 香叶 [zh:香叶] / 香果 [unknown:香果] / 干线椒 [unknown:干线椒] / 大蒜 [garlic] / 大葱 [zh:大葱]

- Source: 油，盐，生抽，蚝油，料酒（可拿啤酒），白糖
- Atomic: 油 [oil] / 盐 [salt] / 生抽 [soy-sauce] / 蚝油 [oyster-sauce] / 料酒（可拿啤酒） [wine] / 白糖 [sugar]

- Source: 鸡肉（鸡腿肉最好），土豆，菜椒和甜椒（可以不用，加上配色好看）
- Atomic: 鸡肉（鸡腿肉最好） [chicken] / 土豆 [potato] / 菜椒 [unknown:菜椒; optional] / 甜椒（可以不用，加上配色好看） [unknown:甜椒; optional]

### 2. 红烧鲤鱼

howtocook:2e80c786dc11857d: 3 → 14 ingredient rows.

- Source: 大葱、姜、大蒜、干辣椒
- Atomic: 大葱 [zh:大葱] / 姜 [ginger] / 大蒜 [garlic] / 干辣椒 [zh:干辣椒]

- Source: 油、盐、生抽、老抽、陈醋、蚝油、料酒、白糖
- Atomic: 油 [oil] / 盐 [salt] / 生抽 [soy-sauce] / 老抽 [dark-soy] / 陈醋 [zh:陈醋] / 蚝油 [oyster-sauce] / 料酒 [wine] / 白糖 [sugar]

- Source: 鲤鱼、五花肉
- Atomic: 鲤鱼 [zh:鲤鱼] / 五花肉 [zh:五花肉]

### 3. 红烧鱼头

howtocook:961ae3ea5f72116b: 4 → 16 ingredient rows.

- Source: 大葱、姜、大蒜、香菜、美人椒
- Atomic: 大葱 [zh:大葱] / 姜 [ginger] / 大蒜 [garlic] / 香菜 [zh:香菜] / 美人椒 [unknown:美人椒]

- Source: 油、盐、鸡精、生抽、老抽、陈醋、黑胡椒粉、料酒
- Atomic: 油 [oil] / 盐 [salt] / 鸡精 [zh:鸡精] / 生抽 [soy-sauce] / 老抽 [dark-soy] / 陈醋 [zh:陈醋] / 黑胡椒粉 [black-pepper] / 料酒 [wine]

- Source: 八角、干辣椒
- Atomic: 八角 [zh:八角] / 干辣椒 [zh:干辣椒]

### 4. 柱候牛腩

howtocook:1473dff6924a687c: 4 → 20 ingredient rows.

- Source: 柱候酱（核心酱），郫县豆瓣酱，南腐乳，叉烧酱（可选），蚝油， 老抽，生抽
- Atomic: 柱候酱（核心酱） [zh:柱候酱] / 郫县豆瓣酱 [douban] / 南腐乳 [unknown:南腐乳] / 叉烧酱（可选） [zh:叉烧酱; optional] / 蚝油 [oyster-sauce] / 老抽 [dark-soy] / 生抽 [soy-sauce]

- Source: 花雕酒，白酒
- Atomic: 花雕酒 [unknown:花雕酒] / 白酒 [unknown:白酒]

- Source: 香叶， 花椒，八角，干辣椒，丁香，甘草，干辣椒，小米辣（可选），姜，蒜
- Atomic: 香叶 [zh:香叶] / 花椒 [zh:花椒] / 八角 [zh:八角] / 干辣椒 [zh:干辣椒] / 丁香 [zh:丁香] / 甘草 [unknown:甘草] / 干辣椒 [zh:干辣椒] / 小米辣（可选） [zh:小米椒; optional] / 姜 [ginger] / 蒜 [garlic]

### 5. 猪皮冻

howtocook:ddc763f709d2b5b6: 2 → 17 ingredient rows.

- Source: 大料、花椒、白芷、桂皮、丁香、香叶、小茴香
- Atomic: 大料 [unknown:大料] / 花椒 [zh:花椒] / 白芷 [unknown:白芷] / 桂皮 [zh:桂皮] / 丁香 [zh:丁香] / 香叶 [zh:香叶] / 小茴香 [zh:小茴香]

### 6. 南派红烧肉

howtocook:373d56f2f32aba5c: 2 → 16 ingredient rows.

- Source: 辅料：`油`、`冰糖`、`老抽`、`料酒`、`香叶`、`八角`、`生姜`、`盐`、`葱`、`开水`、`凉水`、`蒜`、`花椒`
- Atomic: `油` [oil] / `冰糖` [zh:冰糖] / `老抽` [dark-soy] / `料酒` [wine] / `香叶` [zh:香叶] / `八角` [zh:八角] / `生姜` [ginger] / `盐` [salt] / `葱` [scallion] / `开水` [water] / `凉水` [water] / `蒜` [garlic] / `花椒` [zh:花椒]

### 7. 凉皮

howtocook:617f7ae9488e0b06: 3 → 14 ingredient rows.

- Source: 凉皮、面筋
- Atomic: 凉皮 [unknown:凉皮] / 面筋 [unknown:面筋]

- Source: 盐、鸡精、蚝油、生抽、老抽、香油、香醋、芝麻酱（原味芝麻酱最佳）
- Atomic: 盐 [salt] / 鸡精 [zh:鸡精] / 蚝油 [oyster-sauce] / 生抽 [soy-sauce] / 老抽 [dark-soy] / 香油 [zh:香油] / 香醋 [zh:香醋] / 芝麻酱（原味芝麻酱最佳） [zh:芝麻酱]

- Source: 黄瓜、大蒜、绿豆芽
- Atomic: 黄瓜 [zh:黄瓜] / 大蒜 [garlic] / 绿豆芽 [zh:绿豆芽]

### 8. 蒸卤面

howtocook:06a218a8627c1797: 9 → 16 ingredient rows.

- Source: 葱，姜，蒜
- Atomic: 葱 [scallion] / 姜 [ginger] / 蒜 [garlic]

- Source: 生抽，老抽，料酒，盐，五香粉
- Atomic: 生抽 [soy-sauce] / 老抽 [dark-soy] / 料酒 [wine] / 盐 [salt] / 五香粉 [zh:五香粉]

### 9. 包菜炒鸡蛋粉丝

howtocook:1a65efb5c3b641c0: 7 → 12 ingredient rows.

- Source: 盐、生抽、老抽、蚝油
- Atomic: 盐 [salt] / 生抽 [soy-sauce] / 老抽 [dark-soy] / 蚝油 [oyster-sauce]

- Source: 葱、蒜、干辣椒
- Atomic: 葱 [scallion] / 蒜 [garlic] / 干辣椒 [zh:干辣椒]

### 10. 番茄牛肉蛋花汤

howtocook:28a9b2f06a8d98ee: 6 → 8 ingredient rows.

- Source: 葱、姜、蒜
- Atomic: 葱 [scallion] / 姜 [ginger] / 蒜 [garlic]

Run: pnpm recipes:audit-ingredient-groups. Any stored grouped row or divergence from deterministic source parsing fails validation.
