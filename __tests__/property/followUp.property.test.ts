// **Feature: property-dealer-crm, Property 22: Follow-up date round-trip**
// **Feature: property-dealer-crm, Property 23: Overdue detection correctness**
// **Feature: property-dealer-crm, Property 24: Stale detection correctness**
import * as fc from "fast-check";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { createLead } from "@/services/leadService";
import { setFollowUpDate, isOverdue, isStale } from "@/services/followUpService";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup/dbHelper";

async function makeUser() {
  return User.create({
    name: "Agent",
    email: `agent_${Date.now()}_${Math.random()}@t.com`,
    passwordHash: "hash",
    role: "agent",
  });
}

async function makeLead(userId: string) {
  return createLead(
    { name: "L", email: `l_${Date.now()}@t.com`, propertyInterest: "P", budget: 5_000_000, source: "Walk-in" },
    userId
  );
}

describe("Property 22: Follow-up date round-trip", () => {
  // **Validates: Requirements 13.1**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("after setting followUpDate, reading the lead back returns the same date", async () => {
    const user = await makeUser();
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date("2025-01-01"), max: new Date("2030-12-31") }),
        async (date) => {
          const lead = await makeLead(user._id.toString());
          await setFollowUpDate(lead._id.toString(), date, user._id.toString());

          const fetched = await Lead.findById(lead._id);
          expect(fetched!.followUpDate).toBeDefined();
          expect(fetched!.followUpDate!.getTime()).toBe(
            new Date(date.toISOString().split(".")[0] + "Z").getTime() ||
            date.getTime()
          );
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe("Property 23: Overdue detection correctness", () => {
  // **Validates: Requirements 13.2**

  it("isOverdue returns true when followUpDate is past and no followup_completed log", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysAgo) => {
          const now = new Date();
          const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          const lead = { followUpDate: pastDate };
          const logs: any[] = [{ action: "created" }, { action: "status_updated" }];

          expect(isOverdue(lead, logs, now)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("isOverdue returns false when followup_completed log exists", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysAgo) => {
          const now = new Date();
          const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          const lead = { followUpDate: pastDate };
          const logs: any[] = [{ action: "followup_completed" }];

          expect(isOverdue(lead, logs, now)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("isOverdue returns false when followUpDate is in the future", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysAhead) => {
          const now = new Date();
          const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
          const lead = { followUpDate: futureDate };
          const logs: any[] = [];

          expect(isOverdue(lead, logs, now)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 24: Stale detection correctness", () => {
  // **Validates: Requirements 13.3**

  it("isStale returns true when most recent log is more than 7 days ago", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 8, max: 365 }),
        (daysAgo) => {
          const now = new Date();
          const oldTimestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          const logs: any[] = [{ timestamp: oldTimestamp }];

          expect(isStale(logs, now)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("isStale returns false when most recent log is within 7 days", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6 }),
        (daysAgo) => {
          const now = new Date();
          const recentTimestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          const logs: any[] = [{ timestamp: recentTimestamp }];

          expect(isStale(logs, now)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("isStale returns false when there are no logs", () => {
    expect(isStale([], new Date())).toBe(false);
  });
});
