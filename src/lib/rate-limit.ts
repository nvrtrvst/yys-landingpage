const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  Array.from(rateLimitMap.keys()).forEach((k) => {
    const entry = rateLimitMap.get(k);
    if (entry && entry.timestamp < windowStart) rateLimitMap.delete(k);
  });

  const entry = rateLimitMap.get(key);
  if (!entry || entry.timestamp < windowStart) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export function getClientIpFromHeaders(headers: Headers | Record<string, string | string[]> | undefined): string {
  if (!headers) return "unknown";
  
  const get = (key: string): string | undefined => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(key) || undefined;
    }
    const v = (headers as Record<string, string | string[]>)[key];
    return Array.isArray(v) ? v[0] : v;
  };
  
  const xff = get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return get("x-real-ip") || "unknown";
}

export function getClientIp(req: Request): string {
  return getClientIpFromHeaders(req.headers);
}
