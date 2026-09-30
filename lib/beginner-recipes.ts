import type { Recipe } from "./model";
import { ingredientById } from "./ingredients";
import sourceSignals from "@/data/recipe-beginner-source-signals.json";
const signalsById = new Map(
  sourceSignals.map((signal) => [signal.recipeId, signal]),
);

export function beginnerSignals(recipe: Recipe) {
  const required = recipe.ingredients.filter((item) => !item.optional);
  const unknown = required.filter(
    (item) => !ingredientById.has(item.ingredientId),
  ).length;
  const signals = {
    sourceDifficulty:
      recipe.sourceDifficulty ?? signalsById.get(recipe.id)?.sourceDifficulty,
    totalTimeMinutes: recipe.totalTime,
    requiredIngredientCount: required.length,
    nonStapleIngredientCount: required.filter(
      (item) => !ingredientById.get(item.ingredientId)?.pantryStaple,
    ).length,
    instructionCount:
      recipe.sourceInstructionCount ?? recipe.instructions.length,
    specialEquipmentCount: recipe.equipment.filter(
      (name) => !/^(锅|炒锅|平底锅|刀|碗|勺|pan|pot|knife|bowl)$/i.test(name),
    ).length,
  };
  const sourceEasy =
    /(?:^(?:Very Easy|Easy|beginner|simple)$|新手|做法.*简单|操作.*简单|制作简单|简单易|初学者.*友好)/i.test(
      signals.sourceDifficulty ?? "",
    );
  const objective =
    recipe.totalTime !== null &&
    recipe.totalTime <= 30 &&
    signals.nonStapleIngredientCount <= 8 &&
    signals.instructionCount > 0 &&
    signals.instructionCount <= 8 &&
    signals.specialEquipmentCount === 0 &&
    unknown === 0;
  return {
    ...signals,
    sourceEasy,
    beginnerFriendly: sourceEasy || objective,
    classificationBasis: sourceEasy
      ? "来源标注简单"
      : "根据步骤、用时和食材数量归类",
  };
}
export function compareBeginnerRecipes(a: Recipe, b: Recipe) {
  const x = beginnerSignals(a),
    y = beginnerSignals(b);
  return (
    Number(y.sourceEasy) - Number(x.sourceEasy) ||
    Number(b.totalTime !== null && b.totalTime <= 30) -
      Number(a.totalTime !== null && a.totalTime <= 30) ||
    x.nonStapleIngredientCount - y.nonStapleIngredientCount ||
    x.instructionCount - y.instructionCount ||
    a.title.localeCompare(b.title, "zh-CN") ||
    a.id.localeCompare(b.id)
  );
}
