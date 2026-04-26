import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRole } from "@/middleware/role";
import { checkRateLimit } from "@/middleware/rateLimit";
import { getAnalytics } from "@/services/analyticsService";

export async function GET(req: NextRequest) {
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const roleCheck = checkRole(auth.payload, ["admin"]);
  if (roleCheck) return roleCheck;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  try {
    const analytics = await getAnalytics();
    return NextResponse.json({ analytics });
  } catch (err) {
    console.error("[GET /api/analytics]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
