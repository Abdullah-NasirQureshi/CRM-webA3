import mongoose from "mongoose";
import Lead, { ILead } from "@/models/Lead";
import ActivityLog, { IActivityLog } from "@/models/ActivityLog";
import { connectDB } from "@/lib/db";

const STALE_DAYS = 7;

/**
 * Sets a follow-up date on a lead and logs the action.
 * Req 13.1
 */
export async function setFollowUpDate(
  leadId: string,
  date: Date,
  userId: string
): Promise<ILead> {
  await connectDB();

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    { followUpDate: date },
    { new: true }
  );
  if (!lead) throw new Error("Lead not found");

  await ActivityLog.create({
    leadId: new mongoose.Types.ObjectId(leadId),
    action: "followup_set",
    performedBy: new mongoose.Types.ObjectId(userId),
    details: { followUpDate: date.toISOString() },
  });

  return lead;
}

/**
 * Returns true if the lead is overdue:
 * followUpDate is in the past AND no followup_completed log exists.
 * Req 13.2
 */
export function isOverdue(
  lead: Pick<ILead, "followUpDate">,
  activityLogs: Pick<IActivityLog, "action">[],
  now: Date = new Date()
): boolean {
  if (!lead.followUpDate) return false;
  const pastDue = lead.followUpDate < now;
  const completed = activityLogs.some((l) => l.action === "followup_completed");
  return pastDue && !completed;
}

/**
 * Returns true if the lead is stale:
 * most recent activity log entry is more than STALE_DAYS days ago.
 * Req 13.3
 */
export function isStale(
  activityLogs: Pick<IActivityLog, "timestamp">[],
  now: Date = new Date()
): boolean {
  if (activityLogs.length === 0) return false;
  const latest = activityLogs.reduce((a, b) =>
    a.timestamp > b.timestamp ? a : b
  );
  const diffMs = now.getTime() - latest.timestamp.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > STALE_DAYS;
}

/**
 * Returns overdue and stale leads for a given agent.
 * Req 13.2, 13.3, 13.4
 */
export async function getFollowUpAlerts(agentId: string): Promise<{
  overdue: ILead[];
  stale: ILead[];
}> {
  await connectDB();

  const leads = await Lead.find({
    assignedTo: new mongoose.Types.ObjectId(agentId),
    status: { $nin: ["Closed", "Lost"] },
  });

  const now = new Date();
  const overdue: ILead[] = [];
  const stale: ILead[] = [];

  for (const lead of leads) {
    const logs = await ActivityLog.find({ leadId: lead._id }).sort({ timestamp: 1 });

    if (isOverdue(lead, logs, now)) overdue.push(lead);
    if (isStale(logs, now)) stale.push(lead);
  }

  return { overdue, stale };
}
