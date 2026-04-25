import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRole } from "@/middleware/role";
import { checkRateLimit } from "@/middleware/rateLimit";
import { validateBody } from "@/middleware/validate";
import { assignLeadSchema } from "@/lib/schemas";
import { assignLead, reassignLead, AssignmentError } from "@/services/assignmentService";
import Lead from "@/models/Lead";
import { connectDB } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  // Admin only
  const roleCheck = checkRole(auth.payload, ["admin"]);
  if (roleCheck) return roleCheck;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  const bodyResult = await validateBody(req, assignLeadSchema);
  if ("error" in bodyResult) return bodyResult.error;

  try {
    await connectDB();
    const existing = await Lead.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found", resource: "lead" }, { status: 404 });
    }

    let lead;
    if (existing.assignedTo) {
      // Already assigned — reassign
      lead = await reassignLead(id, bodyResult.data.agentId, auth.payload.userId);
    } else {
      lead = await assignLead(id, bodyResult.data.agentId, auth.payload.userId);
    }

    return NextResponse.json({ lead });
  } catch (err: any) {
    if (err instanceof AssignmentError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[POST /api/leads/[id]/assign]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
