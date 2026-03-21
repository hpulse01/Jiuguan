/**
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, replace with Redis-based solution.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig = { limit: 60, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetTime });
    return { success: true, limit: config.limit, remaining: config.limit - 1, resetTime };
  }

  entry.count++;

  if (entry.count > config.limit) {
    return { success: false, limit: config.limit, remaining: 0, resetTime: entry.resetTime };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
        "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
      },
    }
  );
}
