"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/model";
import {
  Heart,
  Search,
  SlidersHorizontal,
  UtensilsCrossed,
} from "lucide-react";

type TextSetter = (value: string) => void;
type Props = {
  pantryCount: number;
  query: string;
  setQuery: TextSetter;
  loading: boolean;
  onSearch: () => void;
  mode: string;
  setMode: TextSetter;
  onlyFavorites: boolean;
  setOnlyFavorites: (value: boolean) => void;
  filtersOpen: boolean;
  setFiltersOpen: (value: boolean) => void;
  sourceFilter: string;
  setSourceFilter: TextSetter;
  resetVisible: () => void;
  maxTime: string;
  setMaxTime: TextSetter;
  difficulty: string;
  setDifficulty: TextSetter;
  cuisine: string;
  setCuisine: TextSetter;
  diet: string;
  setDiet: TextSetter;
  equipment: string;
  setEquipment: TextSetter;
  warning: string;
  resultCount: number;
  cards: ReactNode;
  recentRecipes: Recipe[];
  onOpen: (recipe: Recipe) => void;
};

export function DiscoverPageView(props: Props) {
  const filterOptions: [string, string, TextSetter, string[]][] = [
    ["时间", props.maxTime, props.setMaxTime, ["15", "30", "60"]],
    ["难度", props.difficulty, props.setDifficulty, ["简单", "普通", "进阶"]],
    [
      "菜系",
      props.cuisine,
      props.setCuisine,
      [
        "中餐",
        "川菜",
        "粤菜",
        "江浙菜",
        "东北菜",
        "日料",
        "韩餐",
        "西餐",
        "意大利菜",
        "墨西哥菜",
        "东南亚",
      ],
    ],
    [
      "偏好",
      props.diet,
      props.setDiet,
      ["素食", "Vegan", "高蛋白", "低碳", "低脂"],
    ],
    [
      "厨具",
      props.equipment,
      props.setEquipment,
      ["炒锅", "烤箱", "空气炸锅", "电饭煲", "高压锅", "微波炉"],
    ],
  ];
  if (!props.pantryCount && props.sourceFilter === "为我推荐")
    return (
      <section className="empty">
        <h1>先选择一些你手头有的食材</h1>
        <Link href="/pantry" className="primary">
          去选择食材
        </Link>
        <p>
          或者
          <Link href="/recipes" className="text-link">
            浏览全部教程
          </Link>
        </p>
        <button
          className="text-link"
          onClick={() => props.setSourceFilter("我的导入")}
        >
          我的导入
        </button>
      </section>
    );
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">COOK SOMETHING GOOD</span>
        <h1>根据你现有的食材</h1>
        <p>你有 {props.pantryCount} 种食材，看看今天能做点什么。</p>
      </section>
      <div className="discover-search">
        <div className="searchbox">
          <Search size={20} />
          <input
            aria-label="搜索菜谱"
            placeholder="搜索菜名、食材或标签，例如：番茄炒蛋 / 快手菜"
            value={props.query}
            onChange={(event) => props.setQuery(event.target.value)}
          />
        </div>
        <button
          className="secondary"
          onClick={props.onSearch}
          disabled={props.loading}
        >
          {props.loading ? "正在查找…" : "查找在线菜谱"}
        </button>
      </div>
      <div className="recommend-tabs">
        {["现在就能做", "只差一样", "只差两样", "最匹配", "快手菜"].map(
          (mode) => (
            <button
              key={mode}
              className={props.mode === mode ? "active" : ""}
              onClick={() => props.setMode(mode)}
            >
              {mode}
            </button>
          ),
        )}
        <button
          className={props.onlyFavorites ? "active" : ""}
          onClick={() => props.setOnlyFavorites(!props.onlyFavorites)}
        >
          <Heart size={16} /> 收藏
        </button>
        <button onClick={() => props.setFiltersOpen(!props.filtersOpen)}>
          <SlidersHorizontal size={16} /> 筛选
        </button>
      </div>
      <div className="source-tabs" aria-label="菜谱来源">
        {["为我推荐", "我的导入", "在线菜谱"].map((source) => (
          <button
            key={source}
            className={props.sourceFilter === source ? "active" : ""}
            onClick={() => {
              props.setSourceFilter(source);
              props.resetVisible();
            }}
          >
            {source}
          </button>
        ))}
      </div>
      {props.recentRecipes.length > 0 && (
        <section className="recent-recipes" aria-label="最近看过的菜谱">
          <strong>最近看过</strong>
          <div>
            {props.recentRecipes.map((recipe) => (
              <Link
                className="text-link"
                key={recipe.id}
                href={`/recipe/${encodeURIComponent(recipe.id)}`}
                onClick={(event) => {
                  if (
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    props.onOpen(recipe);
                  }
                }}
              >
                {recipe.title}
              </Link>
            ))}
          </div>
        </section>
      )}
      {props.filtersOpen && (
        <div className="filter-panel">
          {filterOptions.map(([label, value, set, options]) => (
            <label key={label}>
              {label}
              <select
                aria-label={label}
                value={value}
                onChange={(event) => set(event.target.value)}
              >
                <option value="">不限</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {label === "时间" ? `${option} 分钟以内` : option}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button
            className="text-link"
            onClick={() => {
              props.setMaxTime("");
              props.setDifficulty("");
              props.setCuisine("");
              props.setDiet("");
              props.setEquipment("");
            }}
          >
            重置筛选
          </button>
        </div>
      )}
      {props.warning && (
        <p className="notice" role="status">
          {props.warning}
        </p>
      )}
      <div className="result-count">
        找到 {props.resultCount} 道真实菜谱{" "}
        <span>基础调料对匹配度影响较小 · 请核对原始食材清单</span>
      </div>
      {props.resultCount ? (
        props.cards
      ) : (
        <div className="empty">
          <UtensilsCrossed size={36} />
          <h2>换个条件，找点新灵感</h2>
          <p>试着添加更多食材，或放宽筛选条件。</p>
        </div>
      )}
    </>
  );
}
