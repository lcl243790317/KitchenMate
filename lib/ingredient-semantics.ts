import { ingredientById } from "./ingredients";
import { parseHowToCookCalculationBullet } from "./howtocook-ingredient-parser";
export function classifyCalculation(text: string, previousId = "") {
  const parsed = parseHowToCookCalculationBullet(text);
  const resolved =
    parsed.length > 0 && parsed.every((item) => !item.unresolvedReason);
  let category: string;
  if (/^(?:锅|炒锅|圆碟子|蒸架|煲汤盅|蘸料碟)(?:$|\s*\d)/.test(text)) category = "Tool";
  else if (/或|\bor\b|\/.*(?:生抽|牛奶|面粉|瘦肉|薄荷)/i.test(text))
    category = "Alternative";
  else if (
    /葱姜|姜蒜|青红椒|青红辣椒|玉米粒和青豆|高度白酒.*水|温牛奶/.test(text)
  )
    category = "Compound ingredient";
  else if (
    /^\d.*(?:ml|g|克|个|片|颗|mL)|^每颗|^向上|^向下|[=×]|份数|用量|数量|体积|质量|[Tt][r1c]|\d.*\*.*\d/.test(
      text,
    )
  )
    category = "Quantity/formula";
  else if (/^(?:去皮|切|掰|磨|拍|中间切开|葱白切段|小葱挽成结|放凉)/.test(text))
    category = "Preparation instruction";
  else if (/可选|装饰用|可无|可不加/.test(text))
    category = "Optional description";
  else if (
    /^(?:本教程|一般|此|如果|若|能|需要|推荐|单人|一杯|约|人多|按|开始|正常|看个人|过来人|当|不放|进阶|小料|调味品|可选配料)/.test(
      text,
    )
  )
    category = "Section prose";
  else if (resolved)
    category = previousId.startsWith("unknown:")
      ? "Real ingredient"
      : "Parser gap";
  else if (/^[\u4e00-\u9fff]{2,12}\s*\d/.test(text))
    category = "Vocabulary gap";
  else category = "Truly ambiguous";
  return {
    category,
    resolved,
    identities: parsed
      .filter((p) => !p.unresolvedReason)
      .map((p) => p.ingredientId),
  };
}
export function ingredientParentIds(id: string) {
  const ids = new Set<string>();
  while (id && !ids.has(id)) {
    ids.add(id);
    id = ingredientById.get(id)?.parentIngredientId ?? "";
  }
  return ids;
}
