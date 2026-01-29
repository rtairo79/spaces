import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const defaultConfig: RateLimitConfig = {
  limit: 100, // 100 requests
  windowMs: 60000, // per minute
};

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const { limit, windowMs } = { ...defaultConfig, ...config };

  return function checkRateLimit(request: NextRequest): NextResponse | null {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();

    const entry = rateLimitMap.get(key);

    if (!entry || entry.resetTime < now) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null;
    }

    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          }
        }
      );
    }

    entry.count++;
    return null;
  };
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = rateLimit({ limit: 100, windowMs: 60000 });
export const authRateLimiter = rateLimit({ limit: 10, windowMs: 60000 });
export const createRateLimiter = rateLimit({ limit: 20, windowMs: 60000 });
