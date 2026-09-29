"use client";
import { useState } from "react";
import { ArrowRight, Check, Plus, Search } from "lucide-react";
import {
  ingredients,
  ingredientName,
  normalizeIngredientText,
} from "@/lib/ingredients";
import type { PantryItem } from "@/lib/model";

const categories = [
  "全部",
  ...new Set(ingredients.map((item) => item.category)),
];
const common = ["egg", "tomato", "potato", "onion", "chicken-breast"];

export function IngredientPicker({
  pantry,
  onToggle,
}: {
  pantry: PantryItem[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [showAll, setShowAll] = useState(false);
  const normalized = normalizeIngredientText(query);
  const filtered = ingredients.filter(
    (item) =>
      (category === "全部" || item.category === category) &&
      [item.displayNameZh, item.displayNameEn, ...item.aliases].some((value) =>
        normalizeIngredientText(value).includes(normalized),
      ),
  );
  const limit = showAll || query || category !== "全部" ? filtered.length : 36;
  return (
    <>
      <div className="searchbox">
        <Search size={19} />
        <input
          aria-label="搜索食材"
          placeholder="搜索食材，例如：鸡蛋、西红柿、chicken"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span>⌕</span>
      </div>
      <div className="ingredient-tools">
        <label>
          分类{" "}
          <select
            aria-label="食材分类"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setShowAll(false);
            }}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        {!query && category === "全部" && (
          <span>常用食材优先 · 搜索可查找全部 {ingredients.length} 种</span>
        )}
      </div>
      {!query && category === "全部" && (
        <div className="recent-ingredients">
          <strong>常用</strong>
          {common.map((id) => (
            <button
              key={id}
              aria-label={`快速添加${ingredientName(id)}`}
              aria-pressed={pantry.some((item) => item.ingredientId === id)}
              onClick={() => onToggle(id)}
            >
              {ingredientName(id)}
            </button>
          ))}
        </div>
      )}
      <div className="ingredient-grid">
        {filtered.slice(0, limit).map((item) => {
          const selected = pantry.some(
            (entry) => entry.ingredientId === item.id,
          );
          return (
            <button
              className={`ingredient ${selected ? "selected" : ""}`}
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
      {!query && category === "全部" && !showAll && (
        <button className="text-link" onClick={() => setShowAll(true)}>
          显示更多食材 <ArrowRight size={14} />
        </button>
      )}
    </>
  );
}
