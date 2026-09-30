# Phase 3.1.2 Ingredient Completeness Audit

Source: checksum-verified local HowToCook snapshots at pinned commit a2d45c6984dff9ee941da0e7c452f7965965d962. No live source fetch.

| Metric | Count |
| --- | ---: |
| recipesScanned | 365 |
| recipesWithCalculationSections | 365 |
| materialIngredientIdentities | 3186 |
| calculationIngredientIdentities | 2323 |
| recipesWithCalculationOnlyIngredients | 144 |
| calculationOnlyIngredientsAdded | 277 |
| duplicateIdentitiesMerged | 2074 |
| ingredientRowsBefore | 3211 |
| ingredientRowsAfter | 3486 |
| unresolvedCalculationFragments | 826 |
| operationOnlyCandidates | 654 |
| completenessViolations | 0 |

Material and calculation bullets are parsed atomically, then merged by canonical identity. Calculation wording and explicit scalar amounts enrich materials; separate calculation usages are retained without summing. Optional material status remains optional. Unresolved calculation fragments stay in source notes and the JSON report; ambiguous prose, alternatives and unknown identities are not silently promoted to requirements. A formula with an explicit ingredient head retains that identity with quantity=null. Operation candidates are report-only, including possible examples, substitutes and optional mentions. They are not completeness violations.

Validation fails if a high-confidence calculation identity is absent from the final catalog. The separate Phase 3.1.1 atomic audit remains available.

## 香菇滑鸡

{
  "id": "howtocook:4f1a2679eb840431",
  "title": "香菇滑鸡",
  "hasCalculation": true,
  "materialIngredientIdentities": [
    "chicken-thigh",
    "zh:干香菇",
    "ginger",
    "scallion",
    "garlic"
  ],
  "calculationIngredientIdentities": [
    "chicken-thigh",
    "zh:干香菇",
    "ginger",
    "scallion",
    "garlic",
    "water",
    "wine",
    "soy-sauce",
    "salt",
    "dark-soy",
    "sugar",
    "zh:香油"
  ],
  "calculationOnlyIngredientsAdded": [
    {
      "ingredientId": "water",
      "originalText": "温水(30-40 ℃) 150ml",
      "sourceGroupText": "温水(30-40 ℃) 150ml",
      "quantity": 150,
      "unit": "ml",
      "optional": false,
      "group": "原料"
    },
    {
      "ingredientId": "wine",
      "originalText": "料酒 15ml",
      "sourceGroupText": "料酒 15ml",
      "quantity": 15,
      "unit": "ml",
      "optional": false,
      "group": "原料"
    },
    {
      "ingredientId": "soy-sauce",
      "originalText": "生抽 30ml",
      "sourceGroupText": "生抽 30ml",
      "quantity": 30,
      "unit": "ml",
      "optional": false,
      "group": "原料"
    },
    {
      "ingredientId": "salt",
      "originalText": "盐 1.5g",
      "sourceGroupText": "盐 1.5g",
      "quantity": 1.5,
      "unit": "g",
      "optional": false,
      "group": "原料"
    },
    {
      "ingredientId": "dark-soy",
      "originalText": "老抽 15ml",
      "sourceGroupText": "老抽 15ml",
      "quantity": 15,
      "unit": "ml",
      "optional": false,
      "group": "原料"
    },
    {
      "ingredientId": "sugar",
      "originalText": "糖 15ml",
      "sourceGroupText": "糖 15ml",
      "quantity": 15,
      "unit": "ml",
      "optional": false,
      "group": "原料"
    },
    {
      "ingredientId": "zh:香油",
      "originalText": "香油 5ml",
      "sourceGroupText": "香油 5ml",
      "quantity": 5,
      "unit": "ml",
      "optional": false,
      "group": "原料"
    }
  ],
  "duplicateIdentitiesMerged": 5,
  "unresolvedCalculationFragments": [],
  "operationOnlyCandidates": [
    {
      "ingredientId": "zh:香菇",
      "text": "9. 等待 20 秒会有香菇香味从锅中飘出，此时下入煸炒过的鸡腿肉，下入香菇水（全部，**本程序员认为的灵魂操作**）、糖 15ml、生抽 30ml"
    },
    {
      "ingredientId": "oil",
      "text": "8. 锅留底油，下入葱、姜、蒜炒香，香菇入锅，大火翻匀"
    }
  ],
  "completenessViolations": [],
  "beforeIngredientCount": 5,
  "afterIngredientCount": 12
}

Run: pnpm recipes:audit-ingredient-completeness. Full per-recipe evidence, unresolved fragments and operation candidates: INGREDIENT_COMPLETENESS_AUDIT.json.
