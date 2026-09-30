"use client";
import { useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import {
  pantryPrimary,
  pantryCommonIds,
  pantryUiCategories,
  searchPantryIngredients,
} from "@/lib/pantry-selection";
import type { PantryItem, Ingredient } from "@/lib/model";
export function IngredientPicker({
  pantry,
  onToggle,
}: {
  pantry: PantryItem[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const searching = Boolean(query.trim());
  const groups: { label: string; items: Ingredient[] }[] = searching
    ? [{ label: "搜索结果", items: searchPantryIngredients(query) }]
    : [
        {
          label: "常用",
          items: [...pantryCommonIds].map((id) =>
            pantryPrimary.find((i) => i.id === id)!,
          ),
        },
        ...pantryUiCategories.map((label) => ({
          label,
          items: pantryPrimary.filter(
            (i) => i.pantryUiCategory === label && !pantryCommonIds.has(i.id),
          ),
        })),
      ];
  return (
    <>
      <div className="searchbox">
        <Search size={19} />
        <input
          aria-label="搜索食材"
          placeholder="搜索食材，例如：鸡蛋、番茄、鸡胸肉"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {searching && (
          <button className="text-link" onClick={() => setQuery("")}>
            清除
          </button>
        )}
      </div>
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <section
            className="pantry-group"
            key={group.label}
            aria-label={group.label}
          >
            <h3>{group.label}</h3>
            <div className="ingredient-grid">
              {group.items.map((item) => {
                const selected = pantry.some(
                  (entry) => entry.ingredientId === item.id,
                );
                return (
                  <button
                    className={`ingredient ${selected ? "selected" : ""}`}
                    data-ingredient-id={item.id}
                    aria-pressed={selected}
                    aria-label={item.displayNameZh}
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                  >
                    <span>{item.emoji}</span>
                    <strong>{item.displayNameZh}</strong>
                    <i>{selected ? <Check size={14} /> : <Plus size={14} />}</i>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      {searching && !groups[0].items.length && (
        <p>没有找到这个食材，试试其他名称。</p>
      )}
      <p className="subtle">找不到？直接搜索全部食材，中文和英文名称都可以。</p>
    </>
  );
}
