/**
 * Property tests for LeadService
 * Properties 7, 9, 10, 11, 13, 15
 */
import * as fc from "fast-check";
import mongoose from "mongoose";
import { createLead, getLeads, updateLead, deleteLead } from "@/services/leadService";
import ActivityLog from "@/models/ActivityLog";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { computeScore } from "@/lib/scoring";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup/dbHelper";

const SOURCES = ["Facebook Ads", "Walk-in", "Website", "Other"] as const;
const STATUSES = ["New", "Contacted", "In Progress", "Closed", "Lost"] as const;

const leadInputArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  propertyInterest: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  budget: fc.integer({ min: 0, max: 100_000_000 }),
  source: fc.constantFrom(...SOURCES),
  status: fc.constantFrom(...STATUSES),
});

async function makeUser(role: "admin" | "agent" = "admin") {
  return User.create({
    name: "Test User",
    email: `user_${Date.now()}_${Math.random()}@test.com`,
    passwordHash: "hash",
    role,
  });
}

describe("Property 9: Lead creation completeness", () => {
  // **Validates: Requirements 5.1, 7.1, 7.2, 7.3**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("created lead contains all submitted fields + createdAt + computed score", async () => {
    const user = await makeUser();
    await fc.assert(
      fc.asyncProperty(leadInputArb, async (input) => {
        const lead = await createLead(input, user._id.toString());
        expect(lead.name).toBe(input.name.trim());
        expect(lead.email).toBe(input.email.toLowerCase());
        expect(lead.budget).toBe(input.budget);
        expect(lead.source).toBe(input.source);
        expect(lead.score).toBe(computeScore(input.budget));
        expect(lead.createdAt).toBeInstanceOf(Date);
        await Lead.deleteOne({ _id: lead._id });
        await ActivityLog.deleteMany({ leadId: lead._id });
      }),
      { numRuns: 30 }
    );
  });
});

describe("Property 10: Lead update persistence", () => {
  // **Validates: Requirements 5.4**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("updated fields are persisted; unchanged fields remain intact", async () => {
    const user = await makeUser();
    await fc.assert(
      fc.asyncProperty(
        leadInputArb,
        fc.constantFrom(...STATUSES),
        async (input, newStatus) => {
          const lead = await createLead(input, user._id.toString());
          const updated = await updateLead(
            lead._id.toString(),
            { status: newStatus },
            user._id.toString(),
            "admin"
          );
          expect(updated.status).toBe(newStatus);
          expect(updated.name).toBe(lead.name);
          expect(updated.budget).toBe(lead.budget);
          await Lead.deleteOne({ _id: lead._id });
          await ActivityLog.deleteMany({ leadId: lead._id });
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe("Property 11: Lead deletion cascade", () => {
  // **Validates: Requirements 5.5, 12.4**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("after deletion, lead and all its activity logs are gone", async () => {
    const user = await makeUser();
    await fc.assert(
      fc.asyncProperty(leadInputArb, async (input) => {
        const lead = await createLead(input, user._id.toString());
        const leadId = lead._id.toString();

        await deleteLead(leadId);

        const found = await Lead.findById(leadId);
        expect(found).toBeNull();

        const logs = await ActivityLog.find({ leadId: lead._id });
        expect(logs).toHaveLength(0);
      }),
      { numRuns: 20 }
    );
  });
});

describe("Property 7: Agent lead scoping", () => {
  // **Validates: Requirements 3.3, 5.3, 8.3**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("agent only receives leads assigned to them", async () => {
    const admin = await makeUser("admin");
    const agent1 = await makeUser("agent");
    const agent2 = await makeUser("agent");

    // Create leads assigned to agent1 and agent2
    const lead1 = await createLead({ name: "A", email: "a@t.com", propertyInterest: "Villa", budget: 5_000_000, source: "Walk-in" }, admin._id.toString());
    const lead2 = await createLead({ name: "B", email: "b@t.com", propertyInterest: "Apt", budget: 15_000_000, source: "Website" }, admin._id.toString());

    // Assign lead1 to agent1, lead2 to agent2
    await Lead.findByIdAndUpdate(lead1._id, { assignedTo: agent1._id });
    await Lead.findByIdAndUpdate(lead2._id, { assignedTo: agent2._id });

    const agent1Leads = await getLeads(agent1._id.toString(), "agent");
    const agent2Leads = await getLeads(agent2._id.toString(), "agent");

    expect(agent1Leads.every((l) => l.assignedTo?.toString() === agent1._id.toString())).toBe(true);
    expect(agent2Leads.every((l) => l.assignedTo?.toString() === agent2._id.toString())).toBe(true);
  });
});

describe("Property 13: Filter results satisfy predicate", () => {
  // **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("status filter returns only leads matching that status", async () => {
    const user = await makeUser();
    for (const status of STATUSES) {
      await createLead({ name: "X", email: `x_${status}@t.com`, propertyInterest: "P", budget: 5_000_000, source: "Walk-in", status }, user._id.toString());
    }

    for (const status of STATUSES) {
      const results = await getLeads(user._id.toString(), "admin", { status });
      expect(results.every((l) => l.status === status)).toBe(true);
    }
  });

  it("score filter returns only leads matching that priority", async () => {
    const user = await makeUser();
    await createLead({ name: "H", email: "h@t.com", propertyInterest: "P", budget: 25_000_000, source: "Walk-in" }, user._id.toString());
    await createLead({ name: "M", email: "m@t.com", propertyInterest: "P", budget: 15_000_000, source: "Walk-in" }, user._id.toString());
    await createLead({ name: "L", email: "l@t.com", propertyInterest: "P", budget: 5_000_000, source: "Walk-in" }, user._id.toString());

    const high = await getLeads(user._id.toString(), "admin", { score: "High" });
    const medium = await getLeads(user._id.toString(), "admin", { score: "Medium" });
    const low = await getLeads(user._id.toString(), "admin", { score: "Low" });

    expect(high.every((l) => l.score === "High")).toBe(true);
    expect(medium.every((l) => l.score === "Medium")).toBe(true);
    expect(low.every((l) => l.score === "Low")).toBe(true);
  });
});

describe("Property 15: Budget update triggers score recalculation", () => {
  // **Validates: Requirements 7.4**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("after updating budget, score equals computeScore(newBudget)", async () => {
    const user = await makeUser();
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100_000_000 }),
        async (initialBudget, newBudget) => {
          const lead = await createLead({
            name: "Test", email: `t_${Date.now()}@t.com`,
            propertyInterest: "P", budget: initialBudget, source: "Walk-in",
          }, user._id.toString());

          const updated = await updateLead(
            lead._id.toString(),
            { budget: newBudget },
            user._id.toString(),
            "admin"
          );

          expect(updated.score).toBe(computeScore(newBudget));
          await Lead.deleteOne({ _id: lead._id });
          await ActivityLog.deleteMany({ leadId: lead._id });
        }
      ),
      { numRuns: 20 }
    );
  });
});
