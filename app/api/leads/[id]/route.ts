import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRole } from "@/middleware/role";
import { checkRateLimit } from "@/middleware/rateLimit";
import { validateBody } from "@/middleware/validate";
import { updateLeadSchema } from "@/lib/schemas";
import {
  getLeadById,
  updateLead,
  deleteLead,
  LeadNotFoundError,
  LeadForbiddenError,
} from "@/services/leadService";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  try {
    const lead = await getLeadById(id, auth.payload.userId, auth.payload.role);
    return NextResponse.json({ lead });
  } catch (err: any) {
    if (err instanceof LeadNotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err instanceof LeadForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  const bodyResult = await validateBody(req, updateLeadSchema);
  if ("error" in bodyResult) return bodyResult.error;

  try {
    const lead = await updateLead(id, bodyResult.data, auth.payload.userId, auth.payload.role);
    return NextResponse.json({ lead });
  } catch (err: any) {
    if (err instanceof LeadNotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err instanceof LeadForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  // Only admins can delete
  const roleCheck = checkRole(auth.payload, ["admin"]);
  if (roleCheck) return roleCheck;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  try {
    await deleteLead(id);
    return NextResponse.json({ message: "Lead deleted" });
  } catch (err: any) {
    if (err instanceof LeadNotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
