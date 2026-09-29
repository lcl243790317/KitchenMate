const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit = 15) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const b = buckets.get(key) ?? { count: 0, reset: now + 60000 };
  b.count++;
  buckets.set(key, b);
  return b.count <= limit;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
