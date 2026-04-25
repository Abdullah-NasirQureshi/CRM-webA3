// **Feature: property-dealer-crm, Property 16: Assignment updates lead and creates log**
// **Feature: property-dealer-crm, Property 17: Reassignment updates to new agent**
import Lead from "@/models/Lead";
import User from "@/models/User";
import ActivityLog from "@/models/ActivityLog";
import { createLead } from "@/services/leadService";
import { assignLead, reassignLead } from "@/services/assignmentService";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup/dbHelper";

async function makeAdmin() {
  return User.create({ name: "Admin", email: `admin_${Date.now()}_${Math.random()}@t.com`, passwordHash: "h", role: "admin" });
}
async function makeAgent(suffix = "") {
  return User.create({ name: "Agent", email: `agent_${suffix}_${Date.now()}_${Math.random()}@t.com`, passwordHash: "h", role: "agent" });
}
async function makeLead(adminId: string) {
  return createLead({ name: "L", email: `l_${Date.now()}@t.com`, propertyInterest: "P", budget: 5_000_000, source: "Walk-in" }, adminId);
}

describe("Property 16: Assignment updates lead and creates log", () => {
  // **Validates: Requirements 8.1**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("after assignment, lead.assignedTo equals agentId and activity log has 'assigned' entry", async () => {
    const admin = await makeAdmin();
    const agent = await makeAgent("a");
    const lead = await makeLead(admin._id.toString());

    await assignLead(lead._id.toString(), agent._id.toString(), admin._id.toString());

    const updated = await Lead.findById(lead._id);
    expect(updated!.assignedTo!.toString()).toBe(agent._id.toString());

    const log = await ActivityLog.findOne({ leadId: lead._id, action: "assigned" });
    expect(log).not.toBeNull();
    expect(log!.performedBy.toString()).toBe(admin._id.toString());
  });
});

describe("Property 17: Reassignment updates to new agent", () => {
  // **Validates: Requirements 8.2**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("after reassignment, lead.assignedTo equals new agent and log has 'reassigned' entry", async () => {
    const admin = await makeAdmin();
    const agent1 = await makeAgent("1");
    const agent2 = await makeAgent("2");
    const lead = await makeLead(admin._id.toString());

    // First assign to agent1
    await assignLead(lead._id.toString(), agent1._id.toString(), admin._id.toString());

    // Then reassign to agent2
    await reassignLead(lead._id.toString(), agent2._id.toString(), admin._id.toString());

    const updated = await Lead.findById(lead._id);
    expect(updated!.assignedTo!.toString()).toBe(agent2._id.toString());

    const log = await ActivityLog.findOne({ leadId: lead._id, action: "reassigned" });
    expect(log).not.toBeNull();
    expect((log!.details as any).from).toBe(agent1._id.toString());
    expect((log!.details as any).to).toBe(agent2._id.toString());
  });
});
