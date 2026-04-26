import mongoose from "mongoose";
import Lead, { ILead } from "@/models/Lead";
import User from "@/models/User";
import ActivityLog from "@/models/ActivityLog";
import { connectDB } from "@/lib/db";
import { emitLeadAssigned } from "@/services/realtimeService";

export class AssignmentError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "AssignmentError";
  }
}

export async function assignLead(
  leadId: string,
  agentId: string,
  adminId: string
): Promise<ILead> {
  await connectDB();

  const lead = await Lead.findById(leadId);
  if (!lead) throw new AssignmentError("Lead not found", 404);

  const agent = await User.findById(agentId);
  if (!agent || agent.role !== "agent")
    throw new AssignmentError("Agent not found", 404);

  lead.assignedTo = new mongoose.Types.ObjectId(agentId);
  await lead.save();

  await ActivityLog.create({
    leadId: lead._id,
    action: "assigned",
    performedBy: new mongoose.Types.ObjectId(adminId),
    details: { agentId, agentName: agent.name },
  });

  emitLeadAssigned(lead, agentId);
  return lead;
}

export async function reassignLead(
  leadId: string,
  newAgentId: string,
  adminId: string
): Promise<ILead> {
  await connectDB();

  const lead = await Lead.findById(leadId);
  if (!lead) throw new AssignmentError("Lead not found", 404);

  const newAgent = await User.findById(newAgentId);
  if (!newAgent || newAgent.role !== "agent")
    throw new AssignmentError("Agent not found", 404);

  const previousAgentId = lead.assignedTo?.toString();
  lead.assignedTo = new mongoose.Types.ObjectId(newAgentId);
  await lead.save();

  await ActivityLog.create({
    leadId: lead._id,
    action: "reassigned",
    performedBy: new mongoose.Types.ObjectId(adminId),
    details: {
      from: previousAgentId,
      to: newAgentId,
      newAgentName: newAgent.name,
    },
  });

  emitLeadAssigned(lead, newAgentId);
  return lead;
}
