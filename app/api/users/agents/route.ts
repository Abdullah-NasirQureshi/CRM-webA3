import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRole } from "@/middleware/role";
import { checkRateLimit } from "@/middleware/rateLimit";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const roleCheck = checkRole(auth.payload, ["admin"]);
  if (roleCheck) return roleCheck;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  await connectDB();
  const agents = await User.find({ role: "agent" }).select("_id name email");
  return NextResponse.json({ agents });
}
