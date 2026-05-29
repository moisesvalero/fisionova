type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __fisionovaRateLimit?: Map<string, RateLimitBucket>;
};

function getStore() {
  globalForRateLimit.__fisionovaRateLimit ??= new Map();

  return globalForRateLimit.__fisionovaRateLimit;
}

export function getClientKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "local";

  return `${scope}:${ip}`;
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const store = getStore();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });

    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;

  return { allowed: true, retryAfter: 0 };
}
