import { lookup } from "node:dns/promises";
import https from "node:https";
import ipaddr from "ipaddr.js";
export function isPublicAddress(address: string) {
  try {
    const ip = ipaddr.process(address);
    return ip.range() === "unicast";
  } catch {
    return false;
  }
}
export function validateImportUrl(raw: string) {
  const u = new URL(raw);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443") ||
    u.hostname === "localhost" ||
    u.hostname.endsWith(".localhost") ||
    u.hostname.endsWith(".local")
  )
    throw new Error("仅支持公开 HTTPS 菜谱网址");
  u.hash = "";
  return u;
}
export async function safeFetchHtml(
  raw: string,
  redirects = 0,
): Promise<{ html: string; url: string }> {
  if (redirects > 3) throw new Error("重定向次数过多");
  const url = validateImportUrl(raw);
  let dnsDeadline: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(url.hostname.replace(/^\[|\]$/g, ""), { all: true }),
    new Promise<never>((_, reject) => {
      dnsDeadline = setTimeout(() => reject(new Error("DNS 解析超时")), 5000);
    }),
  ]).finally(() => clearTimeout(dnsDeadline));
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error("不允许访问内部网络地址");
  const chosen = addresses[0];
  const result = await new Promise<{ html: string; redirect?: string }>(
    (resolve, reject) => {
      const req = https.get(
        url,
        {
          family: chosen.family,
          lookup: ((
            _host: unknown,
            _opts: unknown,
            cb: (e: Error | null, address: string, family: number) => void,
          ) => cb(null, chosen.address, chosen.family)) as never,
          headers: {
            "User-Agent": "KitchenMate/1.0 Recipe Import",
            Accept: "text/html",
          },
          timeout: 8000,
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            res.resume();
            resolve({
              html: "",
              redirect: new URL(res.headers.location, url).href,
            });
            return;
          }
          if (
            res.statusCode !== 200 ||
            !res.headers["content-type"]?.includes("text/html")
          ) {
            res.destroy();
            reject(new Error("页面不是可读取的 HTML"));
            return;
          }
          const chunks: Buffer[] = [];
          let size = 0;
          res.on("data", (c: Buffer) => {
            size += c.length;
            if (size > 2_000_000) {
              res.destroy();
              reject(new Error("页面超过 2MB 限制"));
            } else chunks.push(c);
          });
          res.on("error", reject);
          res.on("end", () =>
            resolve({ html: Buffer.concat(chunks).toString("utf8") }),
          );
        },
      );
      const deadline = setTimeout(
        () => req.destroy(new Error("导入超时")),
        10000,
      );
      req.on("close", () => clearTimeout(deadline));
      req.on("timeout", () => req.destroy(new Error("导入超时")));
      req.on("error", reject);
    },
  );
  return result.redirect
    ? safeFetchHtml(result.redirect, redirects + 1)
    : { html: result.html, url: url.href };
}
