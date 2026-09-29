"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBasket, ChefHat } from "lucide-react";
import type { PantryItem, Recipe, ShoppingItem } from "@/lib/model";
import { ingredientById, ingredientName } from "@/lib/ingredients";
import { loadDeviceState, saveDeviceState, type DeviceState } from "@/lib/storage/device";
import { scaleQuantity } from "@/lib/units";

export function RecipeActions({ recipe }: { recipe: Recipe }) {
  const [state, setState] = useState<DeviceState | null>(null);
  const [servings, setServings] = useState(recipe.servings);
  const [message, setMessage] = useState("");
  useEffect(() => { loadDeviceState().then(setState).catch(() => setState({ pantry: [], shopping: [], saved: [], favorites: [], dark: false })); }, []);
  function update(next: DeviceState) { setState(next); saveDeviceState(next).catch(() => setMessage("此设备暂时无法保存更改")); }
  const pantryById = new Map((state?.pantry ?? []).map((item: PantryItem) => [item.ingredientId, item]));
  const missing = recipe.ingredients.filter((item) => !item.optional && !pantryById.has(item.ingredientId));
  function addMissing() {
    if (!state) return;
    const shopping = [...state.shopping];
    for (const item of missing) {
      const quantity = scaleQuantity(item.quantity, recipe.servings, servings);
      const existing = shopping.find((entry: ShoppingItem) => entry.ingredientId === item.ingredientId && entry.unit === item.unit && !entry.checked);
      if (existing) existing.quantity = existing.quantity === null || quantity === null ? null : existing.quantity + quantity;
      else shopping.push({ ...item, quantity, id: crypto.randomUUID(), name: ingredientName(item.ingredientId), category: ingredientById.get(item.ingredientId)?.category ?? "其他", checked: false });
    }
    update({ ...state, shopping });
    setMessage(missing.length ? `已添加 ${missing.length} 种食材到购物清单` : "食材都齐了，可以开火啦！");
  }
  return <aside className="panel ingredient-list">
    <div className="section-heading"><h2>食材</h2><div className="servings">
      <button aria-label="减少人数" disabled={servings <= 1} onClick={() => setServings((value) => Math.max(1, value - 1))}><Minus size={14} /></button>
      <select aria-label="份量" value={servings} onChange={(event) => setServings(Number(event.target.value))}>{[...new Set([1,2,3,4,6,8,servings])].sort((a,b) => a-b).map((value) => <option key={value} value={value}>{value} 人份</option>)}</select>
      <button aria-label="增加人数" onClick={() => setServings((value) => value + 1)}><Plus size={14} /></button>
    </div></div>
    {recipe.ingredients.map((item, index) => {
      const stock = pantryById.get(item.ingredientId);
      const scaled = scaleQuantity(item.quantity, recipe.servings, servings);
      const short = stock?.quantity !== null && stock?.quantity !== undefined && scaled !== null && stock.unit === item.unit && stock.quantity < scaled;
      return <div className="detail-ingredient" key={`${item.ingredientId}-${index}`}><span className={stock ? "has" : ""}>{stock ? <Check size={16} /> : <span className="circle" />}{ingredientName(item.ingredientId)}{item.optional && <small> 可选</small>}{short && <small> · 数量可能不足</small>}</span><span>{scaled === null ? item.originalText : `${scaled} ${item.unit}`}</span></div>;
    })}
    <p className="tiny">✓ 你已经有　○ 还缺食材</p>
    <button className="secondary full" onClick={addMissing}><ShoppingBasket size={16} /> 添加缺少食材到购物清单</button>
    <div className="detail-actions"><Link href={`/recipe/${encodeURIComponent(recipe.id)}/cook`} className="primary"><ChefHat size={19} /> 开始做菜</Link>{state && <button className="secondary" onClick={() => update({ ...state, favorites: state.favorites.includes(recipe.id) ? state.favorites.filter((id) => id !== recipe.id) : [...state.favorites, recipe.id] })}>{state.favorites.includes(recipe.id) ? "取消收藏" : "收藏菜谱"}</button>}</div>
    {message && <p role="status">{message}</p>}
  </aside>;
}
