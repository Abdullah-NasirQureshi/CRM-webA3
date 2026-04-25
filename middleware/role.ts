import { NextRequest, NextResponse } from "next/server";
import { AuthPayload } from "@/services/authService";
import { extractAuth } from "@/middleware/auth";

type Role = "admin" | "agent";

/**
 * Higher-order helper: wraps a handler requiring specific roles.
 * Performs auth + role check in one step.
 */
export function withRole(
  roles: Role[],
  handler: (req: NextRequest, user: AuthPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const result = extractAuth(req);
    if ("error" in result) return result.error;

    const { payload } = result;
    if (!roles.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req, payload);
  };
}

/**
 * Pure role check — use when you already have the payload.
 * Returns a 403 response if role is not allowed, otherwise null.
 */
export function checkRole(
  payload: AuthPayload,
  roles: Role[]
): NextResponse | null {
  if (!roles.includes(payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
