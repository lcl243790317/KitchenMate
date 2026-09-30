import {
  ingredientFromText,
  normalizeIngredient,
  ingredients,
} from "./ingredients";
import type { RecipeIngredient } from "./model";

export type ParsedIngredientPart = RecipeIngredient & {
  sourceGroupText: string;
  unresolvedReason?: string;
};
const optionalNote =
  /可选|可不加|非必需|可以不用|可省略|可以不放|可加可不加|可放可不放/;
const tool =
  /锅|刀|砧板|案板|铲|漏勺|量杯|秤|保鲜膜|锡纸|烘焙纸|打蛋器|搅拌机|破壁机|料理机|烤箱|微波炉|碗|擀面杖|压汁器|筛网|筷子|手套|模具|容器|硅油纸|厨房纸|蒸笼垫|盆|盘子|杯子|烤架|布$/;
const prose =
  /^(?:能够|根据|参见|需带|例如|建议|尽量|必须|不能|不要|不加|去除|用于|其中|选择|可根据|其余|炒糖色过程)/;

// Ignore all separators inside balanced parentheses or Markdown link targets.
export function splitTopLevel(text: string, separators: RegExp): string[] {
  const stack: string[] = [];
  const pairs: Record<string, string> = {
    "（": "）",
    "(": ")",
    "[": "]",
    "【": "】",
  };
  const parts: string[] = [];
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (pairs[char]) stack.push(pairs[char]);
    else if (stack.at(-1) === char) stack.pop();
    else if (!stack.length && separators.test(char)) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}
function head(text: string) {
  return text.replace(/[*`]/g, "").split(/[（(]/)[0].trim();
}
function isAlternative(text: string) {
  return /或|\bor\b|\//i.test(head(text));
}
function simpleIngredient(text: string) {
  const name = head(text);
  return (
    Boolean(normalizeIngredient(name)) ||
    /^[\u4e00-\u9fff]{1,6}(?:椒|菇|豆|肉|鱼|菜)$/.test(name)
  );
}
function conjunctionParts(text: string) {
  const parts = splitTopLevel(text, /[和与]/);
  return parts.length > 1 && parts.every(simpleIngredient) ? parts : [text];
}
const aliases = ingredients
  .flatMap((item) =>
    [item.displayNameZh, ...item.aliases]
      .filter(
        (alias) =>
          /^[\u4e00-\u9fff]+$/.test(alias) &&
          (alias.length >= 2 || /^[葱姜蒜盐油糖]$/.test(alias)),
      )
      .map((alias) => ({ alias, id: item.id })),
  )
  .sort((a, b) => b.alias.length - a.alias.length);
export function topLevelIngredientIdentities(text: string) {
  const name = head(text);
  const occupied = new Set<number>();
  const ids = new Set<string>();
  for (const { alias, id } of aliases) {
    let start = name.indexOf(alias);
    while (start !== -1) {
      const positions = Array.from(
        { length: alias.length },
        (_, i) => start + i,
      );
      if (positions.every((i) => !occupied.has(i))) {
        positions.forEach((i) => occupied.add(i));
        ids.add(id);
      }
      start = name.indexOf(alias, start + alias.length);
    }
  }
  return ids;
}
function identity(text: string) {
  const primary = splitTopLevel(text, /[，,、；;]/)[0] ?? text;
  const name = head(primary);
  if (
    !name ||
    isAlternative(primary) ||
    (/[和与]/.test(name) && conjunctionParts(primary).length === 1)
  )
    return {
      id: `unknown:${text}`,
      reason: "unresolved alternative or compound",
    };
  // Never use a recognized substring to stand in for a concatenated list.
  if (/^(?:葱姜蒜|姜蒜|葱姜)$/.test(name))
    return { id: `unknown:${text}`, reason: "unseparated compound" };
  if (
    !normalizeIngredient(name) &&
    topLevelIngredientIdentities(primary).size > 1
  )
    return { id: `unknown:${text}`, reason: "unseparated compound" };
  const found = ingredientFromText(primary);
  return found
    ? { id: found.id }
    : { id: `unknown:${name || text}`, reason: "not in vocabulary" };
}

export function parseHowToCookIngredientBullet(
  sourceGroupText: string,
): ParsedIngredientPart[] {
  if (/^(?:工具|注[：:])/.test(sourceGroupText)) return [];
  const prefix =
    sourceGroupText.match(
      /^(?:主料|辅料|调味料|炒料|全香料|必备|可选|原料|食材)[：:]\s*/,
    )?.[0] ?? "";
  const text = sourceGroupText.slice(prefix.length);
  const chunks = splitTopLevel(text, /[，,、；;]/);
  // A trailing standalone optional note qualifies the whole list, not unrelated earlier chunks with their own annotations.
  const sharedOptional =
    /^可选/.test(prefix) ||
    (chunks.length > 1 &&
      /[（(][^（）()]*[）)]\s*$/.test(text) &&
      optionalNote.test(
        text.slice(Math.max(text.lastIndexOf("（"), text.lastIndexOf("("))),
      ) &&
      chunks.slice(0, -1).every((part) => !/[（(]/.test(part)));
  const fragments: string[] = [];
  const optionalFragments = new Set<string>();
  for (const chunk of chunks) {
    if (prose.test(head(chunk)) && fragments.length) {
      // Retain contiguous explanatory wording with its preceding ingredient.
      const previous = fragments.pop()!;
      const offset = text.indexOf(previous);
      fragments.push(
        text.slice(offset, text.indexOf(chunk, offset) + chunk.length),
      );
    } else {
      const parts = conjunctionParts(chunk);
      if (parts.length > 1 && optionalNote.test(chunk))
        parts.forEach((part) => optionalFragments.add(part));
      fragments.push(...parts);
    }
  }
  return fragments
    .filter((fragment) => {
      const name = head(fragment);
      return (
        !(tool.test(name) && !normalizeIngredient(name)) && !prose.test(name)
      );
    })
    .map((fragment) => {
      const resolved = identity(fragment);
      return {
        ingredientId: resolved.id,
        originalText: fragment,
        sourceGroupText,
        quantity: null,
        unit: "",
        optional:
          sharedOptional ||
          optionalFragments.has(fragment) ||
          optionalNote.test(fragment),
        group: /^辅料|调味料|炒料|全香料/.test(prefix) ? "辅料" : "原料",
        ...(resolved.reason ? { unresolvedReason: resolved.reason } : {}),
      };
    });
}
export function howToCookMaterialBullets(markdown: string): string[] {
  const material = [
    ...markdown.matchAll(/^##\s+(.+)\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/gm),
  ].find((section) => /必备原料|原料和工具|所需食材/.test(section[1]));
  if (!material) throw new Error("missing recognized material section");
  return material[2]
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*+]\s+/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, ""));
}
export function assertAtomicHowToCookIngredients(items: RecipeIngredient[]) {
  for (const item of items) {
    const parsed = parseHowToCookIngredientBullet(item.originalText);
    if (parsed.length > 1)
      throw new Error(
        `Grouped ingredient stored as one row: ${item.originalText}`,
      );
    if (
      !item.ingredientId.startsWith("unknown:") &&
      (parsed.length !== 1 || parsed[0].ingredientId !== item.ingredientId)
    )
      throw new Error(`Unsafe ingredient identity: ${item.originalText}`);
  }
}
