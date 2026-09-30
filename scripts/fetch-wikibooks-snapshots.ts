import fs from "node:fs";
import candidates from "../data/recipe-candidates/wikibooks.json";
async function main() {
  const pages: unknown[] = [];
  const reviewed = candidates.filter((c) => c.revisionId);
  for (let offset = 0; offset < reviewed.length; offset += 40) {
    const batch = reviewed.slice(offset, offset + 40);
    const url = new URL("https://en.wikibooks.org/w/api.php");
    url.search = new URLSearchParams({
      action: "query",
      prop: "revisions",
      revids: batch.map((c) => String(c.revisionId)).join("|"),
      rvprop: "ids|timestamp|content",
      rvslots: "main",
      format: "json",
      formatversion: "2",
      maxlag: "5",
    }).toString();
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "KitchenMate/3.1.3 (https://github.com/lcl243790317/KitchenMate; reviewed pinned recipe snapshots)",
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(
        `MediaWiki HTTP ${response.status}; respect Retry-After ${response.headers.get("retry-after")}; no automatic bypass/retry`,
      );
    const result = await response.json();
    if (result.error || !result.query?.pages)
      throw new Error(`MediaWiki API error: ${JSON.stringify(result.error)}`);
    pages.push(
      ...result.query.pages.map((page: object) => ({
        ...page,
        httpStatus: response.status,
        retrievedAt: new Date().toISOString(),
      })),
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  fs.mkdirSync(".cache/phase313", { recursive: true });
  fs.writeFileSync(
    ".cache/phase313/wiki-reviewed.json",
    JSON.stringify(pages, null, 2),
  );
  console.log(
    `Fetched ${pages.length} reviewed exact revisions from the official MediaWiki API. Run recipes:rebuild-wikibooks -- --research after reviewing changes; never refresh production automatically.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
