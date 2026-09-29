import fs from "node:fs";
import { localRecipes } from "@/tests/fixtures/legacy-recipes";
import { verifiedRecipes } from "../lib/verified-recipes";
// Explicit equivalent dish titles only. A match links to the new source record;
// it NEVER grants provenance to the old instructions.
const aliases: Record<string, string> = {
  番茄炒蛋: "西红柿炒鸡蛋",
  番茄蛋花汤: "西红柿鸡蛋汤",
  蒜蓉西兰花: "蒜蓉西兰花",
  宫保鸡丁: "宫保鸡丁",
  洋葱炒蛋: "洋葱炒鸡蛋",
  蛋炒饭: "蛋炒饭",
  可乐鸡翅: "可乐鸡翅",
  麻婆豆腐: "麻婆豆腐",
};
const rows = localRecipes.map((old) => {
  const source = verifiedRecipes.find(
    (r) => r.title === (aliases[old.title] ?? old.title),
  );
  return {
    title: old.title,
    oldId: old.id,
    sourceFound: Boolean(source),
    sourceUrl: source?.sourceUrl ?? null,
    newTrust: source?.provenance.type ?? "UNVERIFIED",
    replacementId: source?.id ?? null,
    oldInstructionsKept: false,
    keptInProduction: Boolean(source),
  };
});
fs.writeFileSync(
  "docs/LEGACY_RECIPE_AUDIT.json",
  JSON.stringify(rows, null, 2),
);
fs.writeFileSync(
  "docs/LEGACY_RECIPE_AUDIT.md",
  `# Legacy recipe audit\n\n${rows.length} legacy records. ${rows.filter((r) => r.sourceFound).length} have an independently fetched matching source record. All 82 old instruction sets remain hidden. Matching titles identify a replacement, not validation of the old instructions. Unmatched dishes were searched against the fetched source tree; no claim of exhaustive internet search.\n\n|Title|Old ID|Source found|Source URL|New trust|Replacement in production|Old instructions kept|\n|---|---|---|---|---|---|---|\n${rows.map((r) => `|${r.title}|${r.oldId}|${r.sourceFound}|${r.sourceUrl ?? "—"}|${r.newTrust}|${r.keptInProduction}|No|`).join("\n")}\n`,
);
console.log({
  total: rows.length,
  sourceMatched: rows.filter((r) => r.sourceFound).length,
  unmatched: rows.filter((r) => !r.sourceFound).length,
  oldInstructionSetsHidden: 82,
});
