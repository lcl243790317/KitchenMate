const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit = 15, windowMs = 60000) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const b = buckets.get(key) ?? { count: 0, reset: now + windowMs };
  b.count++;
  buckets.set(key, b);
  return b.count <= limit;
}
export function clientKey(request: Request) {
  // Railway sets X-Real-IP at its edge. Ignore user-supplied forwarding chains.
  const trusted = process.env.RAILWAY_ENVIRONMENT ? request.headers.get("x-real-ip") : null;
  if (trusted && /^[0-9a-f:.]{3,45}$/i.test(trusted)) return trusted;
  // Unknown proxy topology: share a conservative budget instead of trusting spoofable headers.
  return "unknown";
}
export function rateLimitRequest(request: Request, endpoint: string, limit: number, windowMs = 60000) {
  return rateLimit(`${endpoint}:${clientKey(request)}`, limit, windowMs);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
