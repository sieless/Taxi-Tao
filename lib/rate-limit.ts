/**
 * Rate limiting utilities for API routes.
 *
 * Uses Upstash Redis for distributed rate limiting across Vercel serverless instances.
 * Falls back to in-memory rate limiting when Redis is not configured (local dev).
 *
 * SECURITY: Rate limiting is a defense layer, not a security boundary.
 * Always validate and sanitize input regardless of rate limits.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Upstash Redis client (server-side only)
const redis: Redis | null = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Default rate limit configurations
export const RATE_LIMITS = {
  API_DEFAULT: { windowMs: 60 * 1000, maxRequests: 60 },
  API_STRICT: { windowMs: 60 * 1000, maxRequests: 10 },
  API_VERY_STRICT: { windowMs: 60 * 1000, maxRequests: 5 },
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  PASSWORD_RESET: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  PAYMENT_SUBMIT: { windowMs: 60 * 1000, maxRequests: 5 },
  PAYMENT_CONFIRM: { windowMs: 60 * 1000, maxRequests: 10 },
  EMAIL_SEND: { windowMs: 60 * 1000, maxRequests: 5 },
  STAFF_INVITE: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  FILE_UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 },
  GRAPHQL: { windowMs: 60 * 1000, maxRequests: 120 },
} as const;

// Upstash Ratelimit instances (keyed by config to reuse)
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(config: RateLimitConfig): Ratelimit {
  if (!redis) throw new Error("Upstash Redis not configured");
  const key = `${config.windowMs}:${config.maxRequests}`;
  if (!upstashLimiters.has(key)) {
    upstashLimiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
        analytics: true,
        prefix: "ratelimit",
      })
    );
  }
  return upstashLimiters.get(key)!;
}

// --- In-memory fallback (local dev only) ---

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}

function checkInMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupExpiredEntries();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Check if a request is within the rate limit.
 * Uses Upstash Redis when configured, falls back to in-memory.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (redis) {
    const limiter = getUpstashLimiter(config);
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }

  return checkInMemoryRateLimit(key, config);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function createRateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}

export async function checkApiRateLimit(
  request: Request,
  endpoint: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const ip = getClientIp(request);
  const key = createRateLimitKey(ip, endpoint);
  return checkRateLimit(key, config);
}

export function rateLimitResponse(
  result: { remaining: number; resetAt: number }
): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetAt.toString(),
      },
    }
  );
}

/**
 * Simple rate limit middleware for API routes.
 * Usage:
 * ```ts
 * const rateLimit = await rateLimitMiddleware(request, "endpoint-name");
 * if (rateLimit) return rateLimit;
 * ```
 */
export async function rateLimitMiddleware(
  request: Request,
  endpoint: string,
  config?: RateLimitConfig
): Promise<Response | null> {
  const result = await checkApiRateLimit(request, endpoint, config);
  if (!result.allowed) return rateLimitResponse(result);
  return null;
}
