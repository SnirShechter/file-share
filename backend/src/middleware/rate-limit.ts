import type { Context, Next } from 'hono';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '../utils/constants.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limits) {
    if (entry.resetAt < now) {
      limits.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

export async function rateLimit(c: Context, next: Next) {
  const ip = getClientIp(c);
  const now = Date.now();

  let entry = limits.get(ip);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    limits.set(ip, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return c.json(
      { error: 'Too many requests. Please try again later.' },
      429
    );
  }

  await next();
}
