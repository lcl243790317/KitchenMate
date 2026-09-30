import type { Recipe } from "./model";
const labels: Record<string, string> = {
  Oven: "烤箱",
  Microwave: "微波炉",
  Blender: "搅拌机",
  "Food Processor": "料理机",
  "Pressure Cooker": "压力锅",
  Thermometer: "温度计",
};
export function recipeEquipment(recipe: Recipe) {
  const equipment = recipe.equipment.map((name) => labels[name] ?? name);
  const source = [
    recipe.title,
    recipe.sourceNotes,
    ...recipe.instructions.map((s) => s.description),
  ].join("\n");
  for (const [pattern, label] of [
    [/微波炉|\bmicrowave\b/i, "微波炉"],
    [/空气炸锅|air fryer/i, "空气炸锅"],
    [/烤箱|\boven\b/i, "烤箱"],
    [/搅拌机|\bblender\b/i, "搅拌机"],
    [/温度计|\bthermometer\b/i, "温度计"],
  ] as const)
    if (pattern.test(source)) equipment.push(label);
  return [...new Set(equipment)];
}
