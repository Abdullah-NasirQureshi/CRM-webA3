// **Feature: property-dealer-crm, Property 25: Analytics aggregation correctness**
// **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
import Lead from "@/models/Lead";
import User from "@/models/User";
import { createLead } from "@/services/leadService";
import { getAnalytics } from "@/services/analyticsService";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup/dbHelper";

const STATUSES = ["New", "Contacted", "In Progress", "Closed", "Lost"] as const;
const SOURCES = ["Facebook Ads", "Walk-in", "Website", "Other"] as const;
const BUDGETS = [5_000_000, 15_000_000, 25_000_000]; // Low, Medium, High

async function makeAdmin() {
  return User.create({ name: "Admin", email: `admin_${Date.now()}_${Math.random()}@t.com`, passwordHash: "h", role: "admin" });
}
async function makeAgent() {
  return User.create({ name: "Agent", email: `agent_${Date.now()}_${Math.random()}@t.com`, passwordHash: "h", role: "agent" });
}

describe("Property 25: Analytics aggregation correctness", () => {
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("totalLeads matches actual count in DB", async () => {
    const admin = await makeAdmin();
    const count = 7;
    for (let i = 0; i < count; i++) {
      await createLead({ name: `L${i}`, email: `l${i}_${Date.now()}@t.com`, propertyInterest: "P", budget: BUDGETS[i % 3], source: SOURCES[i % 4] }, admin._id.toString());
    }
    const analytics = await getAnalytics();
    const actual = await Lead.countDocuments();
    expect(analytics.totalLeads).toBe(actual);
  });

  it("byStatus counts match naive in-memory count", async () => {
    const admin = await makeAdmin();
    for (const status of STATUSES) {
      await createLead({ name: status, email: `s_${status}_${Date.now()}@t.com`, propertyInterest: "P", budget: 5_000_000, source: "Walk-in", status }, admin._id.toString());
    }
    const analytics = await getAnalytics();
    const allLeads = await Lead.find();
    const naiveByStatus: Record<string, number> = {};
    allLeads.forEach((l) => { naiveByStatus[l.status] = (naiveByStatus[l.status] ?? 0) + 1; });

    for (const status of STATUSES) {
      expect(analytics.byStatus[status] ?? 0).toBe(naiveByStatus[status] ?? 0);
    }
  });

  it("byPriority counts match naive in-memory count", async () => {
    const admin = await makeAdmin();
    for (const budget of BUDGETS) {
      await createLead({ name: "P", email: `p_${budget}_${Date.now()}@t.com`, propertyInterest: "P", budget, source: "Website" }, admin._id.toString());
    }
    const analytics = await getAnalytics();
    const allLeads = await Lead.find();
    const naiveByPriority: Record<string, number> = {};
    allLeads.forEach((l) => { naiveByPriority[l.score] = (naiveByPriority[l.score] ?? 0) + 1; });

    for (const priority of ["High", "Medium", "Low"]) {
      expect(analytics.byPriority[priority] ?? 0).toBe(naiveByPriority[priority] ?? 0);
    }
  });

  it("per-agent totals match naive count of assigned leads", async () => {
    const admin = await makeAdmin();
    const agent = await makeAgent();
    const leadsToAssign = 3;
    for (let i = 0; i < leadsToAssign; i++) {
      const lead = await createLead({ name: `A${i}`, email: `a${i}_${Date.now()}@t.com`, propertyInterest: "P", budget: 5_000_000, source: "Walk-in" }, admin._id.toString());
      await Lead.findByIdAndUpdate(lead._id, { assignedTo: agent._id });
    }
    const analytics = await getAnalytics();
    const agentEntry = analytics.byAgent.find((a) => a.agentId === agent._id.toString());
    expect(agentEntry).toBeDefined();
    expect(agentEntry!.total).toBe(leadsToAssign);
  });
});
