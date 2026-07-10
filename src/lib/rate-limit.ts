const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  Array.from(rateLimitMap.keys()).forEach((k) => {
    if (rateLimitMap.get(k)!.timestamp < windowStart) rateLimitMap.delete(k);
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
