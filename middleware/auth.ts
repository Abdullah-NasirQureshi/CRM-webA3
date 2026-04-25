import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AuthPayload } from "@/services/authService";

export type AuthedRequest = NextRequest & { user: AuthPayload };

/**
 * Extracts and verifies JWT from Authorization header.
 * Returns decoded payload or a NextResponse error.
 */
export function extractAuth(
  req: NextRequest
): { payload: AuthPayload } | { error: NextResponse } {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    return { payload };
  } catch (err: any) {
    const message =
      err.message === "Token expired" ? "Token expired" : "Unauthorized";
    const status = 401;
    return {
      error: NextResponse.json({ error: message }, { status }),
    };
  }
}

/**
 * Higher-order helper: wraps an API route handler with auth enforcement.
 * Injects decoded user payload as second argument.
 */
export function withAuth(
  handler: (req: NextRequest, user: AuthPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const result = extractAuth(req);
    if ("error" in result) return result.error;
    return handler(req, result.payload);
  };
}
