import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRateLimit } from "@/middleware/rateLimit";
import { getTimeline } from "@/services/activityLogService";
import { getLeadById, LeadNotFoundError, LeadForbiddenError } from "@/services/leadService";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  try {
    // Verify the requesting user has access to this lead
    await getLeadById(id, auth.payload.userId, auth.payload.role);

    const timeline = await getTimeline(id);
    return NextResponse.json({ timeline });
  } catch (err: any) {
    if (err instanceof LeadNotFoundError)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err instanceof LeadForbiddenError)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[GET /api/leads/[id]/timeline]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
