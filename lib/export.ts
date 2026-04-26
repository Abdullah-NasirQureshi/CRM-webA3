import * as XLSX from "xlsx";
import { ILead } from "@/models/Lead";

export interface ExportRow {
  Name: string;
  Email: string;
  Phone: string;
  "Property Interest": string;
  Budget: number;
  Status: string;
  Score: string;
  Source: string;
  "Assigned To": string;
  "Created At": string;
}

function leadsToRows(leads: ILead[]): ExportRow[] {
  return leads.map((l) => ({
    Name: l.name,
    Email: l.email,
    Phone: l.phone ?? "",
    "Property Interest": l.propertyInterest,
    Budget: l.budget,
    Status: l.status,
    Score: l.score,
    Source: l.source,
    "Assigned To": (l.assignedTo as any)?.name ?? l.assignedTo?.toString() ?? "",
    "Created At": new Date(l.createdAt).toISOString(),
  }));
}

/**
 * Generates an Excel (.xlsx) buffer from a list of leads.
 * Req 18.1, 18.2
 */
export function exportToExcel(leads: ILead[]): Buffer {
  const rows = leadsToRows(leads);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/**
 * Generates a simple CSV buffer (used as PDF fallback via text/csv).
 * For a real PDF, jspdf-autotable would be used server-side.
 * Req 18.1, 18.2
 */
export function exportToCSV(leads: ILead[]): Buffer {
  const rows = leadsToRows(leads);
  if (!rows.length) return Buffer.from("");
  const headers = Object.keys(rows[0]).join(",");
  const lines = rows.map((r) =>
    Object.values(r)
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return Buffer.from([headers, ...lines].join("\n"), "utf-8");
}
