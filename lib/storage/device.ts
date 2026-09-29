import { z } from "zod";
import { pantryItemSchema, recipeSchema, shoppingItemSchema } from "@/lib/model";

export const deviceStateSchema = z.object({
  pantry: z.array(pantryItemSchema),
  shopping: z.array(shoppingItemSchema),
  saved: z.array(recipeSchema),
  favorites: z.array(z.string()),
  dark: z.boolean(),
});
export type DeviceState = z.infer<typeof deviceStateSchema>;
export const backupSchema = z.object({
  format: z.literal("kitchenmate-backup"),
  version: z.literal(2),
  exportedAt: z.string().datetime(),
  data: deviceStateSchema,
});
export function parseLegacyState(raw: string | null): DeviceState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return deviceStateSchema.parse({
      pantry: parsed.pantry ?? [], shopping: parsed.shopping ?? [],
      saved: parsed.saved ?? [], favorites: parsed.favorites ?? [], dark: Boolean(parsed.dark),
    });
  } catch { return null; }
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("kitchenmate", 3);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("state")) request.result.createObjectStore("state");
      if (!request.result.objectStoreNames.contains("cooking")) request.result.createObjectStore("cooking");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readIndexed(): Promise<DeviceState | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction("state", "readonly").objectStore("state").get("current");
      request.onsuccess = () => {
        try { resolve(request.result ? deviceStateSchema.parse(request.result) : null); }
        catch (error) { reject(error); }
      };
      request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}
async function writeIndexed(state: DeviceState) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("state", "readwrite");
      transaction.objectStore("state").put(state, "current");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { database.close(); }
}
export async function loadDeviceState(): Promise<DeviceState | null> {
  if (memoryState) return memoryState;
  const journal = parseLegacyState(localStorage.getItem("kitchenmate-pending"));
  if (journal) { memoryState = journal; return journal; }
  try {
    const indexed = await readIndexed();
    if (indexed) { memoryState = indexed; return indexed; }
  } catch { /* fall back to local storage */ }
  const fallback = parseLegacyState(localStorage.getItem("kitchenmate-v2")) ??
    parseLegacyState(localStorage.getItem("kitchenmate-v1"));
  if (fallback) {
    memoryState = fallback;
    try { await writeIndexed(fallback); } catch { /* keep the original record untouched */ }
  }
  return fallback;
}
export async function saveDeviceState(input: DeviceState): Promise<void> {
  const state = deviceStateSchema.parse(input);
  memoryState = state;
  const serialized = JSON.stringify(state);
  localStorage.setItem("kitchenmate-pending", serialized);
  pendingWrite = pendingWrite.catch(() => {}).then(async () => {
    try { await writeIndexed(state); }
    catch { localStorage.setItem("kitchenmate-v2", JSON.stringify(state)); }
    if (localStorage.getItem("kitchenmate-pending") === serialized) localStorage.removeItem("kitchenmate-pending");
    localStorage.setItem("kitchenmate-theme", state.dark ? "dark" : "light");
  });
  return pendingWrite;
}
let pendingWrite: Promise<void> = Promise.resolve();
let memoryState: DeviceState | null = null;
const cookingSnapshotSchema = z.object({ recipe: recipeSchema, step: z.number().int().nonnegative(), timers: z.array(z.object({ id: z.number(), title: z.string(), end: z.number() })), done: z.boolean() });
export type CookingSnapshot = z.infer<typeof cookingSnapshotSchema>;
export async function saveCookingSnapshot(snapshot: CookingSnapshot) {
  const parsed = cookingSnapshotSchema.parse(snapshot);
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("cooking", "readwrite");
      tx.objectStore("cooking").put(parsed, parsed.recipe.id);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
  } finally { database.close(); }
}
export async function loadCookingSnapshot(id: string): Promise<CookingSnapshot | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const req = database.transaction("cooking", "readonly").objectStore("cooking").get(id);
      req.onsuccess = () => {
        try { resolve(req.result ? cookingSnapshotSchema.parse(req.result) : null); }
        catch (error) { reject(error); }
      };
      req.onerror = () => reject(req.error);
    });
  } finally { database.close(); }
}
export function createBackup(data: DeviceState) {
  return backupSchema.parse({ format: "kitchenmate-backup", version: 2, exportedAt: new Date().toISOString(), data });
}
export function parseBackup(raw: string) {
  return backupSchema.parse(JSON.parse(raw));
}
