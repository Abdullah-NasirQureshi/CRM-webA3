import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRateLimit } from "@/middleware/rateLimit";
import { getFollowUpAlerts } from "@/services/followUpService";

export async function GET(req: NextRequest) {
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  try {
    const alerts = await getFollowUpAlerts(auth.payload.userId);
    return NextResponse.json(alerts);
  } catch (err) {
    console.error("[GET /api/leads/follow-up-alerts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
