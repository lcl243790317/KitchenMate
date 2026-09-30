import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createHash } from "node:crypto";
import aliases from "../data/ingredients/semantic-aliases.json";
import baseline from "../data/ingredient-audits/phase312-baseline.json";
import overrides from "../data/ingredient-audits/operation-overrides.json";
import beginnerEvidence from "../data/recipe-beginner-source-signals.json";
import wikiManifest from "../data/verified-recipes/wikibooks/manifest.json";
import {
  parseHowToCookIngredientBullet,
  parseHowToCookCalculationBullet,
} from "../lib/howtocook-ingredient-parser";
import { ingredientById } from "../lib/ingredients";
import { verifiedRecipes } from "../lib/verified-recipes";
import { matchRecipe, searchRecipe } from "../lib/matching";
import { parseWikibooks, parseWikiIngredient } from "../lib/wikibooks-parser";
import { validateRecipeSourcePolicy } from "../lib/recipe-source-registry";
import { beginnerSignals } from "../lib/beginner-recipes";
import { browseRecipes } from "../lib/recipe-browse";
import { canCookRecipe } from "../lib/recipe-trust";
import { classifyCalculation } from "../lib/ingredient-semantics";
describe("Reviewed semantic aliases", () => {
  it.each(["圆碟子", "蒸架", "煲汤盅", "蘸料碟 1 个"])(
    "%s is explicitly excluded equipment",
    (text) => {
      expect(parseHowToCookIngredientBullet(text)).toEqual([]);
      expect(classifyCalculation(text).category).toBe("Tool");
    },
  );
  it("does not classify a food as equipment because its preparation note mentions a pot", () => {
    expect(classifyCalculation("香油 几滴（出锅用）").category).not.toBe(
      "Tool",
    );
    expect(
      classifyCalculation("五花肉的用量为 0.5 斤/男人（正宗回锅肉）").category,
    ).not.toBe("Tool");
  });
  it.each(
    Object.entries(aliases).flatMap(([id, names]) =>
      names.map((name) => ({ id, name })),
    ),
  )("$name retains $id with and without a scalar amount", ({ id, name }) => {
    expect(ingredientById.has(id)).toBe(true);
    expect(parseHowToCookIngredientBullet(name)[0]?.ingredientId).toBe(id);
    expect(
      parseHowToCookCalculationBullet(`${name} 15g`)[0]?.ingredientId,
    ).toBe(id);
  });
  it.each([
    "意大利面酱",
    "红豆蔻",
    "俄式酸黄瓜汁",
    "蒜蓉酱",
    "预制牛排酱汁",
    "芥末油",
    "巴斯马蒂香米",
    "土豆干粉条",
    "青红椒",
  ])("%s remains unknown instead of a misleading substring", (text) =>
    expect(parseHowToCookIngredientBullet(text)[0]?.ingredientId).toMatch(
      /^unknown:/,
    ),
  );
  it("recognizes tools without treating them as bread or soy milk", () => {
    expect(parseHowToCookIngredientBullet("面包机")).toEqual([]);
    expect(parseHowToCookIngredientBullet("过滤豆浆渣的纱布一块")).toEqual([]);
  });
  it("retains original audit population and explicit source-only operation additions", () => {
    expect(baseline.unresolved).toHaveLength(826);
    expect(baseline.operations).toHaveLength(654);
    for (const o of overrides) {
      const r = verifiedRecipes.find((r) => r.id === o.recipeId)!;
      const i = r.ingredients.find((i) => i.ingredientId === o.ingredientId)!;
      expect(i.quantity).toBeNull();
      expect(i.verificationMethod).toBe("source-operation-explicit");
      expect(i.sourceGroupText).toBe(o.sourcePhrase);
    }
  });
  it("keeps mushroom chicken 12, Dapan 16 and strict ownership", () => {
    const chicken = verifiedRecipes.find(
      (r) => r.id === "howtocook:4f1a2679eb840431",
    )!;
    const dapan = verifiedRecipes.find(
      (r) => r.id === "howtocook:96dd22806c801283",
    )!;
    expect(chicken.ingredients).toHaveLength(12);
    expect(dapan.ingredients).toHaveLength(16);
    expect(
      matchRecipe(dapan, [{ ingredientId: "garlic" }]).selectedIngredientUsage,
    ).toBe(1);
    const m = matchRecipe(chicken, [{ ingredientId: "soy-sauce" }]);
    expect(m.available.map((i) => i.ingredientId)).toEqual(["soy-sauce"]);
  });
});
describe("Wikibooks licensed pinned source fidelity", () => {
  it.each(wikiManifest)(
    "$id retains original recipe, revision, license and every procedure",
    (entry) => {
      const raw = fs.readFileSync(entry.snapshotPath, "utf8"),
        snapshot = JSON.parse(raw),
        r = verifiedRecipes.find((r) => r.id === entry.id)!;
      const parsed = parseWikibooks(snapshot.wikitext, snapshot.language);
      expect(createHash("sha256").update(raw).digest("hex")).toBe(entry.sha256);
      expect(r.provenance.sourceRevision).toBe(String(snapshot.revisionId));
      expect(r.provenance.licenseName).toBe("CC BY-SA 4.0");
      expect(r.provenance.attributionText).toContain("Wikibooks contributors");
      expect(r.originalTitle).toBe(
        snapshot.title.replace(/^Cookbook:|^食譜\//, ""),
      );
      if (snapshot.language !== "zh")
        expect(r.titleTranslation).toBe("KitchenMate");
      expect(r.ingredients).toEqual(parsed.ingredients);
      expect(r.instructions.map((i) => i.description)).toEqual(
        parsed.descriptions,
      );
      expect(r.image).toBeNull();
      expect(canCookRecipe(r)).toBe(true);
      expect(() => validateRecipeSourcePolicy(r)).not.toThrow();
    },
  );
  it("retains source Fahrenheit and food safety values without new conversions", () => {
    const r = verifiedRecipes.find((r) => r.title === "烤鸡胸肉")!;
    expect(r.instructions[1].description).toContain("400°F (200°C)");
    expect(r.instructions[1].description).toContain("165°F (75°C)");
  });
  it.each([
    ["2 tbsp sesame seed oil", "zh:芝麻油"],
    ["200 g minced raw chicken", "chicken"],
    ["1 cup cooked rice", "rice"],
    ["100 g rice", "zh:大米"],
    ["1 cup soy sauce", "zh:普通酱油"],
    ["12 ounces broccoli florets", "broccoli"],
  ])("explicit English ingredient %s", (text, id) =>
    expect(parseWikiIngredient(text, false).ingredientId).toBe(id),
  );
  it("never resolves milk-or-cream or syrup from a substring", () => {
    expect(
      parseWikiIngredient("1 cup milk or cream", false).ingredientId,
    ).toMatch(/^unknown:/);
    expect(
      parseWikiIngredient("2 tbsp chocolate syrup", false).ingredientId,
    ).toMatch(/^unknown:/);
    expect(
      parseWikiIngredient("1/2 lb. frozen broccoli florets", false)
        .ingredientId,
    ).toMatch(/^unknown:/);
    expect(
      parseWikiIngredient("1/2 Tbsp Montreal steak seasoning", false)
        .ingredientId,
    ).toMatch(/^unknown:/);
    expect(
      parseWikiIngredient("Sea salt and freshly ground black pepper", false)
        .ingredientId,
    ).toMatch(/^unknown:/);
  });
  it("rejects incomplete sources and unauthorized commercial full instructions", () => {
    expect(() => parseWikibooks("==Ingredients==\n* egg")).toThrow();
    const linked = verifiedRecipes.find(
      (r) => r.instructionAvailability === "source-only",
    )!;
    expect(canCookRecipe(linked)).toBe(false);
    expect(() =>
      validateRecipeSourcePolicy({
        ...linked,
        instructionAvailability: "full",
      }),
    ).toThrow();
  });
});
describe("Beginner discovery has measurable source/derived evidence", () => {
  it.each(beginnerEvidence)(
    "$recipeId has an actual pinned novice-friendly source statement",
    (evidence) => {
      const source = fs.readFileSync(evidence.snapshotPath, "utf8");
      expect(source.split("##")[0]).toContain(evidence.sourcePhrase);
      expect(evidence.sourcePhrase).toContain(evidence.sourceDifficulty);
      expect(
        beginnerSignals(
          verifiedRecipes.find((r) => r.id === evidence.recipeId)!,
        ).sourceEasy,
      ).toBe(true);
    },
  );
  it("finds Chinese and English title and ingredient aliases", () => {
    const r = verifiedRecipes.find((r) => r.title === "鸡肉炒饭")!;
    for (const q of [
      "鸡肉炒饭",
      "Chicken Fried Rice",
      "chicken",
      "鸡肉",
      "carrot",
      "胡萝卜",
    ])
      expect(searchRecipe(r, q)).toBe(true);
  });
  it("filters and orders beginner and quick recipes without guessing missing times", () => {
    const easy = browseRecipes(verifiedRecipes, "", "", "", true);
    expect(easy.length).toBeGreaterThan(20);
    expect(easy.every((r) => beginnerSignals(r).beginnerFriendly)).toBe(true);
    expect(
      browseRecipes(verifiedRecipes, "", "", "", false, true).every(
        (r) => r.totalTime !== null && r.totalTime <= 30,
      ),
    ).toBe(true);
    const r = verifiedRecipes.find((r) => r.title === "烤鸡胸肉")!;
    expect(beginnerSignals(r).sourceEasy).toBe(true);
    expect(r.totalTime).toBeNull();
    expect(browseRecipes([r], "", "", "", false, true)).toHaveLength(0);
  });
});
