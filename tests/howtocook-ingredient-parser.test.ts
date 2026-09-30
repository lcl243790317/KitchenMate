import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  parseHowToCookIngredientBullet as parse,
  splitTopLevel,
  assertAtomicHowToCookIngredients,
  extractHowToCookIngredients,
} from "../lib/howtocook-ingredient-parser";
import { verifiedRecipes } from "../lib/verified-recipes";
import { matchRecipe, selectedIngredientIds } from "../lib/matching";
import { makePantryItem } from "../lib/ingredients";
import baseline from "../data/verified-recipes/howtocook/ingredient-parsing-baseline.json";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
import report from "../docs/INGREDIENT_PARSING_AUDIT.json";
const dapan = verifiedRecipes.find(
  (r) => r.id === "howtocook:96dd22806c801283",
)!;
describe("HowToCook atomic bullet parser", () => {
  it("splits six spices, preserving unknown identities and source wording", () => {
    const line = "花椒，香叶，香果，干线椒，大蒜，大葱";
    const parts = parse(line);
    expect(parts.map((p) => p.originalText)).toEqual([
      "花椒",
      "香叶",
      "香果",
      "干线椒",
      "大蒜",
      "大葱",
    ]);
    expect(parts.map((p) => p.ingredientId)).toEqual([
      "zh:花椒",
      "zh:香叶",
      "unknown:香果",
      "unknown:干线椒",
      "garlic",
      "zh:大葱",
    ]);
    expect(parts.every((p) => p.sourceGroupText === line)).toBe(true);
  });
  it("keeps the wine alternative note without requiring beer", () => {
    const p = parse("油，盐，生抽，蚝油，料酒（可拿啤酒），白糖");
    expect(p).toHaveLength(6);
    expect(p.map((i) => i.ingredientId)).toEqual([
      "oil",
      "salt",
      "soy-sauce",
      "oyster-sauce",
      "wine",
      "sugar",
    ]);
    expect(p[4].originalText).toBe("料酒（可拿啤酒）");
  });
  it("keeps preferred chicken cut as a note and shares optional conjunction note", () => {
    const p = parse(
      "鸡肉（鸡腿肉最好），土豆，菜椒和甜椒（可以不用，加上配色好看）",
    );
    expect(p).toHaveLength(4);
    expect(p.map((i) => i.ingredientId)).toEqual([
      "chicken",
      "potato",
      "unknown:菜椒",
      "unknown:甜椒",
    ]);
    expect(p.map((i) => i.optional)).toEqual([false, false, true, true]);
  });
  it("does not split forbidden alternatives in parentheses", () => {
    expect(parse("洋葱（不要用紫色的洋葱）")).toMatchObject([
      { ingredientId: "onion", originalText: "洋葱（不要用紫色的洋葱）" },
    ]);
  });
  it("leaves mutually exclusive and unseparated choices unresolved", () => {
    for (const text of ["牛奶或淡奶油", "葱姜蒜", "姜蒜", "鸡蛋 牛奶"]) {
      const p = parse(text);
      expect(p).toHaveLength(1);
      expect(p[0].ingredientId).toMatch(/^unknown:/);
    }
  });
  it("splits all five top-level separators but preserves nested punctuation", () => {
    expect(parse("盐、糖").map((i) => i.ingredientId)).toEqual([
      "salt",
      "sugar",
    ]);
    expect(
      splitTopLevel("盐,糖；油;葱、姜（可选，说明(不要、拆)）", /[，,、；;]/),
    ).toEqual(["盐", "糖", "油", "葱", "姜（可选，说明(不要、拆)）"]);
  });
  it("propagates optional list notes without marking earlier annotated ingredients optional", () => {
    expect(parse("葱、香菜（可选）").every((i) => i.optional)).toBe(true);
    expect(parse("盐（必需），糖（可选）").map((i) => i.optional)).toEqual([
      false,
      true,
    ]);
  });
  it("only splits conjunctions with reliable ingredient operands", () => {
    expect(parse("葱与姜").map((i) => i.ingredientId)).toEqual([
      "scallion",
      "ginger",
    ]);
    expect(parse("味道和口感")).toHaveLength(1);
    expect(parse("味道和口感")[0].ingredientId).toMatch(/^unknown:/);
  });
  it("retains contiguous explanations and isolates explicit material prefixes", () => {
    expect(parse("牛奶 50-100g，能够将燕麦搅拌粘稠即可")).toMatchObject([
      {
        ingredientId: "milk",
        originalText: "牛奶 50-100g，能够将燕麦搅拌粘稠即可",
      },
    ]);
    expect(parse("辅料：`油`、`盐`").map((i) => i.ingredientId)).toEqual([
      "oil",
      "salt",
    ]);
  });
  it("rejects grouped and compound false-positive rows even if the group is unknown", () => {
    for (const [text, id] of [
      ["花椒，香叶，大蒜，大葱", "garlic"],
      ["盐、糖", "unknown:盐、糖"],
      ["葱姜蒜", "garlic"],
    ])
      expect(() =>
        assertAtomicHowToCookIngredients([
          {
            ingredientId: id,
            originalText: text,
            quantity: null,
            unit: "",
            optional: false,
            group: "原料",
          },
        ]),
      ).toThrow();
  });
});
describe("Xinjiang chicken regression", () => {
  it("has sixteen atomic ingredients, including two optional peppers", () => {
    expect(dapan.ingredients).toHaveLength(16);
    expect(dapan.ingredients.filter((i) => i.optional)).toHaveLength(2);
    expect(dapan.ingredients.map((i) => i.ingredientId)).toEqual([
      "zh:花椒",
      "zh:香叶",
      "unknown:香果",
      "unknown:干线椒",
      "garlic",
      "zh:大葱",
      "oil",
      "salt",
      "soy-sauce",
      "oyster-sauce",
      "wine",
      "sugar",
      "chicken",
      "potato",
      "unknown:菜椒",
      "unknown:甜椒",
    ]);
  });
  it("garlic alone owns only garlic; low-weight staples remain missing", () => {
    const m = matchRecipe(dapan, [makePantryItem("garlic")]);
    expect(m.available.map((i) => i.ingredientId)).toEqual(["garlic"]);
    expect(m.missing.map((i) => i.ingredientId)).toEqual([
      "zh:花椒",
      "zh:香叶",
      "unknown:香果",
      "unknown:干线椒",
      "zh:大葱",
      "oil",
      "salt",
      "soy-sauce",
      "oyster-sauce",
      "wine",
      "sugar",
      "chicken",
      "potato",
    ]);
    const selected = selectedIngredientIds([makePantryItem("garlic")]);
    expect(
      dapan.ingredients.filter((i) => !selected.has(i.ingredientId)),
    ).toHaveLength(15);
  });
  it("adding chicken then potato changes exactly one matching state per selection", () => {
    for (const [ids, expected] of [
      [
        ["garlic", "chicken"],
        ["garlic", "chicken"],
      ],
      [
        ["garlic", "chicken", "potato"],
        ["garlic", "chicken", "potato"],
      ],
    ])
      expect(
        matchRecipe(dapan, ids.map(makePantryItem)).available.map(
          (i) => i.ingredientId,
        ),
      ).toEqual(expected);
  });
});
describe("all catalog snapshots and ten grouped-recipe samples", () => {
  it("preserves every non-ingredient field from the release baseline", () => {
    for (const b of baseline) {
      const r = verifiedRecipes.find((r) => r.id === b.id)!;
      expect(
        createHash("sha256")
          .update(JSON.stringify({ ...r, ingredients: [] }))
          .digest("hex"),
      ).toBe(b.nonIngredientSha256);
    }
  });
  it("audit has zero grouped violations and at least ten actual affected recipes", () => {
    expect(report.violations).toBe(0);
    expect(report.examples).toHaveLength(10);
    expect(report.recipesWithGroupedBullets).toBeGreaterThanOrEqual(10);
  });
  it.each(report.examples)(
    "$title remains atomic and faithful to material source",
    ({ id }) => {
      const r = verifiedRecipes.find((r) => r.id === id)!;
      const source = fs.readFileSync(
        manifest.find((m) => m.id === id)!.snapshotPath,
        "utf8",
      );
      expect(() =>
        assertAtomicHowToCookIngredients(r.ingredients),
      ).not.toThrow();
      const parsed = extractHowToCookIngredients(source).ingredients;
      expect(parsed.map((i) => i.originalText)).toEqual(
        r.ingredients.map((i) => i.originalText),
      );
      expect(
        r.ingredients.every(
          (i) =>
            source.includes(i.originalText) &&
            source.includes(i.sourceGroupText!),
        ),
      ).toBe(true);
    },
  );
});
