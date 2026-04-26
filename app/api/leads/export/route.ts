import { NextRequest, NextResponse } from "next/server";
import { extractAuth } from "@/middleware/auth";
import { checkRole } from "@/middleware/role";
import { checkRateLimit } from "@/middleware/rateLimit";
import { getLeads } from "@/services/leadService";
import { exportToExcel, exportToCSV } from "@/lib/export";

export async function GET(req: NextRequest) {
  const auth = extractAuth(req);
  if ("error" in auth) return auth.error;

  const roleCheck = checkRole(auth.payload, ["admin"]);
  if (roleCheck) return roleCheck;

  const limited = checkRateLimit(auth.payload);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "excel";

  try {
    const leads = await getLeads(auth.payload.userId, "admin", {});

    if (format === "csv") {
      const buffer = exportToCSV(leads);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="leads_${Date.now()}.csv"`,
        },
      });
    }

    const buffer = exportToExcel(leads);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="leads_${Date.now()}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/leads/export]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
