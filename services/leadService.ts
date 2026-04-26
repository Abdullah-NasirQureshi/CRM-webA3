import mongoose from "mongoose";
import Lead, { ILead, LeadStatus, LeadScore, LeadSource } from "@/models/Lead";
import ActivityLog from "@/models/ActivityLog";
import { connectDB } from "@/lib/db";
import { emitLeadCreated, emitScoreChanged } from "@/services/realtimeService";
import { computeScore } from "@/lib/scoring";
import { sendNewLeadEmail } from "@/services/notificationService";

export interface LeadFilters {
  status?: LeadStatus;
  score?: LeadScore;
  source?: LeadSource;
  from?: string;
  to?: string;
}

export interface CreateLeadInput {
  name: string;
  email: string;
  phone?: string;
  propertyInterest: string;
  budget: number;
  status?: LeadStatus;
  notes?: string;
  source: LeadSource;
  followUpDate?: string;
}

export interface UpdateLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  propertyInterest?: string;
  budget?: number;
  status?: LeadStatus;
  notes?: string;
  source?: LeadSource;
  followUpDate?: string | null;
}

export class LeadNotFoundError extends Error {
  statusCode = 404;
  constructor() { super("Lead not found"); }
}

export class LeadForbiddenError extends Error {
  statusCode = 403;
  constructor() { super("Forbidden"); }
}

function buildFilterQuery(
  userId: string,
  role: "admin" | "agent",
  filters: LeadFilters
): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  // Agents only see their assigned leads
  if (role === "agent") {
    query.assignedTo = new mongoose.Types.ObjectId(userId);
  }

  if (filters.status) query.status = filters.status;
  if (filters.score) query.score = filters.score;
  if (filters.source) query.source = filters.source;

  if (filters.from || filters.to) {
    const dateFilter: Record<string, Date> = {};
    if (filters.from) dateFilter.$gte = new Date(filters.from);
    if (filters.to) dateFilter.$lte = new Date(filters.to);
    query.createdAt = dateFilter;
  }

  return query;
}

export async function createLead(
  input: CreateLeadInput,
  userId: string
): Promise<ILead> {
  await connectDB();
  const lead = await Lead.create({
    ...input,
    followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
  });

  // Log creation
  await ActivityLog.create({
    leadId: lead._id,
    action: "created",
    performedBy: new mongoose.Types.ObjectId(userId),
    details: { name: lead.name, budget: lead.budget, score: lead.score },
  });

  // Broadcast real-time event to admins
  emitLeadCreated(lead);

  // Send email notification to admin (non-blocking)
  sendNewLeadEmail(lead).catch(() => {});

  return lead;
}

export async function getLeads(
  userId: string,
  role: "admin" | "agent",
  filters: LeadFilters = {}
): Promise<ILead[]> {
  await connectDB();
  const query = buildFilterQuery(userId, role, filters);
  return Lead.find(query).populate("assignedTo", "name email").sort({ createdAt: -1 });
}

export async function getLeadById(
  id: string,
  userId: string,
  role: "admin" | "agent"
): Promise<ILead> {
  await connectDB();
  const lead = await Lead.findById(id).populate("assignedTo", "name email");
  if (!lead) throw new LeadNotFoundError();

  if (role === "agent" && lead.assignedTo?.toString() !== userId) {
    throw new LeadForbiddenError();
  }

  return lead;
}

export async function updateLead(
  id: string,
  input: UpdateLeadInput,
  userId: string,
  role: "admin" | "agent"
): Promise<ILead> {
  await connectDB();

  const existing = await Lead.findById(id);
  if (!existing) throw new LeadNotFoundError();

  if (role === "agent" && existing.assignedTo?.toString() !== userId) {
    throw new LeadForbiddenError();
  }

  const updateData: Record<string, unknown> = { ...input };
  if (input.followUpDate === null) {
    updateData.followUpDate = null;
  } else if (input.followUpDate) {
    updateData.followUpDate = new Date(input.followUpDate);
  }

  const updated = await Lead.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("assignedTo", "name email");

  if (!updated) throw new LeadNotFoundError();

  // Emit score change if budget was updated
  if (input.budget !== undefined) {
    emitScoreChanged(updated);
  }

  // Build details for activity log
  const changedFields = Object.keys(input);
  const details: Record<string, unknown> = {};
  changedFields.forEach((f) => {
    details[f] = { from: (existing as any)[f], to: (input as any)[f] };
  });

  // Determine action type
  let action: "status_updated" | "notes_updated" | "followup_set" = "status_updated";
  if (input.notes !== undefined && changedFields.length === 1) action = "notes_updated";
  else if (input.followUpDate !== undefined && changedFields.length === 1) action = "followup_set";
  else if (input.status !== undefined) action = "status_updated";

  await ActivityLog.create({
    leadId: updated._id,
    action,
    performedBy: new mongoose.Types.ObjectId(userId),
    details,
  });

  return updated;
}

export async function deleteLead(id: string): Promise<void> {
  await connectDB();
  const lead = await Lead.findById(id);
  if (!lead) throw new LeadNotFoundError();

  await Lead.deleteOne({ _id: id });
  await ActivityLog.deleteMany({ leadId: new mongoose.Types.ObjectId(id) });
}
