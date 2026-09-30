"use client";
import type { RecipeLanguage } from "@/lib/recipe-localization";
export function RecipeLanguageToggle({
  language,
  onChange,
}: {
  language: RecipeLanguage;
  onChange: (language: RecipeLanguage) => void;
}) {
  return (
    <div className="recipe-language" role="group" aria-label="教程步骤语言">
      <button
        className="secondary"
        aria-label="中文步骤"
        aria-pressed={language === "zh"}
        onClick={() => onChange("zh")}
      >
        中文
      </button>
      <button
        className="secondary"
        aria-label="英文原文步骤"
        aria-pressed={language === "en"}
        onClick={() => onChange("en")}
      >
        English 原文
      </button>
    </div>
  );
}
