// **Feature: property-dealer-crm, Property 20: Activity log entries created for all lead actions**
// **Feature: property-dealer-crm, Property 21: Activity log timeline ordering**
import * as fc from "fast-check";
import mongoose from "mongoose";
import { createLead, updateLead } from "@/services/leadService";
import { logAction, getTimeline } from "@/services/activityLogService";
import ActivityLog from "@/models/ActivityLog";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup/dbHelper";

const ACTIONS = [
  "created", "status_updated", "assigned", "reassigned",
  "notes_updated", "followup_set", "followup_completed",
] as const;

async function makeUser() {
  return User.create({
    name: "Tester",
    email: `tester_${Date.now()}_${Math.random()}@test.com`,
    passwordHash: "hash",
    role: "admin",
  });
}

async function makeLead(userId: string) {
  return createLead(
    { name: "Lead", email: `lead_${Date.now()}@t.com`, propertyInterest: "Villa", budget: 5_000_000, source: "Walk-in" },
    userId
  );
}

describe("Property 20: Activity log entries created for all lead actions", () => {
  // **Validates: Requirements 12.1**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("logAction creates an entry with correct action, performedBy, and timestamp", async () => {
    const user = await makeUser();
    const lead = await makeLead(user._id.toString());

    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...ACTIONS), async (action) => {
        const entry = await logAction(lead._id.toString(), action, user._id.toString(), { test: true });

        expect(entry.action).toBe(action);
        expect(entry.performedBy.toString()).toBe(user._id.toString());
        expect(entry.leadId.toString()).toBe(lead._id.toString());
        expect(entry.timestamp).toBeInstanceOf(Date);

        await ActivityLog.deleteOne({ _id: entry._id });
      }),
      { numRuns: 30 }
    );
  });

  it("createLead automatically logs a 'created' activity entry", async () => {
    const user = await makeUser();
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100_000_000 }),
        async (budget) => {
          const lead = await createLead(
            { name: "X", email: `x_${Date.now()}@t.com`, propertyInterest: "P", budget, source: "Website" },
            user._id.toString()
          );
          const logs = await ActivityLog.find({ leadId: lead._id, action: "created" });
          expect(logs.length).toBeGreaterThanOrEqual(1);
          await Lead.deleteOne({ _id: lead._id });
          await ActivityLog.deleteMany({ leadId: lead._id });
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe("Property 21: Activity log timeline ordering", () => {
  // **Validates: Requirements 12.2**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("getTimeline returns entries sorted ascending by timestamp", async () => {
    const user = await makeUser();
    const lead = await makeLead(user._id.toString());

    // Insert entries with deliberate time gaps
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 5));
      await logAction(lead._id.toString(), "status_updated", user._id.toString(), { step: i });
    }

    const timeline = await getTimeline(lead._id.toString());
    expect(timeline.length).toBeGreaterThanOrEqual(5);

    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        timeline[i - 1].timestamp.getTime()
      );
    }
  });
});
