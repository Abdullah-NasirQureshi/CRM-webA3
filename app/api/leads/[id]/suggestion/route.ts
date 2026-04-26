import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRateLimit } from "@/middleware/rateLimit";
import { getLeadById } from "@/services/leadService";
import { getTimeline } from "@/services/activityLogService";
import { getFollowUpSuggestion } from "@/lib/aiSuggestion";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  try {
    const lead = await getLeadById(id, auth.payload.userId, auth.payload.role);
    const timeline = await getTimeline(id);
    const suggestion = await getFollowUpSuggestion(lead, timeline);
    return NextResponse.json({ suggestion });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
