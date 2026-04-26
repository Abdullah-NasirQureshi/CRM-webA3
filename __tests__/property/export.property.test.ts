// **Feature: property-dealer-crm, Property 27: Export contains all filtered lead fields**
// **Validates: Requirements 18.1, 18.2**
import * as fc from "fast-check";
import * as XLSX from "xlsx";
import { exportToExcel, exportToCSV } from "@/lib/export";

const SOURCES = ["Facebook Ads", "Walk-in", "Website", "Other"] as const;
const STATUSES = ["New", "Contacted", "In Progress", "Closed", "Lost"] as const;
const SCORES = ["High", "Medium", "Low"] as const;

const leadArb = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  phone: fc.option(fc.string({ minLength: 7, maxLength: 15 }).filter((s) => /^\d+$/.test(s)), { nil: undefined }),
  propertyInterest: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  budget: fc.integer({ min: 0, max: 100_000_000 }),
  status: fc.constantFrom(...STATUSES),
  score: fc.constantFrom(...SCORES),
  source: fc.constantFrom(...SOURCES),
  assignedTo: fc.constant(null),
  notes: fc.constant(""),
  followUpDate: fc.constant(undefined),
  createdAt: fc.date(),
});

const REQUIRED_COLUMNS = [
  "Name", "Email", "Phone", "Property Interest",
  "Budget", "Status", "Score", "Source", "Assigned To", "Created At",
];

describe("Property 27: Export contains all filtered lead fields", () => {
  it("Excel export contains all required columns for any set of leads", () => {
    fc.assert(
      fc.property(fc.array(leadArb, { minLength: 1, maxLength: 20 }), (leads) => {
        const buffer = exportToExcel(leads as any);
        const wb = XLSX.read(buffer, { type: "buffer" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        expect(rows.length).toBe(leads.length);
        for (const row of rows) {
          for (const col of REQUIRED_COLUMNS) {
            expect(Object.keys(row)).toContain(col);
          }
        }
      }),
      { numRuns: 50 }
    );
  });

  it("CSV export contains all required column headers for any set of leads", () => {
    fc.assert(
      fc.property(fc.array(leadArb, { minLength: 1, maxLength: 20 }), (leads) => {
        const buffer = exportToCSV(leads as any);
        const csv = buffer.toString("utf-8");
        const headerLine = csv.split("\n")[0];

        for (const col of REQUIRED_COLUMNS) {
          expect(headerLine).toContain(col);
        }
      }),
      { numRuns: 50 }
    );
  });

  it("export of empty array returns empty content without throwing", () => {
    expect(() => exportToExcel([])).not.toThrow();
    expect(() => exportToCSV([])).not.toThrow();
  });
});
