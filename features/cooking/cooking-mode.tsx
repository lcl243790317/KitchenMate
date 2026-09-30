"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChefHat, Timer, X } from "lucide-react";
import type { Recipe } from "@/lib/model";
import { loadCookingSnapshot, saveCookingSnapshot } from "@/lib/storage/device";
import { canCookRecipe } from "@/lib/recipe-trust";
import {
  localizedInstructions,
  recipeTranslation,
  type RecipeLanguage,
} from "@/lib/recipe-localization";
import { RecipeLanguageToggle } from "@/features/recipes/recipe-language-toggle";
export function CookingMode({
  recipe,
  onExit,
}: {
  recipe: Recipe;
  onExit: () => void;
}) {
  const [step, setStep] = useState(0);
  const [timers, setTimers] = useState<
    { id: number; title: string; end: number }[]
  >([]);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const [wake, setWake] = useState(false);
  const [restored, setRestored] = useState(false);
  const translation = recipeTranslation(recipe);
  const [language, setLanguage] = useState<RecipeLanguage>(
    translation ? "zh" : "en",
  );
  const instruction = localizedInstructions(recipe, language)[step];
  useEffect(() => {
    let active = true;
    loadCookingSnapshot(recipe.id)
      .then((snapshot) => {
        if (!active) return;
        if (snapshot && !snapshot.done) {
          setStep(Math.min(snapshot.step, recipe.instructions.length - 1));
          setTimers(snapshot.timers);
        }
        setRestored(true);
      })
      .catch(() => setRestored(true));
    return () => {
      active = false;
    };
  }, [recipe.id, recipe.instructions.length]);
  useEffect(() => {
    if (restored)
      saveCookingSnapshot({ recipe, step, timers, done }).catch(() => {});
  }, [recipe, step, timers, done, restored]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    let disposed = false;
    async function acquire() {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          const acquired = await navigator.wakeLock.request("screen");
          if (disposed) {
            await acquired.release();
            return;
          }
          lock = acquired;
          setWake(true);
          lock.addEventListener("release", () => setWake(false));
        }
      } catch {
        setWake(false);
      }
    }
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      void lock?.release();
      document.removeEventListener("visibilitychange", acquire);
    };
  }, []);
  if (!canCookRecipe(recipe))
    return (
      <main>
        <p>此菜谱没有可验证的完整步骤。</p>
        <button onClick={onExit}>返回菜谱</button>
      </main>
    );
  if (done)
    return (
      <div className="cooking-complete">
        <span>🍽️</span>
        <p className="eyebrow">MADE WITH LOVE</p>
        <h1>做好了，趁热吃吧！</h1>
        <p>今天的 {recipe.title}，是属于你的好味道。</p>
        <button className="primary" onClick={onExit}>
          完成，返回菜谱 <Check size={18} />
        </button>
      </div>
    );
  return (
    <div className="cooking">
      <header>
        <button className="secondary" onClick={onExit}>
          <X size={18} /> 退出做菜
        </button>
        <span>{recipe.title}</span>
        <small>{wake ? "屏幕常亮已开启" : "烹饪模式"}</small>
      </header>
      <div className="cooking-progress">
        <i
          style={{
            width: `${((step + 1) / recipe.instructions.length) * 100}%`,
          }}
        />
      </div>
      <main>
        <a
          className="text-link"
          href={recipe.sourceUrl!}
          target="_blank"
          rel="noopener noreferrer"
        >
          来源：{recipe.sourceName} · 查看原始菜谱
        </a>
        <p className="eyebrow">
          STEP {String(step + 1).padStart(2, "0")} /{" "}
          {String(recipe.instructions.length).padStart(2, "0")}
        </p>
        {translation && (
          <RecipeLanguageToggle language={language} onChange={setLanguage} />
        )}
        <h1>{instruction.title}</h1>
        <p className="cooking-description">{instruction.description}</p>
        {instruction.tips && (
          <div className="cooking-tip">
            <ChefHat size={20} />
            {instruction.tips}
          </div>
        )}
        {instruction.durationSeconds !== null &&
          instruction.durationSeconds > 0 && (
            <button
              className="timer-start"
              onClick={() =>
                setTimers((prev) => [
                  ...prev,
                  {
                    id: Date.now(),
                    title: instruction.title,
                    end: Date.now() + instruction.durationSeconds! * 1000,
                  },
                ])
              }
            >
              <Timer /> 开始计时{" "}
              {String(Math.floor(instruction.durationSeconds / 60)).padStart(
                2,
                "0",
              )}
              :{String(instruction.durationSeconds % 60).padStart(2, "0")}
            </button>
          )}
        <div className="timer-list" aria-live="polite">
          {timers.map((t) => {
            const remaining = Math.max(0, Math.ceil((t.end - now) / 1000));
            return (
              <div className={remaining === 0 ? "finished" : ""} key={t.id}>
                <Timer size={18} />
                <span>{t.title}</span>
                <b>
                  {remaining === 0
                    ? "时间到！"
                    : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
                </b>
                <button
                  aria-label={`取消${t.title}计时器`}
                  onClick={() =>
                    setTimers((prev) => prev.filter((x) => x.id !== t.id))
                  }
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </main>
      <div className="cooking-controls">
        <button
          className="secondary"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ArrowLeft /> 上一步
        </button>
        <span>
          {step + 1} / {recipe.instructions.length}
        </span>
        <button
          className="primary"
          onClick={() =>
            step === recipe.instructions.length - 1
              ? setDone(true)
              : setStep((s) => s + 1)
          }
        >
          {step === recipe.instructions.length - 1 ? "完成这道菜" : "下一步"}{" "}
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
