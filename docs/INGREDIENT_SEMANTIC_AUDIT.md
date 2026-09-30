# Phase 3.1.3 Ingredient Semantic Audit

Correctness takes priority over unknown reduction. Original 826 calculation fragments and 654 operation candidates are retained individually in the JSON report. Pattern classifications are conservative triage, not claims of manual review or production mappings. Only explicit aliases, deterministic literal-head rules and two source-verified operation overrides change production. No vocabulary entries added; Pantry remains 86 / searchable 703.

```json
{
  "unresolvedBefore": 826,
  "unresolvedAfter": 671,
  "realIngredientFragmentsResolved": 146,
  "calculationCategories": {
    "Real ingredient": 34,
    "Tool": 5,
    "Quantity/formula": 116,
    "Alternative": 29,
    "Optional description": 19,
    "Preparation instruction": 54,
    "Section prose": 41,
    "Compound ingredient": 10,
    "Vocabulary gap": 290,
    "Parser gap": 89,
    "Truly ambiguous": 139
  },
  "operationCandidatesBefore": 654,
  "operationCandidatesAfter": 733,
  "operationCategories": {
    "True missing ingredient": 2,
    "Already represented": 53,
    "Optional ingredient": 61,
    "Alternative": 12,
    "Prepared form": 30,
    "Reference to mixture": 11,
    "Tool": 0,
    "False positive": 4,
    "Ambiguous": 481
  },
  "operationMissingIngredientsAdded": 2,
  "wrongMappingRegressionCount": 0,
  "semanticRegressionCases": 8,
  "addedVocabularyEntries": 0,
  "addedAliases": 60,
  "aliases": {
    "zh:小米椒": [
      "小米辣"
    ],
    "zh:红椒": [
      "红辣椒",
      "红尖椒"
    ],
    "chili": [
      "青辣椒",
      "子弹头辣椒"
    ],
    "zh:辣椒粉": [
      "红辣椒粉",
      "细辣椒粉"
    ],
    "zh:辣椒面": [
      "干辣椒面",
      "中粗辣椒面"
    ],
    "zh:香菜": [
      "香菜叶"
    ],
    "zh:孜然": [
      "孜然籽",
      "孜然粒"
    ],
    "zh:芝麻粒": [
      "芝麻"
    ],
    "zh:蛋黄": [
      "鸡蛋黄"
    ],
    "zh:蛋白": [
      "鸡蛋清"
    ],
    "chicken-thigh": [
      "鸡腿肉",
      "手枪腿鸡腿"
    ],
    "zh:五花肉": [
      "猪五花肉",
      "带皮五花肉",
      "带皮猪五花肉",
      "五花肉薄片",
      "五花肉条"
    ],
    "garlic": [
      "蒜粒",
      "蒜仔"
    ],
    "ginger": [
      "姜丝",
      "生姜片",
      "生姜末",
      "姜沫"
    ],
    "scallion": [
      "葱段",
      "葱末",
      "葱结"
    ],
    "zh:大葱": [
      "葱白"
    ],
    "zh:香油": [
      "芝麻香油"
    ],
    "zh:牛腱": [
      "牛腱子",
      "牛腱子肉"
    ],
    "zh:酸奶": [
      "原味酸奶"
    ],
    "milk": [
      "纯牛奶",
      "冷牛奶"
    ],
    "egg": [
      "无菌鸡蛋"
    ],
    "cheese": [
      "芝士片"
    ],
    "zh:花椒": [
      "花椒粒",
      "红花椒"
    ],
    "zh:花卷": [
      "冷冻花卷"
    ],
    "zh:芝麻油": [],
    "zh:肥牛": [
      "肥牛卷",
      "肥牛片"
    ],
    "zh:红茶": [
      "袋泡红茶",
      "红茶包"
    ],
    "zh:绿茶": [
      "茉莉绿茶",
      "茉莉绿茶茶叶"
    ],
    "zh:芹菜": [
      "芹菜段"
    ],
    "zh:玉米粒": [
      "冷冻玉米粒"
    ],
    "soy-sauce": [
      "生抽酱油"
    ],
    "dark-soy": [
      "老抽酱油"
    ],
    "water": [
      "沸水",
      "凉白开",
      "凉水"
    ],
    "zh:蒜苔": [
      "蒜薹"
    ],
    "zh:红薯粉条": [
      "红薯粉丝"
    ],
    "butter": [
      "无盐黄油"
    ],
    "oil": [
      "食用植物油"
    ]
  },
  "productionRules": [
    "Reliable literal ingredient head only; no substring fallback",
    "Reviewed explicit identity and preparation aliases",
    "Expanded deterministic scalar/formula head boundaries; formula quantity remains null",
    "Checksum/source-phrase-bound operation overrides for two explicit omissions"
  ],
  "remainingUnknownRows": 626,
  "ambiguousCalculationClassifications": 139
}
```

Operation candidates can increase when unsafe material mappings return to unknown. They are not completeness violations. High-risk candidates (two or more source lines) retain all evidence for further review. Ambiguous compound sauces, formulas, alternatives and specialty ingredients remain unknown. Regressions cover every added alias plus mistaken millet, egg-part, sesame-oil, pasta-sauce, spice and sauce identities.
