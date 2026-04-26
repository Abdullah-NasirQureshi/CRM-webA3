import Lead from "@/models/Lead";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export interface AnalyticsResult {
  totalLeads: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byAgent: Array<{
    agentId: string;
    agentName: string;
    agentEmail: string;
    total: number;
    byStatus: Record<string, number>;
  }>;
}

export async function getAnalytics(): Promise<AnalyticsResult> {
  await connectDB();

  // Total leads
  const totalLeads = await Lead.countDocuments();

  // By status
  const statusAgg = await Lead.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byStatus: Record<string, number> = {};
  statusAgg.forEach((s) => { byStatus[s._id] = s.count; });

  // By priority (score)
  const priorityAgg = await Lead.aggregate([
    { $group: { _id: "$score", count: { $sum: 1 } } },
  ]);
  const byPriority: Record<string, number> = {};
  priorityAgg.forEach((p) => { byPriority[p._id] = p.count; });

  // Per-agent summary
  const agents = await User.find({ role: "agent" }).select("_id name email");
  const byAgent = await Promise.all(
    agents.map(async (agent) => {
      const agentLeads = await Lead.aggregate([
        { $match: { assignedTo: agent._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const agentByStatus: Record<string, number> = {};
      let total = 0;
      agentLeads.forEach((l) => {
        agentByStatus[l._id] = l.count;
        total += l.count;
      });
      return {
        agentId: agent._id.toString(),
        agentName: agent.name,
        agentEmail: agent.email,
        total,
        byStatus: agentByStatus,
      };
    })
  );

  return { totalLeads, byStatus, byPriority, byAgent };
}
