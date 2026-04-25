import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRole } from "@/middleware/role";
import { checkRateLimit } from "@/middleware/rateLimit";
import { validateBody, validateParams } from "@/middleware/validate";
import { createLeadSchema, filterLeadsSchema } from "@/lib/schemas";
import { createLead, getLeads, LeadFilters } from "@/services/leadService";
import { LeadStatus, LeadScore, LeadSource } from "@/models/Lead";

export async function GET(req: NextRequest) {
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  // Parse query params
  const { searchParams } = new URL(req.url);
  const rawParams = {
    status: searchParams.get("status") ?? undefined,
    score: searchParams.get("score") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  };

  const paramResult = validateParams(rawParams, filterLeadsSchema);
  if ("error" in paramResult) return paramResult.error;

  const leads = await getLeads(
    auth.payload.userId,
    auth.payload.role,
    paramResult.data as LeadFilters
  );

  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  const bodyResult = await validateBody(req, createLeadSchema);
  if ("error" in bodyResult) return bodyResult.error;

  try {
    const lead = await createLead(bodyResult.data, auth.payload.userId);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
