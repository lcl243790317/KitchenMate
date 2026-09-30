"use client";
import { useState } from "react";
import { Clock } from "lucide-react";
import type { Recipe } from "@/lib/model";
import {
  localizedInstructions,
  recipeTranslation,
  type RecipeLanguage,
} from "@/lib/recipe-localization";
import { RecipeLanguageToggle } from "./recipe-language-toggle";
export function RecipeInstructions({ recipe }: { recipe: Recipe }) {
  const [language, setLanguage] = useState<RecipeLanguage>("zh");
  const translation = recipeTranslation(recipe);
  return (
    <section className="instructions">
      <h2>一步一步，做顿好饭</h2>
      {translation && (
        <RecipeLanguageToggle language={language} onChange={setLanguage} />
      )}
      {!translation &&
        recipe.originalTitle &&
        recipe.sourceProvider !== "howtocook" && (
          <p className="subtle">步骤保留来源原文。</p>
        )}
      {localizedInstructions(recipe, language).map((step) => (
        <article key={step.stepNumber}>
          <span className="step-number">
            {String(step.stepNumber).padStart(2, "0")}
          </span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            {step.durationSeconds !== null && (
              <span className="step-time">
                <Clock size={14} />约 {Math.round(step.durationSeconds / 60)}{" "}
                分钟
              </span>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
