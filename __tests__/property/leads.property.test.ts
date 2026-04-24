// **Feature: property-dealer-crm, Property 8: Lead serialization round-trip**
import * as fc from "fast-check";
import mongoose from "mongoose";
import Lead, { LeadSource, LeadStatus } from "@/models/Lead";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup/dbHelper";

const SOURCES: LeadSource[] = ["Facebook Ads", "Walk-in", "Website", "Other"];
const STATUSES: LeadStatus[] = ["New", "Contacted", "In Progress", "Closed", "Lost"];

const leadArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  phone: fc.option(fc.string({ minLength: 7, maxLength: 15 }).filter((s) => /^\d+$/.test(s)), { nil: undefined }),
  propertyInterest: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  budget: fc.integer({ min: 0, max: 100_000_000 }),
  status: fc.constantFrom(...STATUSES),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  source: fc.constantFrom(...SOURCES),
});

describe("Property 8: Lead serialization round-trip", () => {
  // **Validates: Requirements 4.1, 4.2**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("serializing a lead to MongoDB and reading it back produces an equivalent object", async () => {
    await fc.assert(
      fc.asyncProperty(leadArb, async (data) => {
        const created = await Lead.create(data);
        const fetched = await Lead.findById(created._id).lean();

        expect(fetched).not.toBeNull();
        expect(fetched!.name).toBe(data.name.trim());
        expect(fetched!.email).toBe(data.email.toLowerCase());
        expect(fetched!.propertyInterest).toBe(data.propertyInterest.trim());
        expect(fetched!.budget).toBe(data.budget);
        expect(fetched!.status).toBe(data.status);
        expect(fetched!.source).toBe(data.source);
        expect(fetched!.score).toBeDefined();
        expect(fetched!.createdAt).toBeInstanceOf(Date);

        await Lead.deleteOne({ _id: created._id });
      }),
      { numRuns: 50 }
    );
  });
});
