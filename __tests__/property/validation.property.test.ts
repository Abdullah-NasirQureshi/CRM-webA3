// **Feature: property-dealer-crm, Property 12: Validation middleware rejects incomplete bodies**
// **Feature: property-dealer-crm, Property 26: Validation middleware rejects invalid params**
import * as fc from "fast-check";
import { NextRequest } from "next/server";
import { validateBody, validateParams } from "@/middleware/validate";
import { createLeadSchema, filterLeadsSchema } from "@/lib/schemas";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Property 12: Validation middleware rejects incomplete bodies", () => {
  // **Validates: Requirements 5.6, 16.1**

  it("rejects any lead body missing required fields with 400", async () => {
    // Required fields: name, email, propertyInterest, budget, source
    const requiredFields = ["name", "email", "propertyInterest", "budget", "source"];

    await fc.assert(
      fc.asyncProperty(
        fc.subarray(requiredFields, { minLength: 1 }),
        async (fieldsToOmit) => {
          const fullBody = {
            name: "Test",
            email: "test@example.com",
            propertyInterest: "Villa",
            budget: 5_000_000,
            source: "Walk-in",
          };
          const incomplete: Record<string, unknown> = { ...fullBody };
          fieldsToOmit.forEach((f) => delete incomplete[f]);

          const req = makeRequest(incomplete);
          const result = await validateBody(req, createLeadSchema);
          expect("error" in result).toBe(true);
          if ("error" in result) {
            expect(result.error.status).toBe(400);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it("accepts a fully valid lead body", async () => {
    const req = makeRequest({
      name: "Ali Khan",
      email: "ali@example.com",
      propertyInterest: "Apartment",
      budget: 15_000_000,
      source: "Website",
    });
    const result = await validateBody(req, createLeadSchema);
    expect("data" in result).toBe(true);
  });
});

describe("Property 26: Validation middleware rejects invalid params", () => {
  // **Validates: Requirements 16.2**

  it("rejects invalid status enum values with 400", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !["New", "Contacted", "In Progress", "Closed", "Lost"].includes(s)),
        (invalidStatus) => {
          const result = validateParams({ status: invalidStatus }, filterLeadsSchema);
          expect("error" in result).toBe(true);
          if ("error" in result) {
            expect(result.error.status).toBe(400);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts valid filter params", () => {
    const result = validateParams({ status: "New", score: "High" }, filterLeadsSchema);
    expect("data" in result).toBe(true);
  });
});
