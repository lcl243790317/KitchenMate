"use client";
import type { ReactNode } from "react";
import {
  Heart,
  Search,
  SlidersHorizontal,
  Sparkles,
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
  allergen: string;
  setAllergen: TextSetter;
  equipment: string;
  setEquipment: TextSetter;
  warning: string;
  resultCount: number;
  cards: ReactNode;
  aiEnabled: boolean;
  constraints: string;
  setConstraints: TextSetter;
  onGenerateAI: () => void;
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
      "排除过敏原",
      props.allergen,
      props.setAllergen,
      ["花生", "坚果", "牛奶", "鸡蛋", "海鲜", "麸质"],
    ],
    [
      "厨具",
      props.equipment,
      props.setEquipment,
      ["炒锅", "烤箱", "空气炸锅", "电饭煲", "高压锅", "微波炉"],
    ],
  ];
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">COOK SOMETHING GOOD</span>
        <h1>厨房里的无限可能</h1>
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
        {["最匹配", "我现在就能做", "只差一点", "消耗库存", "快手菜"].map(
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
        {["全部", "KitchenMate", "在线菜谱", "我的菜谱"].map((source) => (
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
      {props.filtersOpen && (
        <div className="filter-panel">
          {filterOptions.map(([label, value, set, options]) => (
            <label key={label}>
              {label}
              <select
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
              props.setAllergen("");
              props.setEquipment("");
            }}
          >
            重置筛选
          </button>
          {props.allergen && (
            <small>
              过敏原筛选仅显示已标注的本地菜谱；请同时核对包装及交叉污染风险。
            </small>
          )}
        </div>
      )}
      {props.warning && (
        <p className="notice" role="status">
          {props.warning}
        </p>
      )}
      <div className="result-count">
        找到 {props.resultCount} 道灵感{" "}
        <span>基础调料对匹配度影响较小 · 已填写库存数量时会提示不足</span>
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
      {props.aiEnabled && (
        <section className="ai-panel">
          <Sparkles />
          <div>
            <h3>还有一点想法？让 AI 帮你想一道菜。</h3>
            <p>根据现有食材和你的偏好，生成 3 个候选方案。</p>
            <input
              aria-label="AI 烹饪要求"
              value={props.constraints}
              onChange={(event) => props.setConstraints(event.target.value)}
              maxLength={500}
            />
          </div>
          <button
            className="primary"
            disabled={props.loading}
            onClick={props.onGenerateAI}
          >
            {props.loading ? "正在准备…" : "AI 帮我想一道菜"}
          </button>
        </section>
      )}
    </>
  );
}
