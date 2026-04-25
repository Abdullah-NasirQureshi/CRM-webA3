import { NextRequest, NextResponse } from "next/server";
import { AuthPayload } from "@/services/authService";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory store — works for single-instance deployments
// For multi-instance, replace with Redis
const store = new Map<string, RateLimitEntry>();

const LIMITS: Record<"admin" | "agent", number> = {
  admin: 500,
  agent: 50,
};

const WINDOW_MS = 60 * 1000; // 1 minute

function getRateLimitKey(userId: string, role: string): string {
  return `${role}:${userId}`;
}

/**
 * Checks rate limit for the given user.
 * Returns null if within limit, or a 429 NextResponse if exceeded.
 */
export function checkRateLimit(
  user: AuthPayload
): NextResponse | null {
  const key = getRateLimitKey(user.userId, user.role);
  const limit = LIMITS[user.role];
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // Start new window
    store.set(key, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  entry.count += 1;
  return null;
}

/**
 * Higher-order helper: wraps a handler with auth + rate limit check.
 */
export function withRateLimit(
  handler: (req: NextRequest, user: AuthPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest, user: AuthPayload): Promise<NextResponse> => {
    const limited = checkRateLimit(user);
    if (limited) return limited;
    return handler(req, user);
  };
}
