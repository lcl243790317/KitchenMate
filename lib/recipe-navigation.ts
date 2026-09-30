export type BrowsePosition = {
  scrollY: number;
  focusedRecipeId: string;
  entryToken: string;
  restoreOnReturn: boolean;
};
export type RecipeOrigin = {
  recipeId: string;
  from: string;
  label: string;
  entryToken: string;
  documentId: string;
};
let documentId: string | undefined;
const originKey = "kitchenmate:recipe-navigation-origin";
const returnKey = "kitchenmate:recipe-return-ticket";
function currentDocument() {
  return (documentId ??= crypto.randomUUID());
}
function read<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browsing still works when storage is unavailable. */
  }
}
export function recordRecipeOrigin(recipeId: string) {
  const from = window.location.pathname;
  const label =
    from === "/recipes"
      ? "返回全部教程"
      : from === "/discover"
        ? "返回发现菜谱"
        : from === "/"
          ? "返回首页"
          : "返回全部教程";
  if (!["/recipes", "/discover", "/"].includes(from)) return;
  const entryToken = history.state?.kitchenmateListEntry ?? crypto.randomUUID();
  history.replaceState(
    {
      ...history.state,
      kitchenmateListEntry: entryToken,
      kitchenmateRecipeOrigin: null,
    },
    "",
  );
  const origin = {
    recipeId,
    from,
    label,
    entryToken,
    documentId: currentDocument(),
  } satisfies RecipeOrigin;
  write(originKey, origin);
  // Arm synchronously: browser Back can occur before the detail client has hydrated.
  write(returnKey, origin);
}
export function claimRecipeOrigin(recipeId: string): RecipeOrigin | null {
  const attached = history.state?.kitchenmateRecipeOrigin as
    RecipeOrigin | undefined;
  if (
    attached?.recipeId === recipeId &&
    ["/recipes", "/discover", "/"].includes(attached.from)
  ) {
    write(returnKey, { ...attached, documentId: currentDocument() });
    return attached;
  }
  const pending = read<RecipeOrigin>(originKey);
  // A fresh document / direct URL must never inherit a stale origin from a prior visit.
  if (
    !pending ||
    pending.recipeId !== recipeId ||
    pending.documentId !== currentDocument()
  )
    return null;
  history.replaceState(
    { ...history.state, kitchenmateRecipeOrigin: pending },
    "",
  );
  write(originKey, null);
  write(returnKey, pending);
  return pending;
}
export function saveBrowseState<T extends object>(
  route: string,
  state: T,
  recipeId: string,
) {
  recordRecipeOrigin(recipeId);
  write(`kitchenmate:${route.slice(1)}-browse-state`, {
    ...state,
    scrollY: window.scrollY,
    focusedRecipeId: recipeId,
    entryToken: history.state.kitchenmateListEntry,
    restoreOnReturn: true,
  });
}
export function takeBrowseState<T extends object>(
  route: string,
): (T & BrowsePosition) | null {
  const key = `kitchenmate:${route.slice(1)}-browse-state`;
  const state = read<T & BrowsePosition>(key);
  const ticket = read<RecipeOrigin>(returnKey);
  if (
    !state?.restoreOnReturn ||
    ticket?.from !== route ||
    (ticket.documentId !== currentDocument() &&
      performance
        .getEntriesByType("navigation")
        .some(
          (entry) => (entry as PerformanceNavigationTiming).type === "reload",
        )) ||
    ticket.entryToken !== state.entryToken ||
    state.entryToken !== history.state?.kitchenmateListEntry
  )
    return null;
  write(key, { ...state, restoreOnReturn: false });
  write(returnKey, null);
  return state;
}
/** Call only after restoring the list state. Wait for a dynamic card list to actually render. */
export function restoreBrowsePosition(
  position: BrowsePosition,
  onRestored?: () => void,
) {
  let cancelled = false;
  let frame = 0;
  let attempts = 0;
  const restore = () => {
    if (cancelled) return;
    const anchor = [
      ...document.querySelectorAll<HTMLElement>("[data-recipe-id]"),
    ].find((node) => node.dataset.recipeId === position.focusedRecipeId);
    if (!anchor && attempts++ < 120) {
      frame = requestAnimationFrame(restore);
      return;
    }
    window.scrollTo({ top: position.scrollY, behavior: "instant" });
    // Layout may have changed (e.g. rotation); keep the previously opened card reachable.
    if (anchor) {
      const bounds = anchor.getBoundingClientRect();
      if (bounds.bottom < 64 || bounds.top > innerHeight)
        anchor.scrollIntoView({ block: "center", behavior: "instant" });
    }
    onRestored?.();
  };
  frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(restore);
  });
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}
export function replaceBrowseQuery(values: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.replaceState(history.state, "", url);
}
