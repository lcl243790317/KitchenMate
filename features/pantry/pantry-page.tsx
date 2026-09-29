"use client";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import { ingredientById } from "@/lib/ingredients";
import type { PantryItem } from "@/lib/model";
import type { DeviceState } from "@/lib/storage/device";

type Props = {
  pantry: PantryItem[];
  setPantry: Dispatch<SetStateAction<PantryItem[]>>;
  picker: ReactNode;
  onDemo: () => void;
  onExport: () => void;
  onBackupFile: (file: File | undefined) => void;
  backupPreview: DeviceState | null;
  onRestore: () => void;
  onCancelRestore: () => void;
};

export function PantryPageView({
  pantry,
  setPantry,
  picker,
  onDemo,
  onExport,
  onBackupFile,
  backupPreview,
  onRestore,
  onCancelRestore,
}: Props) {
  function update(id: string, changes: Partial<PantryItem>) {
    setPantry((current) =>
      current.map((item) =>
        item.ingredientId === id
          ? { ...item, ...changes, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  }
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">YOUR LITTLE KITCHEN</span>
        <h1>我的厨房</h1>
        <p>食材心里有数，每一餐都从容一点。</p>
      </section>
      <div className="pantry-actions">
        <button onClick={onDemo} className="secondary">
          装入示范食材
        </button>
        <button className="secondary" onClick={() => setPantry([])}>
          清空厨房
        </button>
        <Link href="/discover" className="primary">
          看看我能做什么 <ArrowRight size={16} />
        </Link>
      </div>
      <section className="panel backup-panel">
        <h2>我的厨房数据</h2>
        <p>
          食材、收藏、购物清单和保存的菜谱只在这台设备。换设备时可以导出备份，再在新设备恢复。
        </p>
        <div className="backup-actions">
          <button className="secondary" onClick={onExport}>
            导出我的数据
          </button>
          <label className="secondary backup-file">
            恢复备份
            <input
              aria-label="选择 KitchenMate 备份"
              type="file"
              accept="application/json,.json"
              onChange={(event) => onBackupFile(event.target.files?.[0])}
            />
          </label>
        </div>
        {backupPreview && (
          <div role="status" className="backup-preview">
            <strong>将恢复：</strong> {backupPreview.pantry.length} 个食材 ·{" "}
            {backupPreview.favorites.length} 个收藏 ·{" "}
            {backupPreview.shopping.length} 个购物项 ·{" "}
            {backupPreview.saved.length} 道我的菜谱
            <div>
              <button className="primary" onClick={onRestore}>
                确认恢复
              </button>
              <button className="secondary" onClick={onCancelRestore}>
                取消
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="panel">{picker}</section>
      <section className="stock-list">
        <h2>
          已拥有的食材 <span className="count">{pantry.length}</span>
        </h2>
        {!pantry.length && (
          <div className="empty">厨房还是空的，点选上方食材开始吧。</div>
        )}
        {pantry.map((item) => (
          <div className="stock-row" key={item.ingredientId}>
            <strong>
              {ingredientById.get(item.ingredientId)?.emoji} {item.displayName}
            </strong>
            <label>
              数量
              <input
                aria-label={`${item.displayName}数量`}
                type="number"
                min="0"
                step="0.1"
                placeholder="不限"
                value={item.quantity ?? ""}
                onChange={(event) =>
                  update(item.ingredientId, {
                    quantity:
                      event.target.value === ""
                        ? null
                        : Math.max(0, Number(event.target.value)),
                  })
                }
              />
            </label>
            <label>
              单位
              <input
                aria-label={`${item.displayName}单位`}
                placeholder="个 / g / ml"
                value={item.unit}
                onChange={(event) =>
                  update(item.ingredientId, { unit: event.target.value })
                }
              />
            </label>
            <label>
              保质期
              <input
                type="date"
                value={item.expiryDate ?? ""}
                onChange={(event) =>
                  update(item.ingredientId, {
                    expiryDate: event.target.value || null,
                  })
                }
              />
            </label>
            <label>
              存放位置
              <select
                value={item.storageLocation}
                onChange={(event) =>
                  update(item.ingredientId, {
                    storageLocation: event.target
                      .value as PantryItem["storageLocation"],
                  })
                }
              >
                {["冰箱", "冷冻室", "橱柜", "调料柜"].map((location) => (
                  <option key={location}>{location}</option>
                ))}
              </select>
            </label>
            <button
              className="icon-button"
              aria-label={`删除${item.displayName}`}
              onClick={() =>
                setPantry((current) =>
                  current.filter(
                    (entry) => entry.ingredientId !== item.ingredientId,
                  ),
                )
              }
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
