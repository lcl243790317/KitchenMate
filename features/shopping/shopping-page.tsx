"use client";
import Link from "next/link";
import { ArrowRight, ShoppingBasket, X } from "lucide-react";
import { ingredients } from "@/lib/ingredients";
import type { ShoppingItem } from "@/lib/model";

const categories = [...new Set(ingredients.map((item) => item.category))];
export function ShoppingPageView({ shopping, onChange }: { shopping: ShoppingItem[]; onChange: (items: ShoppingItem[]) => void }) {
  return <>
    <section className="page-heading"><span className="eyebrow">A LITTLE PREPARATION</span><h1>购物清单</h1><p>把缺少的带回家，把美味带上桌。</p></section>
    <div className="shopping-top"><span>{shopping.filter((item) => !item.checked).length} 项待购买 · {shopping.filter((item) => item.checked).length} 项已完成</span><button className="secondary" onClick={() => onChange(shopping.filter((item) => !item.checked))}>清除已完成</button></div>
    {!shopping.length ? <div className="empty"><ShoppingBasket size={44} /><h2>清单空空的，厨房满满的可能</h2><p>在菜谱详情中，一键加入缺少的食材。</p><Link href="/discover" className="primary">去找一道菜 <ArrowRight size={16} /></Link></div> : categories.map((category) => {
      const items = shopping.filter((item) => item.category === category);
      return items.length ? <section className="shopping-group panel" key={category}><h3>{category} <span className="count">{items.length}</span></h3>{items.map((item) => <div className="shopping-row" key={item.id}><label className={item.checked ? "done" : ""}><input type="checkbox" checked={item.checked} onChange={() => onChange(shopping.map((entry) => entry.id === item.id ? { ...entry, checked: !entry.checked } : entry))} /><span>{item.name}</span></label><span>{item.quantity ?? "适量"} {item.unit}</span><button className="icon-button" aria-label={`移除${item.name}`} onClick={() => onChange(shopping.filter((entry) => entry.id !== item.id))}><X size={17} /></button></div>)}</section> : null;
    })}
  </>;
}
